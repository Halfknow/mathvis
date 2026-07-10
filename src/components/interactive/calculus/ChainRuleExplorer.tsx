import { useState, useMemo } from 'react';

interface ChainRuleExplorerProps {
  width?: number;
  height?: number;
}

type Composition = {
  outer: string;
  inner: string;
  outerFn: (u: number) => number;
  innerFn: (x: number) => number;
  outerDeriv: (u: number) => number;
  innerDeriv: (x: number) => number;
  label: string;
};

const COMPOSITIONS: Record<string, Composition> = {
  'sin(x²)': {
    outer: 'sin(u)',
    inner: 'u = x²',
    outerFn: (u) => Math.sin(u),
    innerFn: (x) => x * x,
    outerDeriv: (u) => Math.cos(u),
    innerDeriv: (x) => 2 * x,
    label: 'sin(x²)',
  },
  'e^(3x)': {
    outer: 'eᵘ',
    inner: 'u = 3x',
    outerFn: (u) => Math.exp(u),
    innerFn: (x) => 3 * x,
    outerDeriv: (u) => Math.exp(u),
    innerDeriv: (x) => 3,
    label: 'e^(3x)',
  },
  '(x²+1)³': {
    outer: 'u³',
    inner: 'u = x²+1',
    outerFn: (u) => u * u * u,
    innerFn: (x) => x * x + 1,
    outerDeriv: (u) => 3 * u * u,
    innerDeriv: (x) => 2 * x,
    label: '(x²+1)³',
  },
  'ln(cos(x))': {
    outer: 'ln(u)',
    inner: 'u = cos(x)',
    outerFn: (u) => u > 0 ? Math.log(u) : NaN,
    innerFn: (x) => Math.cos(x),
    outerDeriv: (u) => u > 0 ? 1 / u : NaN,
    innerDeriv: (x) => -Math.sin(x),
    label: 'ln(cos(x))',
  },
};

export function ChainRuleExplorer({
  width = 640,
  height = 480,
}: ChainRuleExplorerProps) {
  const [compKey, setCompKey] = useState('sin(x²)');
  const [inputX, setInputX] = useState(1);
  const comp = COMPOSITIONS[compKey];

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const plotW = width - padding.left - padding.right;
  const plotH = height / 2 - padding.top - padding.bottom - 10;

  const xRange = 6;
  const xMin = -xRange / 2;
  const xMax = xRange / 2;

  const sx = (x: number) => padding.left + ((x - xMin) / (xMax - xMin)) * plotW;

  // Top panel: composite function f(g(x))
  const topYMin = -3;
  const topYMax = 5;
  const topSy = (y: number) => padding.top + plotH - ((y - topYMin) / (topYMax - topYMin)) * plotH;

  const compositePath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 200; i++) {
      const x = xMin + (i / 200) * (xMax - xMin);
      const u = comp.innerFn(x);
      const y = comp.outerFn(u);
      if (isNaN(y) || y < topYMin - 2 || y > topYMax + 2) continue;
      pts.push(`${i === 0 || pts.length === 0 ? 'M' : 'L'}${sx(x).toFixed(1)},${topSy(y).toFixed(1)}`);
    }
    return pts.join(' ');
  }, [compKey, width]);

  // Bottom panel: inner function g(x)
  const botYMin = -3;
  const botYMax = 5;
  const botPad = { top: height / 2 + 10, right: 20, bottom: 40, left: 50 };
  const botPlotH = height - botPad.top - botPad.bottom;
  const botSy = (y: number) => botPad.top + botPlotH - ((y - botYMin) / (botYMax - botYMin)) * botPlotH;

  const innerPath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 200; i++) {
      const x = xMin + (i / 200) * (xMax - xMin);
      const y = comp.innerFn(x);
      if (isNaN(y) || y < botYMin - 2 || y > botYMax + 2) continue;
      pts.push(`${i === 0 || pts.length === 0 ? 'M' : 'L'}${sx(x).toFixed(1)},${botSy(y).toFixed(1)}`);
    }
    return pts.join(' ');
  }, [compKey, width]);

  const u = comp.innerFn(inputX);
  const fOfU = isNaN(u) ? NaN : comp.outerFn(u);
  const outerD = isNaN(u) ? NaN : comp.outerDeriv(u);
  const innerD = comp.innerDeriv(inputX);
  const chainD = isNaN(outerD) ? NaN : outerD * innerD;

  return (
    <div className="flex h-full w-full flex-col">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ background: 'var(--color-paper)' }}
      >
        {/* Dividing line */}
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="var(--color-rule)" strokeWidth={1} />

        {/* Top panel grid */}
        {Array.from({ length: Math.ceil(xMax) - Math.floor(xMin) + 1 }, (_, i) => {
          const x = Math.floor(xMin) + i;
          return <line key={`tv${x}`} x1={sx(x)} y1={padding.top} x2={sx(x)} y2={padding.top + plotH} stroke={x === 0 ? 'var(--color-ink-faint)' : 'var(--color-rule)'} strokeWidth={x === 0 ? 1 : 0.5} />;
        })}
        {Array.from({ length: topYMax - topYMin + 1 }, (_, i) => {
          const y = topYMin + i;
          return <line key={`th${y}`} x1={padding.left} y1={topSy(y)} x2={width - padding.right} y2={topSy(y)} stroke={y === 0 ? 'var(--color-ink-faint)' : 'var(--color-rule)'} strokeWidth={y === 0 ? 1 : 0.5} />;
        })}

        {/* Top panel: f(g(x)) */}
        <path d={compositePath} fill="none" stroke="var(--color-vector-blue)" strokeWidth={2.5} />
        <text x={padding.left + 4} y={padding.top + 14} className="text-[11px] font-bold" fill="var(--color-vector-blue)" style={{ fontFamily: 'var(--font-sans)' }}>
          f(g(x)) = {comp.label}
        </text>

        {/* Point on composite */}
        {!isNaN(fOfU) && (
          <circle cx={sx(inputX)} cy={topSy(fOfU)} r={5} fill="var(--color-accent)" />
        )}

        {/* Bottom panel grid */}
        {Array.from({ length: Math.ceil(xMax) - Math.floor(xMin) + 1 }, (_, i) => {
          const x = Math.floor(xMin) + i;
          return <line key={`bv${x}`} x1={sx(x)} y1={botPad.top} x2={sx(x)} y2={height - padding.bottom} stroke={x === 0 ? 'var(--color-ink-faint)' : 'var(--color-rule)'} strokeWidth={x === 0 ? 1 : 0.5} />;
        })}
        {Array.from({ length: botYMax - botYMin + 1 }, (_, i) => {
          const y = botYMin + i;
          return <line key={`bh${y}`} x1={padding.left} y1={botSy(y)} x2={width - padding.right} y2={botSy(y)} stroke={y === 0 ? 'var(--color-ink-faint)' : 'var(--color-rule)'} strokeWidth={y === 0 ? 1 : 0.5} />;
        })}

        {/* Bottom panel: g(x) */}
        <path d={innerPath} fill="none" stroke="var(--color-vector-green)" strokeWidth={2.5} />
        <text x={padding.left + 4} y={botPad.top + 14} className="text-[11px] font-bold" fill="var(--color-vector-green)" style={{ fontFamily: 'var(--font-sans)' }}>
          g(x) = {comp.inner}
        </text>

        {/* Point on inner */}
        {!isNaN(u) && (
          <circle cx={sx(inputX)} cy={botSy(u)} r={5} fill="var(--color-vector-green)" />
        )}

        {/* Vertical line connecting the two panels */}
        <line
          x1={sx(inputX)} y1={topSy(fOfU ?? 0)}
          x2={sx(inputX)} y2={botSy(u)}
          stroke="var(--color-accent)"
          strokeWidth={1}
          strokeDasharray="4,4"
          opacity={0.5}
        />
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
            value={inputX}
            onChange={(e) => setInputX(+e.target.value)}
            className="h-1 w-32 cursor-pointer accent-[var(--color-accent)]"
          />
          <span className="font-mono text-xs text-ink w-10">{inputX.toFixed(2)}</span>
        </label>

        <div className="flex gap-1">
          {Object.keys(COMPOSITIONS).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => { setCompKey(k); setInputX(1); }}
              className={`rounded-sm border px-2 py-0.5 font-mono text-[11px] transition-colors duration-fast ${
                k === compKey
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-rule bg-paper-elevated text-ink-muted hover:bg-surface-1'
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Derivative readout */}
        <div className="ml-auto flex flex-col gap-0.5 font-mono text-[11px]">
          <span className="text-vector-green">g′({inputX.toFixed(1)}) = {innerD.toFixed(3)}</span>
          <span className="text-vector-blue">f′({u.toFixed(1)}) = {isNaN(outerD) ? '—' : outerD.toFixed(3)}</span>
          <span className="text-accent font-bold">
            [f∘g]′ = {isNaN(chainD) ? '—' : chainD.toFixed(3)}
          </span>
        </div>
      </div>
    </div>
  );
}
