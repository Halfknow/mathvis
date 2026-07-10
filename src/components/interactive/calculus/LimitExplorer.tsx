import { useState, useMemo } from 'react';

interface LimitExplorerProps {
  width?: number;
  height?: number;
}

type LimitFn = {
  fn: (x: number) => number;
  label: string;
  limitPoint: number;
  hasLimit: boolean;
  limitValue?: number;
  yRange: [number, number];
};

const FUNCTIONS: Record<string, LimitFn> = {
  'sin(x)/x': {
    fn: (x) => x === 0 ? NaN : Math.sin(x) / x,
    label: 'f(x) = sin(x) / x',
    limitPoint: 0,
    hasLimit: true,
    limitValue: 1,
    yRange: [-0.5, 1.5],
  },
  '|x|/x': {
    fn: (x) => x === 0 ? NaN : Math.abs(x) / x,
    label: 'f(x) = |x| / x',
    limitPoint: 0,
    hasLimit: false,
    yRange: [-2, 2],
  },
  'x²-1 / x-1': {
    fn: (x) => x === 1 ? NaN : (x * x - 1) / (x - 1),
    label: 'f(x) = (x²−1) / (x−1)',
    limitPoint: 1,
    hasLimit: true,
    limitValue: 2,
    yRange: [-1, 4],
  },
  'sin(1/x)': {
    fn: (x) => x === 0 ? NaN : Math.sin(1 / x),
    label: 'f(x) = sin(1/x)',
    limitPoint: 0,
    hasLimit: false,
    yRange: [-1.5, 1.5],
  },
};

export function LimitExplorer({
  width = 640,
  height = 400,
}: LimitExplorerProps) {
  const [fnKey, setFnKey] = useState('sin(x)/x');
  const [epsilon, setEpsilon] = useState(0.5);
  const currentFn = FUNCTIONS[fnKey];

  const padding = { top: 30, right: 30, bottom: 40, left: 50 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const xCenter = currentFn.limitPoint;
  const xSpan = 3;
  const xMin = xCenter - xSpan;
  const xMax = xCenter + xSpan;
  const [yMin, yMax] = currentFn.yRange;

  const sx = (x: number) => padding.left + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y: number) => padding.top + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  // Compute delta for the given epsilon
  const delta = useMemo(() => {
    if (!currentFn.hasLimit || currentFn.limitValue === undefined) return 0;
    const L = currentFn.limitValue;
    const a = currentFn.limitPoint;
    // Numerically find smallest delta where |f(x) - L| < epsilon for all x in (a-delta, a+delta)
    let d = xSpan;
    for (let i = 0; i < 200; i++) {
      const testD = (i / 200) * xSpan;
      let allWithin = true;
      for (let j = -20; j <= 20; j++) {
        const x = a + (j / 20) * testD;
        if (x === a) continue;
        const y = currentFn.fn(x);
        if (isNaN(y) || Math.abs(y - L) >= epsilon) {
          allWithin = false;
          break;
        }
      }
      if (allWithin) {
        d = testD;
        break;
      }
    }
    return d;
  }, [epsilon, fnKey]);

  const curvePath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 400; i++) {
      const x = xMin + (i / 400) * (xMax - xMin);
      const y = currentFn.fn(x);
      if (isNaN(y) || y < yMin - 1 || y > yMax + 1) {
        if (pts.length > 0 && !pts[pts.length - 1].startsWith('M')) {
          // gap
        }
        continue;
      }
      const needsMove = pts.length === 0 || (i > 0 && isNaN(currentFn.fn(x - (xMax - xMin) / 400)));
      pts.push(`${needsMove ? 'M' : 'L'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`);
    }
    return pts.join(' ');
  }, [fnKey, width, height]);

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
  }, [fnKey, width, height]);

  const limitY = currentFn.limitValue ?? 0;
  const limitX = currentFn.limitPoint;

  return (
    <div className="flex h-full w-full flex-col">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ background: 'var(--color-paper)' }}
      >
        {gridLines}

        {/* Epsilon band (horizontal, around limit value) */}
        {currentFn.hasLimit && (
          <rect
            x={padding.left}
            y={sy(limitY + epsilon)}
            width={plotW}
            height={sy(limitY - epsilon) - sy(limitY + epsilon)}
            fill="var(--color-vector-green)"
            opacity={0.1}
          />
        )}

        {/* Delta band (vertical, around limit point) */}
        {currentFn.hasLimit && delta > 0 && (
          <rect
            x={sx(limitX - delta)}
            y={padding.top}
            width={sx(limitX + delta) - sx(limitX - delta)}
            height={plotH}
            fill="var(--color-vector-blue)"
            opacity={0.08}
          />
        )}

        {/* The function curve */}
        <path d={curvePath} fill="none" stroke="var(--color-vector-blue)" strokeWidth={2.5} />

        {/* Limit point marker (open circle) */}
        <circle
          cx={sx(limitX)}
          cy={sy(limitY)}
          r={6}
          fill="var(--color-paper)"
          stroke={currentFn.hasLimit ? 'var(--color-accent)' : 'var(--color-vector-red)'}
          strokeWidth={2}
        />

        {/* Limit value dashed line */}
        {currentFn.hasLimit && (
          <line
            x1={padding.left}
            y1={sy(limitY)}
            x2={width - padding.right}
            y2={sy(limitY)}
            stroke="var(--color-accent)"
            strokeWidth={1}
            strokeDasharray="4,4"
            opacity={0.6}
          />
        )}

        {/* Limit point vertical dashed line */}
        <line
          x1={sx(limitX)}
          y1={padding.top}
          x2={sx(limitX)}
          y2={height - padding.bottom}
          stroke="var(--color-ink-muted)"
          strokeWidth={1}
          strokeDasharray="3,3"
          opacity={0.4}
        />

        {/* Epsilon labels */}
        {currentFn.hasLimit && (
          <>
            <text x={padding.left + 4} y={sy(limitY + epsilon) - 4} className="text-[10px]" fill="var(--color-vector-green)" style={{ fontFamily: 'var(--font-sans)' }}>
              L + ε
            </text>
            <text x={padding.left + 4} y={sy(limitY - epsilon) + 12} className="text-[10px]" fill="var(--color-vector-green)" style={{ fontFamily: 'var(--font-sans)' }}>
              L − ε
            </text>
            <text x={width - padding.right - 30} y={sy(limitY) - 6} className="text-[10px] font-bold" fill="var(--color-accent)" style={{ fontFamily: 'var(--font-sans)' }}>
              L = {limitY}
            </text>
          </>
        )}

        {/* Delta labels */}
        {currentFn.hasLimit && delta > 0 && (
          <>
            <text x={sx(limitX - delta) - 4} y={height - padding.bottom + 14} className="text-[10px]" fill="var(--color-vector-blue)" textAnchor="middle" style={{ fontFamily: 'var(--font-sans)' }}>
              a−δ
            </text>
            <text x={sx(limitX + delta) + 4} y={height - padding.bottom + 14} className="text-[10px]" fill="var(--color-vector-blue)" textAnchor="middle" style={{ fontFamily: 'var(--font-sans)' }}>
              a+δ
            </text>
          </>
        )}
      </svg>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 border-t border-rule bg-paper-elevated px-4 py-3">
        <label className="flex items-center gap-2 font-sans text-xs text-ink-muted">
          ε =
          <input
            type="range"
            min={0.05}
            max={1.5}
            step={0.01}
            value={epsilon}
            onChange={(e) => setEpsilon(+e.target.value)}
            className="h-1 w-28 cursor-pointer accent-[var(--color-vector-green)]"
          />
          <span className="font-mono text-xs text-ink w-10">{epsilon.toFixed(2)}</span>
        </label>

        <div className="flex gap-1">
          {Object.keys(FUNCTIONS).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => { setFnKey(k); setEpsilon(0.5); }}
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
          <span className="text-vector-green">δ ≈ {delta.toFixed(3)}</span>
          <span className={currentFn.hasLimit ? 'text-accent' : 'text-vector-red'}>
            {currentFn.hasLimit ? `lim = ${limitY}` : 'limit DNE'}
          </span>
        </div>
      </div>
    </div>
  );
}
