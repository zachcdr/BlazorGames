import { useRef, useState, type PointerEvent } from 'react';
import { CAPTURE_DISTANCE_PX, dragOffset, isSkipSwipe } from './swipe';

type Handlers = {
  onPointerDown: (e: PointerEvent<HTMLElement>) => void;
  onPointerMove: (e: PointerEvent<HTMLElement>) => void;
  onPointerUp: (e: PointerEvent<HTMLElement>) => void;
  onPointerCancel: (e: PointerEvent<HTMLElement>) => void;
};

type Drag = { y: number; t: number; id: number; captured: boolean };

// The feed only takes the pointer once it moves, so taps still reach the
// challenge underneath, and a drag never lands as a click on a template button.
export function useSwipe(onSkip: () => void): { offset: number; dragging: boolean; handlers: Handlers } {
  const drag = useRef<Drag | null>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  const end = (e: PointerEvent<HTMLElement>, cancelled: boolean) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    setDragging(false);
    setOffset(0);
    if (!cancelled && d.captured && isSkipSwipe({ dy: e.clientY - d.y, ms: e.timeStamp - d.t }, window.innerHeight)) {
      onSkip();
    }
  };

  return {
    offset,
    dragging,
    handlers: {
      onPointerDown: (e) => {
        if (drag.current) return;
        drag.current = { y: e.clientY, t: e.timeStamp, id: e.pointerId, captured: false };
      },
      onPointerMove: (e) => {
        const d = drag.current;
        if (!d || d.id !== e.pointerId) return;
        const dy = e.clientY - d.y;
        if (!d.captured) {
          if (Math.abs(dy) < CAPTURE_DISTANCE_PX) return;
          d.captured = true;
          setDragging(true);
          e.currentTarget.setPointerCapture(e.pointerId);
        }
        setOffset(dragOffset(dy));
      },
      onPointerUp: (e) => end(e, false),
      onPointerCancel: (e) => end(e, true),
    },
  };
}
