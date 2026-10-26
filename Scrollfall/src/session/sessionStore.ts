import { create } from 'zustand';
import { useCreatureStore } from '../creature/creatureStore';
import { load, save } from '../storage';
import { now } from '../time';
import { addActive, openSession, sessionSchema, SLEEP_AFTER_MS, type Session } from './session';

export const SESSION_KEY = 'scrollfall.session.v1';

type SessionStore = {
  session: Session | null;
  sleepAfterMs: number;
  // The rested bonus granted when this session opened, for the home card to announce.
  lastBonus: number;
  configure: (sleepAfterMs: number) => void;
  open: () => void;
  addActive: (ms: number) => boolean; // true when this play put the creature to sleep
};

export const useSessionStore = create<SessionStore>((set, get) => ({
  session: null,
  sleepAfterMs: SLEEP_AFTER_MS,
  lastBonus: 0,

  configure: (sleepAfterMs) => set({ sleepAfterMs }),

  open: () => {
    const prev = get().session ?? load(SESSION_KEY, sessionSchema.nullable(), null);
    const { session, bonus } = openSession(prev, now());
    if (bonus > 0) useCreatureStore.getState().addBonus(bonus);
    save(SESSION_KEY, session);
    set({ session, lastBonus: bonus > 0 ? bonus : get().lastBonus });
  },

  addActive: (ms) => {
    const { session: current, sleepAfterMs } = get();
    const result = addActive(current ?? openSession(null, now()).session, ms, now(), sleepAfterMs);
    save(SESSION_KEY, result.session);
    set({ session: result.session });
    return result.fellAsleep;
  },
}));

export const isAsleep = () => useSessionStore.getState().session?.asleep ?? false;
