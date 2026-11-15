// ============================================================================
// Persistencia local de lecciones completadas.
//
// El backend actual guarda XP, cuestionarios y simulaciones, pero no expone un
// endpoint de lecciones. Mientras exista esa carencia, las interacciones que
// ocurren solo en el cliente (explorar la tabla y resolver ejercicios de
// Química Orgánica) se guardan por usuario en localStorage.
//
// Cada escritura emite un evento para que useUserProgress() recalcule los
// indicadores sin recargar la página. También se escucha el evento `storage`
// para mantener sincronizadas varias pestañas.
// ============================================================================

const STORAGE_KEY = 'mylab_lesson_progress_v1';
export const PROGRESS_EVENT = 'mylab:progress-changed';

type ProgressMap = Record<string, string[]>;

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readMap(): ProgressMap {
  if (!isBrowser()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as ProgressMap;
  } catch {
    return {};
  }
}

function writeMap(map: ProgressMap): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Almacenamiento lleno o bloqueado: el progreso del servidor sigue intacto.
  }
}

function notify(): void {
  if (!isBrowser()) return;
  window.dispatchEvent(new Event(PROGRESS_EVENT));
}

/** Lecciones completadas del usuario (copia defensiva). */
export function getCompletedLessons(userId: number): Set<string> {
  if (!userId) return new Set();
  const stored = readMap()[String(userId)];
  return new Set(Array.isArray(stored) ? stored.filter((id) => typeof id === 'string') : []);
}

/** Marca una lección como completada y notifica a los suscriptores. */
export function markLessonCompleted(userId: number, lessonId: string): void {
  if (!userId || !lessonId) return;

  const map = readMap();
  const key = String(userId);
  const current = new Set(Array.isArray(map[key]) ? map[key] : []);
  if (current.has(lessonId)) return;

  current.add(lessonId);
  map[key] = Array.from(current);
  writeMap(map);
  notify();
}

/** Elimina las lecciones de un módulo (por ejemplo, al reiniciar ejercicios). */
export function clearLessonsByPrefix(userId: number, prefix: string): void {
  if (!userId || !prefix) return;

  const map = readMap();
  const key = String(userId);
  const current = Array.isArray(map[key]) ? map[key] : [];
  const next = current.filter((lessonId) => !lessonId.startsWith(prefix));
  if (next.length === current.length) return;

  if (next.length > 0) {
    map[key] = next;
  } else {
    delete map[key];
  }
  writeMap(map);
  notify();
}

/** Suscribe un callback a cambios locales o de otras pestañas. */
export function subscribeToProgress(listener: () => void): () => void {
  if (!isBrowser()) return () => {};

  const handler = (event: Event) => {
    if (event.type === 'storage') {
      const storageEvent = event as StorageEvent;
      if (storageEvent.key !== null && storageEvent.key !== STORAGE_KEY) return;
    }
    listener();
  };

  window.addEventListener(PROGRESS_EVENT, handler);
  window.addEventListener('storage', handler);

  return () => {
    window.removeEventListener(PROGRESS_EVENT, handler);
    window.removeEventListener('storage', handler);
  };
}
