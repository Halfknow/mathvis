import { useState, useMemo } from 'react';

interface RiemannSumExplorerProps {
  width?: number;
  height?: number;
}

type RiemannFn = {
  fn: (x: number) => number;
  label: string;
  a: number;
  b: number;
  exactIntegral?: number;
};

const FUNCTIONS: Record<string, RiemannFn> = {
  'x²': {
    fn: (x) => x * x,
    label: 'f(x) = x²',
    a: 0, b: 1,
    exactIntegral: 1 / 3,
  },
  'sin(x)': {
    fn: (x) => Math.sin(x),
    label: 'f(x) = sin(x)',
    a: 0, b: Math.PI,
    exactIntegral: 2,
  },
  'eˣ': {
    fn: (x) => Math.exp(x),
    label: 'f(x) = eˣ',
    a: 0, b: 1,
    exactIntegral: Math.E - 1,
  },
  '1/(1+x²)': {
    fn: (x) => 1 / (1 + x * x),
    label: 'f(x) = 1/(1+x²)',
    a: -3, b: 3,
    exactIntegral: 2 * Math.atan(3),
  },
};

type Rule = 'left' | 'right' | 'midpoint';

export function RiemannSumExplorer({
  width = 640,
  height = 400,
}: RiemannSumExplorerProps) {
  const [fnKey, setFnKey] = useState('x²');
  const [n, setN] = useState(4);
  const [rule, setRule] = useState<Rule>('left');

  const currentFn = FUNCTIONS[fnKey];
  const { fn, a, b } = currentFn;

  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const xSpan = b - a;
  const xPad = xSpan * 0.15;
  const xMin = a - xPad;
  const xMax = b + xPad;

  // Compute y range from sampled function values
  const [yMin, yMax] = useMemo(() => {
    let lo = 0, hi = 0;
    for (let i = 0; i <= 100; i++) {
      const x = a + (i / 100) * xSpan;
      const y = fn(x);
      if (y < lo) lo = y;
      if (y > hi) hi = y;
    }
    const yPad = (hi - lo) * 0.15 || 1;
    return [lo - yPad, hi + yPad];
  }, [fnKey]);

  const sx = (x: number) => padding.left + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y: number) => padding.top + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  const curvePath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 300; i++) {
      const x = xMin + (i / 300) * (xMax - xMin);
      const y = fn(x);
      if (y < yMin - 2 || y > yMax + 2) continue;
      pts.push(`${i === 0 || pts.length === 0 ? 'M' : 'L'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`);
    }
    return pts.join(' ');
  }, [fnKey, width]);

  // Compute Riemann sum
  const { rectangles, riemannSum } = useMemo(() => {
    const dx = xSpan / n;
    const rects: Array<{ x: number; y: number; w: number; h: number }> = [];
    let sum = 0;

    for (let i = 0; i < n; i++) {
      const xLeft = a + i * dx;
      let sampleX: number;
      if (rule === 'left') sampleX = xLeft;
      else if (rule === 'right') sampleX = xLeft + dx;
      else sampleX = xLeft + dx / 2;

      const sampleY = fn(sampleX);
      rects.push({ x: xLeft, y: sampleY, w: dx, h: sampleY });
      sum += sampleY * dx;
    }

    return { rectangles: rects, riemannSum: sum };
  }, [fnKey, n, rule]);

  const error = currentFn.exactIntegral !== undefined
    ? Math.abs(riemannSum - currentFn.exactIntegral)
    : undefined;

  const gridLines = useMemo(() => {
    const lines: JSX.Element[] = [];
    for (let x = Math.ceil(xMin); x <= xMax; x++) {
      const isAxis = x === 0;
      lines.push(
        <line key={`v${x}`} x1={sx(x)} y1={sy(yMin)} x2={sx(x)} y2={sy(yMax)} stroke={isAxis ? 'var(--color-ink-faint)' : 'var(--color-rule)'} strokeWidth={isAxis ? 1 : 0.5} />,
      );
    }
    for (let y = Math.ceil(yMin); y <= yMax; y++) {
      const isAxis = y === 0;
      lines.push(
        <line key={`h${y}`} x1={sx(xMin)} y1={sy(y)} x2={sx(xMax)} y2={sy(y)} stroke={isAxis ? 'var(--color-ink-faint)' : 'var(--color-rule)'} strokeWidth={isAxis ? 1 : 0.5} />,
      );
    }
    return lines;
  }, [fnKey, width]);

  const rules: { key: Rule; label: string }[] = [
    { key: 'left', label: 'Left' },
    { key: 'right', label: 'Right' },
    { key: 'midpoint', label: 'Mid' },
  ];

  return (
    <div className="flex h-full w-full flex-col">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ background: 'var(--color-paper)' }}
      >
        {gridLines}

        {/* Riemann rectangles */}
        {rectangles.map((r, i) => {
          const y0 = sy(0);
          const ry = sy(r.y);
          const rectH = y0 - ry;
          const isPositive = r.h >= 0;
          return (
            <rect
              key={i}
              x={sx(r.x)}
              y={Math.min(y0, ry)}
              width={sx(r.x + r.w) - sx(r.x)}
              height={Math.abs(rectH)}
              fill={isPositive ? 'var(--color-vector-yellow)' : 'var(--color-vector-red)'}
              opacity={0.3}
              stroke={isPositive ? 'var(--color-vector-yellow)' : 'var(--color-vector-red)'}
              strokeWidth={1}
            />
          );
        })}

        {/* Function curve */}
        <path d={curvePath} fill="none" stroke="var(--color-vector-blue)" strokeWidth={2.5} />

        {/* Integration bounds */}
        <line x1={sx(a)} y1={sy(yMin)} x2={sx(a)} y2={sy(yMax)} stroke="var(--color-accent)" strokeWidth={1.5} strokeDasharray="3,3" />
        <line x1={sx(b)} y1={sy(yMin)} x2={sx(b)} y2={sy(yMax)} stroke="var(--color-accent)" strokeWidth={1.5} strokeDasharray="3,3" />

        {/* Bound labels */}
        <text x={sx(a)} y={sy(yMin) + 14} textAnchor="middle" className="text-[10px]" fill="var(--color-accent)" style={{ fontFamily: 'var(--font-sans)' }}>a = {a.toFixed(1)}</text>
        <text x={sx(b)} y={sy(yMin) + 14} textAnchor="middle" className="text-[10px]" fill="var(--color-accent)" style={{ fontFamily: 'var(--font-sans)' }}>b = {b.toFixed(1)}</text>
      </svg>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 border-t border-rule bg-paper-elevated px-4 py-3">
        <label className="flex items-center gap-2 font-sans text-xs text-ink-muted">
          n =
          <input
            type="range"
            min={1}
            max={200}
            step={1}
            value={n}
            onChange={(e) => setN(+e.target.value)}
            className="h-1 w-28 cursor-pointer accent-[var(--color-accent)]"
          />
          <span className="font-mono text-xs text-ink w-8">{n}</span>
        </label>

        <div className="flex gap-1">
          {rules.map((r) => (
            <button
              key={r.key}
              type="button"
              onClick={() => setRule(r.key)}
              className={`rounded-sm border px-2 py-0.5 font-sans text-[11px] transition-colors duration-fast ${
                r.key === rule
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-rule bg-paper-elevated text-ink-muted hover:bg-surface-1'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1">
          {Object.keys(FUNCTIONS).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => { setFnKey(k); setN(4); }}
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
          <span className="text-vector-yellow">
            Riemann sum ≈ {riemannSum.toFixed(6)}
          </span>
          {currentFn.exactIntegral !== undefined && (
            <span className="text-accent">
              exact = {currentFn.exactIntegral.toFixed(6)}
            </span>
          )}
          {error !== undefined && (
            <span className="text-vector-red">
              error = {error.toFixed(6)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
