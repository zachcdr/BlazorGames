import type { Envelope } from '../schema/envelope';
import type { Outcome } from '../feed/rank';

export const DAILY_LENGTH = 20;
// Difficulty ramps up through the run.
const DIFFICULTY_SLOTS = [1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5];
const ROW = 5;

// FNV-1a: a stable 32-bit hash of the date string.
function hash(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

// mulberry32: small, fast, and identical in every browser.
export function seededRng(seed: string): () => number {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The same date and library always give the same 20 challenges in the same order.
// The library is sorted by id first, so file load order can't change the result.
export function dailyChallenges(library: readonly Envelope[], date: string): Envelope[] {
  const pool = [...library].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const rng = seededRng(`scrollfall:${date}`);
  const used = new Set<string>();
  const run: Envelope[] = [];

  for (const difficulty of DIFFICULTY_SLOTS.slice(0, Math.min(DAILY_LENGTH, pool.length))) {
    const last = run[run.length - 1]?.template;
    const recent = new Set(run.slice(-3).map((c) => c.template));
    const unused = pool.filter((c) => !used.has(c.id));
    // Relax the rules one at a time until something fits.
    const tiers = [
      unused.filter((c) => c.difficulty === difficulty && !recent.has(c.template)),
      unused.filter((c) => c.difficulty === difficulty && c.template !== last),
      unused.filter((c) => Math.abs(c.difficulty - difficulty) <= 1 && c.template !== last),
      unused,
    ];
    const candidates = tiers.find((t) => t.length > 0) ?? [];
    const pick = candidates[Math.floor(rng() * candidates.length)];
    if (!pick) break;
    used.add(pick.id);
    run.push(pick);
  }
  return run;
}

export function dailyScore(results: readonly (Outcome | null)[]): number {
  return results.filter((r) => r === 'win').length;
}

export function shareText(date: string, results: readonly (Outcome | null)[]): string {
  const squares = results.map((r) => (r === 'win' ? '🟩' : '🟥'));
  const rows = Array.from({ length: Math.ceil(squares.length / ROW) }, (_, i) => squares.slice(i * ROW, (i + 1) * ROW).join(''));
  return [`Scrollfall ${date} ${dailyScore(results)}/${results.length}`, ...rows].join('\n');
}
