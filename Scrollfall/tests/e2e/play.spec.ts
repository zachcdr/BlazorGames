import { expect, test, type Page } from '@playwright/test';
import { tapWindow } from '../../src/engine/solution';
import { STATS_KEY, type PlayStats } from '../../src/feed/stats';
import { segmentAt } from '../../src/templates/stop-the-wheel/wheel';
import { schema as wheelSchema } from '../../src/templates/stop-the-wheel/definition';
import { configUrl } from '../../scripts/lib/bot';
import type { Envelope } from '../../src/schema/envelope';
import { current, loadChallenges, play, tapAt, waitForPlay } from './bot';

const solved = loadChallenges();

async function stats(page: Page): Promise<Record<string, PlayStats>> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), STATS_KEY);
}

// AI configs were bot-tested by scripts/validate.ts on the way in; here the bot covers every
// hand-written config plus the first AI config of each template.
const firstAi = new Map(solved.filter((s) => s.challenge.source === 'ai').reverse().map((s) => [s.challenge.template, s]));
const botSet = [...solved.filter((s) => s.challenge.source === 'hand'), ...firstAi.values()];

test.describe('bot wins every hand-written challenge and a sample of AI ones', () => {
  for (const entry of botSet) {
    const { challenge } = entry;
    test(challenge.id, async ({ page }) => {
      await page.goto(`/?challenge=${challenge.id}`);
      await expect(current(page)).toHaveAttribute('data-id', challenge.id);
      await play(page, entry);
      await expect(current(page)).toHaveAttribute('data-result', 'win');
      expect((await stats(page))[challenge.id]).toEqual({ plays: 1, wins: 1, skips: 0 });
    });
  }
});

test('?config plays a valid config that is not in the library', async ({ page }) => {
  const base = solved.find((s) => s.challenge.id === 'odd-one-out_0001');
  if (!base) throw new Error('missing fixture');
  const challenge = { ...base.challenge, id: 'odd-one-out_900001', prompt: 'Tap the one that is not a fruit' };
  await page.goto(configUrl(challenge));
  await expect(current(page)).toHaveAttribute('data-id', 'odd-one-out_900001');
  await play(page, { challenge, solution: base.solution });
  await expect(current(page)).toHaveAttribute('data-result', 'win');
});

test('?config ignores an invalid config and opens the normal feed', async ({ page }) => {
  const bad = { ...solved[0]?.challenge, durationMs: 50 };
  await page.goto(configUrl(bad as Envelope));
  await expect(page.getByTestId('slot-current')).toHaveAttribute('data-kind', 'home');
});

test('odd-one-out: a wrong tap loses', async ({ page }) => {
  await page.goto('/?challenge=odd-one-out_0001');
  await waitForPlay(page);
  await page.getByTestId('item-0').tap();
  await expect(current(page)).toHaveAttribute('data-result', 'lose');
  await expect(page.getByTestId('item-2')).toHaveClass(/correct/);
});

test('stop-the-wheel: stopping on the wrong segment loses', async ({ page }) => {
  const entry = solved.find((s) => s.challenge.id === 'stop-the-wheel_0001');
  const window = tapWindow(entry?.solution.actions[0]);
  if (!entry || !window) throw new Error('missing fixture');
  const params = wheelSchema.parse(entry.challenge.params);
  // Half a segment after the window closes, a different segment is under the pointer.
  const wrongMs = window.toMs + (window.toMs - window.fromMs) / 2;
  expect(segmentAt(params, wrongMs)).not.toBe(params.targetSegment);

  await page.goto('/?challenge=stop-the-wheel_0001');
  const playStart = await waitForPlay(page);
  await tapAt(page, 'wheel-stop', playStart, wrongMs);
  await expect(current(page)).toHaveAttribute('data-result', 'lose');
});

test('doing nothing loses when time runs out, then the feed moves on', async ({ page }) => {
  await page.goto('/?challenge=odd-one-out_0005'); // 4000ms
  await waitForPlay(page);
  await expect(current(page)).toHaveAttribute('data-result', 'lose', { timeout: 6000 });
  await expect(page.getByTestId('feed')).toHaveAttribute('data-index', '1');
  expect((await stats(page))['odd-one-out_0005']).toEqual({ plays: 1, wins: 0, skips: 0 });
});

test('after a result the feed auto-advances to a different template', async ({ page }) => {
  await page.goto('/?challenge=odd-one-out_0001');
  await waitForPlay(page);
  await page.getByTestId('item-2').tap();
  await expect(current(page)).toHaveAttribute('data-result', 'win');
  await expect(page.getByTestId('feed')).toHaveAttribute('data-index', '1', { timeout: 2000 });
  await expect(current(page)).not.toHaveAttribute('data-id', /^odd-one-out_/);
});

test('result flash stays on screen for under a second', async ({ page }) => {
  await page.goto('/?challenge=odd-one-out_0001');
  await waitForPlay(page);
  await page.getByTestId('item-2').tap();
  const shown = Date.now();
  await expect(page.getByTestId('feed')).toHaveAttribute('data-index', '1');
  expect(Date.now() - shown).toBeLessThan(1000);
});

test('a swipe that starts on a challenge button skips without tapping it', async ({ page }) => {
  await page.goto('/?challenge=odd-one-out_0001');
  await waitForPlay(page);
  const box = await page.getByTestId('item-0').boundingBox();
  if (!box) throw new Error('no item');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y - 300, { steps: 6 });
  await page.mouse.up();
  await expect(page.getByTestId('feed')).toHaveAttribute('data-index', '1');
  expect((await stats(page))['odd-one-out_0001']).toEqual({ plays: 0, wins: 0, skips: 1 });
});

test('the prompt shows before play starts, for at most 800ms', async ({ page }) => {
  await page.goto('/?challenge=odd-one-out_0001');
  await expect(current(page)).toHaveAttribute('data-phase', 'intro');
  // Timed inside the page: the runner process polling from outside adds its own lag under load.
  const introMs = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const runner = document.querySelector('[data-testid="runner-current"]');
        const start = performance.now();
        const observer = new MutationObserver(() => {
          if (runner?.getAttribute('data-phase') !== 'play') return;
          observer.disconnect();
          resolve(performance.now() - start);
        });
        if (runner) observer.observe(runner, { attributes: true });
      }),
  );
  expect(introMs).toBeLessThanOrEqual(800);
});
