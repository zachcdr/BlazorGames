import type { RendererProps } from '../../engine/types';
import { ChoiceGrid } from '../shared/ChoiceGrid';
import type { Params } from './definition';

function columnsFor(count: number): number {
  if (count <= 3) return count;
  return count === 4 ? 2 : 3;
}

export function Renderer({ params, timer, onResult }: RendererProps<Params>) {
  return (
    <ChoiceGrid
      className="ooo-grid"
      options={params.items}
      answerIndex={params.answerIndex}
      columns={columnsFor(params.items.length)}
      testIdPrefix="item"
      onPick={(i) => onResult(i === params.answerIndex, timer.elapsed())}
    />
  );
}
