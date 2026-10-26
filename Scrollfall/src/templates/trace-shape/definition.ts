import { z } from 'zod';
import type { TemplateDefinition } from '../../engine/types';
import { makePath, sample } from './trace';

// Human pace for estimating whether a trace fits in durationMs: 0-100 units is the pad width.
export const START_MS = 500;
export const MS_PER_UNIT = 8;
export const MIN_LENGTH = 30;

const point = z.tuple([z.number().min(5).max(95), z.number().min(5).max(95)]);

export const schema = z
  .object({
    points: z.array(point).min(2).max(40),
    tolerance: z.number().min(6).max(15),
    fadeMs: z.number().int().min(300).max(5000),
  })
  .strict()
  .refine((p) => p.points.every((q, i) => i === 0 || q[0] !== p.points[i - 1]?.[0] || q[1] !== p.points[i - 1]?.[1]), {
    message: 'consecutive points must differ',
    path: ['points'],
  })
  .refine((p) => makePath(p.points).total >= MIN_LENGTH, {
    message: `the path must be at least ${MIN_LENGTH} units long`,
    path: ['points'],
  });

export type Params = z.infer<typeof schema>;

export function estimatedMs(p: Params): number {
  return START_MS + makePath(p.points).total * MS_PER_UNIT;
}

export const definition: TemplateDefinition<Params> = {
  id: 'trace-shape',
  schema,
  solve: (p) => ({
    actions: [{ type: 'drag', target: 'trace-pad', points: sample(makePath(p.points), 2) }],
    estimatedMs: estimatedMs(p),
  }),
  tags: ['dexterity'],
};
