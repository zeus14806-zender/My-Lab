import sqlite3 from 'sqlite3';
import { onWrite, WriteEvent } from './hooks.js';
import { parseWrite } from './sqlParser.js';
import { BackupLogger } from './logger.js';
import { all, get, run, transaction, withTimeout } from './sqlite.js';

export type PrimaryReader = <T = any>(sql: string, params?: any[]) => Promise<T[]>;

export interface SyncEngineOptions {
  backupDb: sqlite3.Database;
  primaryGet: PrimaryReader;
  logger: BackupLogger;
  tables: string[];
  readTimeoutMs?: number;
  retries?: number;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class BackupSyncEngine {
  private readonly backupDb: sqlite3.Database;
  private readonly primaryGet: PrimaryReader;
  private readonly logger: BackupLogger;
  private readonly tables: string[];
  private readonly readTimeoutMs: number;
  private readonly retries: number;

  private queue: Promise<void> = Promise.resolve();
  private pending = 0;
  private idleWaiters: Array<() => void> = [];
  private unsubscribe: (() => void) | null = null;
  private running = false;

  constructor(options: SyncEngineOptions) {
    this.backupDb = options.backupDb;
    this.primaryGet = options.primaryGet;
    this.logger = options.logger;
    this.tables = options.tables;
    this.readTimeoutMs = options.readTimeoutMs ?? 5000;
    this.retries = Math.max(1, options.retries ?? 3);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.unsubscribe = onWrite((event) => this.handleWrite(event));
    this.logger.info('SYNC_MOTOR_INICIADO', `Motor de sincronización en tiempo real activo para tablas: ${this.tables.join(', ')}`);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    this.logger.info('SYNC_MOTOR_DETENIDO', 'Motor de sincronización detenido');
  }

  handleWrite(event: WriteEvent): void {
    if (!this.running) return;
    const parsed = parseWrite(event.sql, event.params);
    if (parsed.op === 'OTHER' || !parsed.table || !this.isSyncedTable(parsed.table)) return;

    const table = parsed.table;
    const op = parsed.op;
    const id = parsed.id;

    this.enqueue(async () => {
      // Nunca registrar parámetros: pueden contener contraseñas.
      this.logger.debug('SYNC_ESCRITURA', `${op} detectado en tabla "${table}" (id=${id ?? 'n/d'})`);
      if (op === 'INSERT') {
        if (event.lastID && event.lastID > 0) {
          await this.withRetries(() => this.replicateRow(table, event.lastID));
        } else {
          await this.withRetries(() => this.fullTableSync(table));
        }
        return;
      }
      if (op === 'DELETE') {
        if (id !== undefined) {
          await this.withRetries(() => this.deleteRow(table, id));
        } else {
          await this.withRetries(() => this.fullTableSync(table));
        }
        return;
      }
      // UPDATE
      if (id !== undefined) {
        await this.withRetries(() => this.replicateRow(table, id));
      } else {
        await this.withRetries(() => this.fullTableSync(table));
      }
    });
  }

  enqueue(task: () => Promise<void>): void {
    this.pending += 1;
    this.queue = this.queue
      .then(task)
      .catch((err) => {
        this.logger.error('SYNC_TAREA_FALLIDA', err instanceof Error ? err.message : String(err));
      })
      .then(() => {
        this.pending -= 1;
        if (this.pending === 0) {
          const waiters = this.idleWaiters.splice(0, this.idleWaiters.length);
          for (const waiter of waiters) waiter();
        }
      });
  }

  waitForIdle(): Promise<void> {
    if (this.pending === 0) return Promise.resolve();
    return new Promise((resolve) => this.idleWaiters.push(resolve));
  }

  async replicateRow(table: string, id: number): Promise<void> {
    const rows = await this.readPrimary(`SELECT * FROM "${table}" WHERE id = ?`, [id]);
    if (rows.length === 0) {
      await run(this.backupDb, `DELETE FROM "${table}" WHERE id = ?`, [id]);
      this.logger.debug('SYNC_FILA_BORRADA', `Fila id=${id} de "${table}" eliminada del respaldo`);
      return;
    }
    await upsertRow(this.backupDb, table, rows[0]);
    this.logger.debug('SYNC_FILA_REPLICADA', `Fila id=${id} de "${table}" replicada al respaldo`);
  }

  async deleteRow(table: string, id: number): Promise<void> {
    await run(this.backupDb, `DELETE FROM "${table}" WHERE id = ?`, [id]);
    this.logger.debug('SYNC_FILA_BORRADA', `Fila id=${id} de "${table}" eliminada del respaldo`);
  }

  async fullTableSync(table: string): Promise<void> {
    const rows = await this.readPrimary(`SELECT * FROM "${table}"`);
    await transaction(this.backupDb, async () => {
      await run(this.backupDb, `DELETE FROM "${table}"`);
      for (const row of rows) {
        await insertRow(this.backupDb, table, row);
      }
    });
    this.logger.info('SYNC_TABLA_COMPLETA', `Tabla "${table}" resincronizada completa (${rows.length} filas)`);
  }

  async fullSyncAll(): Promise<void> {
    for (const table of this.tables) {
      await this.fullTableSync(table);
    }
  }

  private isSyncedTable(table: string): boolean {
    return this.tables.includes(table);
  }

  private async readPrimary(sql: string, params: any[] = []): Promise<any[]> {
    const rows = await withTimeout(this.primaryGet(sql, params), this.readTimeoutMs, sql);
    return rows;
  }

  private async withRetries(task: () => Promise<void>): Promise<void> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        await task();
        return;
      } catch (err) {
        lastError = err;
        this.logger.warn(
          'SYNC_REINTENTO',
          `Reintento ${attempt}/${this.retries} fallido: ${err instanceof Error ? err.message : String(err)}`
        );
        if (attempt < this.retries) await sleep(50 * attempt);
      }
    }
    this.logger.error('SYNC_FALLO_DEFINITIVO', lastError instanceof Error ? lastError.message : String(lastError));
    throw lastError;
  }
}

export async function upsertRow(db: sqlite3.Database, table: string, row: Record<string, any>): Promise<void> {
  const columns = Object.keys(row);
  if (columns.length === 0) return;
  if (row.id !== undefined && row.id !== null) {
    const setList = columns
      .filter((c) => c !== 'id')
      .map((c) => `"${c}" = ?`)
      .join(', ');
    const setParams = columns.filter((c) => c !== 'id').map((c) => row[c]);
    if (setList) {
      const updated = await run(db, `UPDATE "${table}" SET ${setList} WHERE id = ?`, [...setParams, row.id]);
      if (updated.changes > 0) return;
    }
  }
  const colList = columns.map((c) => `"${c}"`).join(', ');
  const placeholders = columns.map(() => '?').join(', ');
  await run(db, `INSERT OR REPLACE INTO "${table}" (${colList}) VALUES (${placeholders})`, columns.map((c) => row[c]));
}

export async function insertRow(db: sqlite3.Database, table: string, row: Record<string, any>): Promise<void> {
  const columns = Object.keys(row);
  if (columns.length === 0) return;
  const colList = columns.map((c) => `"${c}"`).join(', ');
  const placeholders = columns.map(() => '?').join(', ');
  await run(db, `INSERT OR REPLACE INTO "${table}" (${colList}) VALUES (${placeholders})`, columns.map((c) => row[c]));
}

export async function countRows(db: sqlite3.Database, table: string): Promise<number> {
  const row = await get<{ c: number }>(db, `SELECT COUNT(*) as c FROM "${table}"`);
  return row?.c ?? 0;
}

export async function readAllRows(db: sqlite3.Database, table: string): Promise<any[]> {
  return all(db, `SELECT * FROM "${table}"`);
}
