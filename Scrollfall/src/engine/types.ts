import type { ComponentType } from 'react';
import type { z } from 'zod';
import type { Tag } from '../schema/envelope';

export type Timer = {
  readonly durationMs: number;
  started: () => boolean;
  elapsed: () => number;
};

// Milliseconds after play starts.
export type TimeWindow = { fromMs: number; toMs: number };

// x, y from 0 to 100 inside the target element's box.
export type Point = readonly [number, number];

// What a bot has to do to win. Validation uses it to prove a challenge is winnable.
export type BotAction =
  | { type: 'tap'; target: string; window?: TimeWindow }
  | { type: 'drag'; target: string; points: Point[] }
  | { type: 'hold'; target: string; holdMs: number };

// `estimatedMs`: how long a person needs for the actions, when that can exceed a single tap.
export type Solution = { actions: BotAction[]; estimatedMs?: number };

export type TemplateDefinition<P> = {
  id: string;
  schema: z.ZodType<P, z.ZodTypeDef, unknown>;
  solve: (params: P) => Solution;
  tags: readonly Tag[];
};

export type RendererProps<P> = {
  params: P;
  timer: Timer;
  onResult: (win: boolean, ms: number) => void;
};

// The four-part contract every template module exports.
export type TemplateModule<P> = TemplateDefinition<P> & {
  Renderer: ComponentType<RendererProps<P>>;
};
