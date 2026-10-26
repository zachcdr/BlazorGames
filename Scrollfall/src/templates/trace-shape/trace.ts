import type { Point } from '../../engine/types';

// A polyline in the 0-100 square, measured by arc length.
export type Path = { points: Point[]; cum: number[]; total: number };

export type TraceStep = { progress: number; off: boolean };

export function makePath(points: readonly Point[]): Path {
  const cum = [0];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] ?? [0, 0];
    const b = points[i] ?? [0, 0];
    cum.push((cum[i - 1] ?? 0) + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  return { points: [...points], cum, total: cum[cum.length - 1] ?? 0 };
}

export function pointAt(path: Path, s: number): Point {
  const clamped = Math.min(Math.max(s, 0), path.total);
  for (let i = 1; i < path.points.length; i++) {
    const a = path.points[i - 1] ?? [0, 0];
    const b = path.points[i] ?? [0, 0];
    const from = path.cum[i - 1] ?? 0;
    const to = path.cum[i] ?? 0;
    if (clamped <= to || i === path.points.length - 1) {
      const t = to > from ? (clamped - from) / (to - from) : 0;
      return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
    }
  }
  return path.points[0] ?? [0, 0];
}

// Closest point on the path to `p`, only looking between arc lengths lo and hi.
export function project(path: Path, p: Point, lo: number, hi: number): { s: number; d: number } | null {
  let best: { s: number; d: number } | null = null;
  for (let i = 1; i < path.points.length; i++) {
    const from = path.cum[i - 1] ?? 0;
    const to = path.cum[i] ?? 0;
    const sLo = Math.max(from, lo);
    const sHi = Math.min(to, hi);
    if (sLo > sHi || to === from) continue;
    const a = path.points[i - 1] ?? [0, 0];
    const b = path.points[i] ?? [0, 0];
    const len = to - from;
    const t = ((p[0] - a[0]) * (b[0] - a[0]) + (p[1] - a[1]) * (b[1] - a[1])) / (len * len);
    const s = Math.min(Math.max(from + t * len, sLo), sHi);
    const q = pointAt(path, s);
    const d = Math.hypot(p[0] - q[0], p[1] - q[1]);
    if (!best || d < best.d) best = { s, d };
  }
  return best;
}

// Move the finger to `p`. Progress only moves forward, and only along the stretch just ahead,
// so cutting across the shape doesn't count.
export function step(path: Path, progress: number, p: Point, tolerance: number): TraceStep {
  const hit = project(path, p, progress - tolerance, progress + 2 * tolerance);
  if (!hit || hit.d > tolerance) return { progress, off: true };
  return { progress: Math.max(progress, hit.s), off: false };
}

// Same as step, but fills in sparse pointer events from `from` to `to`.
export function traceSegment(path: Path, progress: number, from: Point, to: Point, tolerance: number): TraceStep {
  const n = Math.max(1, Math.ceil(Math.hypot(to[0] - from[0], to[1] - from[1]) / (tolerance / 2)));
  let result: TraceStep = { progress, off: false };
  for (let i = 1; i <= n; i++) {
    const p: Point = [from[0] + ((to[0] - from[0]) * i) / n, from[1] + ((to[1] - from[1]) * i) / n];
    result = step(path, result.progress, p, tolerance);
    if (result.off) return result;
  }
  return result;
}

export function isComplete(path: Path, progress: number, tolerance: number): boolean {
  return progress >= path.total - tolerance / 2;
}

// The path from its start up to arc length s.
export function prefix(path: Path, s: number): Point[] {
  const corners = path.points.filter((_, i) => (path.cum[i] ?? 0) < s);
  return [...corners, pointAt(path, s)];
}

// Evenly spaced points along the path, for the bot.
export function sample(path: Path, spacing: number): Point[] {
  const n = Math.max(1, Math.ceil(path.total / spacing));
  return Array.from({ length: n + 1 }, (_, i) => pointAt(path, (path.total * i) / n));
}
