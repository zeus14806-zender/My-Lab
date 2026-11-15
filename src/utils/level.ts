// ============================================================================
// Progresión de nivel compartida entre cliente y servidor.
//
// El nivel se deriva del XP real del usuario con una única fórmula para evitar
// que la base de datos y la interfaz muestren valores distintos. La constante
// mantiene la coherencia con el usuario sembrado en migrations.ts
// (2.450 XP -> nivel 14).
// ============================================================================

/** XP necesarios para subir un nivel. */
export const XP_PER_LEVEL = 180;

/** Nivel técnico correspondiente a una cantidad de XP. Nunca baja de 1. */
export function levelFromXp(xp: number): number {
  const safeXp = Number.isFinite(xp) ? Math.max(0, xp) : 0;
  return Math.max(1, Math.floor(safeXp / XP_PER_LEVEL) + 1);
}
