import { DAILY_LENGTH } from '../daily/daily';
import { Runner } from '../engine/Runner';
import { DailySummaryCard, HomeCard, SleepCard } from './cards';
import { useFeedStore, type FeedCard } from './feedStore';
import { useSwipe } from './useSwipe';

function CardBody({ card, current }: { card: FeedCard; current: boolean }) {
  const { resolve, advance } = useFeedStore();
  switch (card.kind) {
    case 'challenge':
      return (
        <>
          <Runner challenge={card.challenge} active={current} onResolve={resolve} onDone={advance} />
          {card.daily !== undefined && (
            <p className="daily-badge" data-testid="daily-badge">
              Daily {card.daily + 1}/{DAILY_LENGTH}
            </p>
          )}
        </>
      );
    case 'home':
      return <HomeCard />;
    case 'sleep':
      return <SleepCard />;
    case 'daily-summary':
      return <DailySummaryCard />;
  }
}

export function Feed() {
  const { cards, index, skip } = useFeedStore();
  const { offset, dragging, handlers } = useSwipe(skip);

  if (!cards[index]) return <main className="feed empty">No challenges yet</main>;

  // Slots are keyed by feed position, so the preloaded card is reused, not remounted, when it becomes current.
  return (
    <main className="feed" data-testid="feed" data-index={index} {...handlers}>
      {[index, index + 1].map((i) => {
        const card = cards[i];
        if (!card) return null;
        const current = i === index;
        const transform = current ? `translateY(${offset}px)` : `translateY(calc(100% + ${Math.min(offset, 0)}px))`;
        return (
          <div
            key={i}
            className={`slot${dragging ? '' : ' settle'}`}
            style={{ transform }}
            data-testid={current ? 'slot-current' : 'slot-next'}
            data-kind={card.kind}
          >
            <CardBody card={card} current={current} />
          </div>
        );
      })}
    </main>
  );
}
