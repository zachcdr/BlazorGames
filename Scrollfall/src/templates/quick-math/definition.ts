import { z } from 'zod';
import type { TemplateDefinition } from '../../engine/types';

export const OPERATORS = ['+', '−', '×', '÷'] as const;
export type Operator = (typeof OPERATORS)[number];

const operand = z.number().int().min(0).max(999);

// Keeps sums to what people can do in their head in a few seconds:
// + up to 100, − never below 0, × and ÷ within the 12 times table.
export const MAX_SUM = 100;
export const MAX_TABLE = 12;

export function mentalMathProblem(p: { a: number; op: Operator; b: number }): string | null {
  switch (p.op) {
    case '+':
      return p.a + p.b <= MAX_SUM ? null : `the sum must be ${MAX_SUM} or less`;
    case '−':
      return p.a <= MAX_SUM && p.b <= p.a ? null : `subtraction must stay between 0 and ${MAX_SUM}`;
    case '×':
      return p.a <= MAX_TABLE && p.b <= MAX_TABLE ? null : `multiply within the ${MAX_TABLE} times table`;
    case '÷':
      return p.b >= 1 && p.b <= MAX_TABLE && p.a / p.b <= MAX_TABLE ? null : `divide within the ${MAX_TABLE} times table`;
  }
}

// Reading the sum and finding the tile: quickest for single digits, then tables, then bigger + and −.
export function estimatedMs(p: { a: number; op: Operator; b: number }): number {
  if ((p.op === '+' || p.op === '−') && p.a < 10 && p.b < 10) return 4000;
  if (p.op === '×' || p.op === '÷') return 5000;
  return 5500;
}

// The answer is never stored: it's computed here, so a config can't claim a wrong one.
export function compute(a: number, op: Operator, b: number): number {
  switch (op) {
    case '+':
      return a + b;
    case '−':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      return a / b;
  }
}

export const schema = z
  .object({
    a: operand,
    op: z.enum(OPERATORS),
    b: operand,
    options: z.array(z.number().int().min(-9999).max(99999)).length(4),
  })
  .strict()
  .refine((p) => p.op !== '÷' || (p.b !== 0 && p.a % p.b === 0), {
    message: 'division must come out to a whole number',
    path: ['b'],
  })
  .refine((p) => mentalMathProblem(p) === null, { message: 'too hard for quick mental maths', path: ['op'] })
  .refine((p) => new Set(p.options).size === p.options.length, { message: 'options must all differ', path: ['options'] })
  .refine((p) => p.options.filter((o) => o === compute(p.a, p.op, p.b)).length === 1, {
    message: 'exactly one option must be the correct answer',
    path: ['options'],
  });

export type Params = z.infer<typeof schema>;

export function answerIndex(p: Params): number {
  return p.options.indexOf(compute(p.a, p.op, p.b));
}

export const definition: TemplateDefinition<Params> = {
  id: 'quick-math',
  schema,
  solve: (p) => ({ actions: [{ type: 'tap', target: `option-${answerIndex(p)}` }], estimatedMs: estimatedMs(p) }),
  tags: ['puzzle'],
};
