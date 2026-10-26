import { envelopeSchema, type Envelope } from '../schema/envelope';
import { formatIssue } from '../schema/issues';
import { DEFINITIONS } from './definitions';
import type { Solution } from './types';

// A timed tap needs at least this much of its window inside durationMs.
export const MIN_WINDOW_MS = 100;

export type ChallengeCheck =
  | { ok: true; challenge: Envelope; solution: Solution }
  | { ok: false; id: string; errors: string[] };

function idOf(raw: unknown): string {
  if (typeof raw === 'object' && raw !== null && 'id' in raw && typeof raw.id === 'string') return raw.id;
  return '(no id)';
}

// Envelope schema, template params schema, and a solver-backed winnability check.
export function checkChallenge(raw: unknown): ChallengeCheck {
  const id = idOf(raw);
  const envelope = envelopeSchema.safeParse(raw);
  if (!envelope.success) return { ok: false, id, errors: envelope.error.issues.map(formatIssue) };

  const challenge = envelope.data;
  const definition = DEFINITIONS.get(challenge.template);
  if (!definition) return { ok: false, id, errors: [`unknown template "${challenge.template}"`] };

  const params = definition.checkParams(challenge.params);
  if (!params.ok) return { ok: false, id, errors: params.errors.map((e) => `params.${e}`) };

  const solution = definition.solve(challenge.params);
  const errors: string[] = [];
  if (solution.actions.length === 0) errors.push('solver found no winning input');
  if (solution.estimatedMs !== undefined && solution.estimatedMs > challenge.durationMs) {
    errors.push(`needs about ${Math.round(solution.estimatedMs)}ms but durationMs is ${challenge.durationMs}`);
  }
  for (const action of solution.actions) {
    if (action.type !== 'tap') continue;
    if (!action.window) continue;
    const usable = Math.min(action.window.toMs, challenge.durationMs) - action.window.fromMs;
    if (usable < MIN_WINDOW_MS) errors.push(`winning window ${action.window.fromMs}-${action.window.toMs}ms does not fit durationMs`);
  }
  return errors.length ? { ok: false, id, errors } : { ok: true, challenge, solution };
}
