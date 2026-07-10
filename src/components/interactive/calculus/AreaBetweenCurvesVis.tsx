import { useState, useMemo } from 'react';

interface AreaBetweenCurvesVisProps {
  width?: number;
  height?: number;
}

type CurvePair = {
  upper: { fn: (x: number) => number; label: string };
  lower: { fn: (x: number) => number; label: string };
  defaultA: number;
  defaultB: number;
};

const PAIRS: Record<string, CurvePair> = {
  'sin vs cos': {
    upper: { fn: (x) => Math.sin(x), label: 'y = sin(x)' },
    lower: { fn: (x) => Math.cos(x), label: 'y = cos(x)' },
    defaultA: 0.52,
    defaultB: 5.76,
  },
  'x² vs x': {
    upper: { fn: (x) => x, label: 'y = x' },
    lower: { fn: (x) => x * x, label: 'y = x²' },
    defaultA: 0,
    defaultB: 1,
  },
  'eˣ vs x': {
    upper: { fn: (x) => Math.exp(x), label: 'y = eˣ' },
    lower: { fn: (x) => x, label: 'y = x' },
    defaultA: -1,
    defaultB: 1,
  },
};

export function AreaBetweenCurvesVis({
  width = 640,
  height = 400,
}: AreaBetweenCurvesVisProps) {
  const [pairKey, setPairKey] = useState('sin vs cos');
  const [a, setA] = useState(PAIRS[pairKey].defaultA);
  const [b, setB] = useState(PAIRS[pairKey].defaultB);
  const pair = PAIRS[pairKey];

  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const xMin = -1;
  const xMax = 7;
  const yMin = -2;
  const yMax = 4;

  const sx = (x: number) => padding.left + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y: number) => padding.top + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  const buildPath = (fn: (x: number) => number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 200; i++) {
      const x = xMin + (i / 200) * (xMax - xMin);
      const y = fn(x);
      if (y < yMin - 1 || y > yMax + 1) continue;
      pts.push(`${i === 0 || pts.length === 0 ? 'M' : 'L'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`);
    }
    return pts.join(' ');
  };

  const upperPath = useMemo(() => buildPath(pair.upper.fn), [pairKey]);
  const lowerPath = useMemo(() => buildPath(pair.lower.fn), [pairKey]);

  // Shaded area between curves
  const areaPath = useMemo(() => {
    const pts: string[] = [];
    // Trace upper curve from a to b
    for (let i = 0; i <= 100; i++) {
      const x = a + (i / 100) * (b - a);
      const y = pair.upper.fn(x);
      const cy = Math.max(yMin, Math.min(yMax, y));
      pts.push(`${i === 0 ? 'M' : 'L'}${sx(x).toFixed(1)},${sy(cy).toFixed(1)}`);
    }
    // Trace lower curve from b to a (reverse)
    for (let i = 100; i >= 0; i--) {
      const x = a + (i / 100) * (b - a);
      const y = pair.lower.fn(x);
      const cy = Math.max(yMin, Math.min(yMax, y));
      pts.push(`L${sx(x).toFixed(1)},${sy(cy).toFixed(1)}`);
    }
    pts.push('Z');
    return pts.join(' ');
  }, [pairKey, a, b]);

  // Compute area numerically
  const area = useMemo(() => {
    const steps = 200;
    const dx = (b - a) / steps;
    let sum = 0;
    for (let i = 0; i < steps; i++) {
      const x = a + (i + 0.5) * dx;
      sum += (pair.upper.fn(x) - pair.lower.fn(x)) * dx;
    }
    return Math.max(0, sum);
  }, [pairKey, a, b]);

  const gridLines = useMemo(() => {
    const lines: JSX.Element[] = [];
    for (let x = Math.ceil(xMin); x <= xMax; x++) {
      lines.push(<line key={`v${x}`} x1={sx(x)} y1={sy(yMin)} x2={sx(x)} y2={sy(yMax)} stroke={x === 0 ? 'var(--color-ink-faint)' : 'var(--color-rule)'} strokeWidth={x === 0 ? 1 : 0.5} />);
    }
    for (let y = Math.ceil(yMin); y <= yMax; y++) {
      lines.push(<line key={`h${y}`} x1={sx(xMin)} y1={sy(y)} x2={sx(xMax)} y2={sy(y)} stroke={y === 0 ? 'var(--color-ink-faint)' : 'var(--color-rule)'} strokeWidth={y === 0 ? 1 : 0.5} />);
    }
    return lines;
  }, [width]);

  return (
    <div className="flex h-full w-full flex-col">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ background: 'var(--color-paper)' }}>
        {gridLines}

        {/* Shaded area */}
        {b > a && <path d={areaPath} fill="var(--color-vector-yellow)" opacity={0.3} />}

        {/* Upper curve */}
        <path d={upperPath} fill="none" stroke="var(--color-vector-blue)" strokeWidth={2.5} />
        {/* Lower curve */}
        <path d={lowerPath} fill="none" stroke="var(--color-vector-green)" strokeWidth={2.5} />

        {/* Bound markers */}
        <line x1={sx(a)} y1={sy(yMin)} x2={sx(a)} y2={sy(yMax)} stroke="var(--color-accent)" strokeWidth={1.5} strokeDasharray="4,3" />
        <line x1={sx(b)} y1={sy(yMin)} x2={sx(b)} y2={sy(yMax)} stroke="var(--color-accent)" strokeWidth={1.5} strokeDasharray="4,3" />

        {/* Legend */}
        <line x1={20} y1={12} x2={40} y2={12} stroke="var(--color-vector-blue)" strokeWidth={2.5} />
        <text x={44} y={16} className="text-[10px]" fill="var(--color-ink-muted)" style={{ fontFamily: 'var(--font-sans)' }}>{pair.upper.label}</text>
        <line x1={20} y1={26} x2={40} y2={26} stroke="var(--color-vector-green)" strokeWidth={2.5} />
        <text x={44} y={30} className="text-[10px]" fill="var(--color-ink-muted)" style={{ fontFamily: 'var(--font-sans)' }}>{pair.lower.label}</text>
      </svg>

      <div className="flex flex-wrap items-center gap-4 border-t border-rule bg-paper-elevated px-4 py-3">
        <label className="flex items-center gap-2 font-sans text-xs text-ink-muted">
          a =
          <input type="range" min={xMin + 0.5} max={b - 0.1} step={0.05} value={a} onChange={(e) => setA(+e.target.value)} className="h-1 w-20 cursor-pointer accent-[var(--color-accent)]" />
          <span className="font-mono text-xs text-ink w-6">{a.toFixed(1)}</span>
        </label>
        <label className="flex items-center gap-2 font-sans text-xs text-ink-muted">
          b =
          <input type="range" min={a + 0.1} max={xMax - 0.5} step={0.05} value={b} onChange={(e) => setB(+e.target.value)} className="h-1 w-20 cursor-pointer accent-[var(--color-accent)]" />
          <span className="font-mono text-xs text-ink w-6">{b.toFixed(1)}</span>
        </label>

        <div className="flex gap-1">
          {Object.keys(PAIRS).map((k) => (
            <button key={k} type="button" onClick={() => { setPairKey(k); setA(PAIRS[k].defaultA); setB(PAIRS[k].defaultB); }}
              className={`rounded-sm border px-2 py-0.5 font-mono text-[11px] transition-colors duration-fast ${k === pairKey ? 'border-accent bg-accent-soft text-accent' : 'border-rule bg-paper-elevated text-ink-muted hover:bg-surface-1'}`}>
              {k}
            </button>
          ))}
        </div>

        <div className="ml-auto font-mono text-[11px] text-vector-yellow">
          area ≈ {area.toFixed(4)}
        </div>
      </div>
    </div>
  );
}
