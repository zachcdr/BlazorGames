import type { Page } from '@playwright/test';
import type { BotAction, Point, Solution } from '../../src/engine/types';
import type { Envelope } from '../../src/schema/envelope';

// Plays a challenge in a real page from its solver output. Shared by the e2e tests and
// scripts/validate.ts, so it avoids test-runner-only helpers like `expect`.

export type Solved = { challenge: Envelope; solution: Solution };

const CURRENT = '[data-testid="runner-current"]';

export async function waitForPlay(page: Page): Promise<number> {
  const runner = await page.waitForSelector(`${CURRENT}[data-phase="play"]`);
  return Number(await runner.getAttribute('data-play-start'));
}

export async function waitForResult(page: Page, timeout = 15000): Promise<'win' | 'lose'> {
  const runner = await page.waitForSelector(`${CURRENT}[data-result]`, { timeout });
  return (await runner.getAttribute('data-result')) === 'win' ? 'win' : 'lose';
}

// Sleeps inside the page until `ms` after play started, measured on the page's own clock.
export async function waitUntilPlayMs(page: Page, playStart: number, ms: number): Promise<void> {
  await page.evaluate(
    ([start, at]) =>
      new Promise<void>((resolve) => {
        const wait = start + at - performance.now();
        if (wait <= 0) resolve();
        else setTimeout(resolve, wait);
      }),
    [playStart, ms] as const,
  );
}

async function boxOf(page: Page, testId: string) {
  const box = await page.locator(CURRENT).getByTestId(testId).boundingBox();
  if (!box) throw new Error(`no box for ${testId}`);
  return box;
}

// Touch latency from the runner is a few ms; aim slightly early in each window.
const LATENCY_MS = 10;

export async function tapAt(page: Page, testId: string, playStart: number, ms?: number): Promise<void> {
  const box = await boxOf(page, testId);
  if (ms !== undefined) await waitUntilPlayMs(page, playStart, ms - LATENCY_MS);
  await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2);
}

// Drags through points given in 0-100 of the target's box.
export async function dragThrough(page: Page, testId: string, points: readonly Point[]): Promise<void> {
  const box = await boxOf(page, testId);
  const toPage = (p: Point) => [box.x + (p[0] / 100) * box.width, box.y + (p[1] / 100) * box.height] as const;
  const [first, ...rest] = points.map(toPage);
  if (!first) return;
  await page.mouse.move(first[0], first[1]);
  await page.mouse.down();
  for (const [x, y] of rest) await page.mouse.move(x, y);
  await page.mouse.up();
}

// Presses the target's center, keeps it down for holdMs (timed on the page's clock), then lets go.
export async function holdFor(page: Page, testId: string, holdMs: number): Promise<void> {
  const box = await boxOf(page, testId);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  const downAt = await page.evaluate(() => performance.now());
  await waitUntilPlayMs(page, downAt, holdMs - LATENCY_MS);
  await page.mouse.up();
}

async function perform(page: Page, action: BotAction, playStart: number, durationMs: number): Promise<void> {
  if (action.type === 'drag') return dragThrough(page, action.target, action.points);
  if (action.type === 'hold') return holdFor(page, action.target, action.holdMs);
  const w = action.window;
  const at = w ? (w.fromMs + Math.min(w.toMs, durationMs)) / 2 : undefined;
  await tapAt(page, action.target, playStart, at);
}

export async function play(page: Page, { challenge, solution }: Solved): Promise<void> {
  const playStart = await waitForPlay(page);
  for (const action of solution.actions) await perform(page, action, playStart, challenge.durationMs);
}

// URL that puts any config (even one not in the library) first in the feed.
export function configUrl(challenge: Envelope): string {
  return `/?config=${encodeURIComponent(JSON.stringify(challenge))}`;
}
