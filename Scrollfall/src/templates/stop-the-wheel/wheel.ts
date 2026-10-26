import type { TimeWindow } from '../../engine/types';

export type Wheel = {
  segments: readonly unknown[];
  speed: number; // turns per second, clockwise
  startAngle: number; // degrees
};

// No fair stop is possible before a player can react.
export const REACTION_MS = 300;
export const MIN_WINDOW_MS = 100;
const SCAN_LIMIT_MS = 10000;

export function wheelAngle(w: Wheel, ms: number): number {
  return w.startAngle + (360 * w.speed * ms) / 1000;
}

// Segment i covers [i, i+1) * (360 / n) degrees clockwise from 12 o'clock on the wheel.
// The pointer is fixed at 12 o'clock on screen.
export function segmentAt(w: Wheel, ms: number): number {
  const n = w.segments.length;
  const underPointer = (((-wheelAngle(w, ms)) % 360) + 360) % 360;
  return Math.floor(underPointer / (360 / n)) % n;
}

export function segmentWindowMs(w: Wheel): number {
  return 1000 / (w.segments.length * w.speed);
}

// First stretch after REACTION_MS when the target is under the pointer.
export function firstWindow(w: Wheel, target: number): TimeWindow | null {
  let from: number | null = null;
  for (let t = REACTION_MS; t <= SCAN_LIMIT_MS; t++) {
    const on = segmentAt(w, t) === target;
    if (on && from === null) from = t;
    if (!on && from !== null) {
      if (t - from >= MIN_WINDOW_MS) return { fromMs: from, toMs: t };
      from = null;
    }
  }
  return null;
}
