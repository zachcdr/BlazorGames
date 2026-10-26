import { describe, expect, it } from 'vitest';
import { definition, schema } from '../../src/templates/which-is-heavier/definition';

const params = {
  left: { emoji: '🐘', name: 'Elephant' },
  right: { emoji: '🦒', name: 'Giraffe' },
  answer: 'left',
  explanation: 'Elephants weigh more.',
};

describe('which-is-heavier', () => {
  it('solve taps the stated answer', () => {
    expect(definition.solve(schema.parse(params)).actions).toEqual([{ type: 'tap', target: 'choice-left' }]);
    expect(definition.solve(schema.parse({ ...params, answer: 'right' })).actions[0]?.target).toBe('choice-right');
  });

  it('rejects comparing a thing with itself', () => {
    expect(schema.safeParse({ ...params, right: { emoji: '🐘', name: 'elephant' } }).success).toBe(false);
  });

  it('caps the explanation length and requires a valid side', () => {
    expect(schema.safeParse({ ...params, explanation: 'x'.repeat(81) }).success).toBe(false);
    expect(schema.safeParse({ ...params, answer: 'both' }).success).toBe(false);
  });
});
