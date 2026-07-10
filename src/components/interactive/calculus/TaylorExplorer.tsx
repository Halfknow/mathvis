import { useState, useMemo } from 'react';

interface TaylorExplorerProps {
  width?: number;
  height?: number;
}

type TaylorFn = {
  fn: (x: number) => number;
  label: string;
  // Derivatives at a point a, computed dynamically
  derivatives: (n: number, a: number) => number;
  radiusOfConvergence?: number;
};

const FUNCTIONS: Record<string, TaylorFn> = {
  'sin(x)': {
    fn: (x) => Math.sin(x),
    label: 'f(x) = sin(x)',
    derivatives: (n, _a) => {
      const a = _a;
      const cycle = n % 4;
      if (cycle === 0) return Math.sin(a);
      if (cycle === 1) return Math.cos(a);
      if (cycle === 2) return -Math.sin(a);
      return -Math.cos(a);
    },
    radiusOfConvergence: Infinity,
  },
  'cos(x)': {
    fn: (x) => Math.cos(x),
    label: 'f(x) = cos(x)',
    derivatives: (n, a) => {
      const cycle = n % 4;
      if (cycle === 0) return Math.cos(a);
      if (cycle === 1) return -Math.sin(a);
      if (cycle === 2) return -Math.cos(a);
      return Math.sin(a);
    },
    radiusOfConvergence: Infinity,
  },
  'eˣ': {
    fn: (x) => Math.exp(x),
    label: 'f(x) = eˣ',
    derivatives: (_n, a) => Math.exp(a),
    radiusOfConvergence: Infinity,
  },
  'ln(1+x)': {
    fn: (x) => x > -1 ? Math.log(1 + x) : NaN,
    label: 'f(x) = ln(1+x)',
    derivatives: (n, _a) => {
      if (n === 0) return Math.log(1 + _a);
      const sign = n % 2 === 1 ? 1 : -1;
      const factorial = (k: number) => { let f = 1; for (let i = 2; i <= k; i++) f *= i; return f; };
      return sign * factorial(n - 1) / Math.pow(1 + _a, n);
    },
    radiusOfConvergence: 1,
  },
  '1/(1-x)': {
    fn: (x) => x === 1 ? NaN : 1 / (1 - x),
    label: 'f(x) = 1/(1-x)',
    derivatives: (n, _a) => {
      let result = 1;
      for (let i = 0; i < n; i++) result *= (i + 1);
      return result / Math.pow(1 - _a, n + 1);
    },
    radiusOfConvergence: 1,
  },
};

function factorial(n: number): number {
  let f = 1;
  for (let i = 2; i <= n; i++) f *= i;
  return f;
}

export function TaylorExplorer({
  width = 640,
  height = 400,
}: TaylorExplorerProps) {
  const [fnKey, setFnKey] = useState('sin(x)');
  const [degree, setDegree] = useState(3);
  const [center, setCenter] = useState(0);
  const currentFn = FUNCTIONS[fnKey];

  const padding = { top: 20, right: 30, bottom: 40, left: 50 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const xMin = -6;
  const xMax = 6;
  const yMin = -4;
  const yMax = 4;

  const sx = (x: number) => padding.left + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y: number) => padding.top + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  // Compute Taylor polynomial value at x, centered at a, degree n
  const taylorAt = (x: number, a: number, n: number): number => {
    let sum = 0;
    for (let k = 0; k <= n; k++) {
      const dk = currentFn.derivatives(k, a);
      sum += dk / factorial(k) * Math.pow(x - a, k);
    }
    return sum;
  };

  const originalPath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 300; i++) {
      const x = xMin + (i / 300) * (xMax - xMin);
      const y = currentFn.fn(x);
      if (isNaN(y) || y < yMin - 1 || y > yMax + 1) continue;
      pts.push(`${i === 0 || pts.length === 0 ? 'M' : 'L'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`);
    }
    return pts.join(' ');
  }, [fnKey]);

  const taylorPath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 300; i++) {
      const x = xMin + (i / 300) * (xMax - xMin);
      const y = taylorAt(x, center, degree);
      if (isNaN(y) || y < yMin - 2 || y > yMax + 2) continue;
      pts.push(`${i === 0 || pts.length === 0 ? 'M' : 'L'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`);
    }
    return pts.join(' ');
  }, [fnKey, degree, center]);

  // Residual path (error)
  const residualPath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 300; i++) {
      const x = xMin + (i / 300) * (xMax - xMin);
      const orig = currentFn.fn(x);
      const tay = taylorAt(x, center, degree);
      if (isNaN(orig) || isNaN(tay)) continue;
      const err = orig - tay;
      if (err < yMin - 1 || err > yMax + 1) continue;
      pts.push(`${i === 0 || pts.length === 0 ? 'M' : 'L'}${sx(x).toFixed(1)},${sy(err).toFixed(1)}`);
    }
    return pts.join(' ');
  }, [fnKey, degree, center]);

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

        {/* Residual (error) as thin red line */}
        <path d={residualPath} fill="none" stroke="var(--color-vector-red)" strokeWidth={1} opacity={0.4} />

        {/* Original function */}
        <path d={originalPath} fill="none" stroke="var(--color-vector-blue)" strokeWidth={2.5} />

        {/* Taylor polynomial */}
        <path d={taylorPath} fill="none" stroke="var(--color-vector-yellow)" strokeWidth={2} strokeDasharray="6,3" />

        {/* Center point marker */}
        <circle cx={sx(center)} cy={sy(currentFn.fn(center))} r={5} fill="var(--color-accent)" stroke="var(--color-paper)" strokeWidth={2} />

        {/* Radius of convergence */}
        {currentFn.radiusOfConvergence !== Infinity && (
          <>
            <line x1={sx(center - currentFn.radiusOfConvergence)} y1={sy(yMin)} x2={sx(center - currentFn.radiusOfConvergence)} y2={sy(yMax)} stroke="var(--color-vector-red)" strokeWidth={1} strokeDasharray="2,4" opacity={0.5} />
            <line x1={sx(center + currentFn.radiusOfConvergence)} y1={sy(yMin)} x2={sx(center + currentFn.radiusOfConvergence)} y2={sy(yMax)} stroke="var(--color-vector-red)" strokeWidth={1} strokeDasharray="2,4" opacity={0.5} />
          </>
        )}

        {/* Legend */}
        <line x1={20} y1={12} x2={40} y2={12} stroke="var(--color-vector-blue)" strokeWidth={2.5} />
        <text x={44} y={16} className="text-[10px]" fill="var(--color-ink-muted)" style={{ fontFamily: 'var(--font-sans)' }}>{currentFn.label}</text>
        <line x1={20} y1={26} x2={40} y2={26} stroke="var(--color-vector-yellow)" strokeWidth={2} strokeDasharray="4,2" />
        <text x={44} y={30} className="text-[10px]" fill="var(--color-ink-muted)" style={{ fontFamily: 'var(--font-sans)' }}>T_{degree}(x)</text>
      </svg>

      <div className="flex flex-wrap items-center gap-4 border-t border-rule bg-paper-elevated px-4 py-3">
        <label className="flex items-center gap-2 font-sans text-xs text-ink-muted">
          n =
          <input type="range" min={0} max={20} step={1} value={degree} onChange={(e) => setDegree(+e.target.value)} className="h-1 w-24 cursor-pointer accent-[var(--color-vector-yellow)]" />
          <span className="font-mono text-xs text-ink w-4">{degree}</span>
        </label>

        <label className="flex items-center gap-2 font-sans text-xs text-ink-muted">
          center =
          <input type="range" min={-3} max={3} step={0.5} value={center} onChange={(e) => setCenter(+e.target.value)} className="h-1 w-20 cursor-pointer accent-[var(--color-accent)]" />
          <span className="font-mono text-xs text-ink w-6">{center.toFixed(1)}</span>
        </label>

        <div className="flex gap-1">
          {Object.keys(FUNCTIONS).map((k) => (
            <button key={k} type="button" onClick={() => { setFnKey(k); setDegree(3); setCenter(0); }}
              className={`rounded-sm border px-2 py-0.5 font-mono text-[11px] transition-colors duration-fast ${k === fnKey ? 'border-accent bg-accent-soft text-accent' : 'border-rule bg-paper-elevated text-ink-muted hover:bg-surface-1'}`}>
              {k}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
