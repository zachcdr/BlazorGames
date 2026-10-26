import type { Envelope } from '../../src/schema/envelope';
import { schema as tapCountSchema } from '../../src/templates/tap-count/definition';
import { schema as wheelSchema } from '../../src/templates/stop-the-wheel/definition';

// Pipeline-only checks that the app doesn't need: does the prompt match the params,
// and is this a duplicate of something we already have?

const COLOR_NAMES: Record<string, string> = {
  '#e5484d': 'red',
  '#3e63dd': 'blue',
  '#30a46c': 'green',
  '#ffc53d': 'yellow',
  '#8e4ec6': 'purple',
  '#f76b15': 'orange',
  '#d6409f': 'pink',
  '#12a594': 'teal',
};

// Returns problems with the prompt; empty means fine.
export function lintPrompt(c: Envelope): string[] {
  const prompt = c.prompt.toLowerCase();
  if (c.template === 'tap-count') {
    const p = tapCountSchema.parse(c.params);
    return new RegExp(`\\b${p.targetCount}\\b`).test(prompt) ? [] : [`prompt doesn't say ${p.targetCount}`];
  }
  if (c.template === 'stop-the-wheel') {
    const p = wheelSchema.parse(c.params);
    const target = p.segments[p.targetSegment];
    if (!target) return ['no target segment'];
    if (target.label && prompt.includes(target.label)) return [];
    if (target.label && p.segments.every((s) => s.label)) return []; // named by label in words; can't check
    const name = COLOR_NAMES[target.color.toLowerCase()];
    if (!name) return [`target color ${target.color} is not a nameable palette color`];
    return prompt.includes(name) ? [] : [`prompt doesn't name the target color (${name})`];
  }
  return [];
}

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, canonical(v)]),
    );
  }
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

// The sum is what players remember, not the wrong-answer tiles, and 7 × 8 is the same as 8 × 7.
function mathKey(params: Envelope['params']): unknown {
  const { a, op, b } = params;
  if (typeof a !== 'number' || typeof b !== 'number') return params;
  const swappable = op === '+' || op === '×';
  return swappable ? { op, a: Math.min(a, b), b: Math.max(a, b) } : { op, a, b };
}

// Same template + same normalized params counts as a duplicate.
export function dedupeKey(c: Pick<Envelope, 'template' | 'params'>): string {
  const params = c.template === 'quick-math' ? mathKey(c.params) : c.params;
  return `${c.template}:${JSON.stringify(canonical(params))}`;
}
