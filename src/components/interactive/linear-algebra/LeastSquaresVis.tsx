import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

interface DataPoint {
  x: number;
  y: number;
}

const DEFAULT_POINTS: DataPoint[] = [
  { x: 1, y: 2.1 },
  { x: 2, y: 3.9 },
  { x: 3, y: 5.8 },
  { x: 4, y: 8.2 },
  { x: 5, y: 9.8 },
  { x: 6, y: 12.1 },
  { x: 7, y: 13.9 },
  { x: 8, y: 16.2 },
];

/** Solve least-squares via normal equations: (A^T A)^{-1} A^T b */
function leastSquares(points: DataPoint[]): { slope: number; intercept: number } {
  const n = points.length;
  if (n < 2) return { slope: 0, intercept: 0 };

  // A^T A is 2x2: [[n, sumX], [sumX, sumX2]]
  let sumX = 0, sumX2 = 0;
  for (const p of points) {
    sumX += p.x;
    sumX2 += p.x * p.x;
  }

  // A^T b is 2x1: [sumY, sumXY]
  let sumY = 0, sumXY = 0;
  for (const p of points) {
    sumY += p.y;
    sumXY += p.x * p.y;
  }

  // 2x2 matrix [[a,b],[c,d]] = [[n, sumX],[sumX, sumX2]]
  const a = n, b = sumX, c = sumX, d = sumX2;
  const det = a * d - b * c;
  if (Math.abs(det) < 1e-12) return { slope: 0, intercept: 0 };

  // Inverse: (1/det) * [[d, -b], [-c, a]]
  const inv00 = d / det;
  const inv01 = -b / det;
  const inv10 = -c / det;
  const inv11 = a / det;

  // [intercept, slope] = inverse * [sumY, sumXY]
  const intercept = inv00 * sumY + inv01 * sumXY;
  const slope = inv10 * sumY + inv11 * sumXY;

  return { slope, intercept };
}

function computeR2(points: DataPoint[], slope: number, intercept: number): number {
  const n = points.length;
  if (n < 2) return 0;
  const meanY = points.reduce((s, p) => s + p.y, 0) / n;
  let ssTot = 0, ssRes = 0;
  for (const p of points) {
    const yHat = slope * p.x + intercept;
    ssTot += (p.y - meanY) ** 2;
    ssRes += (p.y - yHat) ** 2;
  }
  if (ssTot < 1e-12) return 1;
  return 1 - ssRes / ssTot;
}

function computeSSR(points: DataPoint[], slope: number, intercept: number): number {
  let ssr = 0;
  for (const p of points) {
    ssr += (p.y - (slope * p.x + intercept)) ** 2;
  }
  return ssr;
}

function generateRandomData(trueSlope: number, trueIntercept: number, noise: number): DataPoint[] {
  const points: DataPoint[] = [];
  for (let x = 1; x <= 8; x++) {
    const y = trueSlope * x + trueIntercept + (Math.random() - 0.5) * 2 * noise;
    points.push({ x, y });
  }
  return points;
}

export function LeastSquaresVis({ width = 640, height = 400 }: { width?: number; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [points, setPoints] = useState<DataPoint[]>(DEFAULT_POINTS);
  const [showResiduals, setShowResiduals] = useState(true);
  const [noise, setNoise] = useState(2);
  const [trueSlope, setTrueSlope] = useState(2);
  const [trueIntercept, setTrueIntercept] = useState(0);

  const fit = leastSquares(points);
  const r2 = computeR2(points, fit.slope, fit.intercept);
  const ssr = computeSSR(points, fit.slope, fit.intercept);

  const draw = useCallback(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const padding = 50;
    const gridSize = 5;
    const plotSize = Math.min(width - padding * 2, height - padding * 2);
    const scale = plotSize / (gridSize * 2);
    const cx = padding + plotSize / 2;
    const cy = height / 2;
    const toX = (v: number) => cx + v * scale;
    const toY = (v: number) => cy - v * scale;

    const g = svg.append('g');

    // Grid lines
    for (let i = -gridSize; i <= gridSize; i++) {
      const isAxis = i === 0;
      g.append('line').attr('x1', toX(-gridSize)).attr('y1', toY(i))
        .attr('x2', toX(gridSize)).attr('y2', toY(i))
        .attr('stroke', isAxis ? 'var(--color-ink-faint)' : 'var(--color-rule)')
        .attr('stroke-width', isAxis ? 1 : 0.4);
      g.append('line').attr('x1', toX(i)).attr('y1', toY(-gridSize))
        .attr('x2', toX(i)).attr('y2', toY(gridSize))
        .attr('stroke', isAxis ? 'var(--color-ink-faint)' : 'var(--color-rule)')
        .attr('stroke-width', isAxis ? 1 : 0.4);
    }

    // Axis labels
    g.append('text').attr('x', toX(gridSize) + 8).attr('y', toY(0) + 4)
      .attr('fill', 'var(--color-ink-faint)').attr('font-size', '11px').attr('font-family', 'var(--font-mono)')
      .text('x');
    g.append('text').attr('x', toX(0) + 4).attr('y', toY(gridSize) - 6)
      .attr('fill', 'var(--color-ink-faint)').attr('font-size', '11px').attr('font-family', 'var(--font-mono)')
      .text('y');

    // Best-fit line — extend it across the plot area
    // y = slope * x + intercept => find x range where line is visible
    const xMin = -gridSize;
    const xMax = gridSize;
    const yFitAtXMin = fit.slope * xMin + fit.intercept;
    const yFitAtXMax = fit.slope * xMax + fit.intercept;
    g.append('line')
      .attr('x1', toX(xMin)).attr('y1', toY(yFitAtXMin))
      .attr('x2', toX(xMax)).attr('y2', toY(yFitAtXMax))
      .attr('stroke', 'var(--color-vector-blue)').attr('stroke-width', 2)
      .attr('opacity', 0.85);

    // Residual lines (vertical from each point to the fit line)
    if (showResiduals) {
      for (const p of points) {
        const yFit = fit.slope * p.x + fit.intercept;
        g.append('line')
          .attr('x1', toX(p.x)).attr('y1', toY(p.y))
          .attr('x2', toX(p.x)).attr('y2', toY(yFit))
          .attr('stroke', 'var(--color-vector-red)')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '3,3')
          .attr('opacity', 0.5);
      }
    }

    // Data points
    for (const p of points) {
      g.append('circle')
        .attr('cx', toX(p.x)).attr('cy', toY(p.y)).attr('r', 5)
        .attr('fill', 'var(--color-accent)').attr('stroke', 'var(--color-paper-elevated)')
        .attr('stroke-width', 1.5);
    }

    // Info box — top-right corner
    const infoX = width - padding;
    const infoY = padding;
    g.append('text').attr('x', infoX).attr('y', infoY)
      .attr('text-anchor', 'end').attr('fill', 'var(--color-vector-blue)')
      .attr('font-size', '13px').attr('font-weight', 'bold').attr('font-family', 'var(--font-mono)')
      .text(`y = ${fit.slope.toFixed(2)}x + ${fit.intercept.toFixed(2)}`);
    g.append('text').attr('x', infoX).attr('y', infoY + 18)
      .attr('text-anchor', 'end').attr('fill', 'var(--color-ink-muted)')
      .attr('font-size', '11px').attr('font-family', 'var(--font-mono)')
      .text(`slope = ${fit.slope.toFixed(3)}`);
    g.append('text').attr('x', infoX).attr('y', infoY + 34)
      .attr('text-anchor', 'end').attr('fill', 'var(--color-ink-muted)')
      .attr('font-size', '11px').attr('font-family', 'var(--font-mono)')
      .text(`intercept = ${fit.intercept.toFixed(3)}`);
    g.append('text').attr('x', infoX).attr('y', infoY + 50)
      .attr('text-anchor', 'end').attr('fill', r2 > 0.95 ? 'var(--color-vector-green)' : 'var(--color-accent)')
      .attr('font-size', '11px').attr('font-weight', 'bold').attr('font-family', 'var(--font-mono)')
      .text(`R\u00B2 = ${r2.toFixed(4)}`);
    g.append('text').attr('x', infoX).attr('y', infoY + 66)
      .attr('text-anchor', 'end').attr('fill', showResiduals ? 'var(--color-vector-red)' : 'var(--color-ink-faint)')
      .attr('font-size', '11px').attr('font-family', 'var(--font-mono)')
      .text(`SSR = ${ssr.toFixed(2)}`);
  }, [points, fit, r2, ssr, showResiduals, width, height]);

  useEffect(() => { draw(); }, [draw]);

  const handleRandomize = useCallback(() => {
    setPoints(generateRandomData(trueSlope, trueIntercept, noise));
  }, [trueSlope, trueIntercept, noise]);

  const handleReset = useCallback(() => {
    setPoints(DEFAULT_POINTS);
  }, []);

  return (
    <div className="not-prose space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => setShowResiduals(!showResiduals)}
          className={`rounded border px-3 py-1 text-xs font-sans font-medium transition-colors ${
            showResiduals
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-rule bg-paper-elevated text-ink-muted hover:border-accent'
          }`}
        >{showResiduals ? 'Residuals ON' : 'Show residuals'}</button>
        <button onClick={handleRandomize}
          className="rounded border border-rule bg-paper-elevated px-3 py-1 text-xs font-sans font-medium text-ink-muted transition-colors hover:border-accent hover:text-accent"
        >Randomize</button>
        <button onClick={handleReset}
          className="rounded border border-rule bg-paper-elevated px-3 py-1 text-xs font-sans font-medium text-ink-muted transition-colors hover:border-accent hover:text-accent"
        >Reset</button>
      </div>
      <div className="rounded-md border border-rule overflow-hidden" style={{ background: 'var(--color-paper)' }}>
        <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ display: 'block' }} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex items-center gap-2">
          <span className="font-sans text-xs font-bold" style={{ color: 'var(--color-vector-red)' }}>Noise:</span>
          <input type="range" min={0} max={8} step={0.1} value={noise}
            onChange={(e) => setNoise(parseFloat(e.target.value))}
            className="flex-1 h-1 accent-[var(--color-vector-red)]" />
          <span className="font-mono text-xs text-ink-muted w-8 text-right">{noise.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-sans text-xs font-bold" style={{ color: 'var(--color-vector-blue)' }}>Slope:</span>
          <input type="range" min={-3} max={5} step={0.1} value={trueSlope}
            onChange={(e) => setTrueSlope(parseFloat(e.target.value))}
            className="flex-1 h-1 accent-[var(--color-vector-blue)]" />
          <span className="font-mono text-xs text-ink-muted w-8 text-right">{trueSlope.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-sans text-xs font-bold" style={{ color: 'var(--color-vector-blue)' }}>Intercept:</span>
          <input type="range" min={-5} max={5} step={0.1} value={trueIntercept}
            onChange={(e) => setTrueIntercept(parseFloat(e.target.value))}
            className="flex-1 h-1 accent-[var(--color-vector-blue)]" />
          <span className="font-mono text-xs text-ink-muted w-8 text-right">{trueIntercept.toFixed(1)}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-md border border-rule p-3" style={{ background: 'var(--color-paper-elevated)' }}>
        <div>
          <div className="font-sans text-xs text-ink-faint mb-0.5">Slope</div>
          <div className="font-mono text-sm font-bold" style={{ color: 'var(--color-vector-blue)' }}>{fit.slope.toFixed(3)}</div>
        </div>
        <div>
          <div className="font-sans text-xs text-ink-faint mb-0.5">Intercept</div>
          <div className="font-mono text-sm font-bold" style={{ color: 'var(--color-vector-blue)' }}>{fit.intercept.toFixed(3)}</div>
        </div>
        <div>
          <div className="font-sans text-xs text-ink-faint mb-0.5">R-squared</div>
          <div className="font-mono text-sm font-bold" style={{ color: r2 > 0.95 ? 'var(--color-vector-green)' : 'var(--color-accent)' }}>{r2.toFixed(4)}</div>
        </div>
        <div>
          <div className="font-sans text-xs text-ink-faint mb-0.5">Sum Sq. Residuals</div>
          <div className="font-mono text-sm font-bold" style={{ color: 'var(--color-vector-red)' }}>{ssr.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
