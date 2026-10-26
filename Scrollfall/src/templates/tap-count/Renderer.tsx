import { useRef, useState } from 'react';
import type { RendererProps } from '../../engine/types';
import type { Params } from './definition';
import { arrangement } from './layout';

// The count stays hidden: the player keeps it in their head and taps Done.
// With distractors, everything reshuffles after each target tap.
export function Renderer({ params, timer, onResult }: RendererProps<Params>) {
  const [taps, setTaps] = useState(0);
  const finished = useRef(false);
  const items = [params.target, ...params.distractors];
  const order = params.distractors.length > 0 ? arrangement(items.length, taps) : [0];

  const finish = (win: boolean) => {
    if (finished.current) return;
    finished.current = true;
    onResult(win, timer.elapsed());
  };

  return (
    <div className="tc">
      <div className={`tc-field${order.length === 1 ? ' solo' : ''}`}>
        {order.map((item) => {
          const isTarget = item === 0;
          return (
            <button
              key={isTarget ? `target-${taps}` : `d${item}`}
              type="button"
              className={`tc-item${isTarget ? ' target' : ''}`}
              data-testid={isTarget ? 'tap-target' : `tap-distractor-${item - 1}`}
              onClick={() => (isTarget ? setTaps((t) => t + 1) : finish(false))}
            >
              {items[item]}
            </button>
          );
        })}
      </div>
      <button type="button" className="tc-done" data-testid="tap-done" onClick={() => finish(taps === params.targetCount)}>
        Done
      </button>
    </div>
  );
}
