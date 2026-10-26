import { describe, expect, it } from 'vitest';
import { DAILY_LENGTH, dailyChallenges, dailyScore, seededRng, shareText } from '../../src/daily/daily';
import { LIBRARY } from '../../src/engine/library';
import type { Outcome } from '../../src/feed/rank';

const library = LIBRARY.challenges;
const ids = (date: string, lib = library) => dailyChallenges(lib, date).map((c) => c.id);

describe('seededRng', () => {
  it('repeats for the same seed and differs between seeds', () => {
    const a = seededRng('2026-10-21');
    const b = seededRng('2026-10-21');
    const c = seededRng('2026-10-22');
    const first = [a(), a(), a()];
    expect([b(), b(), b()]).toEqual(first);
    expect([c(), c(), c()]).not.toEqual(first);
  });
});

describe('dailyChallenges', () => {
  it('gives everyone the same 20 on the same date, whatever order the library loaded in', () => {
    const shuffled = [...library].reverse();
    expect(ids('2026-10-21')).toHaveLength(DAILY_LENGTH);
    expect(ids('2026-10-21', shuffled)).toEqual(ids('2026-10-21'));
  });

  it('gives a different run on a different date', () => {
    expect(ids('2026-10-22')).not.toEqual(ids('2026-10-21'));
  });

  it('has no repeats, no template twice in a row, and ramps up in difficulty', () => {
    for (const date of ['2026-10-21', '2026-12-25', '2027-02-28']) {
      const run = dailyChallenges(library, date);
      expect(new Set(run.map((c) => c.id)).size).toBe(DAILY_LENGTH);
      for (let i = 1; i < run.length; i++) {
        expect(run[i]?.template).not.toBe(run[i - 1]?.template);
        expect(run[i]?.difficulty ?? 0).toBeGreaterThanOrEqual(run[i - 1]?.difficulty ?? 0);
      }
    }
  });

  it('copes with a tiny library', () => {
    expect(dailyChallenges(library.slice(0, 3), '2026-10-21')).toHaveLength(3);
  });
});

describe('shareText', () => {
  it('formats the score and rows of five squares', () => {
    const results = Array.from({ length: 20 }, (_, i): Outcome => (i % 5 === 4 ? 'lose' : i === 7 ? 'skip' : 'win'));
    expect(dailyScore(results)).toBe(15);
    expect(shareText('2026-10-21', results)).toBe(
      ['Scrollfall 2026-10-21 15/20', '🟩🟩🟩🟩🟥', '🟩🟩🟥🟩🟥', '🟩🟩🟩🟩🟥', '🟩🟩🟩🟩🟥'].join('\n'),
    );
  });
});
