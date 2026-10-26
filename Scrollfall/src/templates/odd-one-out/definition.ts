import { z } from 'zod';
import type { TemplateDefinition } from '../../engine/types';

export const schema = z
  .object({
    items: z.array(z.string().min(1).max(16)).min(3).max(9),
    answerIndex: z.number().int().nonnegative(),
  })
  .strict()
  .refine((p) => p.answerIndex < p.items.length, { message: 'answerIndex is out of range', path: ['answerIndex'] })
  .refine((p) => p.items.filter((item) => item === p.items[p.answerIndex]).length === 1, {
    message: 'the answer must appear exactly once',
    path: ['items'],
  });

export type Params = z.infer<typeof schema>;

export const definition: TemplateDefinition<Params> = {
  id: 'odd-one-out',
  schema,
  solve: (p) => ({ actions: [{ type: 'tap', target: `item-${p.answerIndex}` }] }),
  tags: ['perception'],
};
