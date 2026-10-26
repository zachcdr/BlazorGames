import { describe, expect, it } from 'vitest';
import { LIBRARY } from '../../src/engine/library';
import { nextDifficulty, pickNext, type Rng } from '../../src/feed/rank';
import type { Envelope } from '../../src/schema/envelope';

function seeded(seed: number): Rng {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 2 ** 32;
    return s / 2 ** 32;
  };
}

const library = LIBRARY.challenges;

describe('pickNext', () => {
  it('never repeats a template twice in a row over a long feed', () => {
    const rng = seeded(7);
    const feed: Envelope[] = [];
    for (let i = 0; i < 200; i++) {
      const next = pickNext(library, feed, 3, rng);
      expect(next).toBeDefined();
      if (next) feed.push(next);
    }
    for (let i = 1; i < feed.length; i++) expect(feed[i]?.template).not.toBe(feed[i - 1]?.template);
  });

  it('avoids recently shown challenges', () => {
    const rng = seeded(3);
    const feed: Envelope[] = [];
    for (let i = 0; i < 8; i++) {
      const next = pickNext(library, feed, 3, rng);
      if (next) feed.push(next);
    }
    expect(new Set(feed.map((c) => c.id)).size).toBe(8);
  });

  it('stays near the target difficulty', () => {
    const rng = seeded(11);
    for (let i = 0; i < 50; i++) {
      const easy = pickNext(library, [], 1, rng);
      expect(easy?.difficulty).toBeLessThanOrEqual(2);
    }
  });

  it('falls back when only one template exists', () => {
    const one = library.filter((c) => c.template === 'odd-one-out');
    const first = one[0];
    expect(first && pickNext(one, [first], 3, seeded(1))).toBeDefined();
  });

  it('returns undefined for an empty library', () => {
    expect(pickNext([], [], 3, seeded(1))).toBeUndefined();
  });
});

describe('nextDifficulty', () => {
  it('drifts up on wins, down on losses, and stays put on skips', () => {
    expect(nextDifficulty(2, 'win')).toBe(2.5);
    expect(nextDifficulty(2, 'lose')).toBe(1.5);
    expect(nextDifficulty(2, 'skip')).toBe(2);
  });

  it('stays between 1 and 5', () => {
    expect(nextDifficulty(5, 'win')).toBe(5);
    expect(nextDifficulty(1, 'lose')).toBe(1);
  });
});
