import { create } from 'zustand';
import { useCreatureStore } from '../creature/creatureStore';
import { dailyChallenges } from '../daily/daily';
import { firstOpenPosition, useDailyStore } from '../daily/dailyStore';
import { DEFINITIONS } from '../engine/definitions';
import { INTRO_MS } from '../engine/phases';
import type { Envelope } from '../schema/envelope';
import { isAsleep, useSessionStore } from '../session/sessionStore';
import { now } from '../time';
import { nextDifficulty, pickNext, START_DIFFICULTY, type Outcome, type Rng } from './rank';
import { recordOutcome } from './stats';

// `daily` is the challenge's position in today's run.
export type FeedCard =
  | { kind: 'challenge'; challenge: Envelope; daily?: number }
  | { kind: 'home' }
  | { kind: 'sleep' }
  | { kind: 'daily-summary' };

// A creature check-in card after this many challenges in the endless feed.
export const CHECK_IN_EVERY = 12;

type StartOptions = { firstId?: string; home?: boolean; rng?: Rng };

type FeedState = {
  library: Envelope[];
  cards: FeedCard[];
  index: number;
  resolved: boolean;
  targetDifficulty: number;
  outcomes: Outcome[];
  rng: Rng;
  cardStartedAt: number;
  sinceCheckIn: number;
  sleepPending: boolean; // fell asleep mid daily run; show the sleep card once the run ends
  start: (library: Envelope[], options?: StartOptions) => void;
  resolve: (win: boolean, ms: number, timedOut?: boolean) => void;
  advance: () => void;
  skip: () => void;
  startDaily: () => void;
};

export const isDailyCard = (card: FeedCard | undefined) =>
  card?.kind === 'daily-summary' || (card?.kind === 'challenge' && card.daily !== undefined);

const challengesIn = (cards: FeedCard[]) => cards.flatMap((c) => (c.kind === 'challenge' ? [c.challenge] : []));

// `cards` always holds one card past `index`, so the next card is mounted before the swipe.
export const useFeedStore = create<FeedState>((set, get) => {
  // The card that follows the end of `cards` in the endless feed.
  const nextEndless = (cards: FeedCard[]): { card: FeedCard | null; sinceCheckIn: number; sleepPending: boolean } => {
    const { library, targetDifficulty, rng, sinceCheckIn, sleepPending } = get();
    if (sleepPending) return { card: { kind: 'sleep' }, sinceCheckIn, sleepPending: false };
    if (sinceCheckIn >= CHECK_IN_EVERY) return { card: { kind: 'home' }, sinceCheckIn: 0, sleepPending };
    const challenge = pickNext(library, challengesIn(cards), targetDifficulty, rng);
    return { card: challenge ? { kind: 'challenge', challenge } : null, sinceCheckIn: sinceCheckIn + 1, sleepPending };
  };

  const withNext = (cards: FeedCard[], index: number) => {
    if (cards.length > index + 1) return { cards };
    const next = nextEndless(cards);
    return {
      cards: next.card ? [...cards, next.card] : cards,
      sinceCheckIn: next.sinceCheckIn,
      sleepPending: next.sleepPending,
    };
  };

  // The preloaded next card gives way to the sleep card; mid daily run, it waits for the summary.
  const fallAsleep = () => {
    const { cards, index } = get();
    if (isDailyCard(cards[index])) return set({ sleepPending: true });
    set({ cards: [...cards.slice(0, index + 1), { kind: 'sleep' }] });
  };

  // Only real play counts toward the 15 minutes; a timeout means nobody was there.
  const addActive = (ms: number) => {
    if (useSessionStore.getState().addActive(ms)) fallAsleep();
  };

  return {
    library: [],
    cards: [],
    index: 0,
    resolved: false,
    targetDifficulty: START_DIFFICULTY,
    outcomes: [],
    rng: Math.random,
    cardStartedAt: 0,
    sinceCheckIn: 0,
    sleepPending: false,

    start: (library, { firstId, home = false, rng = Math.random } = {}) => {
      set({ library, cards: [], index: 0, resolved: false, targetDifficulty: START_DIFFICULTY, outcomes: [], rng, sinceCheckIn: 0, sleepPending: false });
      const first = library.find((c) => c.id === firstId);
      const opening: FeedCard[] = home ? [{ kind: 'home' }] : first ? [{ kind: 'challenge', challenge: first }] : [];
      const cards = opening.length > 0 ? opening : [nextEndless([]).card].flatMap((c) => (c ? [c] : []));
      set({ sinceCheckIn: cards[0]?.kind === 'challenge' ? 1 : 0 });
      set({ ...withNext(cards, 0), cardStartedAt: now() });
    },

    resolve: (win, ms, timedOut = false) => {
      const { cards, index, resolved, targetDifficulty, outcomes } = get();
      const card = cards[index];
      if (card?.kind !== 'challenge' || resolved) return;
      const outcome: Outcome = win ? 'win' : 'lose';
      recordOutcome(card.challenge.id, outcome);
      if (card.daily !== undefined) useDailyStore.getState().record(card.daily, outcome);
      // A sleeping creature doesn't grow: playing past the sleep card earns nothing.
      if (!isAsleep()) useCreatureStore.getState().play(DEFINITIONS.get(card.challenge.template)?.tags ?? [], win);
      set({
        resolved: true,
        outcomes: [...outcomes, outcome],
        targetDifficulty: card.daily === undefined ? nextDifficulty(targetDifficulty, outcome) : targetDifficulty,
      });
      if (!timedOut) addActive(INTRO_MS + ms);
    },

    advance: () => {
      const { cards, index } = get();
      set({ ...withNext(cards, index + 1), index: index + 1, resolved: false, cardStartedAt: now() });
    },

    // Swiping after a result just moves on; it isn't a skip.
    skip: () => {
      const { cards, index, resolved, outcomes, cardStartedAt } = get();
      const card = cards[index];
      if (card?.kind === 'challenge' && !resolved) {
        recordOutcome(card.challenge.id, 'skip');
        if (card.daily !== undefined) useDailyStore.getState().record(card.daily, 'skip');
        set({ outcomes: [...outcomes, 'skip'] });
        addActive(Math.min(now() - cardStartedAt, INTRO_MS + card.challenge.durationMs));
      }
      get().advance();
    },

    // Today's run replaces whatever was preloaded, resumes at the first unplayed position,
    // and ends on the summary card. A finished run goes straight to its summary.
    startDaily: () => {
      const { library, cards, index } = get();
      const daily = useDailyStore.getState();
      daily.ensureToday();
      const start = firstOpenPosition(useDailyStore.getState().results);
      const run: FeedCard[] =
        start < 0
          ? []
          : dailyChallenges(library, useDailyStore.getState().date)
              .slice(start)
              .map((challenge, i) => ({ kind: 'challenge', challenge, daily: start + i }));
      set({ cards: [...cards.slice(0, index + 1), ...run, { kind: 'daily-summary' }] });
      get().advance();
    },
  };
});
