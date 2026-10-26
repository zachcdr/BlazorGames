import { describe, expect, it } from 'vitest';
import { dragOffset, isSkipSwipe } from '../../src/feed/swipe';

const H = 844;

describe('isSkipSwipe', () => {
  it('skips on a long slow swipe up', () => {
    expect(isSkipSwipe({ dy: -200, ms: 1000 }, H)).toBe(true);
  });

  it('skips on a short fast flick up', () => {
    expect(isSkipSwipe({ dy: -60, ms: 80 }, H)).toBe(true);
  });

  it('ignores a short slow drag up', () => {
    expect(isSkipSwipe({ dy: -60, ms: 600 }, H)).toBe(false);
  });

  it('ignores a tiny fast twitch', () => {
    expect(isSkipSwipe({ dy: -10, ms: 5 }, H)).toBe(false);
  });

  it('never skips on a downward swipe', () => {
    expect(isSkipSwipe({ dy: 400, ms: 50 }, H)).toBe(false);
    expect(isSkipSwipe({ dy: 0, ms: 50 }, H)).toBe(false);
  });
});

describe('dragOffset', () => {
  it('follows the finger upward and resists downward', () => {
    expect(dragOffset(-120)).toBe(-120);
    expect(dragOffset(100)).toBe(25);
  });
});
