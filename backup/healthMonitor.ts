import { BackupLogger } from './logger.js';
import { withTimeout } from './sqlite.js';

export type MonitorState = 'IDLE' | 'HEALTHY' | 'FAILING' | 'RESTORING' | 'RESTORE_FAILED' | 'STOPPED';

export interface HealthMonitorOptions {
  ping: () => Promise<void>;
  onRestore: () => Promise<void>;
  logger: BackupLogger;
  intervalMs: number;
  timeoutMs?: number;
  failureThreshold?: number;
  restoreWaitMs: number;
}

export class HealthMonitor {
  private readonly ping: () => Promise<void>;
  private readonly onRestore: () => Promise<void>;
  private readonly logger: BackupLogger;
  private readonly intervalMs: number;
  private readonly timeoutMs: number;
  private readonly failureThreshold: number;
  private readonly restoreWaitMs: number;

  private timer: NodeJS.Timeout | null = null;
  private restoreTimer: NodeJS.Timeout | null = null;
  private failures = 0;
  private failedAt = 0;
  private checking = false;

  state: MonitorState = 'IDLE';

  constructor(options: HealthMonitorOptions) {
    this.ping = options.ping;
    this.onRestore = options.onRestore;
    this.logger = options.logger;
    this.intervalMs = Math.max(1, options.intervalMs);
    this.timeoutMs = options.timeoutMs ?? 3000;
    this.failureThreshold = Math.max(1, options.failureThreshold ?? 2);
    this.restoreWaitMs = options.restoreWaitMs;
  }

  start(): void {
    if (this.timer) return;
    this.state = 'HEALTHY';
    this.logger.info(
      'HEALTH_MONITOR_INICIADO',
      `Monitor de salud activo (intervalo=${this.intervalMs}ms, umbral_fallos=${this.failureThreshold}, espera_restauracion=${this.restoreWaitMs}ms)`
    );
    void this.check();
    this.timer = setInterval(() => void this.check(), this.intervalMs);
    if (typeof this.timer.unref === 'function') this.timer.unref();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.cancelRestoreTimer(null);
    this.state = 'STOPPED';
    this.logger.info('HEALTH_MONITOR_DETENIDO', 'Monitor de salud detenido');
  }

  elapsedSinceFailure(): number {
    return this.failedAt === 0 ? 0 : Date.now() - this.failedAt;
  }

  async check(): Promise<void> {
    if (this.checking || this.state === 'STOPPED' || this.state === 'RESTORING') return;
    this.checking = true;
    try {
      await withTimeout(this.ping(), this.timeoutMs, 'health check de la DB principal');
      this.onHealthy();
    } catch (err) {
      this.onFailing(err);
    } finally {
      this.checking = false;
    }
  }

  private onHealthy(): void {
    this.failures = 0;
    if (this.state === 'FAILING') {
      const elapsed = this.elapsedSinceFailure();
      this.cancelRestoreTimer('HEALTHY');
      this.failedAt = 0;
      this.state = 'HEALTHY';
      this.logger.warn(
        'HEALTH_RECUPERADO_CANCELADO',
        `DB principal recuperada tras ${elapsed}ms. Restauración cancelada automáticamente.`
      );
      return;
    }
    if (this.state === 'RESTORE_FAILED') {
      this.state = 'HEALTHY';
    }
  }

  private onFailing(err: unknown): void {
    this.failures += 1;
    const detail = err instanceof Error ? err.message : String(err);

    if (this.state === 'FAILING' || this.state === 'RESTORE_FAILED') {
      this.logger.debug('HEALTH_FALLO_CONTINUADO', `DB principal sigue caída (${this.failures} fallos consecutivos): ${detail}`);
      return;
    }

    if (this.failures < this.failureThreshold) {
      this.logger.warn('HEALTH_FALLO_PARCIAL', `Fallo ${this.failures}/${this.failureThreshold} al consultar la DB principal: ${detail}`);
      return;
    }

    this.state = 'FAILING';
    this.failedAt = Date.now();
    this.logger.error('HEALTH_FALLO_DETECTADO', `Caída de la DB principal detectada: ${detail}`);
    this.logger.info(
      'HEALTH_TEMPORIZADOR_INICIADO',
      `Temporizador de restauración iniciado: la restauración se ejecutará en ${this.restoreWaitMs}ms si no hay recuperación.`
    );
    this.restoreTimer = setTimeout(() => void this.runRestore(), this.restoreWaitMs);
    if (typeof this.restoreTimer.unref === 'function') this.restoreTimer.unref();
  }

  private cancelRestoreTimer(nextState: MonitorState | null): void {
    if (this.restoreTimer) {
      clearTimeout(this.restoreTimer);
      this.restoreTimer = null;
      if (nextState !== null) {
        this.logger.warn('HEALTH_RESTAURACION_CANCELADA', 'Se canceló el proceso de restauración programado.');
      }
    }
  }

  private async runRestore(): Promise<void> {
    if (this.state !== 'FAILING') return;
    this.restoreTimer = null;
    this.state = 'RESTORING';
    const downtime = this.elapsedSinceFailure();
    this.logger.error(
      'HEALTH_RESTAURACION_INICIADA',
      `Temporizador agotado (${downtime}ms de inactividad). Iniciando restauración desde la DB de respaldo...`
    );
    try {
      await this.onRestore();
      this.failures = 0;
      this.failedAt = 0;
      this.state = 'HEALTHY';
      this.logger.info('HEALTH_RESTAURACION_EJECUTADA', 'Restauración completada. La DB principal vuelve a ser la fuente activa.');
    } catch (err) {
      this.state = 'RESTORE_FAILED';
      this.failedAt = Date.now();
      this.logger.error(
        'HEALTH_RESTAURACION_FALLIDA',
        `La restauración falló: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
}
