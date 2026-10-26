import { z } from 'zod';
import type { BotAction, TemplateDefinition } from '../../engine/types';

// Human pace for estimating whether the count fits in durationMs. With distractors, everything
// reshuffles after each tap, so each tap also means finding the target again.
export const START_MS = 500;
export const TAP_MS = 300;
export const TAP_WITH_DISTRACTORS_MS = 550;
export const DONE_MS = 500;
// Past 10, keeping an exact count under time pressure stops being fun.
export const MAX_TAPS = 10;

export const schema = z
  .object({
    targetCount: z.number().int().min(2).max(MAX_TAPS),
    target: z.string().min(1).max(16),
    distractors: z.array(z.string().min(1).max(16)).max(5).default([]),
  })
  .strict()
  .refine((p) => !p.distractors.includes(p.target), {
    message: 'distractors must look different from the target',
    path: ['distractors'],
  });

export type Params = z.infer<typeof schema>;

export function estimatedMs(p: Params): number {
  const perTap = p.distractors.length > 0 ? TAP_WITH_DISTRACTORS_MS : TAP_MS;
  return START_MS + p.targetCount * perTap + DONE_MS;
}

export const definition: TemplateDefinition<Params> = {
  id: 'tap-count',
  schema,
  solve: (p) => {
    const taps: BotAction[] = Array.from({ length: p.targetCount }, () => ({ type: 'tap', target: 'tap-target' }));
    return { actions: [...taps, { type: 'tap', target: 'tap-done' }], estimatedMs: estimatedMs(p) };
  },
  tags: ['reflex'],
};
