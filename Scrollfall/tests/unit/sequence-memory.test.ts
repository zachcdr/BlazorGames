import { describe, expect, it } from 'vitest';
import { tapWindow } from '../../src/engine/solution';
import { definition, estimatedMs, flipStart, schema, showEnd } from '../../src/templates/sequence-memory/definition';

const p = schema.parse({ rows: 3, cols: 3, sequence: [4, 0, 8], showMs: 600, gapMs: 250 });

describe('sequence-memory timing', () => {
  it('flips one square every showMs + gapMs', () => {
    expect([0, 1, 2].map((i) => flipStart(p, i))).toEqual([0, 850, 1700]);
    expect(showEnd(p)).toBe(2300);
  });

  it('estimates the show plus human taps', () => {
    expect(estimatedMs(p)).toBe(2300 + 600 + 3 * 400);
  });
});

describe('sequence-memory solve', () => {
  it('taps the sequence in order, starting after the show', () => {
    const { actions, estimatedMs: est } = definition.solve(p);
    expect(actions.map((a) => a.target)).toEqual(['cell-4', 'cell-0', 'cell-8']);
    expect(tapWindow(actions[0])?.fromMs).toBeGreaterThan(showEnd(p));
    expect(tapWindow(actions[1])).toBeUndefined();
    expect(est).toBe(estimatedMs(p));
  });
});

describe('sequence-memory schema', () => {
  it('rejects repeated cells and cells outside the grid', () => {
    expect(schema.safeParse({ ...p, sequence: [1, 2, 1] }).success).toBe(false);
    expect(schema.safeParse({ ...p, sequence: [1, 9] }).success).toBe(false);
  });

  it('keeps sequences between 2 and 8 long', () => {
    expect(schema.safeParse({ ...p, sequence: [1] }).success).toBe(false);
    expect(schema.safeParse({ ...p, rows: 4, cols: 4, sequence: [0, 1, 2, 3, 4, 5, 6, 7, 8] }).success).toBe(false);
  });
});
