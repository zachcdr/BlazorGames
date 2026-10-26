import { describe, expect, it } from 'vitest';
import { buildLibrary, LIBRARY } from '../../src/engine/library';
import { checkChallenge } from '../../src/engine/validate';
import { DEFINITIONS } from '../../src/engine/definitions';

describe('content/challenges', () => {
  it('has no rejected configs', () => {
    expect(LIBRARY.rejected).toEqual([]);
  });

  it('has 10 hand-written configs and at least 30 AI configs for each template', () => {
    for (const id of DEFINITIONS.keys()) {
      const own = LIBRARY.challenges.filter((c) => c.template === id);
      expect(own.filter((c) => c.source === 'hand'), id).toHaveLength(10);
      expect(own.filter((c) => c.source === 'ai').length, id).toBeGreaterThanOrEqual(30);
    }
  });

  it('every config is winnable inside its duration', () => {
    for (const c of LIBRARY.challenges) {
      const result = checkChallenge(c);
      expect(result.ok, c.id).toBe(true);
    }
  });
});

describe('checkChallenge', () => {
  const base = LIBRARY.challenges.find((c) => c.template === 'stop-the-wheel');

  it('reports unknown templates', () => {
    const result = checkChallenge({ ...base, id: 'nope_0001', template: 'nope' });
    expect(result).toMatchObject({ ok: false, errors: ['unknown template "nope"'] });
  });

  it('prefixes template param errors with params.', () => {
    const result = checkChallenge({ ...base, params: { ...base?.params, targetSegment: 99 } });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/^params\.targetSegment/);
  });

  it('rejects a wheel whose first winning window ends after durationMs', () => {
    const slow = {
      ...base,
      durationMs: 3000,
      params: { segments: [{ color: '#e5484d' }, { color: '#3e63dd' }], targetSegment: 0, speed: 0.1, startAngle: 10 },
    };
    const result = checkChallenge(slow);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]).toMatch(/does not fit durationMs/);
  });

  it('rejects duplicate ids', () => {
    expect(buildLibrary([base, base]).rejected).toEqual([{ id: base?.id, errors: ['duplicate id'] }]);
  });
});
