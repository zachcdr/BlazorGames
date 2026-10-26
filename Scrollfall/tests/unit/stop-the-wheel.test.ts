import { describe, expect, it } from 'vitest';
import { definition, schema, type Params } from '../../src/templates/stop-the-wheel/definition';
import { tapWindow } from '../../src/engine/solution';
import { REACTION_MS, segmentAt } from '../../src/templates/stop-the-wheel/wheel';

const four = (overrides: Partial<Params> = {}): Params =>
  schema.parse({
    segments: [{ color: '#e5484d' }, { color: '#3e63dd' }, { color: '#30a46c' }, { color: '#ffc53d' }],
    targetSegment: 0,
    speed: 0.5,
    startAngle: 0,
    ...overrides,
  });

describe('stop-the-wheel geometry', () => {
  it('starts with segment 0 under the pointer', () => {
    expect(segmentAt(four(), 0)).toBe(0);
  });

  it('turning clockwise brings the last segment under the pointer next', () => {
    // 0.5 turns/s: 100ms = 18 degrees clockwise, so the pointer reads wheel angle 342 -> segment 3.
    expect(segmentAt(four(), 100)).toBe(3);
    expect(segmentAt(four(), 600)).toBe(2);
  });

  it('respects startAngle', () => {
    expect(segmentAt(four({ startAngle: 90 }), 0)).toBe(3);
  });
});

describe('stop-the-wheel solve', () => {
  it.each([0, 1, 2, 3])('finds a window where segment %i is under the pointer', (target) => {
    const p = four({ targetSegment: target });
    const [action] = definition.solve(p).actions;
    expect(action?.target).toBe('wheel-stop');
    const w = tapWindow(action);
    expect(w).toBeDefined();
    if (!w) return;
    expect(w.fromMs).toBeGreaterThanOrEqual(REACTION_MS);
    for (const t of [w.fromMs, (w.fromMs + w.toMs) / 2, w.toMs - 1]) expect(segmentAt(p, t)).toBe(target);
    expect(segmentAt(p, w.toMs)).not.toBe(target);
  });

  // 0.5 turns/s is 0.18 degrees per ms; each segment is 90 degrees.
  it('keeps a window clipped by the reaction time if enough is left', () => {
    // Pointer starts at wheel angle 80 (segment 0) and leaves it at ~444ms: 144ms usable.
    const w = tapWindow(definition.solve(four({ startAngle: 280 })).actions[0]);
    expect(w).toEqual({ fromMs: REACTION_MS, toMs: 445 });
  });

  it('skips a window clipped too short and waits for the next pass', () => {
    // Pointer leaves segment 0 at ~333ms, only 33ms after REACTION_MS; the next pass is a full turn later.
    const w = tapWindow(definition.solve(four({ startAngle: 300 })).actions[0]);
    expect(w?.fromMs).toBeGreaterThan(1800);
  });
});

describe('stop-the-wheel schema', () => {
  it('rejects a wheel too fast to be fair', () => {
    expect(schema.safeParse({ ...four(), speed: 2 }).success).toBe(false);
  });

  it('rejects a target that looks like another segment', () => {
    const segments = [{ color: '#e5484d' }, { color: '#3e63dd' }, { color: '#e5484d' }];
    expect(schema.safeParse({ segments, targetSegment: 0, speed: 0.5 }).success).toBe(false);
    const labelled = [{ color: '#e5484d', label: '🍕' }, { color: '#3e63dd' }, { color: '#e5484d', label: '🌮' }];
    expect(schema.safeParse({ segments: labelled, targetSegment: 0, speed: 0.5 }).success).toBe(true);
  });

  it('defaults startAngle to 0', () => {
    expect(schema.parse({ segments: four().segments, targetSegment: 1, speed: 0.5 }).startAngle).toBe(0);
  });
});
