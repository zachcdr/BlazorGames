import type { Tag } from '../schema/envelope';
import type { Look } from './creature';

const COLORS: Record<Tag, string> = {
  reflex: '#f76b15',
  puzzle: '#8e4ec6',
  perception: '#12a594',
  dexterity: '#30a46c',
  knowledge: '#3e63dd',
  memory: '#d6409f',
};
const PLAIN = '#9aa0b5';

type Props = { look: Look; asleep?: boolean; size?: number };

// Simple shapes for now; real art comes later. The primary tag's trait shows at full
// strength, the secondary's at half, and later stages add a few extras.
export function CreatureView({ look, asleep = false, size = 220 }: Props) {
  const level = (tag: Tag) => (look.primary === tag ? 2 : look.secondary === tag ? 1 : 0);
  const color = look.primary ? COLORS[look.primary] : PLAIN;
  const scale = 0.72 + 0.07 * Math.min(look.stage, 4);

  const sleek = level('reflex');
  const bodyRx = 50 - sleek * 7;
  const bodyRy = 42 + sleek * 6;
  const headR = 30 + level('puzzle') * 7;
  const headY = -22 - level('puzzle') * 4;
  const eyeR = 6 + level('perception') * 2.5;
  const eyeX = headR * 0.4;
  const earSize = level('memory');
  const armLength = 18 + level('dexterity') * 16;
  const glasses = level('knowledge') > 0;

  return (
    <svg
      className="creature"
      viewBox="-110 -110 220 220"
      width={size}
      height={size}
      role="img"
      aria-label={`Your creature, a ${look.stageName.toLowerCase()}${asleep ? ', asleep' : ''}`}
      data-testid="creature"
      data-primary={look.primary ?? 'none'}
      data-secondary={look.secondary ?? 'none'}
      data-stage={look.stage}
      data-asleep={asleep}
    >
      <g transform={`scale(${scale})`}>
        {sleek > 0 && (
          <g stroke={color} strokeWidth="4" strokeLinecap="round" opacity="0.6">
            {[-10, 10, 30].map((y, i) => (
              <line key={y} x1={-bodyRx - 12 - i * 4} y1={40 + y} x2={-bodyRx - 30 - sleek * 12} y2={40 + y} />
            ))}
          </g>
        )}
        {look.stage >= 3 && <path d={`M${bodyRx - 8},70 q40,10 35,-30`} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" />}
        <g stroke={color} strokeWidth="9" strokeLinecap="round">
          <line x1={-bodyRx + 6} y1="35" x2={-bodyRx - armLength + 6} y2={35 + armLength * 0.6} />
          <line x1={bodyRx - 6} y1="35" x2={bodyRx + armLength - 6} y2={35 + armLength * 0.6} />
        </g>
        <ellipse cx="0" cy="45" rx={bodyRx} ry={bodyRy} fill={color} />
        <ellipse cx="0" cy="55" rx={bodyRx * 0.55} ry={bodyRy * 0.5} fill="#fff" opacity="0.18" />
        {earSize > 0 && (
          <g fill={color} stroke="#0e0e14" strokeOpacity="0.15" strokeWidth="2">
            <ellipse cx={-headR - 6 * earSize} cy={headY} rx={10 + 8 * earSize} ry={16 + 10 * earSize} />
            <ellipse cx={headR + 6 * earSize} cy={headY} rx={10 + 8 * earSize} ry={16 + 10 * earSize} />
          </g>
        )}
        {look.stage >= 1 && look.stage < 4 && (
          <g stroke={color} strokeWidth="4" strokeLinecap="round">
            <line x1="0" y1={headY - headR + 2} x2="0" y2={headY - headR - 18} />
            <circle cx="0" cy={headY - headR - 22} r="6" fill="#ffc53d" stroke="none" />
          </g>
        )}
        <circle cx="0" cy={headY} r={headR} fill={color} />
        {look.stage >= 4 && (
          <path d={`M-18,${headY - headR + 4} l6,-16 l12,10 l12,-10 l6,16 z`} fill="#ffc53d" />
        )}
        {asleep ? (
          <g stroke="#0e0e14" strokeWidth="3" strokeLinecap="round" fill="none">
            <path d={`M${-eyeX - eyeR},${headY} q${eyeR},${eyeR} ${eyeR * 2},0`} />
            <path d={`M${eyeX - eyeR},${headY} q${eyeR},${eyeR} ${eyeR * 2},0`} />
          </g>
        ) : (
          <g>
            <circle cx={-eyeX} cy={headY} r={eyeR} fill="#fff" />
            <circle cx={eyeX} cy={headY} r={eyeR} fill="#fff" />
            <circle cx={-eyeX + 1} cy={headY + 1} r={eyeR * 0.5} fill="#0e0e14" />
            <circle cx={eyeX + 1} cy={headY + 1} r={eyeR * 0.5} fill="#0e0e14" />
          </g>
        )}
        {glasses && (
          <g fill="none" stroke="#0e0e14" strokeWidth="2.5">
            <circle cx={-eyeX} cy={headY} r={eyeR + 4} />
            <circle cx={eyeX} cy={headY} r={eyeR + 4} />
            <line x1={-eyeX + eyeR + 4} y1={headY} x2={eyeX - eyeR - 4} y2={headY} />
          </g>
        )}
        {look.stage >= 2 && (
          <g fill="#ff8fa3" opacity="0.6">
            <circle cx={-eyeX - 4} cy={headY + eyeR + 8} r="5" />
            <circle cx={eyeX + 4} cy={headY + eyeR + 8} r="5" />
          </g>
        )}
        {asleep ? (
          <circle cx="0" cy={headY + headR * 0.5} r="4" fill="#0e0e14" />
        ) : (
          <path d={`M-9,${headY + headR * 0.42} q9,9 18,0`} stroke="#0e0e14" strokeWidth="3" fill="none" strokeLinecap="round" />
        )}
      </g>
      {asleep && (
        <text x="48" y="-60" className="creature-zzz">
          z<tspan dx="4" dy="-10">z</tspan>
          <tspan dx="4" dy="-10">Z</tspan>
        </text>
      )}
    </svg>
  );
}
