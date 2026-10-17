import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// ---------------------------------------------------------------------------
// El sistema de respaldo se configura mediante variables de entorno, por lo
// que deben definirse ANTES de importar los módulos que las consumen.
// ---------------------------------------------------------------------------
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mylab-backup-test-'));
const primaryPath = path.join(tmpDir, 'primary.db');
const backupPath = path.join(tmpDir, 'backup.db');

process.env.PRIMARY_DB_PATH = primaryPath;
process.env.BACKUP_DB_PATH = backupPath;
process.env.BACKUP_LOG_PATH = path.join(tmpDir, 'backup.log');
process.env.BACKUP_ENABLED = 'true';
process.env.BACKUP_HEALTH_CHECK_INTERVAL_MS = '40';
process.env.BACKUP_HEALTH_TIMEOUT_MS = '300';
process.env.BACKUP_HEALTH_FAILURE_THRESHOLD = '2';
process.env.BACKUP_RESTORE_WAIT_MS = '600';
process.env.BACKUP_SYNC_INTERVAL_MS = '3600000';
process.env.BACKUP_SYNC_RETRIES = '2';

const { runQuery, getQuery, db } = await import('../db.js');
const { runMigrations } = await import('../migrations.js');
const { startBackupSystem } = await import('../backup/index.js');
const { BackupLogger } = await import('../backup/logger.js');
const { openDatabase, get, run, exec, closeDatabase } = await import('../backup/sqlite.js');
const { TABLE_DDL, META_DDL } = await import('../backup/schema.js');
const { USER_RELATED_TABLES } = await import('../backup/config.js');
const { restorePrimaryFromBackup } = await import('../backup/restore.js');

await runMigrations();

async function readBackup<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  const conn = await openDatabase(backupPath);
  try {
    return await get<T>(conn, sql, params);
  } finally {
    await closeDatabase(conn);
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(predicate: () => boolean, timeoutMs = 5000, step = 20): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await wait(step);
  }
  throw new Error('waitFor: condición no satisfecha dentro del tiempo límite');
}

after(async () => {
  await closeDatabase(db).catch(() => undefined);
  fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
});

test('sincroniza usuarios en tiempo real, incluyendo la contraseña hasheada intacta', async () => {
  const logger = new BackupLogger();
  const system = await startBackupSystem({ logger });
  try {
    const hash = '$2b$10$Q0hCJd9pS.1hFZ8k3zR2wOqYy4hV7nLpXmK6tB8aE0cD2fG4iJ5uK';
    const inserted = await runQuery(
      'INSERT INTO users (name, email, password, role, xp_points, level) VALUES (?, ?, ?, ?, ?, ?)',
      ['Sync Test', 'sync@mylab.edu', hash, 'student', 10, 2]
    );

    await runQuery('UPDATE users SET xp_points = ?, level = ? WHERE id = ?', [4321, 9, inserted.lastID]);
    await system.engine.waitForIdle();

    const row = await readBackup<any>('SELECT * FROM users WHERE id = ?', [inserted.lastID]);
    assert.ok(row, 'la fila insertada debe existir en el respaldo');
    assert.equal(row.password, hash, 'la contraseña se replica verbatim (nunca se desencripta ni rehashea)');
    assert.equal(row.email, 'sync@mylab.edu');
    assert.equal(row.xp_points, 4321, 'el progreso actualizado se replica');
    assert.equal(row.level, 9);

    await runQuery('DELETE FROM users WHERE id = ?', [inserted.lastID]);
    await system.engine.waitForIdle();

    const deleted = await readBackup('SELECT * FROM users WHERE id = ?', [inserted.lastID]);
    assert.equal(deleted, undefined, 'la eliminación también se replica al respaldo');
  } finally {
    await system.stop();
  }
});

test('una escritura sin WHERE id dispara una resincronización completa de la tabla', async () => {
  const logger = new BackupLogger();
  const system = await startBackupSystem({ logger });
  try {
    const inserted = await runQuery(
      'INSERT INTO users (name, email, password, role, xp_points, level) VALUES (?, ?, ?, ?, ?, ?)',
      ['Fallback User', 'fallback@mylab.edu', 'hash-fallback', 'student', 0, 1]
    );
    await system.engine.waitForIdle();

    await runQuery("UPDATE users SET role = 'admin' WHERE id > 0");
    await system.engine.waitForIdle();

    const row = await readBackup<any>('SELECT * FROM users WHERE id = ?', [inserted.lastID]);
    assert.ok(row);
    assert.equal(row.role, 'admin', 'el respaldo refleja una actualización masiva vía resync completo');
    assert.ok(logger.hasEvent('SYNC_TABLA_COMPLETA'), 'se usó el mecanismo de resincronización completa');
  } finally {
    await system.stop();
  }
});

test('recuperación antes de los 5 minutos: la restauración se cancela', async () => {
  let down = false;
  const logger = new BackupLogger();
  const system = await startBackupSystem({
    logger,
    ping: async () => {
      if (down) throw new Error('DB principal no responde');
    },
  });

  try {
    down = true;
    await waitFor(() => system.monitor.state === 'FAILING');
    assert.ok(logger.hasEvent('HEALTH_FALLO_DETECTADO'));
    assert.ok(logger.hasEvent('HEALTH_TEMPORIZADOR_INICIADO'));

    await wait(250); // menos que BACKUP_RESTORE_WAIT_MS (600ms)
    down = false;

    await waitFor(() => logger.hasEvent('HEALTH_RESTAURACION_CANCELADA'));
    await wait(800); // más allá de la ventana de 600ms: el temporizador ya no existe

    assert.equal(logger.hasEvent('HEALTH_RESTAURACION_EJECUTADA'), false, 'no debe haberse restaurado');
    assert.equal(system.monitor.state, 'HEALTHY');
    assert.ok(logger.hasEvent('HEALTH_RECUPERADO_CANCELADO'));
  } finally {
    await system.stop();
  }
});

test('fallo prolongado (>5 min simulados): restaura la DB principal desde el respaldo', async () => {
  let down = false;
  const logger = new BackupLogger();
  const system = await startBackupSystem({
    logger,
    ping: async () => {
      if (down) throw new Error('DB principal colapsada');
    },
  });

  try {
    await runQuery(
      'INSERT INTO users (name, email, password, role, xp_points, level) VALUES (?, ?, ?, ?, ?, ?)',
      ['Restore User', 'restore@mylab.edu', '$2b$10$restauracionHashVerbatim1234567890', 'student', 77, 3]
    );
    await system.engine.waitForIdle();

    // Simula pérdida de datos en la DB principal con una conexión directa
    // (evita el hook de la aplicación y, por tanto, la sincronización).
    const direct = await openDatabase(primaryPath);
    await run(direct, 'DELETE FROM users');
    await closeDatabase(direct);

    const empty = await getQuery<{ c: number }>('SELECT COUNT(*) AS c FROM users');
    assert.equal(empty[0].c, 0, 'la DB principal quedó vacía antes del fallo');

    down = true;
    await waitFor(() => logger.hasEvent('HEALTH_TEMPORIZADOR_INICIADO'));
    await waitFor(() => logger.hasEvent('HEALTH_RESTAURACION_EJECUTADA'), 8000);

    const rows = await getQuery<any>('SELECT * FROM users');
    assert.ok(rows.length > 0, 'la DB principal fue repoblada desde el respaldo');
    const restored = rows.find((u) => u.email === 'restore@mylab.edu');
    assert.ok(restored, 'el usuario respaldado existe de nuevo en la DB principal');
    assert.equal(restored.password, '$2b$10$restauracionHashVerbatim1234567890');
    assert.equal(restored.xp_points, 77);
    assert.ok(logger.hasEvent('HEALTH_FALLO_DETECTADO'));
    assert.ok(logger.hasEvent('RESTORE_VERIFICACION_OK'));
  } finally {
    down = false;
    await system.stop();
  }
});

test('DB principal corrupta: la restauración recrea el archivo desde el respaldo', async () => {
  const dir = fs.mkdtempSync(path.join(tmpDir, 'recreate-'));
  const corruptPrimary = path.join(dir, 'primary.db');
  const sourceBackup = path.join(dir, 'backup.db');

  const backupConn = await openDatabase(sourceBackup);
  await exec(backupConn, USER_RELATED_TABLES.map((t) => TABLE_DDL[t]).join(';\n') + ';\n' + META_DDL);
  await run(
    backupConn,
    'INSERT INTO users (name, email, password, role, xp_points, level) VALUES (?, ?, ?, ?, ?, ?)',
    ['Corrupt Case', 'corrupt@mylab.edu', '$2b$10$hashQueDebeSobrevivirA57CaracteresAAAAAAAAAAAA', 'student', 12, 1]
  );
  await run(backupConn, 'INSERT INTO activities (user_id, action, details) VALUES (?, ?, ?)', [1, 'Login', 'Prueba']);
  await closeDatabase(backupConn);

  // Archivo principal ilegible (simula corrupción / colapso físico)
  fs.writeFileSync(corruptPrimary, 'esto no es una base de datos SQLite válida');

  const logger = new BackupLogger();
  const result = await restorePrimaryFromBackup({
    primaryPath: corruptPrimary,
    backupPath: sourceBackup,
    tables: [...USER_RELATED_TABLES],
    logger,
  });

  assert.equal(result.ok, true, result.error);
  assert.equal(result.mode, 'recreated');
  assert.ok(logger.hasEvent('RESTORE_PRINCIPAL_ENCUARDENADA'));

  const restoredConn = await openDatabase(corruptPrimary);
  try {
    const user = await get<any>(restoredConn, 'SELECT * FROM users WHERE email = ?', ['corrupt@mylab.edu']);
    assert.ok(user, 'la DB principal recreada contiene los usuarios del respaldo');
    assert.equal(user.password, '$2b$10$hashQueDebeSobrevivirA57CaracteresAAAAAAAAAAAA');
    const activity = await get<any>(restoredConn, 'SELECT * FROM activities WHERE user_id = ?', [user.id]);
    assert.ok(activity, 'las tablas relacionadas también se restauran');
  } finally {
    await closeDatabase(restoredConn);
  }
});
