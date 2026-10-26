import { beforeEach, describe, expect, it } from 'vitest';
import { NEW_CREATURE } from '../../src/creature/creature';
import { useCreatureStore } from '../../src/creature/creatureStore';
import { DAILY_LENGTH, dailyChallenges } from '../../src/daily/daily';
import { useDailyStore } from '../../src/daily/dailyStore';
import { LIBRARY } from '../../src/engine/library';
import { CHECK_IN_EVERY, useFeedStore, type FeedCard } from '../../src/feed/feedStore';
import { START_DIFFICULTY } from '../../src/feed/rank';
import { SLEEP_AFTER_MS } from '../../src/session/session';
import { useSessionStore } from '../../src/session/sessionStore';
import { localDateKey } from '../../src/time';

const store = () => useFeedStore.getState();
const current = (): FeedCard | undefined => store().cards[store().index];
const currentChallenge = () => {
  const card = current();
  return card?.kind === 'challenge' ? card : undefined;
};

beforeEach(() => {
  useCreatureStore.setState({ creature: NEW_CREATURE });
  useSessionStore.setState({ session: null, sleepAfterMs: SLEEP_AFTER_MS, lastBonus: 0 });
  useSessionStore.getState().open();
  useDailyStore.setState({ date: localDateKey(), results: Array.from({ length: DAILY_LENGTH }, () => null) });
  store().start(LIBRARY.challenges);
});

describe('feed basics', () => {
  it('starts with the current card and one preloaded', () => {
    expect(store().cards).toHaveLength(2);
    expect(current()?.kind).toBe('challenge');
  });

  it('can start on a given challenge, or on the home card', () => {
    store().start(LIBRARY.challenges, { firstId: 'stop-the-wheel_0003' });
    expect(currentChallenge()?.challenge.id).toBe('stop-the-wheel_0003');
    store().start(LIBRARY.challenges, { home: true });
    expect(current()?.kind).toBe('home');
    expect(store().cards[1]?.kind).toBe('challenge');
  });

  it('keeps one card ahead as it advances', () => {
    for (let i = 0; i < 5; i++) store().advance();
    expect(store().cards).toHaveLength(7);
  });

  it('a win raises the target difficulty, once per card', () => {
    store().resolve(true, 800);
    store().resolve(false, 900);
    expect(store()).toMatchObject({ resolved: true, targetDifficulty: START_DIFFICULTY + 0.5, outcomes: ['win'] });
  });

  it('skip counts only before a result', () => {
    store().skip();
    store().resolve(true, 800);
    store().skip();
    expect(store().outcomes).toEqual(['skip', 'win']);
    expect(store().index).toBe(2);
  });

  it('shows a creature check-in every CHECK_IN_EVERY challenges', () => {
    const kinds: string[] = [];
    for (let i = 0; i < CHECK_IN_EVERY * 2 + 2; i++) {
      kinds.push(current()?.kind ?? '');
      store().advance();
    }
    expect(kinds.filter((k) => k === 'home')).toHaveLength(2);
    expect(kinds.indexOf('home')).toBe(CHECK_IN_EVERY);
  });
});

describe('creature growth', () => {
  it('a played challenge adds its tags and a win', () => {
    store().start(LIBRARY.challenges, { firstId: 'quick-math_0001' });
    store().resolve(true, 1000);
    expect(useCreatureStore.getState().creature).toMatchObject({ counts: { puzzle: 1 }, wins: 1 });
  });

  it('a loss still counts toward the tag but not growth', () => {
    store().start(LIBRARY.challenges, { firstId: 'stop-the-wheel_0001' });
    store().resolve(false, 1000);
    expect(useCreatureStore.getState().creature).toMatchObject({ counts: { reflex: 1 }, wins: 0 });
  });

  it('skips do not shape the creature', () => {
    store().skip();
    expect(useCreatureStore.getState().creature).toEqual(NEW_CREATURE);
  });
});

describe('stopping point', () => {
  beforeEach(() => useSessionStore.getState().configure(3000));

  it('the play that crosses the limit puts the creature to sleep and queues the sleep card next', () => {
    store().resolve(true, 1000); // 700 intro + 1000
    store().advance();
    expect(current()?.kind).toBe('challenge');
    store().resolve(true, 1000); // 3400 total
    expect(useSessionStore.getState().session?.asleep).toBe(true);
    expect(store().cards[store().index + 1]?.kind).toBe('sleep');
  });

  it('a sleeping creature stops growing, but play goes on', () => {
    useSessionStore.getState().addActive(5000);
    store().start(LIBRARY.challenges, { firstId: 'quick-math_0001' });
    store().resolve(true, 1000);
    expect(useCreatureStore.getState().creature).toEqual(NEW_CREATURE);
  });

  it('timeouts are not active play', () => {
    for (let i = 0; i < 5; i++) {
      store().resolve(false, 3000, true);
      store().advance();
    }
    expect(useSessionStore.getState().session?.activeMs).toBe(0);
  });
});

describe('daily run', () => {
  const today = () => dailyChallenges(LIBRARY.challenges, localDateKey());

  it('plays today\'s challenges in order, then the summary', () => {
    store().start(LIBRARY.challenges, { home: true });
    store().startDaily();
    const seen: string[] = [];
    for (let i = 0; i < DAILY_LENGTH; i++) {
      const card = currentChallenge();
      expect(card?.daily).toBe(i);
      seen.push(card?.challenge.id ?? '');
      store().skip();
    }
    expect(seen).toEqual(today().map((c) => c.id));
    expect(current()?.kind).toBe('daily-summary');
    expect(useDailyStore.getState().results.every((r) => r === 'skip')).toBe(true);
    store().advance();
    expect(current()?.kind).toBe('challenge');
  });

  it('resumes at the first unplayed position', () => {
    useDailyStore.getState().record(0, 'win');
    useDailyStore.getState().record(1, 'lose');
    store().startDaily();
    expect(currentChallenge()?.daily).toBe(2);
    expect(currentChallenge()?.challenge.id).toBe(today()[2]?.id);
  });

  it('a finished run goes straight to the summary', () => {
    for (let i = 0; i < DAILY_LENGTH; i++) useDailyStore.getState().record(i, 'win');
    store().startDaily();
    expect(current()?.kind).toBe('daily-summary');
  });

  it('falling asleep mid-run waits until after the summary', () => {
    useSessionStore.getState().configure(1000);
    store().startDaily();
    store().resolve(true, 1000);
    expect(store().cards[store().index + 1]?.kind).toBe('challenge');
    while (current()?.kind !== 'daily-summary') store().skip();
    expect(store().cards[store().index + 1]?.kind).toBe('sleep');
  });
});
