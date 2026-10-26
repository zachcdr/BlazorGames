import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react';
import type { Point, RendererProps } from '../../engine/types';
import type { Params } from './definition';
import { isComplete, makePath, pointAt, prefix, traceSegment } from './trace';

// Landing within this many tolerances of the start (or where you left off) begins tracing.
const GRAB_RADIUS = 1.5;

function toPadPoint(e: PointerEvent<SVGSVGElement>): Point {
  const box = e.currentTarget.getBoundingClientRect();
  return [((e.clientX - box.left) / box.width) * 100, ((e.clientY - box.top) / box.height) * 100];
}

function polyline(points: readonly Point[]): string {
  return points.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');
}

export function Renderer({ params, timer, onResult }: RendererProps<Params>) {
  const path = useMemo(() => makePath(params.points), [params.points]);
  const guide = useRef<SVGGElement>(null);
  const finger = useRef<{ id: number; last: Point } | null>(null);
  const done = useRef(false);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);

  useEffect(() => {
    let frame = 0;
    const draw = () => {
      const opacity = timer.started() ? Math.max(0, 1 - timer.elapsed() / params.fadeMs) : 1;
      guide.current?.setAttribute('opacity', opacity.toFixed(3));
      if (opacity > 0) frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [params.fadeMs, timer]);

  const finish = (win: boolean) => {
    if (done.current) return;
    done.current = true;
    finger.current = null;
    onResult(win, timer.elapsed());
  };

  // Only a touch near the start or the current progress point is a trace; anywhere else,
  // the event bubbles up to the feed so swiping to skip still works.
  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (done.current || finger.current) return;
    const p = toPadPoint(e);
    const anchor = pointAt(path, progressRef.current);
    if (Math.hypot(p[0] - anchor[0], p[1] - anchor[1]) > params.tolerance * GRAB_RADIUS) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    finger.current = { id: e.pointerId, last: anchor };
  };

  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const f = finger.current;
    if (!f || f.id !== e.pointerId) return;
    const p = toPadPoint(e);
    const result = traceSegment(path, progressRef.current, f.last, p, params.tolerance);
    f.last = p;
    if (result.off) return finish(false);
    if (result.progress !== progressRef.current) {
      progressRef.current = result.progress;
      setProgress(result.progress);
    }
    if (isComplete(path, result.progress, params.tolerance)) finish(true);
  };

  const onPointerEnd = (e: PointerEvent<SVGSVGElement>) => {
    if (finger.current?.id === e.pointerId) finger.current = null;
  };

  const start = path.points[0] ?? [50, 50];
  const end = path.points[path.points.length - 1] ?? [50, 50];
  const anchor = pointAt(path, progress);

  return (
    <svg
      className="trace-pad"
      data-testid="trace-pad"
      viewBox="0 0 100 100"
      role="img"
      aria-label="Trace the shape from the green dot"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerEnd}
      onPointerCancel={onPointerEnd}
    >
      <g ref={guide}>
        <polyline points={polyline(path.points)} className="trace-band" strokeWidth={params.tolerance * 2} />
        <polyline points={polyline(path.points)} className="trace-guide" />
        <circle cx={end[0]} cy={end[1]} r="3" className="trace-end" />
      </g>
      {progress > 0 && <polyline points={polyline(prefix(path, progress))} className="trace-done" />}
      <circle cx={start[0]} cy={start[1]} r="4.5" className="trace-start" />
      <circle cx={anchor[0]} cy={anchor[1]} r="2.5" className="trace-anchor" />
    </svg>
  );
}
