import { describe, expect, it } from 'vitest';
import { tapWindow } from '../../src/engine/solution';
import { definition, RECALL_MS, schema } from '../../src/templates/memory-flash/definition';

const base = { rows: 3, cols: 3, flashMs: 800, targetCell: 4, item: '🐱' };

describe('memory-flash solve', () => {
  it('taps the target cell after the flash ends', () => {
    const [action] = definition.solve(schema.parse(base)).actions;
    expect(action?.target).toBe('cell-4');
    const w = tapWindow(action);
    expect(w?.fromMs).toBeGreaterThan(base.flashMs);
    expect(w && w.toMs - w.fromMs).toBe(RECALL_MS);
  });
});

describe('memory-flash schema', () => {
  it('rejects a target outside the grid', () => {
    expect(schema.safeParse({ ...base, targetCell: 9 }).success).toBe(false);
  });

  it('rejects decoys on the target, outside the grid, sharing a cell, or looking like the item', () => {
    expect(schema.safeParse({ ...base, decoys: [{ cell: 4, item: '🐶' }] }).success).toBe(false);
    expect(schema.safeParse({ ...base, decoys: [{ cell: 9, item: '🐶' }] }).success).toBe(false);
    expect(schema.safeParse({ ...base, decoys: [{ cell: 1, item: '🐶' }, { cell: 1, item: '🐭' }] }).success).toBe(false);
    expect(schema.safeParse({ ...base, decoys: [{ cell: 1, item: '🐱' }] }).success).toBe(false);
  });

  it('accepts valid decoys and limits flash time', () => {
    expect(schema.safeParse({ ...base, decoys: [{ cell: 1, item: '🐶' }, { cell: 2, item: '🐶' }] }).success).toBe(true);
    expect(schema.safeParse({ ...base, flashMs: 100 }).success).toBe(false);
    expect(schema.safeParse({ ...base, flashMs: 2500 }).success).toBe(false);
  });
});
