import { z } from 'zod';
import type { TemplateDefinition } from '../../engine/types';

// The band must take at least this long to fill through, to be fair.
export const MIN_BAND_MS = 150;
// Human pace: find the button, then let go a moment after the band.
export const START_MS = 500;
export const RELEASE_MS = 300;

export const schema = z
  .object({
    item: z.string().min(1).max(16),
    fillPerSecond: z.number().min(15).max(150), // percent of the container per second
    targetFrom: z.number().min(10).max(90),
    targetTo: z.number().min(15).max(95),
  })
  .strict()
  .refine((p) => p.targetTo > p.targetFrom, { message: 'targetTo must be above targetFrom', path: ['targetTo'] })
  .refine((p) => bandMs(p) >= MIN_BAND_MS, {
    message: `too fast: the target band must take at least ${MIN_BAND_MS}ms to fill through`,
    path: ['fillPerSecond'],
  });

export type Params = z.infer<typeof schema>;
export type Release = 'hit' | 'short' | 'over';

export function bandMs(p: { fillPerSecond: number; targetFrom: number; targetTo: number }): number {
  return ((p.targetTo - p.targetFrom) / p.fillPerSecond) * 1000;
}

export function levelAt(p: Params, heldMs: number): number {
  return (heldMs * p.fillPerSecond) / 1000;
}

export function releaseOutcome(p: Params, heldMs: number): Release {
  const level = levelAt(p, heldMs);
  if (level < p.targetFrom) return 'short';
  return level <= p.targetTo ? 'hit' : 'over';
}

export function estimatedMs(p: Params): number {
  return START_MS + (p.targetTo / p.fillPerSecond) * 1000 + RELEASE_MS;
}

export const definition: TemplateDefinition<Params> = {
  id: 'hold-to-fill',
  schema,
  solve: (p) => ({
    actions: [{ type: 'hold', target: 'hold-pad', holdMs: (((p.targetFrom + p.targetTo) / 2) / p.fillPerSecond) * 1000 }],
    estimatedMs: estimatedMs(p),
  }),
  tags: ['reflex'],
};
