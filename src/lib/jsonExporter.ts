import type { ProcessMap } from '../types/process';

export function toJSON(process: ProcessMap): string {
  return JSON.stringify(process, null, 2);
}

export function fromJSON(raw: string): ProcessMap {
  const parsed = JSON.parse(raw) as ProcessMap;
  // minimal shape validation
  if (!parsed.id || !Array.isArray(parsed.nodes) || !Array.isArray(parsed.lanes)) {
    throw new Error('JSON inválido: no parece un ProcessMap GEN+.');
  }
  return parsed;
}
