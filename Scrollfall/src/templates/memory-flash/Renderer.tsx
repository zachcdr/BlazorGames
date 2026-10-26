import { useEffect, useRef, useState } from 'react';
import type { RendererProps } from '../../engine/types';
import type { Params } from './definition';

type Stage = 'waiting' | 'flash' | 'recall';

// Nothing shows until play starts, so neither the intro nor the preloaded card gives the answer away.
export function Renderer({ params, timer, onResult }: RendererProps<Params>) {
  const [stage, setStage] = useState<Stage>('waiting');
  const [picked, setPicked] = useState<number | null>(null);
  const stageRef = useRef<Stage>('waiting');

  useEffect(() => {
    let frame = 0;
    const tick = () => {
      const next: Stage = !timer.started() ? 'waiting' : timer.elapsed() < params.flashMs ? 'flash' : 'recall';
      if (next !== stageRef.current) {
        stageRef.current = next;
        setStage(next);
      }
      if (next !== 'recall') frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [params.flashMs, timer]);

  const pick = (cell: number) => {
    if (stageRef.current !== 'recall' || picked !== null) return;
    setPicked(cell);
    onResult(cell === params.targetCell, timer.elapsed());
  };

  const cells = params.rows * params.cols;
  const decoys = new Map(params.decoys.map((d) => [d.cell, d.item]));
  const revealed = stage === 'flash' || picked !== null;

  return (
    <div className={`mf-grid stage-${stage}`} style={{ gridTemplateColumns: `repeat(${params.cols}, 1fr)` }}>
      {Array.from({ length: cells }, (_, i) => {
        const content = i === params.targetCell ? params.item : decoys.get(i);
        const state = picked === null ? '' : i === params.targetCell ? ' correct' : i === picked ? ' wrong' : '';
        return (
          <button key={i} type="button" className={`mf-cell${state}`} data-testid={`cell-${i}`} onClick={() => pick(i)}>
            {revealed ? content : ''}
          </button>
        );
      })}
    </div>
  );
}
