import { formatIssue } from '../schema/issues';
import type { Tag } from '../schema/envelope';
import { definition as oddOneOut } from '../templates/odd-one-out/definition';
import { definition as stopTheWheel } from '../templates/stop-the-wheel/definition';
import { definition as traceShape } from '../templates/trace-shape/definition';
import { definition as whichIsHeavier } from '../templates/which-is-heavier/definition';
import { definition as tapCount } from '../templates/tap-count/definition';
import { definition as memoryFlash } from '../templates/memory-flash/definition';
import { definition as quickMath } from '../templates/quick-math/definition';
import { definition as sequenceMemory } from '../templates/sequence-memory/definition';
import { definition as holdToFill } from '../templates/hold-to-fill/definition';
import type { Solution, TemplateDefinition } from './types';

export type ParamsCheck = { ok: true } | { ok: false; errors: string[] };

// A template definition with its params type erased, so different templates
// can share one registry. No React here: node scripts import this file.
export type CheckedDefinition = {
  id: string;
  tags: readonly Tag[];
  checkParams: (raw: unknown) => ParamsCheck;
  solve: (raw: unknown) => Solution;
};

export function checked<P>(d: TemplateDefinition<P>): CheckedDefinition {
  return {
    id: d.id,
    tags: d.tags,
    checkParams: (raw) => {
      const result = d.schema.safeParse(raw);
      return result.success ? { ok: true } : { ok: false, errors: result.error.issues.map(formatIssue) };
    },
    solve: (raw) => d.solve(d.schema.parse(raw)),
  };
}

export const DEFINITIONS: ReadonlyMap<string, CheckedDefinition> = new Map(
  [
    checked(oddOneOut),
    checked(stopTheWheel),
    checked(traceShape),
    checked(whichIsHeavier),
    checked(tapCount),
    checked(memoryFlash),
    checked(quickMath),
    checked(sequenceMemory),
    checked(holdToFill),
  ].map((d) => [d.id, d]),
);
