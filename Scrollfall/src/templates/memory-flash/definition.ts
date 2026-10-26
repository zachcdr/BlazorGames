import { z } from 'zod';
import type { TemplateDefinition } from '../../engine/types';

// How long after the flash ends the bot aims to answer within.
export const RECALL_MS = 2000;
const AFTER_FLASH_MS = 50;

const decoy = z.object({ cell: z.number().int().nonnegative(), item: z.string().min(1).max(16) }).strict();

export const schema = z
  .object({
    rows: z.number().int().min(2).max(5),
    cols: z.number().int().min(2).max(5),
    flashMs: z.number().int().min(200).max(2000),
    targetCell: z.number().int().nonnegative(),
    item: z.string().min(1).max(16),
    decoys: z.array(decoy).max(8).default([]),
  })
  .strict()
  .refine((p) => p.targetCell < p.rows * p.cols, { message: 'targetCell is out of range', path: ['targetCell'] })
  .refine((p) => p.decoys.every((d) => d.cell < p.rows * p.cols && d.cell !== p.targetCell), {
    message: 'decoys must be inside the grid and off the target cell',
    path: ['decoys'],
  })
  .refine((p) => new Set(p.decoys.map((d) => d.cell)).size === p.decoys.length, {
    message: 'decoys must use different cells',
    path: ['decoys'],
  })
  .refine((p) => p.decoys.every((d) => d.item !== p.item), {
    message: 'decoys must look different from the item',
    path: ['decoys'],
  });

export type Params = z.infer<typeof schema>;

export const definition: TemplateDefinition<Params> = {
  id: 'memory-flash',
  schema,
  solve: (p) => ({
    actions: [
      {
        type: 'tap',
        target: `cell-${p.targetCell}`,
        window: { fromMs: p.flashMs + AFTER_FLASH_MS, toMs: p.flashMs + AFTER_FLASH_MS + RECALL_MS },
      },
    ],
  }),
  tags: ['memory'],
};
