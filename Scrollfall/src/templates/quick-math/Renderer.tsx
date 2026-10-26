import type { RendererProps } from '../../engine/types';
import { ChoiceGrid } from '../shared/ChoiceGrid';
import { answerIndex, type Params } from './definition';

export function Renderer({ params, timer, onResult }: RendererProps<Params>) {
  const answer = answerIndex(params);
  return (
    <div className="qm">
      <p className="qm-question" data-testid="math-question">
        {params.a} {params.op} {params.b} = ?
      </p>
      <ChoiceGrid
        options={params.options}
        answerIndex={answer}
        columns={2}
        testIdPrefix="option"
        onPick={(i) => onResult(i === answer, timer.elapsed())}
      />
    </div>
  );
}
