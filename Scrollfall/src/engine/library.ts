import type { Envelope } from '../schema/envelope';
import { checkChallenge } from './validate';

export type Rejection = { id: string; errors: string[] };
export type Library = { challenges: Envelope[]; rejected: Rejection[] };

export function buildLibrary(raws: unknown[]): Library {
  const challenges: Envelope[] = [];
  const rejected: Rejection[] = [];
  const seen = new Set<string>();
  for (const raw of raws) {
    const result = checkChallenge(raw);
    if (!result.ok) {
      rejected.push({ id: result.id, errors: result.errors });
    } else if (seen.has(result.challenge.id)) {
      rejected.push({ id: result.challenge.id, errors: ['duplicate id'] });
    } else {
      seen.add(result.challenge.id);
      challenges.push(result.challenge);
    }
  }
  return { challenges, rejected };
}

const files = import.meta.glob<unknown>('../../content/challenges/*.json', { eager: true, import: 'default' });

export const LIBRARY = buildLibrary(Object.values(files));

if (LIBRARY.rejected.length > 0) console.warn('Rejected challenges:', LIBRARY.rejected);
