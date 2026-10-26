import { expect, type Page } from '@playwright/test';
import { waitForPlay as waitForPlayPhase } from '../../scripts/lib/bot';

export { dragThrough, play, tapAt, type Solved } from '../../scripts/lib/bot';
export { loadSolved as loadChallenges } from '../../scripts/lib/content';

export const current = (page: Page) => page.getByTestId('runner-current');

export async function waitForPlay(page: Page): Promise<number> {
  await expect(current(page)).toHaveAttribute('data-phase', 'play');
  return waitForPlayPhase(page);
}
