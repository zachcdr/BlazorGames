import { describe, expect, it } from 'vitest';
import { addActive, BONUS_GAP_MS, NEW_SESSION_GAP_MS, newSession, openSession, RESTED_BONUS, SLEEP_AFTER_MS } from '../../src/session/session';

const T0 = 1_700_000_000_000;
const MIN = 60 * 1000;

describe('openSession', () => {
  it('starts a fresh session the first time, with no bonus', () => {
    expect(openSession(null, T0)).toEqual({ session: newSession(T0), bonus: 0 });
  });

  it('continues the same session after a short break', () => {
    const played = { ...newSession(T0), activeMs: 5 * MIN, asleep: true };
    const { session, bonus } = openSession(played, T0 + 10 * MIN);
    expect(session).toMatchObject({ startedAt: T0, activeMs: 5 * MIN, asleep: true, lastSeenAt: T0 + 10 * MIN });
    expect(bonus).toBe(0);
  });

  it('a 30+ minute break starts a new session and wakes the creature, without a bonus', () => {
    const asleep = { ...newSession(T0), activeMs: SLEEP_AFTER_MS, asleep: true };
    const { session, bonus } = openSession(asleep, T0 + NEW_SESSION_GAP_MS);
    expect(session).toEqual(newSession(T0 + NEW_SESSION_GAP_MS));
    expect(bonus).toBe(0);
  });

  it('a 2+ hour break after playing earns the rested bonus', () => {
    const played = { ...newSession(T0), activeMs: MIN };
    expect(openSession(played, T0 + BONUS_GAP_MS).bonus).toBe(RESTED_BONUS);
  });

  it('no bonus for a session where nothing was played', () => {
    expect(openSession(newSession(T0), T0 + 3 * BONUS_GAP_MS).bonus).toBe(0);
  });
});

describe('addActive', () => {
  it('falls asleep exactly once, on the play that crosses the limit', () => {
    let s = newSession(T0);
    let r = addActive(s, SLEEP_AFTER_MS - 1000, T0);
    expect(r.fellAsleep).toBe(false);
    s = r.session;
    r = addActive(s, 2000, T0);
    expect(r).toMatchObject({ fellAsleep: true, session: { asleep: true } });
    r = addActive(r.session, 2000, T0);
    expect(r.fellAsleep).toBe(false);
  });

  it('respects a shorter limit for testing', () => {
    expect(addActive(newSession(T0), 5000, T0, 3000).fellAsleep).toBe(true);
  });
});
