import fs from 'fs';
import path from 'path';
import sqlite3 from 'sqlite3';
import { BackupLogger } from './logger.js';
import { TABLE_DDL } from './schema.js';
import { closeDatabase, exec, get, openDatabase, quotePath, run, transaction } from './sqlite.js';
import { countRows } from './syncEngine.js';

export interface RestoreOptions {
  primaryPath: string;
  backupPath: string;
  tables: string[];
  logger: BackupLogger;
}

export interface RestoreResult {
  ok: boolean;
  mode: 'repopulated' | 'recreated';
  counts: Record<string, number>;
  error?: string;
}

function timestampSlug(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function validate(db: sqlite3.Database, label: string): Promise<void> {
  await get(db, 'SELECT count(*) AS c FROM sqlite_master');
  const row = await get<Record<string, unknown>>(db, 'PRAGMA quick_check');
  const value = row ? String(Object.values(row)[0] ?? '') : '';
  if (value.toLowerCase() !== 'ok') {
    throw new Error(`${label} corrupta (quick_check: ${value || 'sin resultado'})`);
  }
}

async function openHealthy(filePath: string, label: string): Promise<sqlite3.Database> {
  const db = await openDatabase(filePath);
  try {
    await validate(db, label);
    return db;
  } catch (err) {
    await closeDatabase(db).catch(() => undefined);
    throw err;
  }
}

export async function restorePrimaryFromBackup(options: RestoreOptions): Promise<RestoreResult> {
  const { primaryPath, backupPath, tables, logger } = options;
  const counts: Record<string, number> = {};

  if (!fs.existsSync(backupPath)) {
    const error = `No existe la DB de respaldo en ${backupPath}`;
    logger.error('RESTORE_SIN_RESPALDO', error);
    return { ok: false, mode: 'repopulated', counts, error };
  }

  let backupDb: sqlite3.Database | null = null;
  let primaryDb: sqlite3.Database | null = null;
  let recreated = false;

  try {
    backupDb = await openHealthy(backupPath, 'DB de respaldo');
    logger.info('RESTORE_RESPALDO_VERIFICADO', `DB de respaldo verificada en ${backupPath}`);

    for (const table of tables) {
      counts[table] = await countRows(backupDb, table);
    }
    logger.info('RESTORE_CONTEO_RESPALDO', `Filas a restaurar: ${JSON.stringify(counts)}`);

    try {
      primaryDb = await openHealthy(primaryPath, 'DB principal');
    } catch (err) {
      logger.warn(
        'RESTORE_PRINCIPAL_IRRECUPERABLE',
        `La DB principal no es utilizable (${err instanceof Error ? err.message : String(err)}). Se reemplazará el archivo.`
      );
      primaryDb = null;
      const quarantinePath = path.join(
        path.dirname(primaryPath),
        `mylab.corrupt-${timestampSlug()}.db`
      );
      try {
        if (fs.existsSync(primaryPath)) {
          fs.renameSync(primaryPath, quarantinePath);
          logger.warn('RESTORE_PRINCIPAL_ENCUARDENADA', `Archivo dañado movido a ${quarantinePath}`);
        }
      } catch (renameErr) {
        const message = renameErr instanceof Error ? renameErr.message : String(renameErr);
        logger.error('RESTORE_RENAME_FALLIDO', `No se pudo retirar el archivo dañado: ${message}`);
        return {
          ok: false,
          mode: 'repopulated',
          counts,
          error: `No se pudo reemplazar la DB principal dañada: ${message}`,
        };
      }
      primaryDb = await openDatabase(primaryPath);
      await exec(primaryDb, tables.map((t) => TABLE_DDL[t]).join(';\n') + ';');
      recreated = true;
      logger.info('RESTORE_PRINCIPAL_RECREADA', `DB principal recreada vacía en ${primaryPath}`);
    }

    const target = primaryDb;
    await exec(target, 'PRAGMA foreign_keys=OFF');
    await transaction(target, async () => {
      for (const table of [...tables].reverse()) {
        await run(target, `DELETE FROM "${table}"`);
      }
    });

    await exec(backupDb, `ATTACH DATABASE ${quotePath(primaryPath)} AS prim`);
    try {
      await transaction(backupDb, async () => {
        for (const table of tables) {
          await run(backupDb, `INSERT OR REPLACE INTO prim."${table}" SELECT * FROM "${table}"`);
        }
      });
    } finally {
      await exec(backupDb, 'DETACH DATABASE prim').catch(() => undefined);
    }

    for (const table of tables) {
      const restored = await countRows(target, table);
      const expected = counts[table];
      if (restored !== expected) {
        throw new Error(`Verificación fallida en "${table}": respaldo=${expected}, principal=${restored}`);
      }
    }
    logger.info('RESTORE_VERIFICACION_OK', 'Conteos verificados: la DB principal coincide con el respaldo');

    return { ok: true, mode: recreated ? 'recreated' : 'repopulated', counts };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('RESTORE_ERROR', message);
    return { ok: false, mode: recreated ? 'recreated' : 'repopulated', counts, error: message };
  } finally {
    if (backupDb) await closeDatabase(backupDb).catch(() => undefined);
    if (primaryDb) await closeDatabase(primaryDb).catch(() => undefined);
  }
}
