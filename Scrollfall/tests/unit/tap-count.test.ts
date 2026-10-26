import { describe, expect, it } from 'vitest';
import { definition, estimatedMs, schema } from '../../src/templates/tap-count/definition';
import { arrangement } from '../../src/templates/tap-count/layout';

describe('tap-count solve', () => {
  it('taps the target N times, then Done', () => {
    const p = schema.parse({ targetCount: 3, target: '🥁' });
    const targets = definition.solve(p).actions.map((a) => a.target);
    expect(targets).toEqual(['tap-target', 'tap-target', 'tap-target', 'tap-done']);
  });

  it('estimates human time, slower when the target has to be found after each reshuffle', () => {
    const solo = schema.parse({ targetCount: 10, target: '🥁' });
    const busy = schema.parse({ targetCount: 10, target: '🥁', distractors: ['🎺', '🎸'] });
    expect(definition.solve(solo).estimatedMs).toBe(estimatedMs(solo));
    expect(estimatedMs(solo)).toBe(500 + 10 * 300 + 500);
    expect(estimatedMs(busy)).toBe(500 + 10 * 550 + 500);
  });
});

describe('tap-count schema', () => {
  it('defaults to no distractors', () => {
    expect(schema.parse({ targetCount: 3, target: '🥁' }).distractors).toEqual([]);
  });

  it('rejects a distractor that looks like the target', () => {
    expect(schema.safeParse({ targetCount: 3, target: '🥁', distractors: ['🥁'] }).success).toBe(false);
  });

  it('keeps counts between 2 and 10', () => {
    expect(schema.safeParse({ targetCount: 1, target: '🥁' }).success).toBe(false);
    expect(schema.safeParse({ targetCount: 10, target: '🥁' }).success).toBe(true);
    expect(schema.safeParse({ targetCount: 11, target: '🥁' }).success).toBe(false);
  });
});

describe('arrangement', () => {
  it('is a deterministic permutation', () => {
    for (let taps = 0; taps < 20; taps++) {
      const order = arrangement(5, taps);
      expect([...order].sort()).toEqual([0, 1, 2, 3, 4]);
      expect(arrangement(5, taps)).toEqual(order);
    }
  });

  it('moves the target around as taps go up', () => {
    const slots = new Set(Array.from({ length: 20 }, (_, taps) => arrangement(4, taps).indexOf(0)));
    expect(slots.size).toBeGreaterThan(2);
  });
});
