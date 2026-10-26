import { useEffect, useRef, useState } from 'react';
import type { RendererProps } from '../../engine/types';
import { flipStart, showEnd, type Params } from './definition';

// `lit` is the sequence index currently flipped during the show, or null between flips.
type Stage = { kind: 'waiting' } | { kind: 'show'; lit: number | null } | { kind: 'input' };

function stageAt(p: Params, started: boolean, ms: number): Stage {
  if (!started) return { kind: 'waiting' };
  if (ms >= showEnd(p)) return { kind: 'input' };
  const i = p.sequence.findIndex((_, k) => ms >= flipStart(p, k) && ms < flipStart(p, k) + p.showMs);
  return { kind: 'show', lit: i >= 0 ? i : null };
}

const sameStage = (a: Stage, b: Stage) => a.kind === b.kind && (a.kind !== 'show' || b.kind !== 'show' || a.lit === b.lit);

// Squares flip one at a time; then the player taps them back in the same order.
// Nothing flips until play starts, so the intro and the preloaded card give nothing away.
export function Renderer({ params, timer, onResult }: RendererProps<Params>) {
  const [stage, setStage] = useState<Stage>({ kind: 'waiting' });
  const [done, setDone] = useState(0);
  const [wrongCell, setWrongCell] = useState<number | null>(null);
  const stageRef = useRef<Stage>(stage);
  const finished = useRef(false);

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const next = stageAt(params, timer.started(), timer.elapsed());
      if (!sameStage(next, stageRef.current)) {
        stageRef.current = next;
        setStage(next);
      }
      if (next.kind !== 'input') frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [params, timer]);

  const tap = (cell: number) => {
    if (stageRef.current.kind !== 'input' || finished.current) return;
    if (cell !== params.sequence[done]) {
      finished.current = true;
      setWrongCell(cell);
      onResult(false, timer.elapsed());
      return;
    }
    const next = done + 1;
    setDone(next);
    if (next === params.sequence.length) {
      finished.current = true;
      onResult(true, timer.elapsed());
    }
  };

  const litCell = stage.kind === 'show' && stage.lit !== null ? params.sequence[stage.lit] : undefined;
  const order = new Map(params.sequence.slice(0, done).map((cell, i) => [cell, i + 1]));
  const expected = wrongCell !== null ? params.sequence[done] : undefined;

  return (
    <div className="sm-grid" style={{ gridTemplateColumns: `repeat(${params.cols}, 1fr)` }}>
      {Array.from({ length: params.rows * params.cols }, (_, cell) => {
        const state =
          cell === litCell ? ' lit' : order.has(cell) ? ' done' : cell === wrongCell ? ' wrong' : cell === expected ? ' missed' : '';
        return (
          <button key={cell} type="button" className={`sm-cell${state}`} data-testid={`cell-${cell}`} onClick={() => tap(cell)}>
            {order.get(cell) ?? ''}
          </button>
        );
      })}
    </div>
  );
}
