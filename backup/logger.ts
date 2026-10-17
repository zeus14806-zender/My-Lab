import fs from 'fs';
import path from 'path';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  event: string;
  message: string;
}

export class BackupLogger {
  readonly entries: LogEntry[] = [];
  private readonly filePath: string | null;

  constructor(filePath?: string) {
    let resolved: string | null = filePath ?? null;
    if (resolved) {
      try {
        fs.mkdirSync(path.dirname(resolved), { recursive: true });
      } catch {
        resolved = null;
      }
    }
    this.filePath = resolved;
  }

  log(level: LogLevel, event: string, message: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      event,
      message,
    };
    this.entries.push(entry);
    const line = `[${entry.timestamp}] [${level}] [${event}] ${message}`;
    if (level === 'ERROR') console.error(`🛡️  ${line}`);
    else console.log(`🛡️  ${line}`);
    if (this.filePath) {
      try {
        fs.appendFileSync(this.filePath, line + '\n', 'utf8');
      } catch {
        // el logging jamás debe tumbar el sistema
      }
    }
  }

  info(event: string, message: string): void {
    this.log('INFO', event, message);
  }

  warn(event: string, message: string): void {
    this.log('WARN', event, message);
  }

  error(event: string, message: string): void {
    this.log('ERROR', event, message);
  }

  debug(event: string, message: string): void {
    this.log('DEBUG', event, message);
  }

  hasEvent(event: string): boolean {
    return this.entries.some((e) => e.event === event);
  }

  clear(): void {
    this.entries.length = 0;
  }
}

export function createBackupLogger(filePath?: string): BackupLogger {
  return new BackupLogger(filePath);
}
