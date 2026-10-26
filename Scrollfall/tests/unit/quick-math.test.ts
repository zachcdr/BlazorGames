import { describe, expect, it } from 'vitest';
import { answerIndex, compute, definition, estimatedMs, mentalMathProblem, schema, type Operator } from '../../src/templates/quick-math/definition';

const base = { a: 7, op: '×', b: 8, options: [54, 56, 63, 15] };

describe('quick-math', () => {
  it('computes each operator', () => {
    expect(compute(7, '+', 8)).toBe(15);
    expect(compute(7, '−', 8)).toBe(-1);
    expect(compute(7, '×', 8)).toBe(56);
    expect(compute(63, '÷', 9)).toBe(7);
  });

  it('solve taps the tile holding the computed answer', () => {
    const p = schema.parse(base);
    expect(answerIndex(p)).toBe(1);
    expect(definition.solve(p).actions).toEqual([{ type: 'tap', target: 'option-1' }]);
  });

  it('rejects configs with no correct option or two of them', () => {
    expect(schema.safeParse({ ...base, options: [54, 55, 63, 15] }).success).toBe(false);
    expect(schema.safeParse({ ...base, options: [56, 56, 63, 15] }).success).toBe(false);
  });

  it('rejects inexact division and division by zero', () => {
    expect(schema.safeParse({ a: 10, op: '÷', b: 3, options: [3, 4, 5, 6] }).success).toBe(false);
    expect(schema.safeParse({ a: 10, op: '÷', b: 0, options: [0, 1, 2, 10] }).success).toBe(false);
  });

  it('needs exactly 4 options and a known operator', () => {
    expect(schema.safeParse({ ...base, options: [56, 54, 63] }).success).toBe(false);
    expect(schema.safeParse({ ...base, op: '*' }).success).toBe(false);
  });

  it('keeps sums to quick mental maths', () => {
    const ok = (a: number, op: string, b: number) => mentalMathProblem({ a, op: op as Operator, b }) === null;
    expect(ok(48, '+', 52)).toBe(true);
    expect(ok(48, '+', 56)).toBe(false); // over 100
    expect(ok(100, '−', 37)).toBe(true);
    expect(ok(3, '−', 10)).toBe(false); // negative
    expect(ok(12, '×', 12)).toBe(true);
    expect(ok(13, '×', 2)).toBe(false); // outside the 12 times table
    expect(ok(144, '÷', 12)).toBe(true);
    expect(ok(156, '÷', 12)).toBe(false); // answer 13
    expect(ok(38, '÷', 19)).toBe(false); // divisor 19
  });

  it('the schema enforces it', () => {
    expect(schema.safeParse({ a: 3, op: '−', b: 10, options: [-7, 7, -13, 13] }).success).toBe(false);
    expect(schema.safeParse({ a: 25, op: '×', b: 16, options: [350, 400, 410, 41] }).success).toBe(false);
  });

  it('gives more time to harder kinds of sum', () => {
    expect(estimatedMs({ a: 4, op: '+', b: 5 })).toBeLessThan(estimatedMs({ a: 7, op: '×', b: 8 }));
    expect(estimatedMs({ a: 7, op: '×', b: 8 })).toBeLessThan(estimatedMs({ a: 47, op: '+', b: 38 }));
    expect(definition.solve(schema.parse(base)).estimatedMs).toBe(5000);
  });
});
