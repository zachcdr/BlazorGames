import { z } from 'zod';
import type { TemplateDefinition } from '../../engine/types';

const thing = z
  .object({
    emoji: z.string().min(1).max(16),
    name: z.string().min(1).max(24),
  })
  .strict();

export const schema = z
  .object({
    left: thing,
    right: thing,
    answer: z.enum(['left', 'right']),
    explanation: z.string().min(1).max(80),
  })
  .strict()
  .refine((p) => p.left.name.toLowerCase() !== p.right.name.toLowerCase(), {
    message: 'left and right must be different things',
    path: ['right', 'name'],
  });

export type Params = z.infer<typeof schema>;

export const definition: TemplateDefinition<Params> = {
  id: 'which-is-heavier',
  schema,
  solve: (p) => ({ actions: [{ type: 'tap', target: `choice-${p.answer}` }] }),
  tags: ['knowledge'],
};
