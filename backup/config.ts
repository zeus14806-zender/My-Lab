import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: ['.env', '.env.local'] });

export interface BackupConfig {
  enabled: boolean;
  primaryKeyPath: string;
  backupPath: string;
  logPath: string;
  syncIntervalMs: number;
  syncRetries: number;
  healthCheckIntervalMs: number;
  healthTimeoutMs: number;
  healthFailureThreshold: number;
  restoreWaitMs: number;
}

export type BackupOverrides = Partial<BackupConfig>;

function envString(name: string, fallback: string): string {
  const raw = process.env[name];
  return raw === undefined || raw === '' ? fallback : raw;
}

function envNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function envBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(raw.trim().toLowerCase());
}

export function loadBackupConfig(overrides: BackupOverrides = {}): BackupConfig {
  const dataDir = path.join(process.cwd(), 'data');
  const config: BackupConfig = {
    enabled: envBool('BACKUP_ENABLED', true),
    primaryKeyPath: envString('PRIMARY_DB_PATH', path.join(dataDir, 'mylab.db')),
    backupPath: envString('BACKUP_DB_PATH', path.join(dataDir, 'mylab.backup.db')),
    logPath: envString('BACKUP_LOG_PATH', path.join(dataDir, 'backup', 'backup.log')),
    syncIntervalMs: envNumber('BACKUP_SYNC_INTERVAL_MS', 30000),
    syncRetries: envNumber('BACKUP_SYNC_RETRIES', 3),
    healthCheckIntervalMs: envNumber('BACKUP_HEALTH_CHECK_INTERVAL_MS', 10000),
    healthTimeoutMs: envNumber('BACKUP_HEALTH_TIMEOUT_MS', 3000),
    healthFailureThreshold: Math.max(1, envNumber('BACKUP_HEALTH_FAILURE_THRESHOLD', 2)),
    restoreWaitMs: envNumber('BACKUP_RESTORE_WAIT_MS', 5 * 60 * 1000),
  };
  return { ...config, ...overrides };
}

export const USER_RELATED_TABLES = [
  'users',
  'activities',
  'lab_reports',
  'course_modules',
  'simulations',
  'quiz_results',
] as const;

export type SyncedTable = (typeof USER_RELATED_TABLES)[number];
