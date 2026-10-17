# Sistema de respaldo (Backup DB)

Sistema de replicación en tiempo real de la base de datos principal (SQLite) hacia
una base de datos de respaldo **aislada**, con detección de caídas, temporizador de
5 minutos y restauración automática.

## Arquitectura

```
App (Express) ──► db.ts (runQuery) ──► SQLite principal (data/mylab.db)
                        │
                        │ notifyWrite()  (hook de escritura, no bloqueante)
                        ▼
                 backup/ (capa de respaldo)
                 ├─ syncEngine.ts      replicación en tiempo real (por fila)
                 ├─ healthMonitor.ts   health check + temporizador diferido
                 ├─ restore.ts         repoblación de la DB principal
                 └─ backupDb           SQLite de respaldo (data/mylab.backup.db)
```

La DB de respaldo **nunca** es consultada por la lógica de la aplicación. Solo se
abre para (1) escribir las réplicas y (2) leerla durante una restauración.

## Componentes

| Archivo | Responsabilidad |
|---|---|
| `backup/config.ts` | Configuración por variables de entorno y lista de tablas sincronizadas |
| `backup/hooks.ts` | Registro de escrituras emitido desde `db.ts` (sin acoplar la app) |
| `backup/schema.ts` | Esquema espejo de la DB de respaldo + tabla de metadatos |
| `backup/syncEngine.ts` | Motor de sincronización: upsert por fila, borrado, reintentos y resync completo |
| `backup/healthMonitor.ts` | Máquina de estados `HEALTHY → FAILING → RESTORING` con temporizador cancelable |
| `backup/restore.ts` | Restauración verificada desde el respaldo hacia la DB principal |
| `backup/index.ts` | `startBackupSystem()`: arranque y parada coordinados |
| `tests/backup.test.ts` | Pruebas de los escenarios requeridos |

### Sincronización en tiempo real

Todas las escrituras pasan por `runQuery()` en `db.ts`. Tras cada operación con éxito
se emite un `WriteEvent` que la capa de respaldo traduce así:

- `INSERT` → lee la fila por `lastID` (incluida la **contraseña hash, byte a byte sin
  modificarla**) y la inserta/actualiza en el respaldo.
- `UPDATE ... WHERE id = ?` → re-lee y replica esa fila.
- `DELETE ... WHERE id = ?` → elimina la fila en el respaldo.
- Operaciones sin `id` (p. ej. `UPDATE users SET role='admin'` o `DELETE FROM t`) →
  **resincronización completa de la tabla** como red de seguridad.

Además, cada `BACKUP_SYNC_INTERVAL_MS` se ejecuta una reconciliación completa de todas
las tablas para corregir cualquier escritura que haya evadido el hook.

### Detección de fallos y restauración diferida

1. Cada `BACKUP_HEALTH_CHECK_INTERVAL_MS` se hace ping a la DB principal abriendo una
   **conexión nueva** (detecta archivo borrado/corrupto/bloqueado).
2. Tras `BACKUP_HEALTH_FAILURE_THRESHOLD` fallos consecutivos → estado `FAILING` y se
   inicia un temporizador de `BACKUP_RESTORE_WAIT_MS` (5 min por defecto).
3. Si vuelve a responder antes del vencimiento → se **cancela** la restauración.
4. Si el temporizador se agota → estado `RESTORING` y se ejecuta la restauración.

### Restauración

- Verifica el respaldo (`PRAGMA quick_check`).
- Si la DB principal es inutilizable (corrupta/inexistente), el archivo dañado se mueve
  a `mylab.corrupt-<fecha>.db` y se recrea el esquema.
- Repuebla la DB principal copiando todas las filas desde el respaldo (vía `ATTACH`).
- Verifica los conteos de cada tabla antes de dar la restauración por buena.

Todas las fases loguean eventos claros: `HEALTH_FALLO_DETECTADO`,
`HEALTH_TEMPORIZADOR_INICIADO`, `HEALTH_RESTAURACION_CANCELADA`,
`HEALTH_RESTAURACION_INICIADA`, `HEALTH_RESTAURACION_EJECUTADA`, etc.

## Configuración

Copia `.env.example` a `.env`/`.env.local` y ajusta:

| Variable | Por defecto | Descripción |
|---|---|---|
| `BACKUP_ENABLED` | `true` | Activa/desactiva el sistema |
| `PRIMARY_DB_PATH` | `data/mylab.db` | DB principal |
| `BACKUP_DB_PATH` | `data/mylab.backup.db` | DB de respaldo |
| `BACKUP_LOG_PATH` | `data/backup/backup.log` | Log dedicado |
| `BACKUP_SYNC_INTERVAL_MS` | `30000` | Reconciliación completa periódica |
| `BACKUP_SYNC_RETRIES` | `3` | Reintentos por operación |
| `BACKUP_HEALTH_CHECK_INTERVAL_MS` | `10000` | Intervalo del health check |
| `BACKUP_HEALTH_TIMEOUT_MS` | `3000` | Timeout de cada ping |
| `BACKUP_HEALTH_FAILURE_THRESHOLD` | `2` | Fallos consecutivos para declarar caída |
| `BACKUP_RESTORE_WAIT_MS` | `300000` | Espera antes de restaurar (5 min) |

## Uso

El sistema arranca automáticamente con el servidor (`server.ts` → `startBackupSystem()`)
y se detiene con `SIGINT`/`SIGTERM`.

Estado en runtime: `GET /api/system/backup-status`
```json
{ "enabled": true, "state": "HEALTHY", "restore_wait_ms": 300000, ... }
```

## Pruebas

```bash
npm test
```

Cubre:
1. Sincronización en tiempo real (INSERT/UPDATE/DELETE) incluyendo la contraseña
   hasheada intacta.
2. Resincronización completa ante escrituras sin `WHERE id`.
3. Recuperación antes del tiempo de espera → **no** restaura (cancela).
4. Fallo prolongado → restaura la DB principal desde el respaldo y verifica conteos.

Las pruebas usan DBs temporales y tiempos cortos (`BACKUP_RESTORE_WAIT_MS=600`) para no
esperar los 5 minutos reales.

## Probar manualmente una caída

1. Arranca la app (`npm run dev`) y comprueba `data/mylab.backup.db`.
2. Renombra o elimina `data/mylab.db` para simular la caída.
3. Observa `data/backup/backup.log`: `HEALTH_FALLO_DETECTADO` → `HEALTH_TEMPORIZADOR_INICIADO`.
4. Vuelve a crear/restaurar el archivo antes de los 5 minutos → verás
   `HEALTH_RESTAURACION_CANCELADA`.
5. Si no se recupera en 5 minutos → `HEALTH_RESTAURACION_EJECUTADA` y la DB principal
   queda repoblada desde el respaldo.
