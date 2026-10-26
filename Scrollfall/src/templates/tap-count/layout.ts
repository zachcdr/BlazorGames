// Slot order for the target (index 0) and distractors (1..n) after `taps` target taps.
// Deterministic, so the same tap count always gives the same layout.
export function arrangement(itemCount: number, taps: number): number[] {
  const order = Array.from({ length: itemCount }, (_, i) => i);
  let seed = Math.imul(taps + 1, 2654435761) >>> 0;
  for (let i = order.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [order[i], order[j]] = [order[j] ?? 0, order[i] ?? 0];
  }
  return order;
}
