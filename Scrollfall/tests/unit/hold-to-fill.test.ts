import { describe, expect, it } from 'vitest';
import { bandMs, definition, estimatedMs, levelAt, releaseOutcome, schema } from '../../src/templates/hold-to-fill/definition';

// 40% per second, band 50-65: the band is reached at 1250ms and left at 1625ms.
const p = schema.parse({ item: '🎈', fillPerSecond: 40, targetFrom: 50, targetTo: 65 });

describe('hold-to-fill', () => {
  it('fills linearly', () => {
    expect(levelAt(p, 1000)).toBe(40);
    expect(bandMs(p)).toBe(375);
  });

  it('judges the release', () => {
    expect(releaseOutcome(p, 1000)).toBe('short');
    expect(releaseOutcome(p, 1250)).toBe('hit');
    expect(releaseOutcome(p, 1625)).toBe('hit');
    expect(releaseOutcome(p, 1700)).toBe('over');
  });

  it('solve holds to the middle of the band', () => {
    const { actions, estimatedMs: est } = definition.solve(p);
    const [action] = actions;
    expect(action?.type).toBe('hold');
    if (action?.type !== 'hold') return;
    expect(action.holdMs).toBeCloseTo(1437.5);
    expect(releaseOutcome(p, action.holdMs)).toBe('hit');
    expect(est).toBe(estimatedMs(p));
  });

  it('rejects a band too thin to hit or upside down', () => {
    expect(schema.safeParse({ ...p, fillPerSecond: 150, targetFrom: 50, targetTo: 60 }).success).toBe(false);
    expect(schema.safeParse({ ...p, targetFrom: 70, targetTo: 60 }).success).toBe(false);
  });
});
