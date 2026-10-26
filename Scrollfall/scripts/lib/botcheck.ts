import { chromium, type Browser } from '@playwright/test';
import { createServer } from 'vite';
import { configUrl, play, waitForResult, type Solved } from './bot';
import { mapLimit } from './claude';

export type BotVerdict = { ok: boolean; reason?: string };

const PHONE = { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true };
// A loss can be timing noise on a busy machine; a config only fails after this many losses.
const ATTEMPTS = 2;

async function playOnce(browser: Browser, base: string, candidate: Solved): Promise<BotVerdict> {
  const context = await browser.newContext(PHONE);
  try {
    const page = await context.newPage();
    await page.goto(new URL(configUrl(candidate.challenge), base).href);
    const runner = await page.waitForSelector('[data-testid="runner-current"]');
    if ((await runner.getAttribute('data-id')) !== candidate.challenge.id) {
      return { ok: false, reason: 'the app did not load the config' };
    }
    await play(page, candidate);
    const result = await waitForResult(page, candidate.challenge.durationMs + 5000);
    return result === 'win' ? { ok: true } : { ok: false, reason: 'bot lost' };
  } catch (error) {
    return { ok: false, reason: `bot error: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}` };
  } finally {
    await context.close();
  }
}

// Plays every candidate in a 390x844 phone viewport against a local dev server.
export async function botCheck(candidates: Solved[], concurrency = 4): Promise<Map<string, BotVerdict>> {
  const verdicts = new Map<string, BotVerdict>();
  if (candidates.length === 0) return verdicts;

  const server = await createServer({ logLevel: 'error', server: { port: 5199 } });
  await server.listen();
  const base = server.resolvedUrls?.local[0];
  const browser = await chromium.launch();
  try {
    if (!base) throw new Error('dev server has no local URL');
    await mapLimit(candidates, concurrency, async (candidate) => {
      let verdict: BotVerdict = { ok: false, reason: 'not played' };
      for (let attempt = 0; attempt < ATTEMPTS && !verdict.ok; attempt++) {
        verdict = await playOnce(browser, base, candidate);
      }
      verdicts.set(candidate.challenge.id, verdict);
    });
  } finally {
    await browser.close();
    await server.close();
  }
  return verdicts;
}
