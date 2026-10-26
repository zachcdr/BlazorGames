import { describe, expect, it } from 'vitest';
import { applyBonus, applyPlay, lookOf, NEW_CREATURE, topTags, WINS_PER_STAGE } from '../../src/creature/creature';

describe('creature', () => {
  it('starts plain', () => {
    expect(lookOf(NEW_CREATURE)).toMatchObject({ primary: null, secondary: null, stage: 0, stageName: 'Hatchling' });
  });

  it('counts tags for every play and wins only for wins', () => {
    let c = applyPlay(NEW_CREATURE, ['reflex'], true);
    c = applyPlay(c, ['reflex'], false);
    c = applyPlay(c, ['puzzle'], true);
    expect(c).toEqual({ counts: { reflex: 2, puzzle: 1 }, wins: 2, bonus: 0 });
  });

  it('takes its look from the top two tags, so play style changes it', () => {
    const reflexy = { counts: { reflex: 9, memory: 4, puzzle: 1 }, wins: 0, bonus: 0 };
    const brainy = { counts: { puzzle: 7, knowledge: 6, reflex: 2 }, wins: 0, bonus: 0 };
    expect(topTags(reflexy.counts)).toEqual(['reflex', 'memory']);
    expect(topTags(brainy.counts)).toEqual(['puzzle', 'knowledge']);
  });

  it('breaks ties in tag order so the look is stable', () => {
    expect(topTags({ memory: 3, reflex: 3 })).toEqual(['reflex', 'memory']);
  });

  it('grows a stage every 25 wins, counting the rested bonus', () => {
    const c = { counts: {}, wins: WINS_PER_STAGE * 2 - 3, bonus: 0 };
    expect(lookOf(c)).toMatchObject({ stage: 1, stageName: 'Sprout' });
    expect(lookOf(applyBonus(c, 5))).toMatchObject({ stage: 2, stageName: 'Explorer', growth: 52 });
  });

  it('tops out at Legend, fully grown', () => {
    expect(lookOf({ counts: {}, wins: 1000, bonus: 0 })).toMatchObject({ stage: 4, stageName: 'Legend', toNextStage: 1 });
  });
});
