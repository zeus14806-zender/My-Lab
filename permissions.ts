// ============================================================================
// Política de permisos compartida entre el cliente (React) y el servidor
// (Express). Debe mantenerse libre de dependencias para poder importarse en
// ambos entornos.
//
// Extiende el sistema de roles existente ('student' | 'admin') con una
// condición de año académico. El año se persiste en `users.academic_year`
// como TEXT ('4' | '5') y aquí se modela como un tipo enumerado.
// ============================================================================

export type Role = 'student' | 'admin';

/** Años académicos admitidos por la institución (excluyentes). */
export type AcademicYear = '4' | '5';

export const ACADEMIC_YEARS: readonly AcademicYear[] = ['4', '5'] as const;

/** Módulos que están sujetos a una restricción por año académico. */
export type RestrictedModuleKey = 'quimica_organica';

/** Año mínimo requerido para cada módulo restringido. */
export const MODULE_MIN_ACADEMIC_YEAR: Record<RestrictedModuleKey, AcademicYear> = {
  quimica_organica: '5',
};

export interface PermissionSubject {
  role: Role | null;
  academicYear: AcademicYear | null;
}

export function isAcademicYear(value: unknown): value is AcademicYear {
  return value === '4' || value === '5';
}

/**
 * Normaliza el valor crudo de la base de datos / formulario al tipo
 * `AcademicYear`. Acepta también números por si llegan desde una API externa.
 */
export function normalizeAcademicYear(value: unknown): AcademicYear | null {
  if (isAcademicYear(value)) return value;
  if (value === 4) return '4';
  if (value === 5) return '5';
  return null;
}

export function academicYearLabel(year: AcademicYear | null | undefined): string {
  if (!year) return 'Año no definido';
  return `${year}.º Año`;
}

/**
 * Regla única de acceso a módulos restringidos.
 * - Los administradores siempre tienen acceso (gestionan el contenido).
 * - El resto requiere un año académico que alcance el mínimo del módulo.
 * - Un año desconocido se considera sin acceso (postura segura por defecto).
 */
export function canAccessModule(key: RestrictedModuleKey, subject: PermissionSubject): boolean {
  if (subject.role === 'admin') return true;
  if (subject.academicYear === null) return false;
  return Number(subject.academicYear) >= Number(MODULE_MIN_ACADEMIC_YEAR[key]);
}

export function moduleAccessDeniedMessage(key: RestrictedModuleKey): string {
  const minYear = MODULE_MIN_ACADEMIC_YEAR[key];
  return `Este módulo está disponible a partir de ${minYear}.º año.`;
}
