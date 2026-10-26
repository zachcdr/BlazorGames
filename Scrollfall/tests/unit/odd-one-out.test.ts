import { describe, expect, it } from 'vitest';
import { definition, schema } from '../../src/templates/odd-one-out/definition';

const params = { items: ['🍎', '🍌', '🥕', '🍇'], answerIndex: 2 };

describe('odd-one-out', () => {
  it('solve taps the answer', () => {
    expect(definition.solve(schema.parse(params))).toEqual({ actions: [{ type: 'tap', target: 'item-2' }] });
  });

  it('accepts 3 to 9 items', () => {
    expect(schema.safeParse({ items: ['a', 'b', 'c'], answerIndex: 0 }).success).toBe(true);
    expect(schema.safeParse({ items: ['a', 'b'], answerIndex: 0 }).success).toBe(false);
    expect(schema.safeParse({ items: Array.from('abcdefghij'), answerIndex: 0 }).success).toBe(false);
  });

  it('rejects an answer index out of range', () => {
    expect(schema.safeParse({ ...params, answerIndex: 4 }).success).toBe(false);
  });

  it('rejects an answer that appears twice', () => {
    expect(schema.safeParse({ items: ['🍎', '🥕', '🍌', '🥕'], answerIndex: 1 }).success).toBe(false);
  });

  it('allows repeated distractors', () => {
    expect(schema.safeParse({ items: ['😀', '😀', '😃', '😀'], answerIndex: 2 }).success).toBe(true);
  });
});
