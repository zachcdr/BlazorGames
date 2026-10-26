import { create } from 'zustand';
import type { Tag } from '../schema/envelope';
import { load, save } from '../storage';
import { applyBonus, applyPlay, creatureSchema, NEW_CREATURE, type CreatureState } from './creature';

export const CREATURE_KEY = 'scrollfall.creature.v1';

type CreatureStore = {
  creature: CreatureState;
  play: (tags: readonly Tag[], win: boolean) => void;
  addBonus: (bonus: number) => void;
};

export const useCreatureStore = create<CreatureStore>((set, get) => {
  const update = (creature: CreatureState) => {
    save(CREATURE_KEY, creature);
    set({ creature });
  };
  return {
    creature: load(CREATURE_KEY, creatureSchema, NEW_CREATURE),
    play: (tags, win) => update(applyPlay(get().creature, tags, win)),
    addBonus: (bonus) => update(applyBonus(get().creature, bonus)),
  };
});
