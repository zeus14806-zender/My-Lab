# Progreso real del perfil y del dashboard

Este documento describe cómo se calculan los indicadores de progreso del
estudiante, de dónde sale cada dato y qué carencias siguen existiendo en el
backend.

## Fuente central

| Pieza | Archivo | Responsabilidad |
|---|---|---|
| Selector puro | `src/utils/progress.ts` | Catálogo de lecciones, cálculo de porcentajes, módulos y resumen |
| Nivel compartido | `src/utils/level.ts` | Fórmula única `XP -> nivel` para cliente y servidor |
| Persistencia local | `src/utils/progressStore.ts` | Lecciones que aún no tienen endpoint (tabla y ejercicios orgánicos) |
| Hook reactivo | `src/hooks/useUserProgress.ts` | Carga `/api/stats/:userId`, escucha cambios y memoiza el resumen |
| Agregado servidor | `GET /api/stats/:userId` | XP, nivel, simulaciones e intentos/aprobados/promedio de quiz |

El hook se instancia una sola vez en `src/App.tsx` y su resultado se reutiliza
en el dashboard y en el perfil. Se recalcula al montar, al cambiar de usuario,
al completar una lección local y cuando la interfaz llama a `refresh()` después
de guardar un cuestionario o una simulación.

## Indicadores conectados

### Dashboard (`Resumen del Curso en Curso`)

| Indicador | Antes | Ahora | Fuente |
|---|---|---|---|
| Módulos de Práctica | `83%` fijo | `modulesPercent` | Módulos con todas sus lecciones completas / 3 |
| Avance Práctico | `50%` fijo | `lessonsPercent` | Lecciones completadas / 10 |
| Pruebas en Cola | `70%` fijo | `passRate` (Tasa de Aprobación) | Intentos aprobados / intentos totales de `quiz_results` |
| Tareas completadas | `62%` fijo | `simulations` (Simulaciones Realizadas) | Filas de `simulations` del usuario |

Las tarjetas muestran además el detalle real: `X de Y módulos`,
`X de Y lecciones` y `X de Y intentos`.

### Perfil

| Indicador | Antes | Ahora | Fuente |
|---|---|---|---|
| Puntos de Honor | `2,450 XP` fijo | `formatNumber(progress.xp)` | `users.xp_points` |
| Nivel Técnico | `14` fijo | `progress.level` | `users.level` reconciliado con `levelFromXp(xp)` |
| Progreso del Curso | No existía barra | Barra con `overallPercent` | Lecciones completadas / 10 |
| Rendimiento en Exámenes | “4 exámenes… 94%” fijo | Aprobados, intentos y promedio reales | `quiz_results` |
| Cursos recomendados | “para Alex” fijo | Nombre real del usuario | Estado de sesión |
| Estado de cada módulo | `Iniciado / Listo / En Progreso` fijo | `Completado / X% completado / Sin iniciar` | `progress.perModule` |

### Lecciones que alimentan el progreso

| Módulo | Lección | Cuándo se completa | Persistencia |
|---|---|---|---|
| `mod1` Tabla Periódica | Explorar la tabla | Al seleccionar un elemento | `localStorage` por usuario |
| `mod2` Equilibrio y pH | Aprobar el cuestionario | Al aprobar el quiz (≥ 3/5) | `quiz_results` + `localStorage` |
| `mod3` Química Orgánica | 8 ejercicios | Al responder correctamente cada ejercicio | `localStorage` por usuario |

Los ejercicios se derivan de `EJERCICIOS` (`src/organicData.ts`), por lo que el
denominador del módulo 3 nunca se desincroniza si se agregan o quitan
ejercicios.

## Fórmulas y casos borde

- `percent(completado, total)` devuelve `0` si `total <= 0` y recorta el
  resultado a `[0, 100]`.
- `levelFromXp(xp) = max(1, floor(xp / 180) + 1)`. El usuario sembrado con
  2.450 XP sigue mostrando nivel 14. Si el nivel persistido quedó atrás, manda
  el XP.
- `passRate = aprobados / intentos`; con 0 intentos muestra `0%`.
- `averageQuizScore = aciertos totales / preguntas totales`; con 0 preguntas
  muestra `0%`.
- La barra y los porcentajes muestran `0%`, valores parciales y `100%` con el
  mismo componente.

## Persistencia y reactividad

- `markLessonCompleted()` y `clearLessonsByPrefix()` escriben en
  `localStorage` y emiten `mylab:progress-changed`.
- `useUserProgress()` escucha ese evento y el evento `storage`, de modo que el
  dashboard y el perfil se actualizan sin recargar la página, incluso entre
  pestañas.
- Al guardar un quiz se marca la lección local, se actualiza el XP/nivel en
  caché y se llama a `refresh()` para releer el agregado del servidor.
- Al guardar una simulación se llama a `refresh()` para actualizar el contador.
- Al reiniciar los ejercicios orgánicos se borran solo las lecciones de ese
  módulo.

## Carencias y propuestas

1. **Lecciones en el servidor.** `mod1` y `mod3` viven en `localStorage`, por
   lo que no se sincronizan entre dispositivos ni se ven en el panel admin.
   Propuesta: crear una tabla `user_progress (user_id, lesson_id, completed_at)`
   con endpoints `GET/PUT /api/progress/:userId` y migrar el store local.
2. **Catálogo de lecciones.** Hoy está en código (`COURSE_MODULE_LESSONS`).
   Propuesta: moverlo a `course_modules`/`module_lessons` para que el admin
   pueda editar el contenido sin desplegar.
3. **“Pruebas en Cola”.** No existe una cola de pruebas pendientes en la base
   de datos. Se reemplazó por “Tasa de Aprobación”, que sí tiene respaldo real.
4. **“Tareas completadas”.** No existe tabla de tareas. Se reemplazó por
   “Simulaciones Realizadas”, que se persiste en `simulations`.
5. **“Tu Compañero Práctico”.** Es contenido social de ejemplo y no es un
   indicador de progreso; se dejó intacto. Si se quiere dinamizar, requiere una
   tabla de compañeros/equipos y presencia en tiempo real.
6. **Matrícula y fecha de miembro.** Siguen siendo datos de identidad fijos.
   Propuesta: exponer `created_at` y un campo `enrollment_code` en `users`.
