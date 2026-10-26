export type SwipeSample = { dy: number; ms: number };

// Swipe up past this share of the screen, or fast enough, counts as a skip.
export const SKIP_DISTANCE_RATIO = 0.18;
export const SKIP_VELOCITY = 0.5; // px per ms
const MIN_FLICK_PX = 24;
// Movement before the feed takes over the pointer from the challenge.
export const CAPTURE_DISTANCE_PX = 10;

export function isSkipSwipe({ dy, ms }: SwipeSample, viewportHeight: number): boolean {
  if (dy >= 0) return false;
  const distance = -dy;
  if (distance >= viewportHeight * SKIP_DISTANCE_RATIO) return true;
  return ms > 0 && distance > MIN_FLICK_PX && distance / ms >= SKIP_VELOCITY;
}

// Downward drags only rubber-band; there's no going back in the feed.
export function dragOffset(dy: number): number {
  return dy < 0 ? dy : dy * 0.25;
}
