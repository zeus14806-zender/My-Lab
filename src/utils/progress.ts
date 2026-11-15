// ============================================================================
// Selector central de progreso del estudiante.
//
// Este módulo es puro (sin React ni acceso al DOM) para poder probarlo y para
// reutilizarlo desde la interfaz, los tests y cualquier capa que lo necesite.
//
// Fuentes reales:
//   - XP y nivel:    tabla `users` (xp_points, level) vía /api/stats/:userId.
//   - Cuestionarios: tabla `quiz_results` (intentos, aprobados, promedio).
//   - Simulaciones:  tabla `simulations`.
//   - Lecciones:     curso_local (src/utils/progressStore.ts) para las
//                    interacciones que aún no se persisten en el servidor
//                    (explorar la tabla periódica y resolver los ejercicios
//                    de Química Orgánica).
// ============================================================================

import { EJERCICIOS } from '../organicData';
import { levelFromXp } from './level';

export const PERIODIC_LESSON_ID = 'mod1:explore';
export const QUIZ_LESSON_ID = 'mod2:quiz';
export const ORGANIC_LESSON_PREFIX = 'mod3:exercise:';

/** Identificador de la lección asociada a un ejercicio de Química Orgánica. */
export function organicLessonId(exerciseId: string): string {
  return `${ORGANIC_LESSON_PREFIX}${exerciseId}`;
}

export interface LessonDefinition {
  id: string;
  label: string;
}

export interface ModuleLessonDefinition {
  id: string;
  title: string;
  lessons: LessonDefinition[];
}

/**
 * Catálogo de lecciones por módulo. Los ejercicios se derivan de la misma
 * fuente que usa OrganicChemistry para que el denominador nunca se desincronice.
 */
export const COURSE_MODULE_LESSONS: ModuleLessonDefinition[] = [
  {
    id: 'mod1',
    title: 'Tabla Periódica Interactiva',
    lessons: [{ id: PERIODIC_LESSON_ID, label: 'Explorar la tabla periódica' }],
  },
  {
    id: 'mod2',
    title: 'Equilibrio Químico y pH',
    lessons: [{ id: QUIZ_LESSON_ID, label: 'Aprobar el cuestionario' }],
  },
  {
    id: 'mod3',
    title: 'Química Orgánica: Hidrocarburos',
    lessons: EJERCICIOS.map((exercise, index) => ({
      id: organicLessonId(exercise.id),
      label: `Resolver ejercicio ${index + 1}`,
    })),
  },
];

export interface QuizAttemptResult {
  score: number;
  total_questions: number;
  passed: boolean;
}

export interface QuizSummary {
  attempts: number;
  passed: number;
  averageScore: number;
}

export interface ProgressInput {
  xp?: number;
  /** Nivel persistido; si falta se deriva del XP. */
  level?: number;
  quizAttempts?: number;
  quizzesPassed?: number;
  /** Promedio de aciertos en porcentaje (0-100). */
  averageQuizScore?: number;
  simulations?: number;
  localCompletedLessons?: Iterable<string>;
}

export interface ModuleProgress {
  id: string;
  title: string;
  completedLessons: number;
  totalLessons: number;
  percent: number;
  completed: boolean;
}

export interface ProgressSummary {
  xp: number;
  level: number;
  modulesCompleted: number;
  modulesTotal: number;
  modulesPercent: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  lessonsPercent: number;
  overallPercent: number;
  quizAttempts: number;
  quizzesPassed: number;
  averageQuizScore: number;
  passRate: number;
  simulations: number;
  perModule: ModuleProgress[];
}

/** Normaliza un porcentaje y evita divisiones por cero. */
export function percent(completed: number, total: number): number {
  if (!Number.isFinite(completed) || !Number.isFinite(total) || total <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round((completed / total) * 100)));
}

/** Resume intentos crudos de cuestionario (útil para tests y agregados). */
export function summarizeQuizResults(results: readonly QuizAttemptResult[]): QuizSummary {
  let score = 0;
  let questions = 0;
  let passed = 0;

  for (const result of results) {
    const total = Math.max(0, Number(result.total_questions) || 0);
    const correct = Math.max(0, Math.min(total, Number(result.score) || 0));
    score += correct;
    questions += total;
    if (result.passed) passed += 1;
  }

  return {
    attempts: results.length,
    passed,
    averageScore: percent(score, questions),
  };
}

/**
 * Construye el resumen que consumen todos los indicadores. Es determinista y
 * barato (el catálogo de lecciones es pequeño), así que puede memoizarse por
 * sus entradas sin problema.
 */
export function buildProgressSummary(input: ProgressInput = {}): ProgressSummary {
  const xp = Math.max(0, Number(input.xp) || 0);
  const persistedLevel = Math.floor(Number(input.level) || 0);
  // El XP manda: si el nivel persistido quedó atrás, la fórmula lo corrige.
  const level = Math.max(1, persistedLevel, levelFromXp(xp));

  const completedLessons = new Set<string>();
  for (const lessonId of input.localCompletedLessons ?? []) {
    completedLessons.add(lessonId);
  }

  const quizzesPassed = Math.max(0, Number(input.quizzesPassed) || 0);
  if (quizzesPassed > 0) {
    completedLessons.add(QUIZ_LESSON_ID);
  }

  const perModule: ModuleProgress[] = COURSE_MODULE_LESSONS.map((module) => {
    const totalLessons = module.lessons.length;
    const done = module.lessons.filter((lesson) => completedLessons.has(lesson.id)).length;
    return {
      id: module.id,
      title: module.title,
      completedLessons: done,
      totalLessons,
      percent: percent(done, totalLessons),
      completed: totalLessons > 0 && done === totalLessons,
    };
  });

  const lessonsTotal = perModule.reduce((sum, module) => sum + module.totalLessons, 0);
  const lessonsCompleted = perModule.reduce(
    (sum, module) => sum + module.completedLessons,
    0
  );
  const modulesTotal = perModule.length;
  const modulesCompleted = perModule.filter((module) => module.completed).length;

  const quizAttempts = Math.max(0, Number(input.quizAttempts) || 0);
  const averageQuizScore = percent(
    Number(input.averageQuizScore) || 0,
    100
  );

  return {
    xp,
    level,
    modulesCompleted,
    modulesTotal,
    modulesPercent: percent(modulesCompleted, modulesTotal),
    lessonsCompleted,
    lessonsTotal,
    lessonsPercent: percent(lessonsCompleted, lessonsTotal),
    overallPercent: percent(lessonsCompleted, lessonsTotal),
    quizAttempts,
    quizzesPassed,
    averageQuizScore,
    passRate: percent(quizzesPassed, quizAttempts),
    simulations: Math.max(0, Number(input.simulations) || 0),
    perModule,
  };
}

/** Formatea números grandes (XP) con separadores locales. */
export function formatNumber(value: number): string {
  const safe = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  return new Intl.NumberFormat('es-ES').format(safe);
}
