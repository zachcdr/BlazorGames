import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { useDailyStore } from './daily/dailyStore';
import { LIBRARY } from './engine/library';
import { checkChallenge } from './engine/validate';
import { useFeedStore } from './feed/feedStore';
import type { Envelope } from './schema/envelope';
import { useSessionStore } from './session/sessionStore';
import './index.css';
import './templates/templates.css';

// `?challenge=<id>` puts a library challenge first. `?config=<json>` puts any valid config
// first, even one not in the library; scripts/validate.ts uses it to bot-test candidates.
// Either skips the home card. `?sleepAfter=<seconds>` shortens the 15-minute stopping point for testing.
function urlChallenge(params: URLSearchParams): Envelope | undefined {
  const raw = params.get('config');
  if (!raw) return undefined;
  try {
    const result = checkChallenge(JSON.parse(raw));
    if (result.ok) return result.challenge;
    console.warn('Ignoring ?config:', result.errors);
  } catch {
    console.warn('Ignoring ?config: not JSON');
  }
  return undefined;
}

const params = new URLSearchParams(window.location.search);
const sleepAfter = Number(params.get('sleepAfter'));
if (sleepAfter > 0) useSessionStore.getState().configure(sleepAfter * 1000);

// Opening or returning to the app may start a new session (and wake the creature) or a new day.
const wake = () => {
  useSessionStore.getState().open();
  useDailyStore.getState().ensureToday();
};
wake();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') wake();
});

const extra = urlChallenge(params);
const library = extra ? [extra, ...LIBRARY.challenges.filter((c) => c.id !== extra.id)] : LIBRARY.challenges;
const firstId = extra?.id ?? params.get('challenge') ?? undefined;
useFeedStore.getState().start(library, { firstId, home: firstId === undefined });

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
