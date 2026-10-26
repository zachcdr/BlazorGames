import { useState, type ReactNode } from 'react';

type Props = {
  options: readonly ReactNode[];
  answerIndex: number;
  columns: number;
  testIdPrefix: string;
  className?: string;
  onPick: (index: number) => void;
};

// Tap one of N tiles. After the pick, the right tile gets a green ring and a wrong pick a red one.
export function ChoiceGrid({ options, answerIndex, columns, testIdPrefix, className = '', onPick }: Props) {
  const [picked, setPicked] = useState<number | null>(null);

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    onPick(i);
  };

  return (
    <div className={`choice-grid ${className}`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {options.map((option, i) => {
        const state = picked === null ? '' : i === answerIndex ? ' correct' : i === picked ? ' wrong' : '';
        return (
          <button key={i} type="button" className={`choice${state}`} data-testid={`${testIdPrefix}-${i}`} onClick={() => pick(i)}>
            {option}
          </button>
        );
      })}
    </div>
  );
}
