import { useState, useMemo } from 'react';

interface DerivativeSlopeProps {
  width?: number;
  height?: number;
}

type FnDef = {
  fn: (x: number) => number;
  dfn: (x: number) => number;
  label: string;
};

const FUNCTIONS: Record<string, FnDef> = {
  'x²': { fn: (x) => x * x, dfn: (x) => 2 * x, label: 'f(x) = x²' },
  'sin(x)': { fn: (x) => Math.sin(x), dfn: (x) => Math.cos(x), label: 'f(x) = sin(x)' },
  'x³-3x': { fn: (x) => x * x * x - 3 * x, dfn: (x) => 3 * x * x - 3, label: 'f(x) = x³ − 3x' },
  'eˣ': { fn: (x) => Math.exp(x), dfn: (x) => Math.exp(x), label: 'f(x) = eˣ' },
};

export function DerivativeSlope({
  width = 640,
  height = 400,
}: DerivativeSlopeProps) {
  const [fnKey, setFnKey] = useState('x²');
  const [tangentX, setTangentX] = useState(1);
  const currentFn = FUNCTIONS[fnKey];

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const xRange = 6;
  const xMin = -xRange / 2;
  const xMax = xRange / 2;
  const yMin = -3;
  const yMax = 5;

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
  }, [fnKey, width, height]);

  const derivativePath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 200; i++) {
      const x = xMin + (i / 200) * (xMax - xMin);
      const y = currentFn.dfn(x);
      if (y < yMin - 2 || y > yMax + 2) continue;
      pts.push(`${i === 0 || pts.length === 0 ? 'M' : 'L'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`);
    }
    return pts.join(' ');
  }, [fnKey, width, height]);

  const fAtX = currentFn.fn(tangentX);
  const slope = currentFn.dfn(tangentX);

  const tangentPath = useMemo(() => {
    const x1 = tangentX - 1.5;
    const y1 = fAtX + slope * (x1 - tangentX);
    const x2 = tangentX + 1.5;
    const y2 = fAtX + slope * (x2 - tangentX);
    return `M${sx(x1).toFixed(1)},${sy(y1).toFixed(1)} L${sx(x2).toFixed(1)},${sy(y2).toFixed(1)}`;
  }, [tangentX, fnKey, width, height]);

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
  }, [width, height]);

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

        {/* f'(x) curve */}
        <path d={derivativePath} fill="none" stroke="var(--color-vector-green)" strokeWidth={1.5} strokeDasharray="6,3" />

        {/* Tangent line */}
        <path d={tangentPath} fill="none" stroke="var(--color-accent)" strokeWidth={2} />

        {/* Tangent point */}
        <circle cx={sx(tangentX)} cy={sy(fAtX)} r={5} fill="var(--color-accent)" />

        {/* Derivative point on f' curve */}
        <circle cx={sx(tangentX)} cy={sy(slope)} r={4} fill="var(--color-vector-green)" stroke="var(--color-paper)" strokeWidth={2} />

        {/* Legend */}
        <line x1={width - 140} y1={20} x2={width - 120} y2={20} stroke="var(--color-vector-blue)" strokeWidth={2.5} />
        <text x={width - 115} y={24} className="text-[10px]" fill="var(--color-ink-muted)" style={{ fontFamily: 'var(--font-sans)' }}>f(x)</text>
        <line x1={width - 140} y1={34} x2={width - 120} y2={34} stroke="var(--color-vector-green)" strokeWidth={1.5} strokeDasharray="4,2" />
        <text x={width - 115} y={38} className="text-[10px]" fill="var(--color-ink-muted)" style={{ fontFamily: 'var(--font-sans)' }}>f′(x)</text>
        <line x1={width - 140} y1={48} x2={width - 120} y2={48} stroke="var(--color-accent)" strokeWidth={2} />
        <text x={width - 115} y={52} className="text-[10px]" fill="var(--color-ink-muted)" style={{ fontFamily: 'var(--font-sans)' }}>tangent</text>
      </svg>

      {/* Controls */}
      <div className="flex items-center gap-4 border-t border-rule bg-paper-elevated px-4 py-3">
        <label className="flex items-center gap-2 font-sans text-xs text-ink-muted">
          x =
          <input
            type="range"
            min={xMin + 0.5}
            max={xMax - 0.5}
            step={0.05}
            value={tangentX}
            onChange={(e) => setTangentX(+e.target.value)}
            className="h-1 w-32 cursor-pointer accent-[var(--color-accent)]"
          />
          <span className="font-mono text-xs text-ink w-12">{tangentX.toFixed(2)}</span>
        </label>

        <div className="flex gap-1">
          {Object.keys(FUNCTIONS).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => { setFnKey(k); setTangentX(1); }}
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

        <div className="ml-auto flex gap-3 font-mono text-[11px]">
          <span className="text-vector-blue">f({tangentX.toFixed(1)}) = {fAtX.toFixed(2)}</span>
          <span className="text-vector-green">f′ = {slope.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
