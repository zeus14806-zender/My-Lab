// ============================================================================
// Hook único para el progreso del estudiante.
//
// Centraliza la lectura de datos reales y entrega un resumen memoizado que
// consumen el dashboard y el perfil. Se recalcula:
//   - al montar y cuando cambia el usuario,
//   - al completar una lección local (evento de progressStore),
//   - cuando la interfaz llama a refresh() tras guardar un quiz o simulación.
// ============================================================================

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { buildProgressSummary, type ProgressSummary } from '../utils/progress';
import { getCompletedLessons, subscribeToProgress } from '../utils/progressStore';
import { levelFromXp } from '../utils/level';

interface UseUserProgressOptions {
  userId: number;
}

interface ServerProgress {
  xp: number;
  level: number;
  quizAttempts: number;
  quizzesPassed: number;
  averageQuizScore: number;
  simulations: number;
}

export interface UserProgress extends ProgressSummary {
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const EMPTY_SERVER: ServerProgress = {
  xp: 0,
  level: 1,
  quizAttempts: 0,
  quizzesPassed: 0,
  averageQuizScore: 0,
  simulations: 0,
};

function readCachedUser(): { xp: number; level: number } {
  if (typeof window === 'undefined') return { xp: 0, level: 1 };

  try {
    const raw = window.localStorage.getItem('mylab_active_user');
    if (!raw) return { xp: 0, level: 1 };

    const parsed = JSON.parse(raw);
    const xp = Math.max(0, Number(parsed?.xp_points) || 0);
    const storedLevel = Math.floor(Number(parsed?.level) || 0);
    return { xp, level: Math.max(1, storedLevel, levelFromXp(xp)) };
  } catch {
    return { xp: 0, level: 1 };
  }
}

export function useUserProgress({ userId }: UseUserProgressOptions): UserProgress {
  const [server, setServer] = useState<ServerProgress>(() => {
    const cached = readCachedUser();
    return { ...EMPTY_SERVER, xp: cached.xp, level: cached.level };
  });
  const [localVersion, setLocalVersion] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    if (!userId) {
      requestId.current += 1;
      setServer(EMPTY_SERVER);
      setIsLoading(false);
      return;
    }

    const current = ++requestId.current;
    setIsLoading(true);

    try {
      const response = await fetch(`/api/stats/${userId}`);
      if (!response.ok) throw new Error(`No se pudo cargar el progreso (${response.status})`);

      const data = await response.json();
      if (current !== requestId.current) return;

      const xp = Math.max(0, Number(data?.xp_points) || 0);
      const attempts = Math.max(0, Number(data?.total_quiz_attempts) || 0);
      const passed = Math.max(
        0,
        Math.min(attempts, Number(data?.quizzes_passed) || 0)
      );

      setServer({
        xp,
        level: Math.max(
          1,
          Math.floor(Number(data?.level) || 0),
          levelFromXp(xp)
        ),
        quizAttempts: attempts,
        quizzesPassed: passed,
        averageQuizScore: Math.max(
          0,
          Math.min(100, Number(data?.average_quiz_percent) || 0)
        ),
        simulations: Math.max(0, Number(data?.total_simulations) || 0),
      });
    } catch {
      // Sin conexión: conserva el XP/nivel en caché y el progreso local.
      if (current === requestId.current) {
        const cached = readCachedUser();
        setServer((previous) => ({
          ...previous,
          xp: cached.xp,
          level: Math.max(previous.level, cached.level),
        }));
      }
    } finally {
      if (current === requestId.current) setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    return subscribeToProgress(() => {
      setLocalVersion((version) => version + 1);
    });
  }, [userId]);

  const localCompletedLessons = useMemo(
    () => getCompletedLessons(userId),
    [userId, localVersion]
  );

  const summary = useMemo(
    () => buildProgressSummary({ ...server, localCompletedLessons }),
    [server, localCompletedLessons]
  );

  return useMemo(
    () => ({ ...summary, isLoading, refresh }),
    [summary, isLoading, refresh]
  );
}
