import { useState, useMemo } from 'react';

interface SeriesExplorerProps {
  width?: number;
  height?: number;
}

type Mode = 'partial-sums' | 'terms';

type SeriesDef = {
  /** Returns the n-th term a_n (1-indexed). */
  term: (n: number) => number;
  /** Known sum, or null if divergent. */
  sum: number | null;
  /** Display label. */
  label: string;
  /** Short key used in buttons. */
  shortLabel: string;
};

const PRESETS: Record<string, SeriesDef> = {
  'geo-1/2': {
    term: (n) => Math.pow(1 / 2, n),
    sum: 1,
    label: '\u03A3(1/2)\u207F = 1',
    shortLabel: 'Geo 1/2',
  },
  'geo-2/3': {
    term: (n) => Math.pow(2 / 3, n),
    sum: 2,
    label: '\u03A3(2/3)\u207F = 2',
    shortLabel: 'Geo 2/3',
  },
  harmonic: {
    term: (n) => 1 / n,
    sum: null,
    label: '\u03A3 1/n (diverges)',
    shortLabel: 'Harmonic',
  },
  'alt-harmonic': {
    term: (n) => Math.pow(-1, n + 1) / n,
    sum: Math.LN2,
    label: '\u03A3(-1)\u207F\u207A\u00B9/n = ln(2)',
    shortLabel: 'Alt Harm',
  },
  'p-series-2': {
    term: (n) => 1 / (n * n),
    sum: (Math.PI * Math.PI) / 6,
    label: '\u03A3 1/n\u00B2 = \u03C0\u00B2/6',
    shortLabel: 'p-series 2',
  },
};

export function SeriesExplorer({
  width = 640,
  height = 400,
}: SeriesExplorerProps) {
  const [presetKey, setPresetKey] = useState('geo-1/2');
  const [maxN, setMaxN] = useState(30);
  const [mode, setMode] = useState<Mode>('partial-sums');

  const preset = PRESETS[presetKey];

  // ---- Computed data ----
  const { terms, partialSums } = useMemo(() => {
    const t: number[] = [];
    const s: number[] = [];
    let running = 0;
    for (let i = 1; i <= maxN; i++) {
      const a_i = preset.term(i);
      t.push(a_i);
      running += a_i;
      s.push(running);
    }
    return { terms: t, partialSums: s };
  }, [presetKey, maxN]);

  // ---- Layout constants ----
  const padding = { top: 24, right: 24, bottom: 40, left: 56 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  // ---- Axis ranges ----
  const xMin = 0.5;
  const xMax = maxN + 0.5;

  const { yMin, yMax } = useMemo(() => {
    const data = mode === 'partial-sums' ? partialSums : terms;
    if (data.length === 0) return { yMin: -1, yMax: 1 };
    let lo = Math.min(...data);
    let hi = Math.max(...data);
    // Include known sum in range for partial-sums mode
    if (mode === 'partial-sums' && preset.sum !== null) {
      lo = Math.min(lo, preset.sum);
      hi = Math.max(hi, preset.sum);
    }
    // Add padding
    const span = hi - lo || 1;
    lo -= span * 0.12;
    hi += span * 0.12;
    return { yMin: lo, yMax: hi };
  }, [mode, partialSums, terms, preset.sum, maxN]);

  // ---- Coordinate transforms ----
  const sx = (x: number) =>
    padding.left + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y: number) =>
    padding.top + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  // ---- Grid ----
  const gridLines = useMemo(() => {
    const lines: JSX.Element[] = [];

    // Vertical grid lines — every 5 indices, plus first and last
    const xStep = maxN <= 20 ? 5 : 10;
    for (let x = Math.ceil(xMin / xStep) * xStep; x <= maxN; x += xStep) {
      const isAxis = false;
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
    // Y-axis grid lines
    const ySpan = yMax - yMin;
    const yStep =
      ySpan > 20 ? 5 : ySpan > 8 ? 2 : ySpan > 3 ? 1 : ySpan > 1 ? 0.5 : 0.1;
    for (
      let y = Math.ceil(yMin / yStep) * yStep;
      y <= yMax;
      y += yStep
    ) {
      const isAxis = Math.abs(y) < yStep * 0.01;
      lines.push(
        <line
          key={`h${y.toFixed(3)}`}
          x1={sx(xMin)}
          y1={sy(y)}
          x2={sx(xMax)}
          y2={sy(y)}
          stroke={isAxis ? 'var(--color-ink-faint)' : 'var(--color-rule)'}
          strokeWidth={isAxis ? 1 : 0.5}
        />,
      );
    }
    return lines;
  }, [width, height, maxN, yMin, yMax]);

  // ---- Axis labels ----
  const axisLabels = useMemo(() => {
    const labels: JSX.Element[] = [];
    // X-axis ticks
    const xStep = maxN <= 20 ? 5 : 10;
    for (let x = Math.ceil(1 / xStep) * xStep; x <= maxN; x += xStep) {
      labels.push(
        <text
          key={`xl${x}`}
          x={sx(x)}
          y={height - padding.bottom + 18}
          textAnchor="middle"
          className="text-[10px]"
          fill="var(--color-ink-faint)"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          {x}
        </text>,
      );
    }
    // Y-axis ticks
    const ySpan = yMax - yMin;
    const yStep =
      ySpan > 20 ? 5 : ySpan > 8 ? 2 : ySpan > 3 ? 1 : ySpan > 1 ? 0.5 : 0.1;
    for (
      let y = Math.ceil(yMin / yStep) * yStep;
      y <= yMax;
      y += yStep
    ) {
      const labelY = Math.abs(y) < 1e-9 ? 0 : y;
      labels.push(
        <text
          key={`yl${y.toFixed(3)}`}
          x={padding.left - 8}
          y={sy(y) + 3}
          textAnchor="end"
          className="text-[10px]"
          fill="var(--color-ink-faint)"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          {Number.isInteger(labelY) ? labelY : labelY.toFixed(2)}
        </text>,
      );
    }
    // Axis titles
    labels.push(
      <text
        key="xlabel"
        x={width / 2}
        y={height - 2}
        textAnchor="middle"
        className="text-[11px]"
        fill="var(--color-ink-muted)"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        n
      </text>,
    );
    const yLabel = mode === 'partial-sums' ? 'S\u2099' : 'a\u2099';
    labels.push(
      <text
        key="ylabel"
        x={6}
        y={padding.top + plotH / 2}
        textAnchor="middle"
        className="text-[11px]"
        fill="var(--color-ink-muted)"
        style={{
          fontFamily: 'var(--font-sans)',
          transform: `rotate(-90deg, 6, ${padding.top + plotH / 2})`,
        }}
        transform={`rotate(-90, 12, ${padding.top + plotH / 2})`}
      >
        {yLabel}
      </text>,
    );
    return labels;
  }, [width, height, maxN, yMin, yMax, mode]);

  // ---- Data line (partial sums or terms) ----
  const dataLinePath = useMemo(() => {
    const data = mode === 'partial-sums' ? partialSums : terms;
    if (data.length === 0) return '';
    return data
      .map((val, i) => {
        const x = i + 1;
        const cmd = i === 0 ? 'M' : 'L';
        return `${cmd}${sx(x).toFixed(1)},${sy(val).toFixed(1)}`;
      })
      .join(' ');
  }, [mode, partialSums, terms, maxN, yMin, yMax, width, height]);

  // ---- Convergence band (only for partial-sums mode with known sum) ----
  const convergenceBand = useMemo(() => {
    if (mode !== 'partial-sums' || preset.sum === null) return null;
    const s = preset.sum;
    const lastSn = partialSums[partialSums.length - 1];
    const error = Math.abs(s - lastSn);
    const bandHalf = Math.max(error, (yMax - yMin) * 0.03);

    const bandYTop = Math.min(s + bandHalf, yMax);
    const bandYBot = Math.max(s - bandHalf, yMin);

    return (
      <rect
        x={sx(xMin)}
        y={sy(bandYTop)}
        width={sx(xMax) - sx(xMin)}
        height={sy(bandYBot) - sy(bandYTop)}
        fill="var(--color-vector-yellow)"
        opacity={0.1}
      />
    );
  }, [mode, preset.sum, partialSums, yMin, yMax, maxN, width, height]);

  // ---- Known sum line ----
  const sumLine = useMemo(() => {
    if (preset.sum === null) return null;
    const y = preset.sum;
    return (
      <line
        x1={sx(xMin)}
        y1={sy(y)}
        x2={sx(xMax)}
        y2={sy(y)}
        stroke="var(--color-vector-yellow)"
        strokeWidth={1.5}
        strokeDasharray="6,4"
      />
    );
  }, [preset.sum, yMin, yMax, maxN, width, height]);

  // ---- Data dots ----
  const dataDots = useMemo(() => {
    const data = mode === 'partial-sums' ? partialSums : terms;
    const dotColor =
      mode === 'partial-sums'
        ? 'var(--color-vector-blue)'
        : 'var(--color-vector-green)';
    const r = mode === 'partial-sums' ? 4 : 3;
    return data.map((val, i) => (
      <circle
        key={i}
        cx={sx(i + 1)}
        cy={sy(val)}
        r={r}
        fill={dotColor}
        stroke="var(--color-paper)"
        strokeWidth={1}
      />
    ));
  }, [mode, partialSums, terms, yMin, yMax, maxN, width, height]);

  // ---- Readout values ----
  const currentSn = partialSums[partialSums.length - 1] ?? 0;
  const knownSum = preset.sum;
  const error =
    knownSum !== null ? Math.abs(knownSum - currentSn) : null;
  const converges = knownSum !== null;

  const statusText = converges
    ? `Converges to ${knownSum === Math.LN2 ? 'ln(2)' : knownSum === 1 ? '1' : knownSum === 2 ? '2' : '\u03C0\u00B2/6'}`
    : 'Diverges';
  const statusColor = converges
    ? 'var(--color-vector-green)'
    : 'var(--color-vector-red)';

  // ---- Legend items ----
  const legendX = width - 150;
  const legendItems: JSX.Element[] = [];

  if (mode === 'partial-sums') {
    legendItems.push(
      <circle
        key="legend-sn"
        cx={legendX}
        cy={18}
        r={4}
        fill="var(--color-vector-blue)"
      />,
      <line
        key="legend-sn-line"
        x1={legendX - 8}
        y1={18}
        x2={legendX + 8}
        y2={18}
        stroke="var(--color-vector-blue)"
        strokeWidth={2}
      />,
      <text
        key="legend-sn-text"
        x={legendX + 14}
        y={22}
        className="text-[10px]"
        fill="var(--color-ink-muted)"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        S\u2099 partial sums
      </text>,
    );
  } else {
    legendItems.push(
      <circle
        key="legend-an"
        cx={legendX}
        cy={18}
        r={3}
        fill="var(--color-vector-green)"
      />,
      <line
        key="legend-an-line"
        x1={legendX - 8}
        y1={18}
        x2={legendX + 8}
        y2={18}
        stroke="var(--color-vector-green)"
        strokeWidth={2}
      />,
      <text
        key="legend-an-text"
        x={legendX + 14}
        y={22}
        className="text-[10px]"
        fill="var(--color-ink-muted)"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        a\u2099 terms
      </text>,
    );
  }

  if (knownSum !== null) {
    legendItems.push(
      <line
        key="legend-sum-line"
        x1={legendX - 8}
        y1={34}
        x2={legendX + 8}
        y2={34}
        stroke="var(--color-vector-yellow)"
        strokeWidth={1.5}
        strokeDasharray="4,3"
      />,
      <text
        key="legend-sum-text"
        x={legendX + 14}
        y={38}
        className="text-[10px]"
        fill="var(--color-ink-muted)"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        S (known sum)
      </text>,
    );
  }

  return (
    <div className="flex h-full w-full flex-col">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ background: 'var(--color-paper)' }}
      >
        {gridLines}
        {axisLabels}

        {/* Convergence band */}
        {convergenceBand}

        {/* Known sum dashed line */}
        {sumLine}

        {/* Data line path */}
        <path
          d={dataLinePath}
          fill="none"
          stroke={
            mode === 'partial-sums'
              ? 'var(--color-vector-blue)'
              : 'var(--color-vector-green)'
          }
          strokeWidth={2}
        />

        {/* Data dots */}
        {dataDots}

        {/* Legend */}
        {legendItems}
      </svg>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 border-t border-rule bg-paper-elevated px-4 py-3">
        {/* n slider */}
        <label className="flex items-center gap-2 font-sans text-xs text-ink-muted">
          n =
          <input
            type="range"
            min={5}
            max={80}
            step={1}
            value={maxN}
            onChange={(e) => setMaxN(+e.target.value)}
            className="h-1 w-28 cursor-pointer accent-[var(--color-accent)]"
          />
          <span className="font-mono text-xs text-ink w-8">{maxN}</span>
        </label>

        {/* Mode toggle */}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMode('partial-sums')}
            className={`rounded-sm border px-2 py-0.5 font-sans text-[11px] transition-colors duration-fast ${
              mode === 'partial-sums'
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-rule bg-paper-elevated text-ink-muted hover:bg-surface-1'
            }`}
          >
            Partial Sums
          </button>
          <button
            type="button"
            onClick={() => setMode('terms')}
            className={`rounded-sm border px-2 py-0.5 font-sans text-[11px] transition-colors duration-fast ${
              mode === 'terms'
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-rule bg-paper-elevated text-ink-muted hover:bg-surface-1'
            }`}
          >
            Terms
          </button>
        </div>

        {/* Preset selector */}
        <div className="flex gap-1">
          {Object.entries(PRESETS).map(([key, def]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setPresetKey(key);
              }}
              className={`rounded-sm border px-2 py-0.5 font-mono text-[11px] transition-colors duration-fast ${
                key === presetKey
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-rule bg-paper-elevated text-ink-muted hover:bg-surface-1'
              }`}
            >
              {def.shortLabel}
            </button>
          ))}
        </div>
      </div>

      {/* Readout */}
      <div className="flex flex-wrap items-center gap-4 border-t border-rule bg-surface-1 px-4 py-2 font-mono text-[11px]">
        <span className="text-vector-blue">
          S{'\u2099'} = {currentSn.toFixed(6)}
        </span>
        {knownSum !== null && (
          <span className="text-vector-yellow">
            S = {knownSum === Math.LN2 ? 'ln(2)' : knownSum.toFixed(6)}
          </span>
        )}
        {error !== null && (
          <span className="text-ink-muted">
            |S - S{'\u2099'}| = {error.toFixed(6)}
          </span>
        )}
        <span className="ml-auto font-sans text-[11px]" style={{ color: statusColor }}>
          {statusText}
        </span>
      </div>
    </div>
  );
}
