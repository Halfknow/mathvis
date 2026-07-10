import { useState, useMemo } from 'react';

interface ArcLengthExplorerProps {
  width?: number;
  height?: number;
}

type CurveDef = {
  fn: (x: number) => number;
  label: string;
  domain: [number, number];
};

const CURVES: Record<string, CurveDef> = {
  'x^(3/2)': {
    fn: (x) => Math.pow(x, 1.5),
    label: 'y = x^(3/2)',
    domain: [0, 4],
  },
  'sin(x)': {
    fn: (x) => Math.sin(x),
    label: 'y = sin(x)',
    domain: [0, Math.PI],
  },
  'sqrt(x)': {
    fn: (x) => Math.sqrt(x),
    label: 'y = \u221Ax',
    domain: [0, 4],
  },
  'ln(cos(x))': {
    fn: (x) => Math.log(Math.cos(x)),
    label: 'y = ln(cos(x))',
    domain: [0, 1.2],
  },
};

/**
 * Compute the arc length of f over [a, b] using Simpson's rule
 * with a large number of subintervals for a numerically exact reference.
 *
 * L = integral_a^b sqrt(1 + [f'(x)]^2) dx
 *
 * We estimate f' with a central difference.
 */
function exactArcLength(fn: (x: number) => number, a: number, b: number): number {
  const n = 2000; // must be even for Simpson's
  const h = (b - a) / n;

  const integrand = (x: number): number => {
    const eps = 1e-7;
    const dy = (fn(x + eps) - fn(x - eps)) / (2 * eps);
    return Math.sqrt(1 + dy * dy);
  };

  let sum = integrand(a) + integrand(b);
  for (let i = 1; i < n; i++) {
    const x = a + i * h;
    sum += (i % 2 === 0 ? 2 : 4) * integrand(x);
  }
  return (h / 3) * sum;
}

/**
 * Compute the approximate arc length using n straight-line chords.
 */
function approximateArcLength(
  fn: (x: number) => number,
  a: number,
  b: number,
  n: number,
): number {
  const dx = (b - a) / n;
  let total = 0;
  for (let i = 0; i < n; i++) {
    const x0 = a + i * dx;
    const x1 = a + (i + 1) * dx;
    const dy = fn(x1) - fn(x0);
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return total;
}

/**
 * Compute the approximate surface area of revolution around the x-axis
 * using n frustums (bands), each from rotating a chord segment.
 *
 * For each segment [x_i, x_{i+1}], the band surface area is:
 *   2*pi * r_avg * chord_length
 * where r_avg = (|f(x_i)| + |f(x_{i+1})|) / 2
 */
function approximateSurfaceArea(
  fn: (x: number) => number,
  a: number,
  b: number,
  n: number,
): number {
  const dx = (b - a) / n;
  let total = 0;
  for (let i = 0; i < n; i++) {
    const x0 = a + i * dx;
    const x1 = a + (i + 1) * dx;
    const y0 = Math.abs(fn(x0));
    const y1 = Math.abs(fn(x1));
    const chordLength = Math.sqrt(dx * dx + (fn(x1) - fn(x0)) ** 2);
    const rAvg = (y0 + y1) / 2;
    total += 2 * Math.PI * rAvg * chordLength;
  }
  return total;
}

/**
 * Compute "exact" surface area via Simpson's rule.
 * SA = 2*pi * integral_a^b |f(x)| * sqrt(1 + [f'(x)]^2) dx
 */
function exactSurfaceArea(fn: (x: number) => number, a: number, b: number): number {
  const n = 2000;
  const h = (b - a) / n;

  const integrand = (x: number): number => {
    const eps = 1e-7;
    const dy = (fn(x + eps) - fn(x - eps)) / (2 * eps);
    return Math.abs(fn(x)) * Math.sqrt(1 + dy * dy);
  };

  let sum = integrand(a) + integrand(b);
  for (let i = 1; i < n; i++) {
    const x = a + i * h;
    sum += (i % 2 === 0 ? 2 : 4) * integrand(x);
  }
  return 2 * Math.PI * (h / 3) * sum;
}

export function ArcLengthExplorer({
  width = 640,
  height = 400,
}: ArcLengthExplorerProps) {
  const [curveKey, setCurveKey] = useState('x^(3/2)');
  const [numSegments, setNumSegments] = useState(4);
  const [mode, setMode] = useState<'arc' | 'surface'>('arc');

  const curve = CURVES[curveKey];
  const [domainA, domainB] = curve.domain;

  // Compute padding and plot dimensions
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  // Determine y-range by sampling the function
  const { yMin, yMax } = useMemo(() => {
    let lo = Infinity;
    let hi = -Infinity;
    for (let i = 0; i <= 200; i++) {
      const x = domainA + (i / 200) * (domainB - domainA);
      const y = curve.fn(x);
      if (isFinite(y)) {
        lo = Math.min(lo, y);
        hi = Math.max(hi, y);
      }
    }
    const span = hi - lo || 1;
    const margin = span * 0.15;
    return { yMin: lo - margin, yMax: hi + margin };
  }, [curveKey]);

  // For surface area mode, we need extra vertical space for the reflection
  const effectiveYMin = mode === 'surface' ? -(yMax - yMin) / 2 - yMin + yMin - ((yMax - yMin) * 0.15) : yMin;
  const effectiveYMax = mode === 'surface' ? -effectiveYMin + (yMax - yMin) : yMax;
  const finalYMin = mode === 'surface' ? Math.min(effectiveYMin, -yMax * 1.15) : yMin;
  const finalYMax = mode === 'surface' ? Math.max(effectiveYMax, yMax * 1.15) : yMax;

  // Coordinate transforms
  const sx = (x: number) =>
    padding.left + ((x - domainA) / (domainB - domainA)) * plotW;
  const sy = (y: number) =>
    padding.top + plotH - ((y - finalYMin) / (finalYMax - finalYMin)) * plotH;

  // Build the smooth curve path
  const curvePath = useMemo(() => {
    const pts: string[] = [];
    for (let i = 0; i <= 300; i++) {
      const x = domainA + (i / 300) * (domainB - domainA);
      const y = curve.fn(x);
      if (y < finalYMin - 2 || y > finalYMax + 2) continue;
      pts.push(
        `${pts.length === 0 ? 'M' : 'L'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`,
      );
    }
    return pts.join(' ');
  }, [curveKey, width, height, mode]);

  // Build reflected curve path (for surface area mode)
  const reflectedCurvePath = useMemo(() => {
    if (mode !== 'surface') return '';
    const pts: string[] = [];
    for (let i = 0; i <= 300; i++) {
      const x = domainA + (i / 300) * (domainB - domainA);
      const y = -curve.fn(x);
      if (y < finalYMin - 2 || y > finalYMax + 2) continue;
      pts.push(
        `${pts.length === 0 ? 'M' : 'L'}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`,
      );
    }
    return pts.join(' ');
  }, [curveKey, width, height, mode]);

  // Build line segments for chord approximation
  const segments = useMemo(() => {
    const dx = (domainB - domainA) / numSegments;
    const segs: { x0: number; y0: number; x1: number; y1: number }[] = [];
    for (let i = 0; i < numSegments; i++) {
      const x0 = domainA + i * dx;
      const x1 = domainA + (i + 1) * dx;
      segs.push({ x0, y0: curve.fn(x0), x1, y1: curve.fn(x1) });
    }
    return segs;
  }, [curveKey, numSegments]);

  // Grid lines
  const gridLines = useMemo(() => {
    const lines: JSX.Element[] = [];
    // Vertical grid
    const xStep = Math.ceil((domainB - domainA) / 8) || 1;
    for (
      let x = Math.ceil(domainA);
      x <= Math.floor(domainB);
      x += xStep
    ) {
      lines.push(
        <line
          key={`v${x}`}
          x1={sx(x)}
          y1={sy(finalYMin)}
          x2={sx(x)}
          y2={sy(finalYMax)}
          stroke={x === 0 ? 'var(--color-ink-faint)' : 'var(--color-rule)'}
          strokeWidth={x === 0 ? 1 : 0.5}
        />,
      );
    }
    // Horizontal grid
    const ySpan = finalYMax - finalYMin;
    const yStep = Math.max(1, Math.ceil(ySpan / 8));
    for (
      let y = Math.ceil(finalYMin);
      y <= Math.floor(finalYMax);
      y += yStep
    ) {
      const isAxis = y === 0;
      lines.push(
        <line
          key={`h${y}`}
          x1={sx(domainA)}
          y1={sy(y)}
          x2={sx(domainB)}
          y2={sy(y)}
          stroke={isAxis ? 'var(--color-ink-faint)' : 'var(--color-rule)'}
          strokeWidth={isAxis ? 1 : 0.5}
        />,
      );
    }
    return lines;
  }, [curveKey, width, height, mode]);

  // Surface area bands (trapezoids showing the frustum cross-section)
  const bands = useMemo(() => {
    if (mode !== 'surface') return [];
    return segments.map((seg, i) => {
      const sx0 = sx(seg.x0);
      const sx1 = sx(seg.x1);
      const sy0_pos = sy(seg.y0);
      const sy1_pos = sy(seg.y1);
      const sy0_neg = sy(-seg.y0);
      const sy1_neg = sy(-seg.y1);
      // Draw the band as a filled polygon: top-right, top-left, bottom-left, bottom-right
      const path = `M${sx0},${sy0_pos} L${sx1},${sy1_pos} L${sx1},${sy1_neg} L${sx0},${sy0_neg} Z`;
      return (
        <path
          key={`band-${i}`}
          d={path}
          fill="var(--color-vector-yellow)"
          fillOpacity={0.15}
          stroke="var(--color-vector-yellow)"
          strokeWidth={1}
          strokeOpacity={0.6}
        />
      );
    });
  }, [curveKey, numSegments, mode, width, height]);

  // Compute values
  const approxLength = approximateArcLength(curve.fn, domainA, domainB, numSegments);
  const exactLength = exactArcLength(curve.fn, domainA, domainB);
  const lengthError = Math.abs(approxLength - exactLength);
  const convergence = exactLength > 0 ? ((approxLength / exactLength) * 100) : 100;

  const approxSA = approximateSurfaceArea(curve.fn, domainA, domainB, numSegments);
  const exactSA = exactSurfaceArea(curve.fn, domainA, domainB);
  const saError = Math.abs(approxSA - exactSA);
  const saConvergence = exactSA > 0 ? ((approxSA / exactSA) * 100) : 100;

  const isArcMode = mode === 'arc';
  const displayApprox = isArcMode ? approxLength : approxSA;
  const displayExact = isArcMode ? exactLength : exactSA;
  const displayError = isArcMode ? lengthError : saError;
  const displayConvergence = isArcMode ? convergence : saConvergence;

  return (
    <div className="flex h-full w-full flex-col">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ background: 'var(--color-paper)' }}
      >
        {gridLines}

        {/* Surface area bands (behind everything) */}
        {bands}

        {/* Reflected curve in surface mode */}
        {mode === 'surface' && reflectedCurvePath && (
          <path
            d={reflectedCurvePath}
            fill="none"
            stroke="var(--color-vector-blue)"
            strokeWidth={1.5}
            strokeOpacity={0.5}
            strokeDasharray="4,3"
          />
        )}

        {/* Main curve */}
        <path
          d={curvePath}
          fill="none"
          stroke="var(--color-vector-blue)"
          strokeWidth={2.5}
        />

        {/* Chord segments */}
        {segments.map((seg, i) => (
          <line
            key={`seg-${i}`}
            x1={sx(seg.x0)}
            y1={sy(seg.y0)}
            x2={sx(seg.x1)}
            y2={sy(seg.y1)}
            stroke="var(--color-vector-yellow)"
            strokeWidth={2}
          />
        ))}

        {/* Segment endpoints */}
        {segments.map((seg, i) => (
          <g key={`dots-${i}`}>
            <circle
              cx={sx(seg.x0)}
              cy={sy(seg.y0)}
              r={3}
              fill="var(--color-vector-yellow)"
              stroke="var(--color-paper)"
              strokeWidth={1}
            />
            {/* Right endpoint only for the last segment */}
            {i === segments.length - 1 && (
              <circle
                cx={sx(seg.x1)}
                cy={sy(seg.y1)}
                r={3}
                fill="var(--color-vector-yellow)"
                stroke="var(--color-paper)"
                strokeWidth={1}
              />
            )}
          </g>
        ))}

        {/* Axis labels */}
        <text
          x={width - padding.right - 5}
          y={sy(0) - 6}
          textAnchor="end"
          className="text-[10px]"
          fill="var(--color-ink-muted)"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          x
        </text>
        <text
          x={sx(domainA) + 6}
          y={padding.top + 12}
          className="text-[10px]"
          fill="var(--color-ink-muted)"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          y
        </text>

        {/* Legend */}
        <g>
          <line
            x1={width - 160}
            y1={18}
            x2={width - 140}
            y2={18}
            stroke="var(--color-vector-blue)"
            strokeWidth={2.5}
          />
          <text
            x={width - 135}
            y={22}
            className="text-[10px]"
            fill="var(--color-ink-muted)"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            {curve.label}
          </text>

          <line
            x1={width - 160}
            y1={32}
            x2={width - 140}
            y2={32}
            stroke="var(--color-vector-yellow)"
            strokeWidth={2}
          />
          <text
            x={width - 135}
            y={36}
            className="text-[10px]"
            fill="var(--color-ink-muted)"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            {numSegments} chord{numSegments > 1 ? 's' : ''}
          </text>
        </g>
      </svg>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 border-t border-rule bg-paper-elevated px-4 py-3">
        {/* n slider */}
        <label className="flex items-center gap-2 font-sans text-xs text-ink-muted">
          n =
          <input
            type="range"
            min={1}
            max={50}
            step={1}
            value={numSegments}
            onChange={(e) => setNumSegments(+e.target.value)}
            className="h-1 w-28 cursor-pointer accent-[var(--color-accent)]"
          />
          <span className="w-8 font-mono text-xs text-ink">
            {numSegments}
          </span>
        </label>

        {/* Mode toggle */}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setMode('arc')}
            className={`rounded-sm border px-2 py-0.5 font-sans text-[11px] transition-colors duration-fast ${
              mode === 'arc'
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-rule bg-paper-elevated text-ink-muted hover:bg-surface-1'
            }`}
          >
            Arc Length
          </button>
          <button
            type="button"
            onClick={() => setMode('surface')}
            className={`rounded-sm border px-2 py-0.5 font-sans text-[11px] transition-colors duration-fast ${
              mode === 'surface'
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-rule bg-paper-elevated text-ink-muted hover:bg-surface-1'
            }`}
          >
            Surface Area
          </button>
        </div>

        {/* Curve presets */}
        <div className="flex gap-1">
          {Object.entries(CURVES).map(([k, def]) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setCurveKey(k);
                setNumSegments(4);
              }}
              className={`rounded-sm border px-2 py-0.5 font-mono text-[11px] transition-colors duration-fast ${
                k === curveKey
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-rule bg-paper-elevated text-ink-muted hover:bg-surface-1'
              }`}
            >
              {def.label}
            </button>
          ))}
        </div>
      </div>

      {/* Readout */}
      <div className="border-t border-rule bg-surface-1 px-4 py-2">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 font-mono text-[11px]">
          <span className="text-ink-muted">
            n = <span className="text-ink">{numSegments}</span>
          </span>
          <span className="text-vector-yellow">
            Approx: {displayApprox.toFixed(4)}
          </span>
          <span className="text-vector-blue">
            Exact: {displayExact.toFixed(4)}
          </span>
          <span className="text-vector-red">
            Error: {displayError.toFixed(4)}
          </span>
          <span className="text-vector-green">
            {displayConvergence.toFixed(1)}%
          </span>
          {mode === 'surface' && (
            <span className="text-ink-faint">(SA = 2\u03C0\u222Br\u00B7ds)</span>
          )}
        </div>
      </div>
    </div>
  );
}
