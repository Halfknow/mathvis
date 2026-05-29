import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

export function BasisChangeVis({ width = 640, height = 420 }: { width?: number; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [b1x, setB1x] = useState(2);
  const [b1y, setB1y] = useState(1);
  const [b2x, setB2x] = useState(-1);
  const [b2y, setB2y] = useState(2);
  // Target point in standard coordinates
  const [px, setPx] = useState(3);
  const [py, setPy] = useState(2);

  // Compute coordinates in new basis: solve px = c1*b1x + c2*b2x, py = c1*b1y + c2*b2y
  const det = b1x * b2y - b1y * b2x;
  const hasInverse = Math.abs(det) > 0.01;
  const c1 = hasInverse ? (px * b2y - py * b2x) / det : 0;
  const c2 = hasInverse ? (b1x * py - b1y * px) / det : 0;

  const draw = useCallback(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const cx = width / 2, cy = height / 2, gridSize = 5;
    const scale = Math.min(width - 100, height - 100) / (gridSize * 2);
    const toX = (v: number) => cx + v * scale;
    const toY = (v: number) => cy - v * scale;

    const g = svg.append('g');

    // Standard grid (faint)
    for (let i = -gridSize; i <= gridSize; i++) {
      const isAxis = i === 0;
      g.append('line').attr('x1', toX(-gridSize)).attr('y1', toY(i))
        .attr('x2', toX(gridSize)).attr('y2', toY(i))
        .attr('stroke', isAxis ? 'var(--color-ink-faint)' : 'var(--color-rule)')
        .attr('stroke-width', isAxis ? 1 : 0.3);
      g.append('line').attr('x1', toX(i)).attr('y1', toY(-gridSize))
        .attr('x2', toX(i)).attr('y2', toY(gridSize))
        .attr('stroke', isAxis ? 'var(--color-ink-faint)' : 'var(--color-rule)')
        .attr('stroke-width', isAxis ? 1 : 0.3);
    }

    // New basis grid lines (dashed, lighter)
    if (hasInverse) {
      for (let n = -4; n <= 4; n++) {
        // Lines along b1 direction: point = n*b2 + t*b1
        const startX1 = n * b2x + (-4) * b1x, startY1 = n * b2y + (-4) * b1y;
        const endX1 = n * b2x + 4 * b1x, endY1 = n * b2y + 4 * b1y;
        g.append('line').attr('x1', toX(startX1)).attr('y1', toY(startY1))
          .attr('x2', toX(endX1)).attr('y2', toY(endY1))
          .attr('stroke', 'var(--color-vector-yellow)').attr('stroke-width', 0.4).attr('stroke-dasharray', '3 3').attr('opacity', 0.5);

        // Lines along b2 direction: point = n*b1 + t*b2
        const startX2 = n * b1x + (-4) * b2x, startY2 = n * b1y + (-4) * b2y;
        const endX2 = n * b1x + 4 * b2x, endY2 = n * b1y + 4 * b2y;
        g.append('line').attr('x1', toX(startX2)).attr('y1', toY(startY2))
          .attr('x2', toX(endX2)).attr('y2', toY(endY2))
          .attr('stroke', 'var(--color-vector-yellow)').attr('stroke-width', 0.4).attr('stroke-dasharray', '3 3').attr('attr', 0.5);
      }
    }

    const drawArrow = (ox: number, oy: number, tx: number, ty: number, color: string, sw: number) => {
      const px1 = toX(ox), py1 = toY(oy), px2 = toX(tx), py2 = toY(ty);
      const dx = px2 - px1, dy = py2 - py1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 3) return;
      const ux = dx / len, uy = dy / len, hl = 10;
      g.append('line').attr('x1', px1).attr('y1', py1)
        .attr('x2', px2 - ux * hl).attr('y2', py2 - uy * hl)
        .attr('stroke', color).attr('stroke-width', sw).attr('stroke-linecap', 'round');
      g.append('polygon')
        .attr('points', [`${px2},${py2}`, `${px2 - ux * hl + uy * 5},${py2 - uy * hl - ux * 5}`, `${px2 - ux * hl - uy * 5},${py2 - uy * hl + ux * 5}`].join(' '))
        .attr('fill', color);
    };

    // Standard basis (faint blue/green arrows)
    drawArrow(0, 0, 1, 0, 'var(--color-vector-blue)', 1.5);
    drawArrow(0, 0, 0, 1, 'var(--color-vector-green)', 1.5);

    // New basis vectors (bold)
    drawArrow(0, 0, b1x, b1y, 'var(--color-vector-blue)', 2.5);
    drawArrow(0, 0, b2x, b2y, 'var(--color-vector-green)', 2.5);

    // Target point
    g.append('circle').attr('cx', toX(px)).attr('cy', toY(py)).attr('r', 6)
      .attr('fill', 'var(--color-accent)');

    // Decomposition arrows to target (if valid)
    if (hasInverse && Math.abs(c1) < 10 && Math.abs(c2) < 10) {
      const midX = c1 * b1x, midY = c1 * b1y;
      // c1 * b1
      g.append('line').attr('x1', toX(0)).attr('y1', toY(0))
        .attr('x2', toX(midX)).attr('y2', toY(midY))
        .attr('stroke', 'var(--color-vector-blue)').attr('stroke-width', 1.5).attr('stroke-dasharray', '4 3').attr('opacity', 0.7);
      // c2 * b2
      g.append('line').attr('x1', toX(midX)).attr('y1', toY(midY))
        .attr('x2', toX(px)).attr('y2', toY(py))
        .attr('stroke', 'var(--color-vector-green)').attr('stroke-width', 1.5).attr('stroke-dasharray', '4 3').attr('opacity', 0.7);
    }

    // Labels
    g.append('text').attr('x', toX(b1x) + 8).attr('y', toY(b1y) - 8)
      .attr('fill', 'var(--color-vector-blue)').attr('font-size', 13).attr('font-weight', 600)
      .text("b\u2081");
    g.append('text').attr('x', toX(b2x) + 8).attr('y', toY(b2y) - 8)
      .attr('fill', 'var(--color-vector-green)').attr('font-size', 13).attr('font-weight', 600)
      .text("b\u2082");
    g.append('text').attr('x', toX(px) + 10).attr('y', toY(py) + 4)
      .attr('fill', 'var(--color-accent)').attr('font-size', 13).attr('font-weight', 600)
      .text('P');

  }, [b1x, b1y, b2x, b2y, px, py, hasInverse, c1, c2, width, height]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <div className="space-y-3">
      <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full bg-[var(--color-paper)] rounded-lg border border-[var(--color-rule)]" />

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <label className="text-[var(--color-vector-blue)] font-semibold">New basis b1</label>
          <div className="flex gap-2 mt-1">
            <input type="range" min={-4} max={4} step={0.1} value={b1x} onChange={e => setB1x(+e.target.value)} className="flex-1 accent-[var(--color-vector-blue)]" />
            <span className="font-mono text-xs w-8 text-right">{b1x.toFixed(1)}</span>
          </div>
          <div className="flex gap-2 mt-1">
            <input type="range" min={-4} max={4} step={0.1} value={b1y} onChange={e => setB1y(+e.target.value)} className="flex-1 accent-[var(--color-vector-blue)]" />
            <span className="font-mono text-xs w-8 text-right">{b1y.toFixed(1)}</span>
          </div>
        </div>
        <div>
          <label className="text-[var(--color-vector-green)] font-semibold">New basis b2</label>
          <div className="flex-1 flex gap-2 mt-1">
            <input type="range" min={-4} max={4} step={0.1} value={b2x} onChange={e => setB2x(+e.target.value)} className="flex-1 accent-[var(--color-vector-green)]" />
            <span className="font-mono text-xs w-8 text-right">{b2x.toFixed(1)}</span>
          </div>
          <div className="flex gap-2 mt-1">
            <input type="range" min={-4} max={4} step={0.1} value={b2y} onChange={e => setB2y(+e.target.value)} className="flex-1 accent-[var(--color-vector-green)]" />
            <span className="font-mono text-xs w-8 text-right">{b2y.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-sm bg-[var(--color-surface-1)] rounded-lg p-3">
        <div>
          <div className="text-[var(--color-ink-muted)] text-xs">Standard coords</div>
          <div className="font-mono font-semibold">({px}, {py})</div>
        </div>
        <div>
          <div className="text-[var(--color-ink-muted)] text-xs">New basis coords</div>
          <div className="font-mono font-semibold text-[var(--color-accent)]">
            {hasInverse ? `(${c1.toFixed(2)}, ${c2.toFixed(2)})` : 'det = 0!'}
          </div>
        </div>
        <div>
          <div className="text-[var(--color-ink-muted)] text-xs">det</div>
          <div className={`font-mono font-semibold ${Math.abs(det) < 0.3 ? 'text-[var(--color-vector-red)]' : ''}`}>{det.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
