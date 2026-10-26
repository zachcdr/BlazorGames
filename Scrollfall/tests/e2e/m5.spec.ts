import { expect, test, type Browser, type Page } from '@playwright/test';
import { current, loadChallenges, play } from './bot';

const solved = loadChallenges();
const byId = (id: string) => {
  const s = solved.find((x) => x.challenge.id === id);
  if (!s) throw new Error(`missing ${id}`);
  return s;
};

const slot = (page: Page) => page.getByTestId('slot-current');
const feedIndex = (page: Page) => page.getByTestId('feed').getAttribute('data-index');

async function swipeUp(page: Page) {
  const before = await feedIndex(page);
  await page.mouse.move(195, 700);
  await page.mouse.down();
  await page.mouse.move(195, 250, { steps: 6 });
  await page.mouse.up();
  await expect(page.getByTestId('feed')).not.toHaveAttribute('data-index', before ?? '');
}

const stored = (page: Page, key: string) => page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? 'null'), key);

test.describe('home card and creature', () => {
  test('the feed opens on the creature card; swiping up starts play', async ({ page }) => {
    await page.goto('/');
    await expect(slot(page)).toHaveAttribute('data-kind', 'home');
    await expect(page.getByTestId('creature').first()).toHaveAttribute('data-primary', 'none');
    await swipeUp(page);
    await expect(slot(page)).toHaveAttribute('data-kind', 'challenge');
  });

  async function creatureAfter(browser: Browser, id: string) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await context.newPage();
    for (let i = 0; i < 3; i++) {
      await page.goto(`/?challenge=${id}`);
      await play(page, byId(id));
      await expect(current(page)).toHaveAttribute('data-result', 'win');
    }
    await page.goto('/');
    const creature = page.getByTestId('home-card').getByTestId('creature');
    const look = { primary: await creature.getAttribute('data-primary'), image: await creature.screenshot() };
    await context.close();
    return look;
  }

  test('the creature changes visibly with play style', async ({ browser }) => {
    const brainy = await creatureAfter(browser, 'quick-math_0001');
    const speedy = await creatureAfter(browser, 'hold-to-fill_0001');
    expect(brainy.primary).toBe('puzzle');
    expect(speedy.primary).toBe('reflex');
    expect(brainy.image.equals(speedy.image)).toBe(false);
  });
});

test.describe('daily run', () => {
  async function runToday(browser: Browser): Promise<{ ids: string[]; share: string }> {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const page = await context.newPage();
    await page.clock.setFixedTime(new Date('2026-10-21T10:00:00'));
    await page.goto('/');
    await page.getByTestId('daily-start').click();
    const ids: string[] = [];
    for (let i = 0; i < 20; i++) {
      await expect(page.getByTestId('slot-current').getByTestId('daily-badge')).toHaveText(`Daily ${i + 1}/20`);
      ids.push((await current(page).getAttribute('data-id')) ?? '');
      await swipeUp(page);
    }
    await expect(slot(page)).toHaveAttribute('data-kind', 'daily-summary');
    await expect(page.getByTestId('daily-score')).toHaveText('0/20');
    await page.getByTestId('daily-share').click();
    await expect(page.getByTestId('daily-share')).toHaveText('Copied!');
    // The OS clipboard may turn \n into \r\n (Windows does); the app copies \n.
    const share = (await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, '\n');
    await context.close();
    return { ids, share };
  }

  test('two browsers on the same date get the same 20 challenges and share text', async ({ browser }) => {
    const [a, b] = [await runToday(browser), await runToday(browser)];
    expect(new Set(a.ids).size).toBe(20);
    expect(b.ids).toEqual(a.ids);
    expect(a.share).toBe(['Scrollfall 2026-10-21 0/20', ...Array.from({ length: 4 }, () => '🟥'.repeat(5))].join('\n'));
    expect(b.share).toBe(a.share);
  });

  test('a played position counts, and the home card offers to continue', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-10-21T10:00:00'));
    await page.goto('/');
    await page.getByTestId('daily-start').click();
    await swipeUp(page);
    await page.goto('/');
    await expect(page.getByTestId('daily-start')).toHaveText("Continue today's run · 1/20");
    const progress = await stored(page, 'scrollfall.daily.v1');
    expect(progress.date).toBe('2026-10-21');
    expect(progress.results[0]).toBe('skip');
  });
});

test.describe('stopping point', () => {
  test('the sleep card appears once active time passes the limit, and play after it does not grow the creature', async ({ page }) => {
    await page.goto('/?sleepAfter=3');
    await swipeUp(page);
    for (let i = 0; i < 12 && (await slot(page).getAttribute('data-kind')) !== 'sleep'; i++) {
      await page.waitForTimeout(900);
      await swipeUp(page);
    }
    await expect(slot(page)).toHaveAttribute('data-kind', 'sleep');
    await expect(page.getByTestId('sleep-card').getByTestId('creature')).toHaveAttribute('data-asleep', 'true');
    expect((await stored(page, 'scrollfall.session.v1')).asleep).toBe(true);

    // Keep playing past the card: allowed, but the creature doesn't grow.
    const before = await stored(page, 'scrollfall.creature.v1');
    await page.goto('/?challenge=hold-to-fill_0001&sleepAfter=3');
    await play(page, byId('hold-to-fill_0001'));
    await expect(current(page)).toHaveAttribute('data-result', 'win');
    expect(await stored(page, 'scrollfall.creature.v1')).toEqual(before);
  });

  test('coming back after 2+ hours wakes the creature with a rested bonus', async ({ page }) => {
    const t0 = new Date('2026-10-21T09:00:00').getTime();
    await page.clock.setFixedTime(t0);
    await page.goto('/?challenge=hold-to-fill_0001&sleepAfter=1');
    await play(page, byId('hold-to-fill_0001'));
    await expect(current(page)).toHaveAttribute('data-result', 'win');
    expect((await stored(page, 'scrollfall.session.v1')).asleep).toBe(true);

    await page.clock.setFixedTime(t0 + 3 * 60 * 60 * 1000);
    await page.goto('/');
    await expect(page.getByTestId('rested-bonus')).toContainText('+5 growth');
    await expect(page.getByTestId('home-card').getByTestId('creature')).toHaveAttribute('data-asleep', 'false');
    expect((await stored(page, 'scrollfall.creature.v1')).bonus).toBe(5);
  });
});
