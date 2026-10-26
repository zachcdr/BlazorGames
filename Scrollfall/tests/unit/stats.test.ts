import { describe, expect, it } from 'vitest';
import { readStats, recordOutcome, STATS_KEY, type StatsStorage } from '../../src/feed/stats';

function memoryStorage(): StatsStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

describe('play stats', () => {
  it('counts plays, wins, and skips per challenge', () => {
    const storage = memoryStorage();
    recordOutcome('a_0001', 'win', storage);
    recordOutcome('a_0001', 'lose', storage);
    recordOutcome('a_0001', 'skip', storage);
    recordOutcome('b_0001', 'skip', storage);
    expect(readStats(storage)).toEqual({
      a_0001: { plays: 2, wins: 1, skips: 1 },
      b_0001: { plays: 0, wins: 0, skips: 1 },
    });
  });

  it('survives corrupt or missing storage', () => {
    const storage = memoryStorage();
    storage.data.set(STATS_KEY, '{not json');
    expect(readStats(storage)).toEqual({});
    expect(() => recordOutcome('a_0001', 'win', null)).not.toThrow();
  });
});
