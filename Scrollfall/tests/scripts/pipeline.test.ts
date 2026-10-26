import { describe, expect, it } from 'vitest';
import { dedupeKey, lintPrompt } from '../../scripts/lib/checks';
import { loadSolved } from '../../scripts/lib/content';
import { factQuestion } from '../../scripts/lib/factcheck';
import { parseJsonReply } from '../../scripts/lib/parse';
import { GUIDES } from '../../scripts/guides';
import { DEFINITIONS } from '../../src/engine/definitions';
import type { Envelope } from '../../src/schema/envelope';

const library = loadSolved().map((s) => s.challenge);
const byId = (id: string): Envelope => {
  const c = library.find((x) => x.id === id);
  if (!c) throw new Error(`missing ${id}`);
  return c;
};

describe('parseJsonReply', () => {
  it('parses plain JSON, fenced JSON, and JSON wrapped in prose', () => {
    expect(parseJsonReply('[1, 2]')).toEqual([1, 2]);
    expect(parseJsonReply('```json\n[{"a": 1}]\n```')).toEqual([{ a: 1 }]);
    expect(parseJsonReply('Here you go:\n[{"a": 1}]\nEnjoy!')).toEqual([{ a: 1 }]);
  });

  it('throws when there is no JSON', () => {
    expect(() => parseJsonReply('sorry, no')).toThrow();
  });
});

describe('guides', () => {
  it('has a generation guide for every registered template', () => {
    for (const id of DEFINITIONS.keys()) expect(GUIDES[id], id).toBeTruthy();
  });
});

describe('lintPrompt', () => {
  it('passes every hand-written challenge', () => {
    for (const c of library.filter((x) => x.source === 'hand')) expect(lintPrompt(c), c.id).toEqual([]);
  });

  it('catches a tap-count prompt with the wrong number', () => {
    const c = byId('tap-count_0001'); // 3 taps
    expect(lintPrompt({ ...c, prompt: 'Tap the drum exactly 4 times' })).toHaveLength(1);
    expect(lintPrompt({ ...c, prompt: 'Tap the drum exactly 13 times' })).toHaveLength(1);
  });

  it('catches a color wheel whose prompt names the wrong color', () => {
    const c = byId('stop-the-wheel_0001'); // target red
    expect(lintPrompt({ ...c, prompt: 'Stop the wheel on blue' })).toEqual(["prompt doesn't name the target color (red)"]);
  });

  it('accepts a fully labeled wheel named in words', () => {
    expect(lintPrompt(byId('stop-the-wheel_0002'))).toEqual([]); // "Stop on the taco"
  });
});

describe('dedupeKey', () => {
  it('ignores key order, case, and surrounding space', () => {
    const a = { template: 'which-is-heavier', params: { answer: 'left', left: { name: 'Elephant', emoji: '🐘' } } };
    const b = { template: 'which-is-heavier', params: { left: { emoji: '🐘', name: ' elephant ' }, answer: 'LEFT' } };
    expect(dedupeKey(a)).toBe(dedupeKey(b));
  });

  it('keeps array order and template meaningful', () => {
    const items = { template: 'odd-one-out', params: { items: ['a', 'b', 'c'], answerIndex: 0 } };
    expect(dedupeKey(items)).not.toBe(dedupeKey({ ...items, params: { items: ['b', 'a', 'c'], answerIndex: 0 } }));
    expect(dedupeKey(items)).not.toBe(dedupeKey({ ...items, template: 'tap-count' }));
  });

  it('finds no duplicates in the library', () => {
    expect(new Set(library.map(dedupeKey)).size).toBe(library.length);
  });
});

describe('factQuestion', () => {
  it('asks a blind question for which-is-heavier', () => {
    const q = factQuestion(byId('which-is-heavier_0002')); // elephant vs blue whale, answer right
    expect(q?.expected).toBe('B');
    expect(q?.text).toContain('A) Elephant');
    expect(q?.text).not.toMatch(/answer.*right|left/i);
  });

  it('numbers odd-one-out items from 1', () => {
    expect(factQuestion(byId('odd-one-out_0001'))?.expected).toBe('3'); // carrot at index 2
  });

  it('skips templates without a fact to check', () => {
    expect(factQuestion(byId('tap-count_0001'))).toBeNull();
  });
});

describe('dedupeKey for quick-math', () => {
  const math = (a: number, op: string, b: number, options: number[]) => ({ template: 'quick-math', params: { a, op, b, options } });

  it('ignores the wrong-answer tiles and the order of + and ×', () => {
    expect(dedupeKey(math(7, '×', 8, [56, 54, 63, 15]))).toBe(dedupeKey(math(8, '×', 7, [48, 56, 64, 72])));
    expect(dedupeKey(math(6, '+', 7, [13, 12, 14, 16]))).toBe(dedupeKey(math(7, '+', 6, [11, 13, 15, 17])));
  });

  it('keeps − and ÷ order', () => {
    expect(dedupeKey(math(9, '−', 4, [5, 4, 6, 13]))).not.toBe(dedupeKey(math(4, '−', 9, [5, 4, 6, 13])));
  });
});
