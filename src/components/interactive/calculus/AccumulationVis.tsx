import { useState, useMemo } from 'react';

interface AccumulationVisProps {
  width?: number;
  height?: number;
}

type VelocityProfile = {
  fn: (t: number) => number;
  label: string;
  description: string;
};

const PROFILES: Record<string, VelocityProfile> = {
  'constant': {
    fn: (t) => 3,
    label: 'v(t) = 3',
    description: 'Constant speed: distance grows linearly.',
  },
  'linear': {
    fn: (t) => t,
    label: 'v(t) = t',
    description: 'Linearly increasing speed: distance grows quadratically.',
  },
  'sine': {
    fn: (t) => 3 + 2 * Math.sin(t),
    label: 'v(t) = 3 + 2sin(t)',
    description: 'Oscillating speed: distance accumulates in bursts.',
  },
  'decelerate': {
    fn: (t) => 6 / (1 + t),
    label: 'v(t) = 6/(1+t)',
    description: 'Decelerating: area accumulates but more slowly.',
  },
};

export function AccumulationVis({
  width = 640,
  height = 360,
}: AccumulationVisProps) {
  const [profileKey, setProfileKey] = useState('constant');
  const [time, setTime] = useState(4);
  const profile = PROFILES[profileKey];

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const tMax = 8;
  const yMin = -1;
  const yMax = 8;

  const sx = (t: number) => padding.left + (t / tMax) * plotW;
  const sy = (y: number) => padding.top + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  const velocityPath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 200; i++) {
      const t = (i / 200) * tMax;
      const v = profile.fn(t);
      if (v < yMin - 1 || v > yMax + 1) continue;
      pts.push(`${i === 0 ? 'M' : 'L'}${sx(t).toFixed(1)},${sy(v).toFixed(1)}`);
    }
    return pts.join(' ');
  }, [profileKey, width]);

  // Compute area path (filled region from 0 to time)
  const areaPath = useMemo(() => {
    const pts: string[] = [`M${sx(0).toFixed(1)},${sy(0).toFixed(1)}`];
    for (let i = 0; i <= 100; i++) {
      const t = (i / 100) * time;
      const v = profile.fn(t);
      const clampedV = Math.max(yMin, Math.min(yMax, v));
      pts.push(`L${sx(t).toFixed(1)},${sy(clampedV).toFixed(1)}`);
    }
    pts.push(`L${sx(time).toFixed(1)},${sy(0).toFixed(1)}`);
    pts.push('Z');
    return pts.join(' ');
  }, [profileKey, time, width]);

  // Compute distance (accumulated area) numerically
  const distance = useMemo(() => {
    const steps = 200;
    const dt = time / steps;
    let sum = 0;
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) * dt;
      sum += profile.fn(t) * dt;
    }
    return sum;
  }, [profileKey, time]);

  const gridLines = useMemo(() => {
    const lines: JSX.Element[] = [];
    for (let t = 0; t <= tMax; t++) {
      const isAxis = t === 0;
      lines.push(
        <line key={`v${t}`} x1={sx(t)} y1={sy(yMin)} x2={sx(t)} y2={sy(yMax)} stroke={isAxis ? 'var(--color-ink-faint)' : 'var(--color-rule)'} strokeWidth={isAxis ? 1 : 0.5} />,
      );
    }
    for (let y = Math.ceil(yMin); y <= yMax; y++) {
      const isAxis = y === 0;
      lines.push(
        <line key={`h${y}`} x1={sx(0)} y1={sy(y)} x2={sx(tMax)} y2={sy(y)} stroke={isAxis ? 'var(--color-ink-faint)' : 'var(--color-rule)'} strokeWidth={isAxis ? 1 : 0.5} />,
      );
    }
    return lines;
  }, [width, height]);

  return (
    <div className="flex h-full w-full flex-col">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ background: 'var(--color-paper)' }}
      >
        {gridLines}

        {/* Filled area (accumulated distance) */}
        <path d={areaPath} fill="var(--color-vector-yellow)" opacity={0.3} />

        {/* Velocity curve */}
        <path d={velocityPath} fill="none" stroke="var(--color-vector-blue)" strokeWidth={2.5} />

        {/* Time cursor */}
        <line
          x1={sx(time)} y1={sy(yMin)}
          x2={sx(time)} y2={sy(yMax)}
          stroke="var(--color-accent)"
          strokeWidth={1.5}
          strokeDasharray="4,3"
        />

        {/* Distance label in the filled area */}
        <text
          x={sx(time / 2)}
          y={sy(distance / 2)}
          textAnchor="middle"
          className="text-[13px] font-bold"
          fill="var(--color-vector-yellow)"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          distance = {distance.toFixed(1)}
        </text>

        {/* Velocity label */}
        <text x={sx(time) + 6} y={sy(profile.fn(time))} className="text-[11px]" fill="var(--color-vector-blue)" style={{ fontFamily: 'var(--font-sans)' }}>
          v = {profile.fn(time).toFixed(1)}
        </text>
      </svg>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 border-t border-rule bg-paper-elevated px-4 py-3">
        <label className="flex items-center gap-2 font-sans text-xs text-ink-muted">
          time =
          <input
            type="range"
            min={0.1}
            max={tMax - 0.1}
            step={0.1}
            value={time}
            onChange={(e) => setTime(+e.target.value)}
            className="h-1 w-32 cursor-pointer accent-[var(--color-accent)]"
          />
          <span className="font-mono text-xs text-ink w-8">{time.toFixed(1)}</span>
        </label>

        <div className="flex gap-1">
          {Object.keys(PROFILES).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => { setProfileKey(k); setTime(4); }}
              className={`rounded-sm border px-2 py-0.5 font-mono text-[11px] transition-colors duration-fast ${
                k === profileKey
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-rule bg-paper-elevated text-ink-muted hover:bg-surface-1'
              }`}
            >
              {PROFILES[k].label}
            </button>
          ))}
        </div>

        <div className="ml-auto font-mono text-[11px] text-vector-yellow">
          total distance: {distance.toFixed(2)}
        </div>
      </div>

      <div className="border-t border-rule bg-surface-1 px-4 py-1 text-center font-sans text-[10px] text-ink-muted">
        {profile.description}
      </div>
    </div>
  );
}
