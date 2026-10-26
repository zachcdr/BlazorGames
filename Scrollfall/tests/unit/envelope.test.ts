import { describe, expect, it } from 'vitest';
import { envelopeSchema, type Envelope } from '../../src/schema/envelope';

const valid: Envelope = {
  id: 'odd-one-out_0001',
  template: 'odd-one-out',
  version: 1,
  prompt: "Tap the one that isn't a fruit",
  durationMs: 5000,
  difficulty: 2,
  theme: 'kitchen',
  params: { items: ['🍎', '🍌', '🥕', '🍇'], answerIndex: 2 },
  source: 'ai',
  stats: { plays: 0, wins: 0, skips: 0 },
};

function errorPaths(input: unknown): string[] {
  const result = envelopeSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => i.path.join('.'));
}

describe('envelopeSchema', () => {
  it('accepts the HANDOFF example', () => {
    expect(envelopeSchema.parse(valid)).toEqual(valid);
  });

  it.each([2999, 10001, 4500.5])('rejects durationMs %s', (durationMs) => {
    expect(errorPaths({ ...valid, durationMs })).toContain('durationMs');
  });

  it.each([3000, 10000])('accepts durationMs boundary %s', (durationMs) => {
    expect(errorPaths({ ...valid, durationMs })).toEqual([]);
  });

  it('caps prompt at 40 characters', () => {
    expect(errorPaths({ ...valid, prompt: 'x'.repeat(40) })).toEqual([]);
    expect(errorPaths({ ...valid, prompt: 'x'.repeat(41) })).toContain('prompt');
    expect(errorPaths({ ...valid, prompt: '' })).toContain('prompt');
  });

  it.each([0, 6, 2.5])('rejects difficulty %s', (difficulty) => {
    expect(errorPaths({ ...valid, difficulty })).toContain('difficulty');
  });

  it('rejects an id that does not match its template', () => {
    expect(errorPaths({ ...valid, id: 'tap-count_0001' })).toContain('id');
  });

  it('rejects unknown sources and extra fields', () => {
    expect(errorPaths({ ...valid, source: 'robot' })).toContain('source');
    expect(envelopeSchema.safeParse({ ...valid, code: 'alert(1)' }).success).toBe(false);
  });

  it('rejects negative stats', () => {
    expect(errorPaths({ ...valid, stats: { plays: -1, wins: 0, skips: 0 } })).toContain('stats.plays');
  });
});
