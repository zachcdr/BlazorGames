import type { Outcome } from './rank';

export type PlayStats = { plays: number; wins: number; skips: number };
export type StatsStorage = Pick<Storage, 'getItem' | 'setItem'>;

export const STATS_KEY = 'scrollfall.stats.v1';

function browserStorage(): StatsStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readStats(storage: StatsStorage | null = browserStorage()): Record<string, PlayStats> {
  try {
    const raw = storage?.getItem(STATS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, PlayStats>) : {};
  } catch {
    return {};
  }
}

// Real play stats will rank the feed later; record them from day one.
export function recordOutcome(id: string, outcome: Outcome, storage: StatsStorage | null = browserStorage()): void {
  const all = readStats(storage);
  const s = all[id] ?? { plays: 0, wins: 0, skips: 0 };
  if (outcome === 'skip') s.skips++;
  else s.plays++;
  if (outcome === 'win') s.wins++;
  all[id] = s;
  try {
    storage?.setItem(STATS_KEY, JSON.stringify(all));
  } catch {
    // Storage full or blocked: stats are best effort.
  }
}
