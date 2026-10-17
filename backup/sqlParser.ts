export type WriteOperation = 'INSERT' | 'UPDATE' | 'DELETE' | 'OTHER';

export interface ParsedWrite {
  op: WriteOperation;
  table?: string;
  id?: number;
}

const INSERT_RE = /^\s*INSERT\s+(?:OR\s+\w+\s+)?INTO\s+[`"[]?([A-Za-z0-9_]+)/i;
const UPDATE_RE = /^\s*UPDATE\s+[`"[]?([A-Za-z0-9_]+)/i;
const DELETE_RE = /^\s*DELETE\s+FROM\s+[`"[]?([A-Za-z0-9_]+)/i;
const REPLACE_RE = /^\s*REPLACE\s+INTO\s+[`"[]?([A-Za-z0-9_]+)/i;
const ID_EQ_RE = /\bid\s*=\s*\?/i;

function idFromParams(sql: string, params: any[]): number | undefined {
  const match = ID_EQ_RE.exec(sql);
  if (!match) return undefined;
  const before = sql.slice(0, match.index);
  const paramIndex = (before.match(/\?/g) || []).length;
  const value = params[paramIndex];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  return undefined;
}

export function parseWrite(sql: string, params: any[] = []): ParsedWrite {
  const text = (sql || '').trim();
  let match = INSERT_RE.exec(text) ?? REPLACE_RE.exec(text);
  if (match) {
    return { op: 'INSERT', table: match[1], id: idFromParams(text, params) };
  }
  match = UPDATE_RE.exec(text);
  if (match) {
    return { op: 'UPDATE', table: match[1], id: idFromParams(text, params) };
  }
  match = DELETE_RE.exec(text);
  if (match) {
    return { op: 'DELETE', table: match[1], id: idFromParams(text, params) };
  }
  return { op: 'OTHER' };
}
