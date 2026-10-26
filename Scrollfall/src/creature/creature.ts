import { z } from 'zod';
import { TAGS, type Tag } from '../schema/envelope';

export const WINS_PER_STAGE = 25;
export const STAGE_NAMES = ['Hatchling', 'Sprout', 'Explorer', 'Champion', 'Legend'] as const;

export const creatureSchema = z.object({
  counts: z.record(z.enum(TAGS), z.number().int().nonnegative()),
  wins: z.number().int().nonnegative(),
  bonus: z.number().int().nonnegative(),
});

export type CreatureState = z.infer<typeof creatureSchema>;

export const NEW_CREATURE: CreatureState = { counts: {}, wins: 0, bonus: 0 };

// Every challenge played (win or lose) counts toward its template's tags; wins also grow it.
export function applyPlay(state: CreatureState, tags: readonly Tag[], win: boolean): CreatureState {
  const counts = { ...state.counts };
  for (const tag of tags) counts[tag] = (counts[tag] ?? 0) + 1;
  return { ...state, counts, wins: state.wins + (win ? 1 : 0) };
}

export function applyBonus(state: CreatureState, bonus: number): CreatureState {
  return { ...state, bonus: state.bonus + bonus };
}

export type Look = {
  primary: Tag | null;
  secondary: Tag | null;
  stage: number;
  stageName: string;
  growth: number; // wins + bonus
  toNextStage: number; // 0-1 progress within the current stage
};

// Top two tags by count; ties go to the order in TAGS so the look is stable.
export function topTags(counts: CreatureState['counts']): [Tag | null, Tag | null] {
  const ranked = TAGS.filter((t) => (counts[t] ?? 0) > 0).sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0));
  return [ranked[0] ?? null, ranked[1] ?? null];
}

export const LAST_STAGE = STAGE_NAMES.length - 1;

export function lookOf(state: CreatureState): Look {
  const [primary, secondary] = topTags(state.counts);
  const growth = state.wins + state.bonus;
  const stage = Math.min(Math.floor(growth / WINS_PER_STAGE), LAST_STAGE);
  return {
    primary,
    secondary,
    stage,
    stageName: STAGE_NAMES[stage] ?? 'Legend',
    growth,
    toNextStage: stage === LAST_STAGE ? 1 : (growth % WINS_PER_STAGE) / WINS_PER_STAGE,
  };
}

export const TRAIT_NAMES: Record<Tag, string> = {
  reflex: 'Lightning fast',
  puzzle: 'Big brain',
  perception: 'Eagle eyed',
  dexterity: 'Nimble',
  knowledge: 'Bookish',
  memory: 'Never forgets',
};
