import { z } from 'zod';

export const TAGS = ['reflex', 'puzzle', 'perception', 'dexterity', 'knowledge', 'memory'] as const;
export const tagSchema = z.enum(TAGS);
export type Tag = z.infer<typeof tagSchema>;

export const statsSchema = z.object({
  plays: z.number().int().nonnegative(),
  wins: z.number().int().nonnegative(),
  skips: z.number().int().nonnegative(),
});

// Shared wrapper around every challenge. `params` is checked separately
// against the template's own schema once the template registry exists.
export const envelopeSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+_\d{4,}$/, 'id must look like "template-name_0001"'),
    template: z.string().regex(/^[a-z0-9-]+$/),
    version: z.number().int().positive(),
    prompt: z.string().min(1).max(40),
    durationMs: z.number().int().min(3000).max(10000),
    difficulty: z.number().int().min(1).max(5),
    theme: z.string().min(1),
    params: z.record(z.string(), z.unknown()),
    source: z.enum(['hand', 'ai', 'creator']),
    stats: statsSchema,
  })
  .strict()
  .refine((c) => c.id.startsWith(`${c.template}_`), {
    message: 'id must start with the template name',
    path: ['id'],
  });

export type Envelope = z.infer<typeof envelopeSchema>;
