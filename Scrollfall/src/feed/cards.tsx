import { useState } from 'react';
import { lookOf, STAGE_NAMES, TRAIT_NAMES, WINS_PER_STAGE } from '../creature/creature';
import { useCreatureStore } from '../creature/creatureStore';
import { CreatureView } from '../creature/CreatureView';
import { DAILY_LENGTH, dailyScore, shareText } from '../daily/daily';
import { firstOpenPosition, useDailyStore } from '../daily/dailyStore';
import { copyText } from '../daily/share';
import { useSessionStore } from '../session/sessionStore';
import { RESTED_BONUS } from '../session/session';
import { useFeedStore } from './feedStore';

function useLook() {
  return lookOf(useCreatureStore((s) => s.creature));
}

const useAsleep = () => useSessionStore((s) => s.session?.asleep ?? false);

function DailyButton() {
  const results = useDailyStore((s) => s.results);
  const startDaily = useFeedStore((s) => s.startDaily);
  const played = results.filter((r) => r !== null).length;
  const label =
    firstOpenPosition(results) < 0
      ? `Today: ${dailyScore(results)}/${DAILY_LENGTH} · See result`
      : played > 0
        ? `Continue today's run · ${played}/${DAILY_LENGTH}`
        : `Today's run · ${DAILY_LENGTH} challenges`;
  return (
    <button type="button" className="card-button" data-testid="daily-start" onClick={startDaily}>
      {label}
    </button>
  );
}

export function HomeCard() {
  const look = useLook();
  const asleep = useAsleep();
  const bonus = useSessionStore((s) => s.lastBonus);
  const traits = [look.primary, look.secondary].flatMap((t) => (t ? [TRAIT_NAMES[t]] : []));
  const nextName = STAGE_NAMES[look.stage + 1];
  const progress = nextName ? `${look.growth % WINS_PER_STAGE}/${WINS_PER_STAGE} wins to ${nextName}` : 'Fully grown!';

  return (
    <section className="info-card home-card" data-testid="home-card">
      <p className="info-kicker">Scrollfall</p>
      {bonus > 0 && (
        <p className="info-banner" data-testid="rested-bonus">
          Welcome back! Your creature is well rested: +{bonus} growth
        </p>
      )}
      <CreatureView look={look} asleep={asleep} />
      <h2 className="info-title">{look.stageName}</h2>
      <p className="info-text">{traits.length > 0 ? traits.join(' · ') : 'Play a few challenges to shape your creature'}</p>
      <div className="growth" aria-label={progress}>
        <div className="growth-fill" style={{ width: `${look.toNextStage * 100}%` }} />
      </div>
      <p className="info-small" data-testid="growth-text">
        {progress}
      </p>
      {asleep && <p className="info-small">Asleep. Come back in a couple of hours for a rested bonus.</p>}
      <DailyButton />
      <p className="info-hint">Swipe up to play</p>
    </section>
  );
}

export function SleepCard() {
  const look = useLook();
  return (
    <section className="info-card sleep-card" data-testid="sleep-card">
      <CreatureView look={look} asleep />
      <h2 className="info-title">Time for a break</h2>
      <p className="info-text">You've been playing a while, so your creature has curled up for a nap.</p>
      <p className="info-text">Come back in a couple of hours and it'll wake up rested (+{RESTED_BONUS} growth).</p>
      <p className="info-small">You can keep playing, but your creature won't grow while it sleeps.</p>
      <p className="info-hint">Swipe up to keep playing</p>
    </section>
  );
}

export function DailySummaryCard() {
  const { date, results } = useDailyStore();
  const [copied, setCopied] = useState<boolean | null>(null);
  const text = shareText(date, results);
  const [, ...rows] = text.split('\n');

  return (
    <section className="info-card daily-card" data-testid="daily-summary">
      <p className="info-kicker">Daily run · {date}</p>
      <h2 className="daily-score" data-testid="daily-score">
        {dailyScore(results)}/{results.length}
      </h2>
      <pre className="daily-grid" data-testid="daily-grid">
        {rows.join('\n')}
      </pre>
      <button type="button" className="card-button" data-testid="daily-share" onClick={() => void copyText(text).then(setCopied)}>
        {copied ? 'Copied!' : 'Share result'}
      </button>
      {copied === false && <p className="info-small">Couldn't copy. Long-press the squares to copy them.</p>}
      <p className="info-small">A new run every day, the same for everyone.</p>
      <p className="info-hint">Swipe up to keep playing</p>
    </section>
  );
}
