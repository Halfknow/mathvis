import { useState, useMemo, useCallback } from 'react';

interface CovarianceVisProps {
  width?: number;
  height?: number;
  initialRho?: number;
}

interface Point {
  x: number;
  y: number;
}

/** Box-Muller transform: generate a pair of independent N(0,1) samples. */
function boxMullerPair(): [number, number] {
  const u1 = Math.random();
  const u2 = Math.random();
  const mag = Math.sqrt(-2 * Math.log(u1));
  const z1 = mag * Math.cos(2 * Math.PI * u2);
  const z2 = mag * Math.sin(2 * Math.PI * u2);
  return [z1, z2];
}

/** Generate n points from a bivariate normal with given correlation rho.
 *  X = 5*Z1, Y = 5*(rho*Z1 + sqrt(1-rho^2)*Z2)
 */
function generateBivariate(n: number, rho: number): Point[] {
  const points: Point[] = [];
  const sqrtOneMinusRho2 = Math.sqrt(1 - rho * rho);
  for (let i = 0; i < n; i++) {
    const [z1, z2] = boxMullerPair();
    points.push({
      x: 5 * z1,
      y: 5 * (rho * z1 + sqrtOneMinusRho2 * z2),
    });
  }
  return points;
}

/** Compute sample mean of an array. */
function mean(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((s, v) => s + v, 0) / arr.length;
}

/** Compute sample covariance between two arrays. */
function covariance(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 2) return 0;
  const mx = mean(xs);
  const my = mean(ys);
  let cov = 0;
  for (let i = 0; i < n; i++) {
    cov += (xs[i] - mx) * (ys[i] - my);
  }
  return cov / (n - 1);
}

/** Compute sample standard deviation. */
function stdDev(arr: number[]): number {
  const m = mean(arr);
  const variance = arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

/** Sample Pearson correlation coefficient. */
function pearsonR(xs: number[], ys: number[]): number {
  const sx = stdDev(xs);
  const sy = stdDev(ys);
  if (sx === 0 || sy === 0) return 0;
  return covariance(xs, ys) / (sx * sy);
}

/** Compute the 2-sigma correlation ellipse parameters from sample data.
 *  Returns [cx, cy, semiA, semiB, rotationAngleDegrees].
 */
function ellipseParams(
  xs: number[],
  ys: number[],
): { cx: number; cy: number; rx: number; ry: number; angleDeg: number } {
  const cx = mean(xs);
  const cy = mean(ys);
  const cov = covariance(xs, ys);
  const varX = stdDev(xs) ** 2;
  const varY = stdDev(ys) ** 2;

  // 2x2 covariance matrix: [[varX, cov], [cov, varY]]
  // Eigenvalues: trace/2 +/- sqrt((trace/2)^2 - det)
  const trace = varX + varY;
  const det = varX * varY - cov * cov;
  const disc = Math.sqrt(Math.max(0, (trace / 2) ** 2 - det));
  const lambda1 = trace / 2 + disc;
  const lambda2 = trace / 2 - disc;

  // 2-sigma semi-axes
  const rx = 2 * Math.sqrt(Math.max(0, lambda1));
  const ry = 2 * Math.sqrt(Math.max(0, lambda2));

  // Rotation angle from eigenvector of largest eigenvalue
  let angleDeg = 0;
  if (Math.abs(cov) > 1e-10) {
    const angleRad = Math.atan2(lambda1 - varY, cov);
    angleDeg = (angleRad * 180) / Math.PI;
  }

  return { cx, cy, rx, ry, angleDeg };
}

export function CovarianceVis({
  width = 640,
  height = 400,
  initialRho = 0.6,
}: CovarianceVisProps) {
  const [rho, setRho] = useState(initialRho);
  const [showMeanLines, setShowMeanLines] = useState(false);
  const [points, setPoints] = useState<Point[]>(() => generateBivariate(200, initialRho));

  const regenerate = useCallback(() => {
    setPoints(generateBivariate(200, rho));
  }, [rho]);

  const xs = useMemo(() => points.map((p) => p.x), [points]);
  const ys = useMemo(() => points.map((p) => p.y), [points]);

  const stats = useMemo(() => {
    const meanX = mean(xs);
    const meanY = mean(ys);
    const covXY = covariance(xs, ys);
    const r = pearsonR(xs, ys);
    const ell = ellipseParams(xs, ys);
    return { meanX, meanY, covXY, r, ellipse: ell };
  }, [xs, ys]);

  // Coordinate system: plot area with padding
  const padding = { top: 24, right: 20, bottom: 36, left: 44 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  // Data range (fixed to +/-15 for stable view)
  const dataMin = -15;
  const dataMax = 15;
  const scaleX = (x: number) =>
    padding.left + ((x - dataMin) / (dataMax - dataMin)) * plotW;
  const scaleY = (y: number) =>
    padding.top + plotH - ((y - dataMin) / (dataMax - dataMin)) * plotH;

  // Axis ticks at -10, -5, 0, 5, 10
  const ticks = [-10, -5, 0, 5, 10];

  const rhoColor =
    stats.r >= 0 ? 'var(--color-vector-green)' : 'var(--color-vector-red)';

  return (
    <div className="flex h-full w-full flex-col">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ background: 'var(--color-paper)', maxHeight: '100%' }}
      >
        {/* Grid lines (subtle) */}
        {ticks.map((t) => (
          <g key={`grid-${t}`}>
            <line
              x1={scaleX(t)}
              y1={padding.top}
              x2={scaleX(t)}
              y2={padding.top + plotH}
              stroke="var(--color-rule)"
              strokeWidth={0.5}
            />
            <line
              x1={padding.left}
              y1={scaleY(t)}
              x2={padding.left + plotW}
              y2={scaleY(t)}
              stroke="var(--color-rule)"
              strokeWidth={0.5}
            />
          </g>
        ))}

        {/* Axes */}
        {/* X-axis (at y=0) */}
        <line
          x1={padding.left}
          y1={scaleY(0)}
          x2={padding.left + plotW}
          y2={scaleY(0)}
          stroke="var(--color-ink-faint)"
          strokeWidth={1}
        />
        {/* Y-axis (at x=0) */}
        <line
          x1={scaleX(0)}
          y1={padding.top}
          x2={scaleX(0)}
          y2={padding.top + plotH}
          stroke="var(--color-ink-faint)"
          strokeWidth={1}
        />

        {/* X-axis ticks & labels */}
        {ticks.map((t) => (
          <g key={`xtick-${t}`}>
            <line
              x1={scaleX(t)}
              y1={scaleY(0) - 3}
              x2={scaleX(t)}
              y2={scaleY(0) + 3}
              stroke="var(--color-ink-faint)"
            />
            <text
              x={scaleX(t)}
              y={scaleY(0) + 16}
              textAnchor="middle"
              fill="var(--color-ink-faint)"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}
            >
              {t}
            </text>
          </g>
        ))}

        {/* Y-axis ticks & labels */}
        {ticks.map((t) => (
          <g key={`ytick-${t}`}>
            <line
              x1={scaleX(0) - 3}
              y1={scaleY(t)}
              x2={scaleX(0) + 3}
              y2={scaleY(t)}
              stroke="var(--color-ink-faint)"
            />
            <text
              x={scaleX(0) - 8}
              y={scaleY(t) + 3}
              textAnchor="end"
              fill="var(--color-ink-faint)"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}
            >
              {t}
            </text>
          </g>
        ))}

        {/* Axis labels */}
        <text
          x={padding.left + plotW / 2}
          y={height - 4}
          textAnchor="middle"
          fill="var(--color-ink-muted)"
          style={{ fontFamily: 'var(--font-sans)', fontSize: '11px' }}
        >
          X
        </text>
        <text
          x={10}
          y={padding.top + plotH / 2}
          textAnchor="middle"
          fill="var(--color-ink-muted)"
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            transform: `rotate(-90deg, 10, ${padding.top + plotH / 2})`,
          }}
          transform={`rotate(-90, 12, ${padding.top + plotH / 2})`}
        >
          Y
        </text>

        {/* Mean lines */}
        {showMeanLines && (
          <>
            <line
              x1={scaleX(stats.meanX)}
              y1={padding.top}
              x2={scaleX(stats.meanX)}
              y2={padding.top + plotH}
              stroke="var(--color-ink-faint)"
              strokeWidth={1}
              strokeDasharray="6,4"
            />
            <line
              x1={padding.left}
              y1={scaleY(stats.meanY)}
              x2={padding.left + plotW}
              y2={scaleY(stats.meanY)}
              stroke="var(--color-ink-faint)"
              strokeWidth={1}
              strokeDasharray="6,4"
            />
          </>
        )}

        {/* Correlation ellipse (2-sigma) */}
        <ellipse
          cx={scaleX(stats.ellipse.cx)}
          cy={scaleY(stats.ellipse.cy)}
          rx={
            (stats.ellipse.rx / (dataMax - dataMin)) * plotW
          }
          ry={
            (stats.ellipse.ry / (dataMax - dataMin)) * plotH
          }
          fill="var(--color-accent)"
          fillOpacity={0.15}
          stroke="var(--color-accent)"
          strokeWidth={2}
          strokeOpacity={0.6}
          transform={`rotate(${-stats.ellipse.angleDeg}, ${scaleX(stats.ellipse.cx)}, ${scaleY(stats.ellipse.cy)})`}
        />

        {/* Scatter points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={scaleX(p.x)}
            cy={scaleY(p.y)}
            r={3}
            fill="var(--color-vector-blue)"
            opacity={0.5}
          />
        ))}

        {/* Statistics panel — top-right */}
        <g>
          <rect
            x={width - padding.right - 140}
            y={padding.top + 4}
            width={136}
            height={82}
            rx={4}
            fill="var(--color-paper-elevated)"
            stroke="var(--color-rule)"
            strokeWidth={0.5}
            fillOpacity={0.92}
          />
          <text
            x={width - padding.right - 132}
            y={padding.top + 20}
            fill="var(--color-ink-muted)"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}
          >
            {'Cov(X,Y) = ' + stats.covXY.toFixed(2)}
          </text>
          <text
            x={width - padding.right - 132}
            y={padding.top + 36}
            fill={rhoColor}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600 }}
          >
            {'\u03C1 = ' + stats.r.toFixed(3)}
          </text>
          <text
            x={width - padding.right - 132}
            y={padding.top + 54}
            fill="var(--color-ink-faint)"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}
          >
            {'E[X] = ' + stats.meanX.toFixed(2)}
          </text>
          <text
            x={width - padding.right - 132}
            y={padding.top + 70}
            fill="var(--color-ink-faint)"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}
          >
            {'E[Y] = ' + stats.meanY.toFixed(2)}
          </text>
        </g>
      </svg>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 border-t border-rule bg-paper-elevated px-4 py-3">
        <label className="flex items-center gap-2 font-sans text-xs text-ink-muted">
          <span style={{ fontFamily: 'var(--font-mono)' }}>{"\u03C1"}</span>
          <input
            type="range"
            min={-0.95}
            max={0.95}
            step={0.05}
            value={rho}
            onChange={(e) => setRho(+e.target.value)}
            className="h-1 w-24 cursor-pointer accent-[var(--color-accent)]"
          />
          <span
            className="w-10 text-right font-mono text-xs"
            style={{ color: rho >= 0 ? 'var(--color-vector-green)' : 'var(--color-vector-red)' }}
          >
            {rho.toFixed(2)}
          </span>
        </label>

        <button
          type="button"
          onClick={regenerate}
          className="rounded-sm border border-rule bg-paper-elevated px-3 py-1 font-sans text-xs text-ink-muted hover:bg-surface-1 hover:text-ink transition-colors duration-fast"
        >
          Regenerate
        </button>

        <label className="flex items-center gap-2 font-sans text-xs text-ink-muted cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showMeanLines}
            onChange={(e) => setShowMeanLines(e.target.checked)}
            className="accent-[var(--color-accent)]"
          />
          Show mean lines
        </label>
      </div>
    </div>
  );
}
