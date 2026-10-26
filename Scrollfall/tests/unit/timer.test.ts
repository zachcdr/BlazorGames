import { describe, expect, it } from 'vitest';
import { createTimer } from '../../src/engine/timer';

function fakeClock() {
  let t = 1000;
  return { now: () => t, advance: (ms: number) => (t += ms) };
}

describe('createTimer', () => {
  it('reads 0 until started', () => {
    const clock = fakeClock();
    const timer = createTimer(5000, clock.now);
    clock.advance(300);
    expect(timer.elapsed()).toBe(0);
    expect(timer.startedAt()).toBeNull();
  });

  it('counts after start and freezes on stop', () => {
    const clock = fakeClock();
    const timer = createTimer(5000, clock.now);
    timer.start();
    clock.advance(1200);
    expect(timer.elapsed()).toBe(1200);
    timer.stop();
    clock.advance(800);
    expect(timer.elapsed()).toBe(1200);
  });

  it('caps at durationMs', () => {
    const clock = fakeClock();
    const timer = createTimer(3000, clock.now);
    timer.start();
    clock.advance(9999);
    expect(timer.elapsed()).toBe(3000);
  });

  it('ignores a second start', () => {
    const clock = fakeClock();
    const timer = createTimer(5000, clock.now);
    timer.start();
    clock.advance(500);
    timer.start();
    expect(timer.elapsed()).toBe(500);
  });
});
