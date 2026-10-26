import { z } from 'zod';
import { create } from 'zustand';
import type { Outcome } from '../feed/rank';
import { load, save } from '../storage';
import { localDateKey } from '../time';
import { DAILY_LENGTH } from './daily';

export const DAILY_KEY = 'scrollfall.daily.v1';

const outcome = z.enum(['win', 'lose', 'skip']);
const progressSchema = z.object({ date: z.string(), results: z.array(outcome.nullable()) });
type Progress = z.infer<typeof progressSchema>;

const fresh = (date: string): Progress => ({ date, results: Array.from({ length: DAILY_LENGTH }, () => null) });

type DailyStore = Progress & {
  // Switches to today's date (clearing yesterday's results) if the day has changed.
  ensureToday: () => void;
  record: (position: number, outcome: Outcome) => void;
};

// Each position is recorded once; replaying a finished run can't change today's score.
export const useDailyStore = create<DailyStore>((set, get) => ({
  ...load(DAILY_KEY, progressSchema, fresh(localDateKey())),

  ensureToday: () => {
    const today = localDateKey();
    if (get().date === today) return;
    const next = fresh(today);
    save(DAILY_KEY, next);
    set(next);
  },

  record: (position, result) => {
    const { date, results } = get();
    if (position < 0 || position >= results.length || results[position] !== null) return;
    const next = { date, results: results.map((r, i) => (i === position ? result : r)) };
    save(DAILY_KEY, next);
    set(next);
  },
}));

export function firstOpenPosition(results: readonly (Outcome | null)[]): number {
  return results.findIndex((r) => r === null);
}
