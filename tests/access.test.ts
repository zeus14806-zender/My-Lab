import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// ---------------------------------------------------------------------------
// La base de datos principal se configura por variable de entorno, por lo que
// debe definirse ANTES de importar los módulos que la consumen.
// ---------------------------------------------------------------------------
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mylab-access-test-'));
process.env.PRIMARY_DB_PATH = path.join(tmpDir, 'access.db');
process.env.BACKUP_ENABLED = 'false';
process.env.BACKUP_DB_PATH = path.join(tmpDir, 'backup.db');
process.env.BACKUP_LOG_PATH = path.join(tmpDir, 'backup.log');

const { runQuery, getOneQuery, getQuery, db } = await import('../db.js');
const { runMigrations } = await import('../migrations.js');
const {
  canAccessModule,
  isAcademicYear,
  normalizeAcademicYear,
  moduleAccessDeniedMessage,
} = await import('../permissions.js');

await runMigrations();

after(async () => {
  await new Promise<void>((resolve) => db.close(() => resolve()));
});

test('la migración agrega users.academic_year de forma idempotente', async () => {
  const columns = await getQuery<{ name: string }>('PRAGMA table_info(users)');
  const names = columns.map((c) => c.name);
  assert.ok(names.includes('academic_year'), 'debe existir la columna academic_year');

  // Ejecutar de nuevo no debe fallar ni duplicar.
  await runMigrations();
  const again = await getQuery<{ name: string }>('PRAGMA table_info(users)');
  assert.equal(again.filter((c) => c.name === 'academic_year').length, 1);
});

test('registro con año válido persiste academic_year', async () => {
  assert.equal(isAcademicYear('4'), true);
  assert.equal(isAcademicYear('5'), true);
  assert.equal(isAcademicYear('6'), false);
  assert.equal(isAcademicYear(undefined), false);
  assert.equal(normalizeAcademicYear(5), '5');

  const result = await runQuery(
    'INSERT INTO users (name, email, password, role, xp_points, level, academic_year) VALUES (?, ?, ?, ?, ?, ?, ?)',
    ['Estudiante Cuarto', 'cuarto@mylab.test', 'secret123', 'student', 0, 1, '4']
  );
  const row = await getOneQuery<{ academic_year: string }>(
    'SELECT academic_year FROM users WHERE id = ?',
    [result.lastID]
  );
  assert.equal(row?.academic_year, '4');
});

test('4.º año queda bloqueado para Química Orgánica', () => {
  assert.equal(canAccessModule('quimica_organica', { role: 'student', academicYear: '4' }), false);
  assert.equal(canAccessModule('quimica_organica', { role: 'student', academicYear: null }), false);
  assert.match(moduleAccessDeniedMessage('quimica_organica'), /5\.º/);
});

test('5.º año tiene acceso completo', () => {
  assert.equal(canAccessModule('quimica_organica', { role: 'student', academicYear: '5' }), true);
});

test('un administrador siempre tiene acceso', () => {
  assert.equal(canAccessModule('quimica_organica', { role: 'admin', academicYear: null }), true);
  assert.equal(canAccessModule('quimica_organica', { role: 'admin', academicYear: '4' }), true);
});
