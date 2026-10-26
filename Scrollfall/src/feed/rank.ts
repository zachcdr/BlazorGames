import type { Envelope } from '../schema/envelope';

export type Outcome = 'win' | 'lose' | 'skip';
export type Rng = () => number;

const RECENT_LIMIT = 8;
const DIFFICULTY_STEP = 0.5;
export const START_DIFFICULTY = 2;

export function nextDifficulty(target: number, outcome: Outcome): number {
  if (outcome === 'win') return Math.min(5, target + DIFFICULTY_STEP);
  if (outcome === 'lose') return Math.max(1, target - DIFFICULTY_STEP);
  return target;
}

// The one place feed ordering lives, so it can be swapped for stats-based ranking later.
// Rules: never the same template twice in a row, avoid recent repeats,
// prefer challenges near the target difficulty.
export function pickNext(library: Envelope[], recent: Envelope[], targetDifficulty: number, rng: Rng): Envelope | undefined {
  const last = recent[recent.length - 1];
  const recentIds = new Set(recent.slice(-RECENT_LIMIT).map((c) => c.id));

  let pool = library.filter((c) => c.template !== last?.template);
  if (pool.length === 0) pool = library;
  const fresh = pool.filter((c) => !recentIds.has(c.id));
  if (fresh.length > 0) pool = fresh;
  if (pool.length === 0) return undefined;

  const distance = (c: Envelope) => Math.abs(c.difficulty - targetDifficulty);
  const best = Math.min(...pool.map(distance));
  const candidates = pool.filter((c) => distance(c) <= best + 1);
  return candidates[Math.floor(rng() * candidates.length)];
}
