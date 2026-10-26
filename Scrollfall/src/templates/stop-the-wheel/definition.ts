import { z } from 'zod';
import type { TemplateDefinition } from '../../engine/types';
import { firstWindow, segmentWindowMs } from './wheel';

// Each segment must sit under the pointer at least this long to be fair.
export const MIN_SEGMENT_MS = 150;

const segment = z
  .object({
    color: z.string().regex(/^#[0-9a-f]{6}$/i, 'color must be #rrggbb'),
    label: z.string().min(1).max(8).optional(),
  })
  .strict();

export const schema = z
  .object({
    segments: z.array(segment).min(2).max(12),
    targetSegment: z.number().int().nonnegative(),
    speed: z.number().min(0.1).max(3),
    startAngle: z.number().min(0).lt(360).default(0),
  })
  .strict()
  .refine((p) => p.targetSegment < p.segments.length, {
    message: 'targetSegment is out of range',
    path: ['targetSegment'],
  })
  .refine(
    (p) => {
      const target = p.segments[p.targetSegment];
      return p.segments.filter((s) => s.color === target?.color && s.label === target?.label).length === 1;
    },
    { message: 'the target segment must look different from every other segment', path: ['segments'] },
  )
  .refine((p) => segmentWindowMs(p) >= MIN_SEGMENT_MS, {
    message: `too fast: each segment must pass the pointer in at least ${MIN_SEGMENT_MS}ms`,
    path: ['speed'],
  });

export type Params = z.infer<typeof schema>;

export const definition: TemplateDefinition<Params> = {
  id: 'stop-the-wheel',
  schema,
  solve: (p) => {
    const window = firstWindow(p, p.targetSegment);
    return { actions: window ? [{ type: 'tap', target: 'wheel-stop', window }] : [] };
  },
  tags: ['reflex'],
};
