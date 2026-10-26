import { describe, expect, it } from 'vitest';
import { definition, estimatedMs, schema } from '../../src/templates/trace-shape/definition';
import { isComplete, makePath, pointAt, prefix, project, step, traceSegment } from '../../src/templates/trace-shape/trace';

const L = makePath([
  [10, 10],
  [90, 10],
  [90, 90],
]); // 80 across, then 80 down

describe('trace geometry', () => {
  it('measures arc length', () => {
    expect(L.total).toBe(160);
    expect(pointAt(L, 40)).toEqual([50, 10]);
    expect(pointAt(L, 120)).toEqual([90, 50]);
    expect(pointAt(L, 999)).toEqual([90, 90]);
  });

  it('projects only within the given arc range', () => {
    // [90, 50] is on the second leg; restricted to the first leg, the closest point is the corner.
    expect(project(L, [90, 50], 0, 120)).toEqual({ s: 120, d: 0 });
    expect(project(L, [90, 50], 0, 60)?.s).toBe(60);
  });

  it('advances while the finger stays close', () => {
    expect(step(L, 0, [12, 13], 6)).toEqual({ progress: 2, off: false });
  });

  it('goes off-path when the finger strays past tolerance', () => {
    expect(step(L, 0, [12, 20], 6).off).toBe(true);
  });

  it('does not let you cut across to a later part of the path', () => {
    // [90, 80] is on the path, but far ahead of progress 0.
    expect(step(L, 0, [90, 80], 6).off).toBe(true);
  });

  it('never moves progress backward', () => {
    expect(step(L, 50, [55, 10], 6)).toEqual({ progress: 50, off: false });
  });

  it('fills in sparse moves along the path', () => {
    const result = traceSegment(L, 0, [10, 10], [90, 10], 6);
    expect(result).toEqual({ progress: 80, off: false });
  });

  it('catches a sparse move that cuts the corner', () => {
    expect(traceSegment(L, 60, [70, 10], [90, 70], 6).off).toBe(true);
  });

  it('is complete within half a tolerance of the end', () => {
    expect(isComplete(L, 157, 6)).toBe(true);
    expect(isComplete(L, 150, 6)).toBe(false);
  });

  it('prefix ends at the progress point', () => {
    expect(prefix(L, 120)).toEqual([
      [10, 10],
      [90, 10],
      [90, 50],
    ]);
  });
});

describe('trace-shape solve', () => {
  const params = schema.parse({ points: [[20, 20], [50, 80], [80, 20]], tolerance: 10, fadeMs: 1500 });

  it('drags along the path from start to end', () => {
    const [action] = definition.solve(params).actions;
    expect(action?.type).toBe('drag');
    if (action?.type !== 'drag') return;
    expect(action.points[0]).toEqual([20, 20]);
    expect(action.points[action.points.length - 1]).toEqual([80, 20]);
  });

  it('the solution trace stays on the path and completes it', () => {
    const [action] = definition.solve(params).actions;
    if (action?.type !== 'drag') throw new Error('expected drag');
    const path = makePath(params.points);
    let progress = 0;
    for (let i = 1; i < action.points.length; i++) {
      const from = action.points[i - 1] ?? [0, 0];
      const to = action.points[i] ?? [0, 0];
      const r = traceSegment(path, progress, from, to, params.tolerance);
      expect(r.off).toBe(false);
      progress = r.progress;
    }
    expect(isComplete(path, progress, params.tolerance)).toBe(true);
  });

  it('estimates human time from path length', () => {
    expect(definition.solve(params).estimatedMs).toBe(estimatedMs(params));
    expect(estimatedMs(params)).toBeGreaterThan(500);
  });
});

describe('trace-shape schema', () => {
  it('rejects paths that are too short or have repeated points', () => {
    expect(schema.safeParse({ points: [[20, 20], [30, 20]], tolerance: 10, fadeMs: 1000 }).success).toBe(false);
    expect(schema.safeParse({ points: [[20, 20], [20, 20], [80, 20]], tolerance: 10, fadeMs: 1000 }).success).toBe(false);
  });

  it('keeps points away from the pad edge and tolerance grabbable', () => {
    expect(schema.safeParse({ points: [[2, 20], [80, 20]], tolerance: 10, fadeMs: 1000 }).success).toBe(false);
    expect(schema.safeParse({ points: [[20, 20], [80, 20]], tolerance: 3, fadeMs: 1000 }).success).toBe(false);
  });
});
