import { useState } from 'react';
import type { RendererProps } from '../../engine/types';
import type { Params } from './definition';

type Side = Params['answer'];
const SIDES: readonly Side[] = ['left', 'right'];

export function Renderer({ params, timer, onResult }: RendererProps<Params>) {
  const [picked, setPicked] = useState<Side | null>(null);

  const pick = (side: Side) => {
    if (picked) return;
    setPicked(side);
    onResult(side === params.answer, timer.elapsed());
  };

  return (
    <div className="wih">
      <div className="wih-choices">
        {SIDES.map((side) => {
          const thing = params[side];
          const state = picked === null ? '' : side === params.answer ? ' correct' : side === picked ? ' wrong' : '';
          return (
            <button key={side} type="button" className={`wih-choice${state}`} data-testid={`choice-${side}`} onClick={() => pick(side)}>
              <span className="wih-emoji">{thing.emoji}</span>
              <span className="wih-name">{thing.name}</span>
            </button>
          );
        })}
      </div>
      <p className="wih-explanation">{picked ? params.explanation : ''}</p>
    </div>
  );
}
