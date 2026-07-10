import { useState, useMemo, useCallback } from 'react';

interface PowerSeriesVisProps {
  width?: number;
  height?: number;
}

type PowerSeriesDef = {
  fn: (x: number) => number;
  label: string;
  shortLabel: string;
  /** Center of the power series (always 0 for these presets) */
  center: number;
  /** Radius of convergence; Infinity means converges everywhere */
  R: number;
  /** Convergence behavior at left endpoint a - R: true = converges, false = diverges */
  leftEndpointConverges: boolean;
  /** Convergence behavior at right endpoint a + R */
  rightEndpointConverges: boolean;
  /** Compute partial sum S_n(x) = sum_{i=0}^{n} c_i * (x-a)^i */
  partialSum: (x: number, n: number) => number;
};

const PRESETS: Record<string, PowerSeriesDef> = {
  'eˣ': {
    fn: (x) => Math.exp(x),
    label: 'Σ xⁿ/n!',
    shortLabel: 'Σxⁿ/n!',
    center: 0,
    R: Infinity,
    leftEndpointConverges: true,
    rightEndpointConverges: true,
    partialSum: (x, n) => {
      let sum = 0;
      let term = 1; // x^0 / 0!
      for (let i = 0; i <= n; i++) {
        sum += term;
        term *= x / (i + 1);
      }
      return sum;
    },
  },
  '1/(1-x)': {
    fn: (x) => (x === 1 ? NaN : 1 / (1 - x)),
    label: 'Σ xⁿ',
    shortLabel: 'Σxⁿ',
    center: 0,
    R: 1,
    leftEndpointConverges: false,
    rightEndpointConverges: false,
    partialSum: (x, n) => {
      // Geometric series: sum = (1 - x^(n+1)) / (1 - x)
      if (Math.abs(x - 1) < 1e-12) return NaN;
      return (1 - Math.pow(x, n + 1)) / (1 - x);
    },
  },
  'ln(1+x)': {
    fn: (x) => (x > -1 ? Math.log(1 + x) : NaN),
    label: 'Σ (-1)ⁿxⁿ⁺¹/(n+1)',
    shortLabel: 'Σ(-1)ⁿxⁿ⁺¹/(n+1)',
    center: 0,
    R: 1,
    leftEndpointConverges: false, // diverges at x = -1
    rightEndpointConverges: true, // converges at x = 1
    partialSum: (x, n) => {
      let sum = 0;
      for (let i = 0; i <= n; i++) {
        // term = (-1)^i * x^(i+1) / (i+1)
        const sign = i % 2 === 0 ? 1 : -1;
        sum += (sign * Math.pow(x, i + 1)) / (i + 1);
      }
      return sum;
    },
  },
  '-ln(1-x)': {
    fn: (x) => (x < 1 ? -Math.log(1 - x) : NaN),
    label: 'Σ xⁿ/n',
    shortLabel: 'Σxⁿ/n',
    center: 0,
    R: 1,
    leftEndpointConverges: true, // converges at x = -1 (alternating harmonic)
    rightEndpointConverges: false, // diverges at x = 1 (harmonic series)
    partialSum: (x, n) => {
      let sum = 0;
      for (let i = 1; i <= n; i++) {
        sum += Math.pow(x, i) / i;
      }
      return sum;
    },
  },
};

export function PowerSeriesVis({
  width = 640,
  height = 400,
}: PowerSeriesVisProps) {
  const [presetKey, setPresetKey] = useState('1/(1-x)');
  const [degree, setDegree] = useState(5);
  const [currentX, setCurrentX] = useState(0.5);

  const preset = PRESETS[presetKey];

  // Determine if current x is in the convergent region
  const convergenceStatus = useMemo(() => {
    const { R, center, leftEndpointConverges, rightEndpointConverges } = preset;
    if (R === Infinity) return 'converges' as const;
    const dist = Math.abs(currentX - center);
    if (dist < R - 1e-9) return 'converges' as const;
    if (dist > R + 1e-9) return 'diverges' as const;
    // At an endpoint
    if (currentX < center) return leftEndpointConverges ? ('converges' as const) : ('diverges' as const);
    return rightEndpointConverges ? ('converges' as const) : ('diverges' as const);
  }, [presetKey, currentX]);

  // Layout: top panel ~30% for number line, bottom panel ~70% for function plot
  const topPanelH = Math.round(height * 0.28);
  const bottomPanelH = height - topPanelH;

  const topPad = { top: 15, right: 30, bottom: 15, left: 50 };
  const botPad = { top: 15, right: 30, bottom: 35, left: 50 };

  const topW = width - topPad.left - topPad.right;
  const topInnerH = topPanelH - topPad.top - topPad.bottom;
  const botW = width - botPad.left - botPad.right;
  const botInnerH = bottomPanelH - botPad.top - botPad.bottom;

  // X range for both panels — widen for infinite R
  const xRange = useMemo(() => {
    if (preset.R === Infinity) return 12;
    // Show R on each side plus some margin
    return Math.max(preset.R * 3, 4);
  }, [presetKey]);
  const xMin = -xRange / 2;
  const xMax = xRange / 2;

  // Y range for function plot
  const yMin = -3;
  const yMax = 6;

  // Scale functions for top panel (number line)
  const tsx = useCallback((x: number) => topPad.left + ((x - xMin) / (xMax - xMin)) * topW, [xMin, xMax, topW, topPad.left]);
  // Number line y coordinate (constant, used directly)
  const numLineY = topPad.top + topInnerH / 2;

  // Scale functions for bottom panel (function plot)
  const bsx = useCallback((x: number) => botPad.left + ((x - xMin) / (xMax - xMin)) * botW, [xMin, xMax, botW, botPad.left]);
  const bsy = useCallback((y: number) => botPad.top + botInnerH - ((y - yMin) / (yMax - yMin)) * botInnerH, [botInnerH, botPad.top, yMin, yMax]);

  // Build SVG path from a function
  const buildPath = useCallback(
    (fn: (x: number) => number, sx: (x: number) => number, sy: (y: number) => number, clipY = true) => {
      const pts: string[] = [];
      const steps = 300;
      let started = false;
      for (let i = 0; i <= steps; i++) {
        const x = xMin + (i / steps) * (xMax - xMin);
        const y = fn(x);
        if (isNaN(y) || !isFinite(y)) { started = false; continue; }
        if (clipY && (y < yMin - 2 || y > yMax + 2)) { started = false; continue; }
        pts.push(`${started ? 'L' : 'M'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`);
        started = true;
      }
      return pts.join(' ');
    },
    [xMin, xMax, yMin, yMax],
  );

  // Function paths
  const originalPath = useMemo(
    () => buildPath(preset.fn, bsx, bsy),
    [presetKey, bsx, bsy, buildPath],
  );

  const partialSumPath = useMemo(
    () => buildPath((x) => preset.partialSum(x, degree), bsx, bsy),
    [presetKey, degree, bsx, bsy, buildPath],
  );

  // Computed values at current x
  const fVal = preset.fn(currentX);
  const snVal = preset.partialSum(currentX, degree);
  const error = isFinite(fVal) && isFinite(snVal) ? Math.abs(fVal - snVal) : NaN;

  // Grid lines for bottom panel
  const gridLines = useMemo(() => {
    const lines: JSX.Element[] = [];
    for (let x = Math.ceil(xMin); x <= xMax; x++) {
      const isAxis = x === 0;
      lines.push(
        <line
          key={`v${x}`}
          x1={bsx(x)} y1={bsy(yMin)}
          x2={bsx(x)} y2={bsy(yMax)}
          stroke={isAxis ? 'var(--color-ink-faint)' : 'var(--color-rule)'}
          strokeWidth={isAxis ? 1 : 0.5}
        />,
      );
    }
    for (let y = Math.ceil(yMin); y <= yMax; y++) {
      const isAxis = y === 0;
      lines.push(
        <line
          key={`h${y}`}
          x1={bsx(xMin)} y1={bsy(y)}
          x2={bsx(xMax)} y2={bsy(y)}
          stroke={isAxis ? 'var(--color-ink-faint)' : 'var(--color-rule)'}
          strokeWidth={isAxis ? 1 : 0.5}
        />,
      );
    }
    return lines;
  }, [bsx, bsy]);

  // Axis labels for bottom panel
  const axisLabels = useMemo(() => {
    const labels: JSX.Element[] = [];
    for (let x = Math.ceil(xMin); x <= xMax; x++) {
      if (x === 0) continue;
      labels.push(
        <text
          key={`xl${x}`}
          x={bsx(x)} y={bsy(yMin) + 14}
          textAnchor="middle"
          className="text-[9px]"
          fill="var(--color-ink-faint)"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {x}
        </text>,
      );
    }
    for (let y = Math.ceil(yMin); y <= yMax; y++) {
      if (y === 0) continue;
      labels.push(
        <text
          key={`yl${y}`}
          x={bsx(xMin) - 6} y={bsy(y) + 3}
          textAnchor="end"
          className="text-[9px]"
          fill="var(--color-ink-faint)"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {y}
        </text>,
      );
    }
    return labels;
  }, [bsx, bsy]);

  const { R, center } = preset;
  const hasFiniteR = R !== Infinity;
  const leftBound = center - R;
  const rightBound = center + R;

  return (
    <div className="flex h-full w-full flex-col">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ background: 'var(--color-paper)' }}
      >
        {/* ===================== TOP PANEL: Number Line ===================== */}
        {/* Background for top panel */}
        <rect
          x={0} y={0}
          width={width} height={topPanelH}
          fill="var(--color-surface-1)"
          opacity={0.5}
        />

        {/* Convergent region shading on number line */}
        {hasFiniteR ? (
          <>
            {/* Divergent left */}
            <rect
              x={tsx(xMin)} y={numLineY - 12}
              width={tsx(leftBound) - tsx(xMin)} height={24}
              fill="var(--color-vector-red)"
              opacity={0.1}
              rx={2}
            />
            {/* Convergent region */}
            <rect
              x={tsx(leftBound)} y={numLineY - 12}
              width={tsx(rightBound) - tsx(leftBound)} height={24}
              fill="var(--color-vector-yellow)"
              opacity={0.2}
              rx={2}
            />
            {/* Divergent right */}
            <rect
              x={tsx(rightBound)} y={numLineY - 12}
              width={tsx(xMax) - tsx(rightBound)} height={24}
              fill="var(--color-vector-red)"
              opacity={0.1}
              rx={2}
            />
          </>
        ) : (
          /* Converges everywhere */
          <rect
            x={tsx(xMin)} y={numLineY - 12}
            width={tsx(xMax) - tsx(xMin)} height={24}
            fill="var(--color-vector-yellow)"
            opacity={0.2}
            rx={2}
          />
        )}

        {/* Number line axis */}
        <line
          x1={tsx(xMin)} y1={numLineY}
          x2={tsx(xMax)} y2={numLineY}
          stroke="var(--color-ink-faint)"
          strokeWidth={1}
        />

        {/* Tick marks and labels on number line */}
        {useMemo(() => {
          const ticks: JSX.Element[] = [];
          for (let x = Math.ceil(xMin); x <= xMax; x++) {
            ticks.push(
              <line
                key={`nt${x}`}
                x1={tsx(x)} y1={numLineY - 4}
                x2={tsx(x)} y2={numLineY + 4}
                stroke="var(--color-ink-faint)"
                strokeWidth={0.5}
              />,
            );
            if (x % 2 === 0 || xMax - xMin <= 8) {
              ticks.push(
                <text
                  key={`nl${x}`}
                  x={tsx(x)} y={numLineY + 16}
                  textAnchor="middle"
                  className="text-[8px]"
                  fill="var(--color-ink-faint)"
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {x}
                </text>,
              );
            }
          }
          return ticks;
        }, [tsx, xMin, xMax])}

        {/* Center point a */}
        <circle cx={tsx(center)} cy={numLineY} r={4} fill="var(--color-accent)" />
        <text
          x={tsx(center)} y={numLineY - 10}
          textAnchor="middle"
          className="text-[9px]"
          fill="var(--color-accent)"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          a={center}
        </text>

        {/* Endpoint markers */}
        {hasFiniteR && (
          <>
            {/* Left endpoint */}
            <g>
              {preset.leftEndpointConverges ? (
                // Convergent: filled circle with dot
                <circle cx={tsx(leftBound)} cy={numLineY} r={6} fill="none" stroke="var(--color-vector-green)" strokeWidth={1.5} />
              ) : (
                // Divergent: circle with slash
                <circle cx={tsx(leftBound)} cy={numLineY} r={6} fill="none" stroke="var(--color-vector-red)" strokeWidth={1.5} />
              )}
              <line x1={tsx(leftBound) - 3.5} y1={numLineY - 3.5} x2={tsx(leftBound) + 3.5} y2={numLineY + 3.5} stroke={preset.leftEndpointConverges ? 'var(--color-vector-green)' : 'var(--color-vector-red)'} strokeWidth={1} opacity={preset.leftEndpointConverges ? 0 : 1} />
              <text
                x={tsx(leftBound)} y={numLineY - 14}
                textAnchor="middle"
                className="text-[8px]"
                fill="var(--color-ink-muted)"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {leftBound}
              </text>
            </g>

            {/* Right endpoint */}
            <g>
              {preset.rightEndpointConverges ? (
                <circle cx={tsx(rightBound)} cy={numLineY} r={6} fill="none" stroke="var(--color-vector-green)" strokeWidth={1.5} />
              ) : (
                <circle cx={tsx(rightBound)} cy={numLineY} r={6} fill="none" stroke="var(--color-vector-red)" strokeWidth={1.5} />
              )}
              <line x1={tsx(rightBound) - 3.5} y1={numLineY - 3.5} x2={tsx(rightBound) + 3.5} y2={numLineY + 3.5} stroke={preset.rightEndpointConverges ? 'var(--color-vector-green)' : 'var(--color-vector-red)'} strokeWidth={1} opacity={preset.rightEndpointConverges ? 0 : 1} />
              <text
                x={tsx(rightBound)} y={numLineY - 14}
                textAnchor="middle"
                className="text-[8px]"
                fill="var(--color-ink-muted)"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {rightBound}
              </text>
            </g>
          </>
        )}

        {/* Draggable current x indicator on number line */}
        <polygon
          points={`${tsx(currentX)},${numLineY + 6} ${tsx(currentX) - 4},${numLineY + 13} ${tsx(currentX) + 4},${numLineY + 13}`}
          fill="var(--color-accent)"
        />
        <line
          x1={tsx(currentX)} y1={numLineY - 20}
          x2={tsx(currentX)} y2={numLineY + 6}
          stroke="var(--color-accent)"
          strokeWidth={1}
          strokeDasharray="2,2"
        />

        {/* Region labels */}
        {hasFiniteR && (
          <>
            <text
              x={(tsx(xMin) + tsx(leftBound)) / 2}
              y={numLineY - 18}
              textAnchor="middle"
              className="text-[8px]"
              fill="var(--color-vector-red)"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              diverges
            </text>
            <text
              x={(tsx(leftBound) + tsx(rightBound)) / 2}
              y={numLineY - 18}
              textAnchor="middle"
              className="text-[8px]"
              fill="var(--color-vector-yellow)"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              converges
            </text>
            <text
              x={(tsx(rightBound) + tsx(xMax)) / 2}
              y={numLineY - 18}
              textAnchor="middle"
              className="text-[8px]"
              fill="var(--color-vector-red)"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              diverges
            </text>
          </>
        )}
        {!hasFiniteR && (
          <text
            x={width / 2}
            y={numLineY - 18}
            textAnchor="middle"
            className="text-[8px]"
            fill="var(--color-vector-yellow)"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            converges everywhere
          </text>
        )}

        {/* Divider between panels */}
        <line
          x1={0} y1={topPanelH}
          x2={width} y2={topPanelH}
          stroke="var(--color-rule)"
          strokeWidth={1}
        />

        {/* ===================== BOTTOM PANEL: Function Plot ===================== */}
        <g>
          {gridLines}
          {axisLabels}

          {/* Convergence boundary vertical lines */}
          {hasFiniteR && (
            <>
              <line
                x1={bsx(leftBound)} y1={bsy(yMin)}
                x2={bsx(leftBound)} y2={bsy(yMax)}
                stroke="var(--color-vector-red)"
                strokeWidth={1}
                strokeDasharray="4,3"
                opacity={0.5}
              />
              <line
                x1={bsx(rightBound)} y1={bsy(yMin)}
                x2={bsx(rightBound)} y2={bsy(yMax)}
                stroke="var(--color-vector-red)"
                strokeWidth={1}
                strokeDasharray="4,3"
                opacity={0.5}
              />
            </>
          )}

          {/* Original function f(x) — solid blue */}
          <path
            d={originalPath}
            fill="none"
            stroke="var(--color-vector-blue)"
            strokeWidth={2.5}
          />

          {/* Partial sum S_n(x) — dashed yellow */}
          <path
            d={partialSumPath}
            fill="none"
            stroke="var(--color-vector-yellow)"
            strokeWidth={2}
            strokeDasharray="6,3"
          />

          {/* Current x vertical indicator on function plot */}
          <line
            x1={bsx(currentX)} y1={bsy(yMin)}
            x2={bsx(currentX)} y2={bsy(yMax)}
            stroke="var(--color-accent)"
            strokeWidth={1}
            strokeDasharray="2,4"
            opacity={0.5}
          />

          {/* Point on f(x) */}
          {isFinite(fVal) && (
            <circle
              cx={bsx(currentX)} cy={bsy(fVal)}
              r={4}
              fill="var(--color-vector-blue)"
              stroke="var(--color-paper)"
              strokeWidth={2}
            />
          )}

          {/* Point on S_n(x) */}
          {isFinite(snVal) && snVal > yMin - 1 && snVal < yMax + 1 && (
            <circle
              cx={bsx(currentX)} cy={bsy(snVal)}
              r={4}
              fill="var(--color-vector-yellow)"
              stroke="var(--color-paper)"
              strokeWidth={2}
            />
          )}

          {/* Error line connecting f(x) and S_n(x) */}
          {isFinite(fVal) && isFinite(snVal)
            && fVal > yMin && fVal < yMax
            && snVal > yMin - 1 && snVal < yMax + 1 && (
            <line
              x1={bsx(currentX)} y1={bsy(fVal)}
              x2={bsx(currentX)} y2={bsy(snVal)}
              stroke="var(--color-vector-red)"
              strokeWidth={1.5}
              opacity={0.6}
            />
          )}

          {/* Legend */}
          <line x1={width - 130} y1={topPanelH + 15} x2={width - 110} y2={topPanelH + 15} stroke="var(--color-vector-blue)" strokeWidth={2.5} />
          <text x={width - 105} y={topPanelH + 19} className="text-[10px]" fill="var(--color-ink-muted)" style={{ fontFamily: 'var(--font-sans)' }}>f(x)</text>
          <line x1={width - 130} y1={topPanelH + 29} x2={width - 110} y2={topPanelH + 29} stroke="var(--color-vector-yellow)" strokeWidth={2} strokeDasharray="4,2" />
          <text x={width - 105} y={topPanelH + 33} className="text-[10px]" fill="var(--color-ink-muted)" style={{ fontFamily: 'var(--font-sans)' }}>S{'\u2099'}(x)</text>
        </g>
      </svg>

      {/* ===================== CONTROLS ===================== */}
      <div className="flex flex-wrap items-center gap-4 border-t border-rule bg-paper-elevated px-4 py-3">
        {/* Degree slider */}
        <label className="flex items-center gap-2 font-sans text-xs text-ink-muted">
          n =
          <input
            type="range"
            min={1}
            max={30}
            step={1}
            value={degree}
            onChange={(e) => setDegree(+e.target.value)}
            className="h-1 w-24 cursor-pointer accent-[var(--color-vector-yellow)]"
          />
          <span className="font-mono text-xs text-ink w-6">{degree}</span>
        </label>

        {/* X position slider */}
        <label className="flex items-center gap-2 font-sans text-xs text-ink-muted">
          x =
          <input
            type="range"
            min={xMin + 0.1}
            max={xMax - 0.1}
            step={0.05}
            value={currentX}
            onChange={(e) => setCurrentX(+e.target.value)}
            className="h-1 w-28 cursor-pointer accent-[var(--color-accent)]"
          />
          <span className="font-mono text-xs text-ink w-12">{currentX.toFixed(2)}</span>
        </label>

        {/* Preset buttons */}
        <div className="flex gap-1">
          {Object.keys(PRESETS).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setPresetKey(k);
                setDegree(5);
                setCurrentX(k === 'eˣ' ? 1 : 0.5);
              }}
              className={`rounded-sm border px-2 py-0.5 font-mono text-[11px] transition-colors duration-fast ${
                k === presetKey
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-rule bg-paper-elevated text-ink-muted hover:bg-surface-1'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* ===================== READOUT ===================== */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-rule bg-surface-1 px-4 py-2 font-mono text-[11px]">
        <span className="text-ink-muted">
          R = {hasFiniteR ? R : '\u221E'}
        </span>
        <span className="text-ink-muted">
          x = {currentX.toFixed(2)}
        </span>
        <span className="text-vector-blue">
          f(x) = {isFinite(fVal) ? fVal.toFixed(4) : 'undef'}
        </span>
        <span className="text-vector-yellow">
          S{'\u2099'}(x) = {isFinite(snVal) ? snVal.toFixed(4) : 'undef'}
        </span>
        <span className="text-vector-red">
          error = {isFinite(error) ? error.toExponential(2) : '\u2014'}
        </span>
        <span
          className={
            convergenceStatus === 'converges'
              ? 'text-vector-green'
              : 'text-vector-red'
          }
        >
          {convergenceStatus === 'converges' ? 'converges' : 'diverges'}
        </span>
      </div>
    </div>
  );
}
