export interface WriteEvent {
  sql: string;
  params: any[];
  lastID: number;
  changes: number;
}

export type WriteListener = (event: WriteEvent) => void;

const listeners = new Set<WriteListener>();

export function onWrite(listener: WriteListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyWrite(event: WriteEvent): void {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // un listener defectuoso nunca debe romper el flujo principal
    }
  }
}
