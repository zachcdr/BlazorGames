import { z } from 'zod';
import type { BotAction, TemplateDefinition } from '../../engine/types';

// Human pace for estimating whether the replay fits in durationMs.
export const START_MS = 600;
export const TAP_MS = 400;
// How long after the show ends the bot aims to start tapping within.
const RECALL_MS = 2000;
const AFTER_SHOW_MS = 50;

export const schema = z
  .object({
    rows: z.number().int().min(2).max(4),
    cols: z.number().int().min(2).max(4),
    sequence: z.array(z.number().int().nonnegative()).min(2).max(8),
    showMs: z.number().int().min(250).max(1200),
    gapMs: z.number().int().min(100).max(600),
  })
  .strict()
  .refine((p) => p.sequence.every((cell) => cell < p.rows * p.cols), {
    message: 'every cell in the sequence must be inside the grid',
    path: ['sequence'],
  })
  .refine((p) => new Set(p.sequence).size === p.sequence.length, {
    message: 'a cell can only appear once in the sequence',
    path: ['sequence'],
  });

export type Params = z.infer<typeof schema>;

// Cell i of the sequence is lit from flipStart(i) for showMs.
export function flipStart(p: Params, i: number): number {
  return i * (p.showMs + p.gapMs);
}

export function showEnd(p: Params): number {
  return flipStart(p, p.sequence.length - 1) + p.showMs;
}

export function estimatedMs(p: Params): number {
  return showEnd(p) + START_MS + p.sequence.length * TAP_MS;
}

export const definition: TemplateDefinition<Params> = {
  id: 'sequence-memory',
  schema,
  solve: (p) => {
    const from = showEnd(p) + AFTER_SHOW_MS;
    const actions: BotAction[] = p.sequence.map((cell, i) =>
      i === 0
        ? { type: 'tap', target: `cell-${cell}`, window: { fromMs: from, toMs: from + RECALL_MS } }
        : { type: 'tap', target: `cell-${cell}` },
    );
    return { actions, estimatedMs: estimatedMs(p) };
  },
  tags: ['memory'],
};
