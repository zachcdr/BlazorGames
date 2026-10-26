import { useEffect, useRef, useState, type PointerEvent } from 'react';
import type { RendererProps } from '../../engine/types';
import { levelAt, releaseOutcome, type Params, type Release } from './definition';

type Hold = { id: number; startMs: number };

// Hold to fill, let go inside the band. The pad doesn't block the feed: if the thumb
// drifts into a swipe, the feed takes the pointer, this hold is cancelled, and the swipe skips.
export function Renderer({ params, timer, onResult }: RendererProps<Params>) {
  const fill = useRef<HTMLDivElement>(null);
  const hold = useRef<Hold | null>(null);
  const [outcome, setOutcome] = useState<Release | null>(null);
  const outcomeRef = useRef<Release | null>(null);

  const setLevel = (level: number) => {
    fill.current?.style.setProperty('height', `${Math.min(level, 100)}%`);
  };

  const finish = (result: Release, level: number) => {
    hold.current = null;
    outcomeRef.current = result;
    setOutcome(result);
    setLevel(level);
    onResult(result === 'hit', timer.elapsed());
  };

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const h = hold.current;
      if (h && outcomeRef.current === null) {
        const level = levelAt(params, timer.elapsed() - h.startMs);
        if (level > 100) finish('over', 100);
        else setLevel(level);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  });

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (outcomeRef.current || hold.current) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    hold.current = { id: e.pointerId, startMs: timer.elapsed() };
  };

  const onPointerUp = (e: PointerEvent<HTMLButtonElement>) => {
    const h = hold.current;
    if (!h || h.id !== e.pointerId || outcomeRef.current) return;
    const heldMs = timer.elapsed() - h.startMs;
    finish(releaseOutcome(params, heldMs), levelAt(params, heldMs));
  };

  // The feed took the pointer for a swipe (or the OS cancelled it): drop this hold, no result.
  const cancel = (e: PointerEvent<HTMLButtonElement>) => {
    if (hold.current?.id !== e.pointerId || outcomeRef.current) return;
    hold.current = null;
    setLevel(0);
  };

  return (
    <button
      type="button"
      className={`htf${outcome ? ` ${outcome === 'hit' ? 'hit' : outcome === 'over' ? 'over' : 'missed'}` : ''}`}
      data-testid="hold-pad"
      aria-label="Hold to fill, release on the line"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={cancel}
      onLostPointerCapture={cancel}
    >
      <span className="htf-item" aria-hidden="true">
        {params.item}
      </span>
      <span className="htf-tank">
        <span
          className="htf-band"
          style={{ bottom: `${params.targetFrom}%`, height: `${params.targetTo - params.targetFrom}%` }}
        />
        <span className="htf-fill" ref={fill} />
      </span>
      <span className="htf-cta">Hold, then let go on the band</span>
    </button>
  );
}
