import sqlite3 from 'sqlite3';
import { getQuery } from '../db.js';
import { BackupConfig, BackupOverrides, SyncedTable, USER_RELATED_TABLES, loadBackupConfig } from './config.js';
import { BackupLogger, createBackupLogger } from './logger.js';
import { TABLE_DDL, META_DDL } from './schema.js';
import { closeDatabase, exec, get, openDatabase, run, withTimeout } from './sqlite.js';
import { BackupSyncEngine } from './syncEngine.js';
import { HealthMonitor } from './healthMonitor.js';
import { restorePrimaryFromBackup } from './restore.js';

export interface BackupSystemOptions extends BackupOverrides {
  ping?: () => Promise<void>;
  logger?: BackupLogger;
}

export interface BackupSystem {
  config: BackupConfig;
  logger: BackupLogger;
  engine: BackupSyncEngine;
  monitor: HealthMonitor;
  stop: () => Promise<void>;
}

async function ensureBackupSchema(backupDb: sqlite3.Database, logger: BackupLogger): Promise<void> {
  const ddl = USER_RELATED_TABLES.map((t) => TABLE_DDL[t]).join(';\n') + ';';
  await exec(backupDb, ddl);
  await exec(backupDb, META_DDL);
  await exec(backupDb, 'PRAGMA journal_mode=WAL');
  await run(
    backupDb,
    'INSERT INTO backup_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    ['schema_initialized_at', new Date().toISOString()]
  );
  logger.info('SYNC_ESQUEMA_LISTO', 'Esquema espejo de la DB de respaldo asegurado');
}

async function defaultPing(config: BackupConfig): Promise<void> {
  const conn = await openDatabase(config.primaryKeyPath, sqlite3.OPEN_READONLY);
  try {
    await get(conn, 'SELECT count(*) AS c FROM sqlite_master');
  } finally {
    await closeDatabase(conn).catch(() => undefined);
  }
}

/**
 * Arranca el sistema de respaldo completo:
 *  - abre/crea la DB de respaldo (aislada: la app nunca la consulta)
 *  - copia el estado inicial de la DB principal
 *  - activa la replicación en tiempo real de las escrituras
 *  - vigila la salud de la DB principal y programa la restauración diferida (5 min)
 */
export async function startBackupSystem(options: BackupSystemOptions = {}): Promise<BackupSystem> {
  const config = loadBackupConfig(options);
  const logger = options.logger ?? createBackupLogger(config.logPath);

  if (!config.enabled) {
    logger.warn('BACKUP_DESHABILITADO', 'BACKUP_ENABLED=false: el sistema de respaldo no se inició');
    const noopEngine = new BackupSyncEngine({
      backupDb: null as unknown as sqlite3.Database,
      primaryGet: async () => [],
      logger,
      tables: [],
    });
    const noopMonitor = new HealthMonitor({
      ping: async () => undefined,
      onRestore: async () => undefined,
      logger,
      intervalMs: 60000,
      restoreWaitMs: config.restoreWaitMs,
    });
    return { config, logger, engine: noopEngine, monitor: noopMonitor, stop: async () => undefined };
  }

  const backupDb = await openDatabase(config.backupPath);
  await ensureBackupSchema(backupDb, logger);
  logger.info('BACKUP_DB_ABIERTA', `DB de respaldo aislada lista en ${config.backupPath}`);

  const engine = new BackupSyncEngine({
    backupDb,
    primaryGet: (sql, params) => getQuery<any>(sql, params),
    logger,
    tables: [...USER_RELATED_TABLES],
    retries: config.syncRetries,
    readTimeoutMs: config.healthTimeoutMs,
  });
  engine.start();

  try {
    await engine.fullSyncAll();
    logger.info('SYNC_INICIAL_COMPLETA', 'Copia inicial completa de la DB principal hacia el respaldo');
  } catch (err) {
    logger.error(
      'SYNC_INICIAL_FALLIDA',
      `No se pudo completar la copia inicial: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  let reconciliationTimer: NodeJS.Timeout | null = null;
  if (config.syncIntervalMs > 0) {
    reconciliationTimer = setInterval(() => {
      engine.enqueue(async () => {
        await engine.fullSyncAll();
      });
    }, config.syncIntervalMs);
    if (typeof reconciliationTimer.unref === 'function') reconciliationTimer.unref();
    logger.info(
      'SYNC_RECONCILIACION_PROGRAMADA',
      `Reconciliación completa periódica cada ${config.syncIntervalMs}ms`
    );
  }

  const ping = options.ping ?? (() => defaultPing(config));
  const monitor = new HealthMonitor({
    ping: () => withTimeout(ping(), config.healthTimeoutMs, 'health check'),
    onRestore: async () => {
      const result = await restorePrimaryFromBackup({
        primaryPath: config.primaryKeyPath,
        backupPath: config.backupPath,
        tables: [...USER_RELATED_TABLES] as SyncedTable[],
        logger,
      });
      if (!result.ok) {
        throw new Error(result.error ?? 'Restauración fallida');
      }
      logger.info('RESTORE_COMPLETADO', `Modo de restauración: ${result.mode}`);
    },
    logger,
    intervalMs: config.healthCheckIntervalMs,
    timeoutMs: config.healthTimeoutMs,
    failureThreshold: config.healthFailureThreshold,
    restoreWaitMs: config.restoreWaitMs,
  });
  monitor.start();

  const stop = async (): Promise<void> => {
    monitor.stop();
    engine.stop();
    if (reconciliationTimer) {
      clearInterval(reconciliationTimer);
      reconciliationTimer = null;
    }
    await engine.waitForIdle();
    await run(
      backupDb,
      'INSERT INTO backup_meta (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
      ['last_shutdown_at', new Date().toISOString()]
    ).catch(() => undefined);
    await closeDatabase(backupDb).catch(() => undefined);
    logger.info('BACKUP_SISTEMA_DETENIDO', 'Sistema de respaldo detenido correctamente');
  };

  return { config, logger, engine, monitor, stop };
}

export { restorePrimaryFromBackup } from './restore.js';
export { BackupSyncEngine } from './syncEngine.js';
export { HealthMonitor } from './healthMonitor.js';
export { loadBackupConfig } from './config.js';
export { createBackupLogger } from './logger.js';
