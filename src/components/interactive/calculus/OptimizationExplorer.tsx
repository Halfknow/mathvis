import { useState, useMemo } from 'react';

interface OptimizationExplorerProps {
  width?: number;
  height?: number;
}

type OptFn = {
  fn: (x: number) => number;
  dfn: (x: number) => number;
  d2fn: (x: number) => number;
  label: string;
  criticalPoints: number[];
};

const FUNCTIONS: Record<string, OptFn> = {
  'x³-3x': {
    fn: (x) => x * x * x - 3 * x,
    dfn: (x) => 3 * x * x - 3,
    d2fn: (x) => 6 * x,
    label: 'f(x) = x³ − 3x',
    criticalPoints: [-1, 1],
  },
  'x⁴-4x²': {
    fn: (x) => x * x * x * x - 4 * x * x,
    dfn: (x) => 4 * x * x * x - 8 * x,
    d2fn: (x) => 12 * x * x - 8,
    label: 'f(x) = x⁴ − 4x²',
    criticalPoints: [-1.41, 0, 1.41],
  },
  '-x²+4': {
    fn: (x) => -x * x + 4,
    dfn: (x) => -2 * x,
    d2fn: (x) => -2,
    label: 'f(x) = −x² + 4',
    criticalPoints: [0],
  },
  'sin(x)': {
    fn: (x) => Math.sin(x),
    dfn: (x) => Math.cos(x),
    d2fn: (x) => -Math.sin(x),
    label: 'f(x) = sin(x)',
    criticalPoints: [-Math.PI / 2, Math.PI / 2],
  },
};

export function OptimizationExplorer({
  width = 640,
  height = 400,
}: OptimizationExplorerProps) {
  const [fnKey, setFnKey] = useState('x³-3x');
  const [pointX, setPointX] = useState(0);
  const currentFn = FUNCTIONS[fnKey];

  const padding = { top: 20, right: 30, bottom: 50, left: 50 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const xRange = 6;
  const xMin = -xRange / 2;
  const xMax = xRange / 2;
  const yMin = -5;
  const yMax = 6;

  const sx = (x: number) => padding.left + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y: number) => padding.top + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  const curvePath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 200; i++) {
      const x = xMin + (i / 200) * (xMax - xMin);
      const y = currentFn.fn(x);
      if (y < yMin - 2 || y > yMax + 2) continue;
      pts.push(`${i === 0 || pts.length === 0 ? 'M' : 'L'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`);
    }
    return pts.join(' ');
  }, [fnKey]);

  const fVal = currentFn.fn(pointX);
  const fPrime = currentFn.dfn(pointX);
  const fDoublePrime = currentFn.d2fn(pointX);

  // Determine classification at nearest critical point
  const nearCritical = currentFn.criticalPoints.find(cp => Math.abs(pointX - cp) < 0.15);
  let classification: 'local max' | 'local min' | 'inflection' | null = null;
  if (nearCritical !== undefined) {
    if (fDoublePrime < -0.1) classification = 'local max';
    else if (fDoublePrime > 0.1) classification = 'local min';
    else classification = 'inflection';
  }

  // Derivative sign arrow
  const derivativeSign = fPrime > 0.1 ? '↑' : fPrime < -0.1 ? '↓' : '→';

  const gridLines = useMemo(() => {
    const lines: JSX.Element[] = [];
    for (let x = Math.ceil(xMin); x <= xMax; x++) {
      lines.push(
        <line key={`v${x}`} x1={sx(x)} y1={sy(yMin)} x2={sx(x)} y2={sy(yMax)} stroke={x === 0 ? 'var(--color-ink-faint)' : 'var(--color-rule)'} strokeWidth={x === 0 ? 1 : 0.5} />,
      );
    }
    for (let y = Math.ceil(yMin); y <= yMax; y++) {
      lines.push(
        <line key={`h${y}`} x1={sx(xMin)} y1={sy(y)} x2={sx(xMax)} y2={sy(y)} stroke={y === 0 ? 'var(--color-ink-faint)' : 'var(--color-rule)'} strokeWidth={y === 0 ? 1 : 0.5} />,
      );
    }
    return lines;
  }, [fnKey, width]);

  return (
    <div className="flex h-full w-full flex-col">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ background: 'var(--color-paper)' }}
      >
        {gridLines}

        {/* f(x) curve */}
        <path d={curvePath} fill="none" stroke="var(--color-vector-blue)" strokeWidth={2.5} />

        {/* Critical point markers */}
        {currentFn.criticalPoints.map((cp) => {
          const cpY = currentFn.fn(cp);
          const cpClass = currentFn.d2fn(cp);
          const color = cpClass < -0.1 ? 'var(--color-vector-red)' : cpClass > 0.1 ? 'var(--color-vector-green)' : 'var(--color-ink-muted)';
          return (
            <g key={cp}>
              <circle cx={sx(cp)} cy={sy(cpY)} r={6} fill="none" stroke={color} strokeWidth={2} />
              <circle cx={sx(cp)} cy={sy(cpY)} r={3} fill={color} />
            </g>
          );
        })}

        {/* Draggable point */}
        <circle cx={sx(pointX)} cy={sy(fVal)} r={7} fill="var(--color-accent)" stroke="var(--color-paper)" strokeWidth={2} />

        {/* Derivative sign indicator */}
        <text x={sx(pointX) + 12} y={sy(fVal) - 5} className="text-[16px]" fill="var(--color-accent)">
          {derivativeSign}
        </text>

        {/* Classification label */}
        {classification && nearCritical !== undefined && (
          <g>
            <rect
              x={sx(nearCritical) - 40}
              y={sy(currentFn.fn(nearCritical)) - 25}
              width={80}
              height={18}
              rx={3}
              fill={classification === 'local max' ? 'var(--color-vector-red)' : classification === 'local min' ? 'var(--color-vector-green)' : 'var(--color-ink-muted)'}
              opacity={0.15}
            />
            <text
              x={sx(nearCritical)}
              y={sy(currentFn.fn(nearCritical)) - 13}
              textAnchor="middle"
              className="text-[10px] font-bold"
              fill={classification === 'local max' ? 'var(--color-vector-red)' : classification === 'local min' ? 'var(--color-vector-green)' : 'var(--color-ink-muted)'}
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {classification}
            </text>
          </g>
        )}

        {/* Legend */}
        <circle cx={width - 100} cy={20} r={3} fill="var(--color-vector-red)" />
        <text x={width - 93} y={24} className="text-[9px]" fill="var(--color-ink-muted)" style={{ fontFamily: 'var(--font-sans)' }}>local max</text>
        <circle cx={width - 100} cy={34} r={3} fill="var(--color-vector-green)" />
        <text x={width - 93} y={38} className="text-[9px]" fill="var(--color-ink-muted)" style={{ fontFamily: 'var(--font-sans)' }}>local min</text>
      </svg>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 border-t border-rule bg-paper-elevated px-4 py-3">
        <label className="flex items-center gap-2 font-sans text-xs text-ink-muted">
          x =
          <input
            type="range"
            min={xMin + 0.5}
            max={xMax - 0.5}
            step={0.05}
            value={pointX}
            onChange={(e) => setPointX(+e.target.value)}
            className="h-1 w-32 cursor-pointer accent-[var(--color-accent)]"
          />
          <span className="font-mono text-xs text-ink w-10">{pointX.toFixed(2)}</span>
        </label>

        <div className="flex gap-1">
          {Object.keys(FUNCTIONS).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => { setFnKey(k); setPointX(0); }}
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
          <span className="text-vector-blue">f = {fVal.toFixed(3)}</span>
          <span className={Math.abs(fPrime) < 0.15 ? 'text-accent font-bold' : 'text-vector-green'}>
            f′ = {fPrime.toFixed(3)}
          </span>
          <span className="text-ink-muted">f″ = {fDoublePrime.toFixed(3)}</span>
        </div>
      </div>
    </div>
  );
}
