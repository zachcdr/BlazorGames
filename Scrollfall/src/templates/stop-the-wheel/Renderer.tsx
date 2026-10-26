import { useEffect, useRef } from 'react';
import type { RendererProps } from '../../engine/types';
import type { Params } from './definition';
import { segmentAt, wheelAngle } from './wheel';

const R = 100;

function point(deg: number, r: number): string {
  const rad = (deg * Math.PI) / 180;
  return `${(r * Math.sin(rad)).toFixed(2)},${(-r * Math.cos(rad)).toFixed(2)}`;
}

function slicePath(i: number, n: number): string {
  const from = (i * 360) / n;
  const to = ((i + 1) * 360) / n;
  const large = to - from > 180 ? 1 : 0;
  return `M0,0 L${point(from, R)} A${R},${R} 0 ${large} 1 ${point(to, R)} Z`;
}

export function Renderer({ params, timer, onResult }: RendererProps<Params>) {
  const wheel = useRef<SVGGElement>(null);
  const pressedAt = useRef<number | null>(null);
  const stoppedAt = useRef<number | null>(null);
  const n = params.segments.length;

  useEffect(() => {
    let frame = 0;
    const draw = () => {
      const ms = stoppedAt.current ?? timer.elapsed();
      wheel.current?.setAttribute('transform', `rotate(${wheelAngle(params, ms).toFixed(2)})`);
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [params, timer]);

  // Timing comes from the moment the finger lands; the click confirms it wasn't a swipe.
  const stop = () => {
    if (stoppedAt.current !== null) return;
    const ms = pressedAt.current ?? timer.elapsed();
    stoppedAt.current = ms;
    onResult(segmentAt(params, ms) === params.targetSegment, ms);
  };

  return (
    <button
      type="button"
      className="wheel-stop"
      data-testid="wheel-stop"
      aria-label="Stop the wheel"
      onPointerDown={() => (pressedAt.current = timer.elapsed())}
      onClick={stop}
    >
      <svg className="wheel" viewBox="-115 -125 230 240" aria-hidden="true">
        <g ref={wheel}>
          {params.segments.map((s, i) => (
            <path key={i} d={slicePath(i, n)} fill={s.color} stroke="#0e0e14" strokeWidth="1.5" />
          ))}
          {params.segments.map((s, i) =>
            s.label ? (
              <text key={i} transform={`translate(${point(((i + 0.5) * 360) / n, R * 0.66)})`} className="wheel-label">
                {s.label}
              </text>
            ) : null,
          )}
          <path d={slicePath(params.targetSegment, n)} className="wheel-target" />
        </g>
        <circle r="12" className="wheel-hub" />
        <polygon points="0,-88 -11,-112 11,-112" className="wheel-pointer" />
      </svg>
      <span className="wheel-cta">Tap to stop</span>
    </button>
  );
}
