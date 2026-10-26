import { expect, test, type Page } from '@playwright/test';

// Real touch input through CDP, so the app sees pointerType "touch".
async function touchSwipe(page: Page, fromY: number, toY: number, steps = 8, stepMs = 16) {
  const cdp = await page.context().newCDPSession(page);
  const x = 195;
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: fromY }] });
  for (let i = 1; i <= steps; i++) {
    const y = fromY + ((toY - fromY) * i) / steps;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] });
    await page.waitForTimeout(stepMs);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
}

const currentId = (page: Page) => page.getByTestId('runner-current').getAttribute('data-id');

test.beforeEach(async ({ page }) => {
  await page.goto('/?challenge=odd-one-out_0001');
  await expect(page.getByTestId('runner-current')).toBeVisible();
});

test('fills the phone viewport with no page scroll', async ({ page }) => {
  const box = await page.getByTestId('runner-current').boundingBox();
  expect(box).toMatchObject({ x: 0, y: 0, width: 390, height: 844 });
  const overflow = await page.evaluate(() => ({
    x: document.documentElement.scrollWidth > window.innerWidth,
    y: document.documentElement.scrollHeight > window.innerHeight,
  }));
  expect(overflow).toEqual({ x: false, y: false });
});

test('preloads the next card below the screen', async ({ page }) => {
  const next = page.getByTestId('runner-next');
  await expect(next).toHaveCount(1);
  expect((await next.boundingBox())?.y).toBe(844);
});

test('swipe up skips to the preloaded card', async ({ page }) => {
  const nextId = await page.getByTestId('runner-next').getAttribute('data-id');
  await touchSwipe(page, 700, 300);
  await expect(page.getByTestId('feed')).toHaveAttribute('data-index', '1');
  expect(await currentId(page)).toBe(nextId);
});

test('quick flick up also skips', async ({ page }) => {
  await touchSwipe(page, 600, 520, 3, 10);
  await expect(page.getByTestId('feed')).toHaveAttribute('data-index', '1');
});

test('small slow drag and downward swipe do not skip', async ({ page }) => {
  const before = await currentId(page);
  await touchSwipe(page, 600, 560, 10, 60);
  await touchSwipe(page, 300, 700);
  await expect(page.getByTestId('feed')).toHaveAttribute('data-index', '0');
  expect(await currentId(page)).toBe(before);
});

test('mouse drag works too, and the feed keeps going past the end', async ({ page }) => {
  for (let i = 0; i < 8; i++) {
    await page.mouse.move(195, 700);
    await page.mouse.down();
    await page.mouse.move(195, 250, { steps: 6 });
    await page.mouse.up();
  }
  await expect(page.getByTestId('feed')).toHaveAttribute('data-index', '8');
  await expect(page.getByTestId('runner-current')).toBeVisible();
});
