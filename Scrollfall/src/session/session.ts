import { z } from 'zod';

export const SLEEP_AFTER_MS = 15 * 60 * 1000;
// A break this long starts a new session, which wakes the creature.
export const NEW_SESSION_GAP_MS = 30 * 60 * 1000;
// A break this long also earns the rested bonus.
export const BONUS_GAP_MS = 2 * 60 * 60 * 1000;
export const RESTED_BONUS = 5;

export const sessionSchema = z.object({
  startedAt: z.number(),
  lastSeenAt: z.number(),
  activeMs: z.number().nonnegative(),
  asleep: z.boolean(),
});

export type Session = z.infer<typeof sessionSchema>;

export function newSession(now: number): Session {
  return { startedAt: now, lastSeenAt: now, activeMs: 0, asleep: false };
}

// Called when the app opens or comes back into view.
export function openSession(prev: Session | null, now: number): { session: Session; bonus: number } {
  if (!prev) return { session: newSession(now), bonus: 0 };
  const gap = now - prev.lastSeenAt;
  if (gap >= NEW_SESSION_GAP_MS) {
    const played = prev.activeMs > 0;
    return { session: newSession(now), bonus: played && gap >= BONUS_GAP_MS ? RESTED_BONUS : 0 };
  }
  return { session: { ...prev, lastSeenAt: now }, bonus: 0 };
}

// Adds active play time. `fellAsleep` is true only on the play that crosses the threshold.
export function addActive(session: Session, ms: number, now: number, sleepAfterMs = SLEEP_AFTER_MS): { session: Session; fellAsleep: boolean } {
  const activeMs = session.activeMs + Math.max(0, ms);
  const asleep = session.asleep || activeMs >= sleepAfterMs;
  return { session: { ...session, activeMs, lastSeenAt: now, asleep }, fellAsleep: asleep && !session.asleep };
}
