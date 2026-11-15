import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  COURSE_MODULE_LESSONS,
  PERIODIC_LESSON_ID,
  QUIZ_LESSON_ID,
  buildProgressSummary,
  formatNumber,
  organicLessonId,
  percent,
  summarizeQuizResults,
} from '../src/utils/progress.js';
import { XP_PER_LEVEL, levelFromXp } from '../src/utils/level.js';
import { EJERCICIOS } from '../src/organicData.js';

const ALL_LESSONS = COURSE_MODULE_LESSONS.flatMap((module) =>
  module.lessons.map((lesson) => lesson.id)
);

test('el catálogo usa los 8 ejercicios reales de Química Orgánica', () => {
  const organicModule = COURSE_MODULE_LESSONS.find((module) => module.id === 'mod3');
  assert.ok(organicModule);
  assert.equal(organicModule.lessons.length, EJERCICIOS.length);
  assert.equal(organicModule.lessons.length, 8);
  assert.equal(organicModule.lessons[0].id, organicLessonId('ex1'));

  assert.equal(ALL_LESSONS.length, 10);
  assert.equal(new Set(ALL_LESSONS).size, ALL_LESSONS.length);
});

test('0%: usuario nuevo sin XP, intentos ni lecciones', () => {
  const summary = buildProgressSummary({
    xp: 0,
    level: 1,
    quizAttempts: 0,
    quizzesPassed: 0,
    averageQuizScore: 0,
    simulations: 0,
  });

  assert.equal(summary.modulesTotal, 3);
  assert.equal(summary.modulesCompleted, 0);
  assert.equal(summary.modulesPercent, 0);
  assert.equal(summary.lessonsTotal, 10);
  assert.equal(summary.lessonsCompleted, 0);
  assert.equal(summary.lessonsPercent, 0);
  assert.equal(summary.overallPercent, 0);
  assert.equal(summary.passRate, 0);
  assert.equal(summary.averageQuizScore, 0);
  assert.equal(summary.level, 1);
  assert.equal(summary.simulations, 0);
  assert.equal(summary.perModule.every((module) => module.percent === 0), true);
});

test('progreso parcial: módulos, lecciones, promedio y tasa de aprobación', () => {
  const summary = buildProgressSummary({
    xp: 2700,
    level: 15,
    quizAttempts: 2,
    quizzesPassed: 1,
    averageQuizScore: 60,
    simulations: 3,
    localCompletedLessons: [
      PERIODIC_LESSON_ID,
      organicLessonId('ex1'),
      organicLessonId('ex2'),
      organicLessonId('ex3'),
      organicLessonId('ex4'),
    ],
  });

  // 5 lecciones locales + la lección de quiz aprobada = 6 de 10.
  assert.equal(summary.lessonsCompleted, 6);
  assert.equal(summary.lessonsPercent, 60);
  assert.equal(summary.overallPercent, 60);

  // mod1 y mod2 completos; mod3 va 4 de 8.
  assert.equal(summary.modulesCompleted, 2);
  assert.equal(summary.modulesPercent, 67);
  const mod3 = summary.perModule.find((module) => module.id === 'mod3');
  assert.equal(mod3?.completedLessons, 4);
  assert.equal(mod3?.percent, 50);
  assert.equal(mod3?.completed, false);

  assert.equal(summary.passRate, 50);
  assert.equal(summary.averageQuizScore, 60);
  assert.equal(summary.simulations, 3);

  // El XP 2700 manda sobre un nivel persistido desactualizado.
  assert.equal(levelFromXp(2700), 16);
  assert.equal(summary.level, 16);
});

test('100%: todos los módulos y lecciones completos', () => {
  const summary = buildProgressSummary({
    xp: 3600,
    level: 21,
    quizAttempts: 1,
    quizzesPassed: 1,
    averageQuizScore: 100,
    simulations: 10,
    localCompletedLessons: ALL_LESSONS,
  });

  assert.equal(summary.lessonsCompleted, 10);
  assert.equal(summary.lessonsTotal, 10);
  assert.equal(summary.lessonsPercent, 100);
  assert.equal(summary.overallPercent, 100);
  assert.equal(summary.modulesCompleted, 3);
  assert.equal(summary.modulesPercent, 100);
  assert.equal(summary.passRate, 100);
  assert.equal(summary.perModule.every((module) => module.completed), true);
});

test('un intento aprobado cuenta la lección aunque no exista registro local', () => {
  const summary = buildProgressSummary({
    quizAttempts: 1,
    quizzesPassed: 1,
    localCompletedLessons: [],
  });

  assert.equal(summary.lessonsCompleted, 1);
  assert.equal(summary.perModule.find((module) => module.id === 'mod2')?.completed, true);
});

test('las lecciones desconocidas no inflan el progreso', () => {
  const summary = buildProgressSummary({
    localCompletedLessons: ['mod9:inventada', 'mod3:exercise:no-existe'],
  });

  assert.equal(summary.lessonsCompleted, 0);
  assert.equal(summary.overallPercent, 0);
});

test('percent evita divisiones por cero y recorta a 0-100', () => {
  assert.equal(percent(0, 0), 0);
  assert.equal(percent(5, 0), 0);
  assert.equal(percent(1, 3), 33);
  assert.equal(percent(2, 3), 67);
  assert.equal(percent(-1, 10), 0);
  assert.equal(percent(20, 10), 100);
});

test('summarizeQuizResults agrega intentos y promedio real', () => {
  const summary = summarizeQuizResults([
    { score: 4, total_questions: 5, passed: true },
    { score: 2, total_questions: 5, passed: false },
  ]);

  assert.equal(summary.attempts, 2);
  assert.equal(summary.passed, 1);
  assert.equal(summary.averageScore, 60);
});

test('el nivel se deriva del XP con la fórmula compartida', () => {
  assert.equal(XP_PER_LEVEL, 180);
  assert.equal(levelFromXp(0), 1);
  assert.equal(levelFromXp(179), 1);
  assert.equal(levelFromXp(180), 2);
  assert.equal(levelFromXp(2450), 14);
  assert.equal(levelFromXp(-50), 1);
});

test('formatNumber usa separadores locales y no acepta negativos', () => {
  assert.match(formatNumber(12345), /^12[.\s]345$/);
  assert.equal(formatNumber(-10), '0');
});
