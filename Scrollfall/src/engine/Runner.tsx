import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Envelope } from '../schema/envelope';
import { INTRO_MS, RESULT_MS } from './phases';
import { getTemplate } from './registry';
import { createTimer } from './timer';

type Phase = 'intro' | 'play' | 'result';
type Result = { win: boolean; ms: number };

type Props = {
  challenge: Envelope;
  active: boolean;
  // `timedOut`: the clock ran out with no input, so it wasn't really played.
  onResolve: (win: boolean, ms: number, timedOut: boolean) => void;
  onDone: () => void;
};

function hueOf(id: string): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

// Prompt (INTRO_MS) -> play with timer bar -> result flash (RESULT_MS) -> onDone.
// An inactive runner sits in its intro, so the next card is ready before the swipe.
export function Runner({ challenge, active, onResolve, onDone }: Props) {
  const template = getTemplate(challenge.template);
  const timer = useMemo(() => createTimer(challenge.durationMs), [challenge]);
  const [phase, setPhase] = useState<Phase>('intro');
  const [result, setResult] = useState<Result | null>(null);
  const phaseRef = useRef<Phase>('intro');
  const callbacks = useRef({ onResolve, onDone });
  callbacks.current = { onResolve, onDone };

  const finish = useCallback(
    (win: boolean, ms: number, timedOut = false) => {
      if (phaseRef.current !== 'play') return;
      phaseRef.current = 'result';
      timer.stop();
      const clamped = Math.round(Math.min(Math.max(ms, 0), challenge.durationMs));
      setResult({ win, ms: clamped });
      setPhase('result');
      callbacks.current.onResolve(win, clamped, timedOut);
    },
    [timer, challenge.durationMs],
  );

  useEffect(() => {
    if (!active || phase !== 'intro') return;
    const t = setTimeout(() => {
      timer.start();
      phaseRef.current = 'play';
      setPhase('play');
    }, INTRO_MS);
    return () => clearTimeout(t);
  }, [active, phase, timer]);

  useEffect(() => {
    if (phase !== 'play') return;
    const t = setTimeout(() => finish(false, challenge.durationMs, true), challenge.durationMs - timer.elapsed());
    return () => clearTimeout(t);
  }, [phase, timer, finish, challenge.durationMs]);

  useEffect(() => {
    if (phase !== 'result') return;
    const t = setTimeout(() => callbacks.current.onDone(), RESULT_MS);
    return () => clearTimeout(t);
  }, [phase]);

  const hue = hueOf(challenge.id);
  const style = {
    '--duration': `${challenge.durationMs}ms`,
    background: `linear-gradient(165deg, hsl(${hue} 50% 26%), hsl(${(hue + 40) % 360} 55% 12%))`,
  } as CSSProperties;

  return (
    <section
      className={`runner phase-${phase}`}
      style={style}
      data-testid={active ? 'runner-current' : 'runner-next'}
      data-id={challenge.id}
      data-phase={phase}
      data-play-start={timer.startedAt() ?? undefined}
      data-result={result ? (result.win ? 'win' : 'lose') : undefined}
    >
      <header className="runner-top">
        <div className="timer-bar" role="presentation">
          <div className="timer-fill" />
        </div>
        <p className="runner-prompt">{challenge.prompt}</p>
      </header>

      <div className="runner-play" inert={phase !== 'play'}>
        {template ? (
          <template.Renderer params={challenge.params} timer={timer} onResult={finish} />
        ) : (
          <p>Unknown template: {challenge.template}</p>
        )}
      </div>

      {phase === 'intro' && (
        <div className="runner-intro">
          <h2>{challenge.prompt}</h2>
          <p className="runner-hint">Swipe up to skip</p>
        </div>
      )}

      {result && (
        <div className={`runner-result ${result.win ? 'win' : 'lose'}`} role="status">
          <strong>{result.win ? 'Nice!' : 'Missed'}</strong>
          <span>{(result.ms / 1000).toFixed(2)}s</span>
        </div>
      )}
    </section>
  );
}
