import { expect, test, type Page } from '@playwright/test';
import { holdFor } from '../../scripts/lib/bot';
import { current, dragThrough, waitForPlay } from './bot';

const feedIndex = (page: Page) => page.getByTestId('feed');
const inCard = (page: Page, testId: string) => current(page).getByTestId(testId);

async function start(page: Page, id: string): Promise<number> {
  await page.goto(`/?challenge=${id}`);
  return waitForPlay(page);
}

test.describe('which-is-heavier', () => {
  test('a wrong pick loses and shows the explanation', async ({ page }) => {
    await start(page, 'which-is-heavier_0001'); // elephant (left) vs giraffe
    await inCard(page, 'choice-right').tap();
    await expect(current(page)).toHaveAttribute('data-result', 'lose');
    await expect(current(page).locator('.wih-explanation')).toContainText('elephant');
  });
});

test.describe('tap-count', () => {
  test('one tap too many loses', async ({ page }) => {
    await start(page, 'tap-count_0001'); // 3 taps
    for (let i = 0; i < 4; i++) await inCard(page, 'tap-target').tap();
    await inCard(page, 'tap-done').tap();
    await expect(current(page)).toHaveAttribute('data-result', 'lose');
  });

  test('one tap too few loses', async ({ page }) => {
    await start(page, 'tap-count_0001');
    for (let i = 0; i < 2; i++) await inCard(page, 'tap-target').tap();
    await inCard(page, 'tap-done').tap();
    await expect(current(page)).toHaveAttribute('data-result', 'lose');
  });

  test('tapping a distractor loses', async ({ page }) => {
    await start(page, 'tap-count_0003'); // balloons with a bomb
    await inCard(page, 'tap-target').tap();
    await inCard(page, 'tap-distractor-0').tap();
    await expect(current(page)).toHaveAttribute('data-result', 'lose');
  });
});

test.describe('memory-flash', () => {
  test('the item is hidden in the intro, shown during the flash, then hidden', async ({ page }) => {
    await page.goto('/?challenge=memory-flash_0001'); // cat in cell 4, 1200ms flash
    await expect(current(page)).toHaveAttribute('data-phase', 'intro');
    await expect(inCard(page, 'cell-4')).toHaveText('');
    await waitForPlay(page);
    await expect(inCard(page, 'cell-4')).toHaveText('🐱');
    await expect(inCard(page, 'cell-4')).toHaveText('', { timeout: 2000 });
  });

  test('taps during the flash are ignored', async ({ page }) => {
    await start(page, 'memory-flash_0001');
    await inCard(page, 'cell-4').tap();
    await expect(current(page)).not.toHaveAttribute('data-result', /./);
    await expect(inCard(page, 'cell-4')).toHaveText('', { timeout: 2000 });
    await inCard(page, 'cell-4').tap();
    await expect(current(page)).toHaveAttribute('data-result', 'win');
  });

  test('the wrong cell loses', async ({ page }) => {
    await start(page, 'memory-flash_0001');
    await expect(inCard(page, 'cell-4')).toHaveText('', { timeout: 2000 });
    await inCard(page, 'cell-0').tap();
    await expect(current(page)).toHaveAttribute('data-result', 'lose');
  });
});

test.describe('trace-shape', () => {
  // trace-shape_0001: a line from (15, 50) to (85, 50), tolerance 12.
  test('straying off the path loses, and does not skip the card', async ({ page }) => {
    await start(page, 'trace-shape_0001');
    await dragThrough(page, 'trace-pad', [
      [15, 50],
      [25, 50],
      [30, 30],
      [30, 5],
    ]);
    await expect(current(page)).toHaveAttribute('data-result', 'lose');
    await expect(feedIndex(page)).toHaveAttribute('data-index', '0');
  });

  test('dragging up from the start dot traces instead of skipping', async ({ page }) => {
    await start(page, 'trace-shape_0001');
    await dragThrough(page, 'trace-pad', [
      [15, 50],
      [16, 40],
      [16, 20],
    ]);
    await expect(feedIndex(page)).toHaveAttribute('data-index', '0');
  });

  test('a swipe up that starts away from the path still skips', async ({ page }) => {
    await start(page, 'trace-shape_0001');
    const pad = await inCard(page, 'trace-pad').boundingBox();
    if (!pad) throw new Error('no pad');
    const x = pad.x + pad.width / 2;
    const y = pad.y + pad.height * 0.9;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y - 350, { steps: 6 });
    await page.mouse.up();
    await expect(feedIndex(page)).toHaveAttribute('data-index', '1');
  });

  test('lifting the finger and resuming where you left off still wins', async ({ page }) => {
    await start(page, 'trace-shape_0001');
    const line = (from: number, to: number) =>
      Array.from({ length: Math.round((to - from) / 2) + 1 }, (_, i) => [from + i * 2, 50] as const);
    await dragThrough(page, 'trace-pad', line(15, 45));
    await expect(current(page)).not.toHaveAttribute('data-result', /./);
    await dragThrough(page, 'trace-pad', line(45, 85));
    await expect(current(page)).toHaveAttribute('data-result', 'win');
  });
});

test.describe('quick-math', () => {
  test('shows the sum and a wrong tile loses', async ({ page }) => {
    await start(page, 'quick-math_0003'); // 7 × 8, answer at option-1
    await expect(inCard(page, 'math-question')).toHaveText('7 × 8 = ?');
    await inCard(page, 'option-0').tap();
    await expect(current(page)).toHaveAttribute('data-result', 'lose');
    await expect(inCard(page, 'option-1')).toHaveClass(/correct/);
  });
});

test.describe('sequence-memory', () => {
  // sequence-memory_0002: 3x3, cells 4 -> 0 -> 8, 600ms flips with 250ms gaps (show ends at 2300ms).
  test('nothing flips during the intro; squares flip during the show', async ({ page }) => {
    await page.goto('/?challenge=sequence-memory_0002');
    await expect(current(page)).toHaveAttribute('data-phase', 'intro');
    await expect(current(page).locator('.sm-cell.lit')).toHaveCount(0);
    await waitForPlay(page);
    await expect(inCard(page, 'cell-4')).toHaveClass(/lit/);
    await expect(inCard(page, 'cell-0')).toHaveClass(/lit/);
  });

  test('taps during the show are ignored', async ({ page }) => {
    await start(page, 'sequence-memory_0002');
    await inCard(page, 'cell-1').tap();
    await expect(current(page)).not.toHaveAttribute('data-result', /./);
  });

  test('the wrong order loses and shows the square that was next', async ({ page }) => {
    await start(page, 'sequence-memory_0002');
    await expect(current(page).locator('.sm-cell.lit')).toHaveCount(0, { timeout: 4000 });
    await page.waitForTimeout(2400);
    await inCard(page, 'cell-4').tap();
    await inCard(page, 'cell-8').tap();
    await expect(current(page)).toHaveAttribute('data-result', 'lose');
    await expect(inCard(page, 'cell-4')).toHaveText('1');
    await expect(inCard(page, 'cell-0')).toHaveClass(/missed/);
  });
});

test.describe('hold-to-fill', () => {
  // hold-to-fill_0004: 40% per second, band 50-65% (1250-1625ms of holding).
  test('letting go early loses', async ({ page }) => {
    await start(page, 'hold-to-fill_0004');
    await holdFor(page, 'hold-pad', 600);
    await expect(current(page)).toHaveAttribute('data-result', 'lose');
  });

  test('holding too long overflows and loses without letting go', async ({ page }) => {
    await start(page, 'hold-to-fill_0004');
    const pad = await inCard(page, 'hold-pad').boundingBox();
    if (!pad) throw new Error('no pad');
    await page.mouse.move(pad.x + pad.width / 2, pad.y + pad.height / 2);
    await page.mouse.down();
    await expect(current(page)).toHaveAttribute('data-result', 'lose', { timeout: 4000 });
    await page.mouse.up();
  });

  test('a swipe that starts on the hold pad cancels the fill and skips', async ({ page }) => {
    await start(page, 'hold-to-fill_0004');
    const pad = await inCard(page, 'hold-pad').boundingBox();
    if (!pad) throw new Error('no pad');
    const x = pad.x + pad.width / 2;
    const y = pad.y + pad.height * 0.7;
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x, y - 350, { steps: 6 });
    await page.mouse.up();
    await expect(feedIndex(page)).toHaveAttribute('data-index', '1');
    const stats = await page.evaluate(() => JSON.parse(localStorage.getItem('scrollfall.stats.v1') ?? '{}'));
    expect(stats['hold-to-fill_0004']).toEqual({ plays: 0, wins: 0, skips: 1 });
  });
});
