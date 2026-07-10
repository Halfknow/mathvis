import { useState, useMemo } from 'react';

interface FTCExplorerProps {
  width?: number;
  height?: number;
}

type FTCFn = {
  fn: (x: number) => number;
  antideriv: (x: number) => number;
  label: string;
  antiderivLabel: string;
};

const FUNCTIONS: Record<string, FTCFn> = {
  '2x': {
    fn: (x) => 2 * x,
    antideriv: (x) => x * x,
    label: 'f(x) = 2x',
    antiderivLabel: 'F(x) = x²',
  },
  'cos(x)': {
    fn: (x) => Math.cos(x),
    antideriv: (x) => Math.sin(x),
    label: 'f(x) = cos(x)',
    antiderivLabel: 'F(x) = sin(x)',
  },
  'eˣ': {
    fn: (x) => Math.exp(x),
    antideriv: (x) => Math.exp(x),
    label: 'f(x) = eˣ',
    antiderivLabel: 'F(x) = eˣ',
  },
  '3x²': {
    fn: (x) => 3 * x * x,
    antideriv: (x) => x * x * x,
    label: 'f(x) = 3x²',
    antiderivLabel: 'F(x) = x³',
  },
};

export function FTCExplorer({
  width = 640,
  height = 440,
}: FTCExplorerProps) {
  const [fnKey, setFnKey] = useState('2x');
  const [upperX, setUpperX] = useState(2);
  const [showDerivCheck, setShowDerivCheck] = useState(false);
  const currentFn = FUNCTIONS[fnKey];

  const lowerBound = 0;
  const halfH = height / 2;
  const padding = { top: 25, right: 25, bottom: 30, left: 50 };
  const plotW = width - padding.left - padding.right;
  const plotH = halfH - padding.top - padding.bottom - 8;

  const xRange = 5;
  const xMin = -0.5;
  const xMax = xRange;

  // Top panel y range (for f(x))
  const topYMin = -2;
  const topYMax = 6;

  // Bottom panel y range (for F(x))
  const botYMin = -2;
  const botYMax = 10;

  const sx = (x: number) => padding.left + ((x - xMin) / (xMax - xMin)) * plotW;
  const topSy = (y: number) => padding.top + plotH - ((y - topYMin) / (topYMax - topYMin)) * plotH;
  const botSy = (y: number) => halfH + 8 + padding.top + plotH - ((y - botYMin) / (botYMax - botYMin)) * plotH;

  // Numerical integral for verification
  const numericalIntegral = useMemo(() => {
    const steps = 500;
    const dx = (upperX - lowerBound) / steps;
    let sum = 0;
    for (let i = 0; i < steps; i++) {
      const x = lowerBound + (i + 0.5) * dx;
      sum += currentFn.fn(x) * dx;
    }
    return sum;
  }, [fnKey, upperX]);

  const ftcValue = currentFn.antideriv(upperX) - currentFn.antideriv(lowerBound);

  // Top panel: f(x) curve and shaded area
  const fCurvePath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 200; i++) {
      const x = xMin + (i / 200) * (xMax - xMin);
      const y = currentFn.fn(x);
      if (y < topYMin - 1 || y > topYMax + 1) continue;
      pts.push(`${i === 0 || pts.length === 0 ? 'M' : 'L'}${sx(x).toFixed(1)},${topSy(y).toFixed(1)}`);
    }
    return pts.join(' ');
  }, [fnKey]);

  // Shaded area under f(x) from lowerBound to upperX
  const areaPath = useMemo(() => {
    const pts = [`M${sx(lowerBound).toFixed(1)},${topSy(0).toFixed(1)}`];
    for (let i = 0; i <= 100; i++) {
      const x = lowerBound + (i / 100) * Math.max(0, upperX - lowerBound);
      const y = currentFn.fn(x);
      const clampedY = Math.max(topYMin, Math.min(topYMax, y));
      pts.push(`L${sx(x).toFixed(1)},${topSy(clampedY).toFixed(1)}`);
    }
    pts.push(`L${sx(upperX).toFixed(1)},${topSy(0).toFixed(1)}`);
    pts.push('Z');
    return pts.join(' ');
  }, [fnKey, upperX]);

  // Bottom panel: F(x) curve
  const FCurvePath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 200; i++) {
      const x = xMin + (i / 200) * (xMax - xMin);
      const y = currentFn.antideriv(x);
      if (y < botYMin - 1 || y > botYMax + 1) continue;
      pts.push(`${i === 0 || pts.length === 0 ? 'M' : 'L'}${sx(x).toFixed(1)},${botSy(y).toFixed(1)}`);
    }
    return pts.join(' ');
  }, [fnKey]);

  // Build F(x) progressively: draw from lowerBound to upperX
  const FProgressPath = useMemo(() => {
    const pts: string[] = [];
    const steps = 100;
    const end = Math.max(lowerBound, upperX);
    for (let i = 0; i <= steps; i++) {
      const x = lowerBound + (i / steps) * (end - lowerBound);
      const y = currentFn.antideriv(x);
      const clampedY = Math.max(botYMin, Math.min(botYMax, y));
      pts.push(`${i === 0 ? 'M' : 'L'}${sx(x).toFixed(1)},${botSy(clampedY).toFixed(1)}`);
    }
    return pts.join(' ');
  }, [fnKey, upperX]);

  return (
    <div className="flex h-full w-full flex-col">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ background: 'var(--color-paper)' }}
      >
        {/* Divider */}
        <line x1={0} y1={halfH} x2={width} y2={halfH} stroke="var(--color-rule)" strokeWidth={1} />

        {/* TOP PANEL: f(x) */}
        <text x={padding.left + 4} y={padding.top - 8} className="text-[11px] font-bold" fill="var(--color-vector-blue)" style={{ fontFamily: 'var(--font-sans)' }}>
          {currentFn.label} — the rate of change
        </text>

        {/* Top grid */}
        {Array.from({ length: Math.ceil(xMax) - Math.floor(xMin) + 1 }, (_, i) => {
          const x = Math.floor(xMin) + i;
          return <line key={`tv${x}`} x1={sx(x)} y1={padding.top} x2={sx(x)} y2={padding.top + plotH} stroke={x === 0 ? 'var(--color-ink-faint)' : 'var(--color-rule)'} strokeWidth={x === 0 ? 1 : 0.5} />;
        })}

        {/* Shaded area */}
        {upperX > lowerBound && (
          <path d={areaPath} fill="var(--color-vector-yellow)" opacity={0.25} />
        )}

        {/* f(x) curve */}
        <path d={fCurvePath} fill="none" stroke="var(--color-vector-blue)" strokeWidth={2.5} />

        {/* Upper bound marker */}
        <line x1={sx(upperX)} y1={padding.top} x2={sx(upperX)} y2={padding.top + plotH} stroke="var(--color-accent)" strokeWidth={2} />
        <circle cx={sx(upperX)} cy={topSy(currentFn.fn(upperX))} r={4} fill="var(--color-accent)" />

        {/* BOTTOM PANEL: F(x) */}
        <text x={padding.left + 4} y={halfH + 8 + padding.top - 8} className="text-[11px] font-bold" fill="var(--color-vector-green)" style={{ fontFamily: 'var(--font-sans)' }}>
          {currentFn.antiderivLabel} — the accumulated total
        </text>

        {/* Bottom grid */}
        {Array.from({ length: Math.ceil(xMax) - Math.floor(xMin) + 1 }, (_, i) => {
          const x = Math.floor(xMin) + i;
          return <line key={`bv${x}`} x1={sx(x)} y1={halfH + 8 + padding.top} x2={sx(x)} y2={height - padding.bottom} stroke={x === 0 ? 'var(--color-ink-faint)' : 'var(--color-rule)'} strokeWidth={x === 0 ? 1 : 0.5} />;
        })}

        {/* F(x) full curve (faded) */}
        <path d={FCurvePath} fill="none" stroke="var(--color-vector-green)" strokeWidth={1} opacity={0.3} />

        {/* F(x) progressive (bright) */}
        {upperX > lowerBound && (
          <path d={FProgressPath} fill="none" stroke="var(--color-vector-green)" strokeWidth={2.5} />
        )}

        {/* Point on F(x) */}
        <circle cx={sx(upperX)} cy={botSy(currentFn.antideriv(upperX))} r={5} fill="var(--color-vector-green)" />

        {/* Connecting dashed line between panels */}
        <line x1={sx(upperX)} y1={topSy(currentFn.fn(upperX))} x2={sx(upperX)} y2={botSy(currentFn.antideriv(upperX))} stroke="var(--color-accent)" strokeWidth={1} strokeDasharray="4,3" opacity={0.5} />

        {/* FTC equation overlay */}
        <rect x={width - 220} y={halfH - 16} width={210} height={32} rx={4} fill="var(--color-paper-elevated)" stroke="var(--color-rule)" strokeWidth={0.5} />
        <text x={width - 115} y={halfH + 5} textAnchor="middle" className="text-[11px] font-bold" fill="var(--color-accent)" style={{ fontFamily: 'var(--font-sans)' }}>
          ∫₀ˣ f(t)dt = F(x) − F(0) = {ftcValue.toFixed(2)}
        </text>
      </svg>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 border-t border-rule bg-paper-elevated px-4 py-3">
        <label className="flex items-center gap-2 font-sans text-xs text-ink-muted">
          upper bound x =
          <input
            type="range"
            min={lowerBound + 0.1}
            max={xMax - 0.1}
            step={0.05}
            value={upperX}
            onChange={(e) => setUpperX(+e.target.value)}
            className="h-1 w-32 cursor-pointer accent-[var(--color-accent)]"
          />
          <span className="font-mono text-xs text-ink w-8">{upperX.toFixed(2)}</span>
        </label>

        <div className="flex gap-1">
          {Object.keys(FUNCTIONS).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => { setFnKey(k); setUpperX(2); }}
              className={`rounded-sm border px-2 py-0.5 font-mono text-[11px] transition-colors duration-fast ${
                k === fnKey
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-rule bg-paper-elevated text-ink-muted hover:bg-surface-1'
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        <div className="ml-auto flex flex-col items-end gap-0.5 font-mono text-[11px]">
          <span className="text-vector-yellow">∫ ≈ {numericalIntegral.toFixed(4)}</span>
          <span className="text-accent">F(x)−F(0) = {ftcValue.toFixed(4)}</span>
        </div>
      </div>
    </div>
  );
}
