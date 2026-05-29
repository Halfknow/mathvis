import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

/* ---------- seeded RNG (same as ColumnSpaceVis) ---------- */
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* Box-Muller approximate randn from uniform RNG */
function makeRandn(seed: number) {
  const u = makeRng(seed);
  let spare: number | null = null;
  return () => {
    if (spare !== null) {
      const v = spare;
      spare = null;
      return v;
    }
    let u1: number, u2: number;
    do { u1 = u(); } while (u1 === 0);
    u2 = u();
    const mag = Math.sqrt(-2 * Math.log(u1));
    const z0 = mag * Math.cos(2 * Math.PI * u2);
    const z1 = mag * Math.sin(2 * Math.PI * u2);
    spare = z1;
    return z0;
  };
}

/* ---------- PCA helpers ---------- */
interface PCA {
  meanX: number;
  meanY: number;
  lambda1: number;
  lambda2: number;
  pc1x: number;
  pc1y: number;
  pc2x: number;
  pc2y: number;
  percentVar: number;
}

function computePCA(points: [number, number][]): PCA {
  const n = points.length;
  if (n < 2) {
    return { meanX: 0, meanY: 0, lambda1: 0, lambda2: 0, pc1x: 1, pc1y: 0, pc2x: 0, pc2y: 1, percentVar: 100 };
  }

  // Compute means
  let sx = 0, sy = 0;
  for (const [x, y] of points) { sx += x; sy += y; }
  const meanX = sx / n;
  const meanY = sy / n;

  // Covariance matrix entries (sample covariance, divide by n-1)
  let c00 = 0, c01 = 0, c11 = 0;
  for (const [x, y] of points) {
    const dx = x - meanX;
    const dy = y - meanY;
    c00 += dx * dx;
    c01 += dx * dy;
    c11 += dy * dy;
  }
  c00 /= n - 1;
  c01 /= n - 1;
  c11 /= n - 1;

  // Eigendecomposition of 2x2 symmetric matrix
  const trace = c00 + c11;
  const det = c00 * c11 - c01 * c01;
  const disc = Math.max(0, trace * trace - 4 * det);
  const sqrtDisc = Math.sqrt(disc);
  const lambda1 = (trace + sqrtDisc) / 2;
  const lambda2 = (trace - sqrtDisc) / 2;

  // Eigenvector for lambda1
  let pc1x: number, pc1y: number;
  if (Math.abs(c01) > 0.001) {
    pc1x = c01;
    pc1y = lambda1 - c00;
  } else {
    pc1x = c00 >= c11 ? 1 : 0;
    pc1y = c00 >= c11 ? 0 : 1;
  }
  const pc1Len = Math.sqrt(pc1x * pc1x + pc1y * pc1y);
  pc1x = pc1Len > 0 ? pc1x / pc1Len : 1;
  pc1y = pc1Len > 0 ? pc1y / pc1Len : 0;

  // PC2 is orthogonal to PC1
  const pc2x = -pc1y;
  const pc2y = pc1x;

  const totalVar = lambda1 + lambda2;
  const percentVar = totalVar > 0 ? (lambda1 / totalVar) * 100 : 100;

  return { meanX, meanY, lambda1, lambda2, pc1x, pc1y, pc2x, pc2y, percentVar };
}

/* ---------- Component ---------- */
export function PCAViz({ width = 640, height = 400 }: { width?: number; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [seed, setSeed] = useState(42);
  const [correlation, setCorrelation] = useState(0.8);
  const [showProjection, setShowProjection] = useState(false);

  // Generate data points from seed + correlation
  const generatePoints = useCallback((): [number, number][] => {
    const randn = makeRandn(seed);
    const pts: [number, number][] = [];
    const scale = 1.5;
    for (let i = 0; i < 50; i++) {
      const x = randn() * scale;
      const noise = randn() * scale * Math.sqrt(Math.max(0, 1 - correlation * correlation));
      const y = correlation * x + noise;
      pts.push([x, y]);
    }
    return pts;
  }, [seed, correlation]);

  const points = generatePoints();
  const pca = computePCA(points);

  const draw = useCallback(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const cx = width / 2;
    const cy = height / 2;
    const gridSize = 5;
    const scale = Math.min(width - 100, height - 100) / (gridSize * 2);
    const toX = (v: number) => cx + v * scale;
    const toY = (v: number) => cy - v * scale;

    const g = svg.append('g');

    // Grid
    for (let i = -gridSize; i <= gridSize; i++) {
      const isAxis = i === 0;
      g.append('line')
        .attr('x1', toX(-gridSize)).attr('y1', toY(i))
        .attr('x2', toX(gridSize)).attr('y2', toY(i))
        .attr('stroke', isAxis ? 'var(--color-ink-faint)' : 'var(--color-rule)')
        .attr('stroke-width', isAxis ? 1 : 0.3);
      g.append('line')
        .attr('x1', toX(i)).attr('y1', toY(-gridSize))
        .attr('x2', toX(i)).attr('y2', toY(gridSize))
        .attr('stroke', isAxis ? 'var(--color-ink-faint)' : 'var(--color-rule)')
        .attr('stroke-width', isAxis ? 1 : 0.3);
    }

    // Covariance ellipse (semi-axes = sqrt(eigenvalue) * 2, rotated by PC1 direction)
    const angle = Math.atan2(pca.pc1y, pca.pc1x);
    const semi1 = Math.sqrt(Math.max(0, pca.lambda1)) * 2;
    const semi2 = Math.sqrt(Math.max(0, pca.lambda2)) * 2;
    const ellipseCx = toX(pca.meanX);
    const ellipseCy = toY(pca.meanY);

    const ellipsePts: [number, number][] = [];
    const numEllipsePts = 64;
    for (let i = 0; i < numEllipsePts; i++) {
      const t = (2 * Math.PI * i) / numEllipsePts;
      const ex = semi1 * Math.cos(t) * scale;
      const ey = semi2 * Math.sin(t) * scale;
      const rx = ex * Math.cos(angle) - ey * Math.sin(angle);
      const ry = -(ex * Math.sin(angle) + ey * Math.cos(angle)); // flip y for SVG
      ellipsePts.push([ellipseCx + rx, ellipseCy + ry]);
    }

    g.append('polygon')
      .attr('points', ellipsePts.map(p => `${p[0]},${p[1]}`).join(' '))
      .attr('fill', 'var(--color-vector-blue)')
      .attr('fill-opacity', 0.05)
      .attr('stroke', 'var(--color-vector-blue)')
      .attr('stroke-width', 1.5);

    // PC arrows from data center (mean)
    const originSx = toX(pca.meanX);
    const originSy = toY(pca.meanY);
    const arrowLen1 = Math.sqrt(Math.max(0, pca.lambda1)) * scale;
    const arrowLen2 = Math.sqrt(Math.max(0, pca.lambda2)) * scale;

    const arrowHead = (x1: number, y1: number, x2: number, y2: number, color: string, headLen = 10) => {
      g.append('line')
        .attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2)
        .attr('stroke', color).attr('stroke-width', 2.5);
      const a2 = Math.atan2(y2 - y1, x2 - x1);
      g.append('polygon')
        .attr('points', [
          [x2, y2],
          [x2 - headLen * Math.cos(a2 - 0.3), y2 - headLen * Math.sin(a2 - 0.3)],
          [x2 - headLen * Math.cos(a2 + 0.3), y2 - headLen * Math.sin(a2 + 0.3)],
        ].map(p => p.join(',')).join(' '))
        .attr('fill', color);
    };

    // PC1 arrow
    if (arrowLen1 > 1) {
      const pc1EndX = originSx + pca.pc1x * arrowLen1;
      const pc1EndY = originSy - pca.pc1y * arrowLen1;
      arrowHead(originSx, originSy, pc1EndX, pc1EndY, 'var(--color-vector-red)');
      g.append('text')
        .attr('x', pc1EndX + 6).attr('y', pc1EndY - 6)
        .attr('fill', 'var(--color-vector-red)').attr('font-size', 12).attr('font-weight', 600)
        .text('PC1');
    }

    // PC2 arrow
    if (arrowLen2 > 1) {
      const pc2EndX = originSx + pca.pc2x * arrowLen2;
      const pc2EndY = originSy - pca.pc2y * arrowLen2;
      arrowHead(originSx, originSy, pc2EndX, pc2EndY, 'var(--color-vector-green)');
      g.append('text')
        .attr('x', pc2EndX + 6).attr('y', pc2EndY - 6)
        .attr('fill', 'var(--color-vector-green)').attr('font-size', 12).attr('font-weight', 600)
        .text('PC2');
    }

    // Data points
    for (const [px, py] of points) {
      const sx = toX(px);
      const sy = toY(py);

      if (showProjection) {
        // Draw original point faded
        g.append('circle')
          .attr('cx', sx).attr('cy', sy).attr('r', 3.5)
          .attr('fill', 'var(--color-ink-muted)')
          .attr('opacity', 0.15);

        // Project onto PC1: proj = dot((p - mean), pc1) * pc1 + mean
        const dx = px - pca.meanX;
        const dy = py - pca.meanY;
        const projScalar = dx * pca.pc1x + dy * pca.pc1y;
        const projX = pca.meanX + projScalar * pca.pc1x;
        const projY = pca.meanY + projScalar * pca.pc1y;

        // Line from point to projection
        g.append('line')
          .attr('x1', sx).attr('y1', sy)
          .attr('x2', toX(projX)).attr('y2', toY(projY))
          .attr('stroke', 'var(--color-ink-muted)')
          .attr('stroke-width', 0.5)
          .attr('opacity', 0.25)
          .attr('stroke-dasharray', '2 2');

        // Projected point on PC1 line
        g.append('circle')
          .attr('cx', toX(projX)).attr('cy', toY(projY)).attr('r', 3.5)
          .attr('fill', 'var(--color-accent)')
          .attr('opacity', 0.7);
      } else {
        g.append('circle')
          .attr('cx', sx).attr('cy', sy).attr('r', 3.5)
          .attr('fill', 'var(--color-accent)')
          .attr('opacity', 0.5);
      }
    }

    // Mean cross
    g.append('line')
      .attr('x1', originSx - 5).attr('y1', originSy - 5)
      .attr('x2', originSx + 5).attr('y2', originSy + 5)
      .attr('stroke', 'var(--color-ink-muted)').attr('stroke-width', 1.5);
    g.append('line')
      .attr('x1', originSx + 5).attr('y1', originSy - 5)
      .attr('x2', originSx - 5).attr('y2', originSy + 5)
      .attr('stroke', 'var(--color-ink-muted)').attr('stroke-width', 1.5);

    // Top-right label
    const label = showProjection ? 'Projected onto PC1' : 'Data cloud + PCA';
    g.append('text')
      .attr('x', width - 10).attr('y', 20)
      .attr('text-anchor', 'end')
      .attr('fill', 'var(--color-ink-muted)').attr('font-size', 12)
      .text(label);

  }, [points, pca, width, height, showProjection]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <div className="not-prose space-y-3">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full bg-[var(--color-paper)] rounded-lg border border-[var(--color-rule)]"
      />

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <label className="text-[var(--color-ink-muted)] text-sm">
            Correlation: {correlation.toFixed(2)}
          </label>
          <input
            type="range"
            min={-0.9}
            max={0.9}
            step={0.01}
            value={correlation}
            onChange={e => setCorrelation(+e.target.value)}
            className="w-full accent-[var(--color-accent)]"
          />
        </div>

        <button
          onClick={() => setSeed(s => s + 1)}
          className="rounded border border-[var(--color-rule)] bg-[var(--color-paper-elevated)] px-3 py-1 text-xs font-sans font-medium text-[var(--color-ink-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
        >
          New data
        </button>

        <button
          onClick={() => setShowProjection(v => !v)}
          className={`rounded border px-3 py-1 text-xs font-sans font-medium transition-colors ${
            showProjection
              ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
              : 'border-[var(--color-rule)] bg-[var(--color-paper-elevated)] text-[var(--color-ink-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]'
          }`}
        >
          {showProjection ? 'Hide projection' : 'Show projection'}
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center text-sm bg-[var(--color-surface-1)] rounded-lg p-3">
        <div>
          <div className="text-[var(--color-vector-red)] text-xs">λ₁</div>
          <div className="font-mono font-semibold">{pca.lambda1.toFixed(3)}</div>
        </div>
        <div>
          <div className="text-[var(--color-vector-green)] text-xs">λ₂</div>
          <div className="font-mono font-semibold">{pca.lambda2.toFixed(3)}</div>
        </div>
        <div>
          <div className="text-[var(--color-vector-red)] text-xs">% variance (PC1)</div>
          <div className="font-mono font-semibold">{pca.percentVar.toFixed(1)}%</div>
        </div>
        <div>
          <div className="text-[var(--color-ink-muted)] text-xs">PC1 direction</div>
          <div className="font-mono text-xs">({pca.pc1x.toFixed(2)}, {pca.pc1y.toFixed(2)})</div>
        </div>
      </div>
    </div>
  );
}
