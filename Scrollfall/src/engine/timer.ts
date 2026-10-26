import type { Timer } from './types';

export type ControlledTimer = Timer & {
  start: () => void;
  stop: () => void;
  startedAt: () => number | null;
};

// Reads 0 until started, and freezes once stopped or once it hits durationMs.
export function createTimer(durationMs: number, now: () => number = () => performance.now()): ControlledTimer {
  let startedAt: number | null = null;
  let stoppedAt: number | null = null;

  return {
    durationMs,
    start: () => {
      if (startedAt === null) startedAt = now();
    },
    stop: () => {
      if (startedAt !== null && stoppedAt === null) stoppedAt = now();
    },
    startedAt: () => startedAt,
    started: () => startedAt !== null,
    elapsed: () => {
      if (startedAt === null) return 0;
      return Math.min((stoppedAt ?? now()) - startedAt, durationMs);
    },
  };
}
