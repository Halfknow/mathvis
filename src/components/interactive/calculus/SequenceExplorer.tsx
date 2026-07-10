import { useState, useMemo } from 'react';

interface SequenceExplorerProps {
  width?: number;
  height?: number;
}

type SeqDef = {
  fn: (n: number) => number;
  label: string;
  limit: number | null; // null means diverges / no limit
  epsilon: number; // band width around limit for visual shading
};

const SEQUENCES: Record<string, SeqDef> = {
  '1/n': {
    fn: (n) => 1 / n,
    label: 'aₙ = 1/n',
    limit: 0,
    epsilon: 0.1,
  },
  '(1+1/n)ⁿ': {
    fn: (n) => Math.pow(1 + 1 / n, n),
    label: 'aₙ = (1+1/n)ⁿ',
    limit: Math.E,
    epsilon: 0.05,
  },
  '(-1)ⁿ': {
    fn: (n) => Math.pow(-1, n),
    label: 'aₙ = (-1)ⁿ',
    limit: null,
    epsilon: 0.3,
  },
  'n/(n+1)': {
    fn: (n) => n / (n + 1),
    label: 'aₙ = n/(n+1)',
    limit: 1,
    epsilon: 0.05,
  },
  'n²/2ⁿ': {
    fn: (n) => (n * n) / Math.pow(2, n),
    label: 'aₙ = n²/2ⁿ',
    limit: 0,
    epsilon: 0.1,
  },
};

export function SequenceExplorer({
  width = 640,
  height = 400,
}: SequenceExplorerProps) {
  const [seqKey, setSeqKey] = useState('1/n');
  const [maxN, setMaxN] = useState(30);

  const currentSeq = SEQUENCES[seqKey];

  // Compute all sequence terms
  const points = useMemo(() => {
    const pts: { n: number; val: number }[] = [];
    for (let n = 1; n <= maxN; n++) {
      pts.push({ n, val: currentSeq.fn(n) });
    }
    return pts;
  }, [seqKey, maxN]);

  const lastVal = points.length > 0 ? points[points.length - 1].val : 0;

  // Padding and plot area
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  // Compute y bounds from the data
  const yBounds = useMemo(() => {
    if (points.length === 0) return { yMin: -1, yMax: 1 };
    let minVal = Infinity;
    let maxVal = -Infinity;
    for (const p of points) {
      if (p.val < minVal) minVal = p.val;
      if (p.val > maxVal) maxVal = p.val;
    }
    // Include the limit in the bounds if it exists
    if (currentSeq.limit !== null) {
      if (currentSeq.limit < minVal) minVal = currentSeq.limit;
      if (currentSeq.limit > maxVal) maxVal = currentSeq.limit;
    }
    // Add padding around bounds
    const range = maxVal - minVal || 2;
    const pad = range * 0.1;
    return { yMin: minVal - pad, yMax: maxVal + pad };
  }, [points, currentSeq]);

  const xMin = 0;
  const xMax = maxN + 1;
  const { yMin, yMax } = yBounds;

  const sx = (x: number) => padding.left + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y: number) => padding.top + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  // Grid lines
  const gridLines = useMemo(() => {
    const lines: JSX.Element[] = [];
    // Vertical grid: at every 5th or 10th n depending on maxN
    const xStep = maxN <= 20 ? 5 : 10;
    for (let x = xStep; x <= maxN; x += xStep) {
      lines.push(
        <line
          key={`v${x}`}
          x1={sx(x)}
          y1={sy(yMin)}
          x2={sx(x)}
          y2={sy(yMax)}
          stroke="var(--color-rule)"
          strokeWidth={0.5}
        />,
      );
    }
    // Horizontal grid: nice round ticks
    const yRange = yMax - yMin;
    const yStep = yRange > 4 ? 1 : yRange > 2 ? 0.5 : 0.25;
    const yStart = Math.ceil(yMin / yStep) * yStep;
    for (let y = yStart; y <= yMax; y += yStep) {
      const isZero = Math.abs(y) < 1e-9;
      lines.push(
        <line
          key={`h${y.toFixed(3)}`}
          x1={sx(xMin)}
          y1={sy(y)}
          x2={sx(xMax)}
          y2={sy(y)}
          stroke={isZero ? 'var(--color-ink-faint)' : 'var(--color-rule)'}
          strokeWidth={isZero ? 1 : 0.5}
        />,
      );
    }
    return lines;
  }, [maxN, yMin, yMax, width, height]);

  // Axis tick labels
  const tickLabels = useMemo(() => {
    const labels: JSX.Element[] = [];
    // X-axis ticks
    const xStep = maxN <= 20 ? 5 : 10;
    for (let x = xStep; x <= maxN; x += xStep) {
      labels.push(
        <text
          key={`xl${x}`}
          x={sx(x)}
          y={height - 8}
          textAnchor="middle"
          className="text-[10px]"
          fill="var(--color-ink-muted)"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          {x}
        </text>,
      );
    }
    // Y-axis ticks
    const yRange = yMax - yMin;
    const yStep = yRange > 4 ? 1 : yRange > 2 ? 0.5 : 0.25;
    const yStart = Math.ceil(yMin / yStep) * yStep;
    for (let y = yStart; y <= yMax; y += yStep) {
      labels.push(
        <text
          key={`yl${y.toFixed(3)}`}
          x={padding.left - 8}
          y={sy(y) + 3}
          textAnchor="end"
          className="text-[10px]"
          fill="var(--color-ink-muted)"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          {Number.isInteger(y) ? y : y.toFixed(1)}
        </text>,
      );
    }
    return labels;
  }, [maxN, yMin, yMax, width, height]);

  // Connecting line path between terms
  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    return points
      .map((p, i) => {
        const cmd = i === 0 ? 'M' : 'L';
        return `${cmd}${sx(p.n).toFixed(1)},${sy(p.val).toFixed(1)}`;
      })
      .join(' ');
  }, [points, yMin, yMax, width, height]);

  const limit = currentSeq.limit;
  const converges = limit !== null;

  return (
    <div className="flex h-full w-full flex-col">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ background: 'var(--color-paper)' }}
      >
        {gridLines}
        {tickLabels}

        {/* Axis labels */}
        <text
          x={width / 2}
          y={height - 2}
          textAnchor="middle"
          className="text-[11px]"
          fill="var(--color-ink-muted)"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          n
        </text>
        <text
          x={12}
          y={height / 2}
          textAnchor="middle"
          className="text-[11px]"
          fill="var(--color-ink-muted)"
          style={{ fontFamily: 'var(--font-sans)', transform: 'rotate(-90deg)', transformOrigin: `${12}px ${height / 2}px` }}
        >
          aₙ
        </text>

        {/* Epsilon band around limit */}
        {converges && (
          <rect
            x={sx(xMin)}
            y={sy(limit + currentSeq.epsilon)}
            width={sx(xMax) - sx(xMin)}
            height={sy(limit - currentSeq.epsilon) - sy(limit + currentSeq.epsilon)}
            fill="var(--color-vector-green)"
            opacity={0.1}
          />
        )}

        {/* Limit horizontal dashed line */}
        {converges && (
          <line
            x1={sx(xMin)}
            y1={sy(limit)}
            x2={sx(xMax)}
            y2={sy(limit)}
            stroke="var(--color-vector-green)"
            strokeWidth={1.5}
            strokeDasharray="6,4"
          />
        )}

        {/* Connecting line between terms */}
        <path
          d={linePath}
          fill="none"
          stroke="var(--color-vector-blue)"
          strokeWidth={1}
          opacity={0.5}
        />

        {/* Dots for each term */}
        {points.map((p) => (
          <circle
            key={p.n}
            cx={sx(p.n)}
            cy={sy(p.val)}
            r={3}
            fill="var(--color-vector-blue)"
            stroke="var(--color-paper)"
            strokeWidth={1}
          />
        ))}

        {/* Legend */}
        <g>
          <circle cx={width - 135} cy={16} r={3} fill="var(--color-vector-blue)" />
          <text
            x={width - 128}
            y={20}
            className="text-[10px]"
            fill="var(--color-ink-muted)"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            aₙ terms
          </text>

          {converges && (
            <>
              <line
                x1={width - 135}
                y1={32}
                x2={width - 115}
                y2={32}
                stroke="var(--color-vector-green)"
                strokeWidth={1.5}
                strokeDasharray="4,2"
              />
              <text
                x={width - 108}
                y={36}
                className="text-[10px]"
                fill="var(--color-ink-muted)"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                L = {limit === Math.E ? 'e' : limit.toFixed(2)}
              </text>
            </>
          )}
        </g>
      </svg>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 border-t border-rule bg-paper-elevated px-4 py-3">
        <label className="flex items-center gap-2 font-sans text-xs text-ink-muted">
          n max =
          <input
            type="range"
            min={10}
            max={100}
            step={1}
            value={maxN}
            onChange={(e) => setMaxN(+e.target.value)}
            className="h-1 w-32 cursor-pointer accent-[var(--color-accent)]"
          />
          <span className="font-mono text-xs text-ink w-8">{maxN}</span>
        </label>

        <div className="flex gap-1">
          {Object.keys(SEQUENCES).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setSeqKey(k)}
              className={`rounded-sm border px-2 py-0.5 font-mono text-[11px] transition-colors duration-fast ${
                k === seqKey
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-rule bg-paper-elevated text-ink-muted hover:bg-surface-1'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* Readout */}
      <div className="flex flex-wrap items-center gap-4 border-t border-rule bg-surface-1 px-4 py-2 font-mono text-[11px]">
        <span className="text-ink-muted">
          n: 1 → {maxN}
        </span>
        <span className="text-vector-blue">
          a<sub>{maxN}</sub> = {lastVal.toFixed(6)}
        </span>
        <span className="flex items-center gap-1.5">
          {converges ? (
            <>
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: 'var(--color-vector-green)' }} />
              <span className="text-vector-green">
                L = {limit === Math.E ? 'e ≈ 2.718...' : limit.toFixed(4)}
              </span>
            </>
          ) : (
            <>
              <span className="inline-block h-2 w-2 rounded-full" style={{ background: 'var(--color-vector-red)' }} />
              <span className="text-vector-red">Diverges</span>
            </>
          )}
        </span>
        <span className="ml-auto font-sans text-[10px] text-ink-muted">
          {currentSeq.label}
        </span>
      </div>
    </div>
  );
}
