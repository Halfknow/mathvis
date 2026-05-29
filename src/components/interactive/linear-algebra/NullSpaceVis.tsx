import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

export function NullSpaceVis({ width = 640, height = 400 }: { width?: number; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [a, setA] = useState(1);
  const [b, setB] = useState(2);
  const [c, setC] = useState(2);
  const [d, setD] = useState(4);

  const det = a * d - b * c;
  const rank = Math.abs(det) > 0.01 ? 2 : (Math.abs(a) > 0.01 || Math.abs(b) > 0.01 || Math.abs(c) > 0.01 || Math.abs(d) > 0.01) ? 1 : 0;

  // Null space direction for rank 1: solve ax + by = 0
  const nullX = rank === 1 ? (Math.abs(b) > 0.01 ? -b : (Math.abs(a) > 0.01 ? -d : 1)) : 0;
  const nullY = rank === 1 ? (Math.abs(b) > 0.01 ? a : (Math.abs(a) > 0.01 ? c : 0)) : 0;
  const nullLen = Math.sqrt(nullX * nullX + nullY * nullY);

  const draw = useCallback(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const cx = width / 2, cy = height / 2, gridSize = 5;
    const scale = Math.min(width - 100, height - 100) / (gridSize * 2);
    const toX = (v: number) => cx + v * scale;
    const toY = (v: number) => cy - v * scale;

    const g = svg.append('g');

    // Grid
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

    // Sample input vectors and their transformed positions
    const numSamples = 24;
    for (let i = 0; i < numSamples; i++) {
      const angle = (2 * Math.PI * i) / numSamples;
      const r = 3;
      const ix = r * Math.cos(angle);
      const iy = r * Math.sin(angle);
      // Transform
      const ox = a * ix + b * iy;
      const oy = c * ix + d * iy;

      // Input vector (faint)
      g.append('circle').attr('cx', toX(ix)).attr('cy', toY(iy)).attr('r', 3)
        .attr('fill', 'var(--color-ink-muted)').attr('opacity', 0.3);

      // Output vector
      const outLen = Math.sqrt(ox * ox + oy * oy);
      if (outLen > 0.1) {
        g.append('line').attr('x1', toX(ix)).attr('y1', toY(iy))
          .attr('x2', toX(ox)).attr('y2', toY(oy))
          .attr('stroke', 'var(--color-vector-blue)').attr('stroke-width', 0.8).attr('opacity', 0.3);
        g.append('circle').attr('cx', toX(ox)).attr('cy', toY(oy)).attr('r', 3)
          .attr('fill', 'var(--color-vector-blue)').attr('opacity', 0.5);
      }
    }

    // Null space direction (red line + arrows)
    if (rank === 1 && nullLen > 0.01) {
      const nx = nullX / nullLen, ny = nullY / nullLen;
      // Draw the null space line
      g.append('line').attr('x1', toX(-nx * gridSize)).attr('y1', toY(-ny * gridSize))
        .attr('x2', toX(nx * gridSize)).attr('y2', toY(ny * gridSize))
        .attr('stroke', 'var(--color-vector-red)').attr('stroke-width', 2).attr('opacity', 0.6);

      // Arrows along null space
      drawArrow(0, 0, nx * 2.5, ny * 2.5, 'var(--color-vector-red)', 2.5);
      drawArrow(0, 0, -nx * 2.5, -ny * 2.5, 'var(--color-vector-red)', 2.5);

      // Label
      g.append('text').attr('x', toX(nx * 2.5) + 10).attr('y', toY(ny * 2.5) - 5)
        .attr('fill', 'var(--color-vector-red)').attr('font-size', 13).attr('font-weight', 600)
        .text('Null(A)');
    }

    // Origin highlight (where null space vectors map to)
    if (rank < 2) {
      g.append('circle').attr('cx', toX(0)).attr('cy', toY(0)).attr('r', 8)
        .attr('fill', 'none').attr('stroke', 'var(--color-vector-red)').attr('stroke-width', 2).attr('stroke-dasharray', '3 2');
    }

  }, [a, b, c, d, rank, nullLen, width, height]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <div className="space-y-3">
      <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full bg-[var(--color-paper)] rounded-lg border border-[var(--color-rule)]" />

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <label className="text-[var(--color-ink-muted)]">Matrix A</label>
          <div className="grid grid-cols-2 gap-1 mt-1">
            <input type="range" min={-4} max={4} step={0.1} value={a} onChange={e => setA(+e.target.value)} className="accent-[var(--color-vector-blue)]" />
            <input type="range" min={-4} max={4} step={0.1} value={b} onChange={e => setB(+e.target.value)} className="accent-[var(--color-vector-blue)]" />
            <input type="range" min={-4} max={4} step={0.1} value={c} onChange={e => setC(+e.target.value)} className="accent-[var(--color-vector-blue)]" />
            <input type="range" min={-4} max={4} step={0.1} value={d} onChange={e => setD(+e.target.value)} className="accent-[var(--color-vector-blue)]" />
          </div>
        </div>
        <div className="flex flex-col justify-center bg-[var(--color-surface-1)] rounded-lg p-3 text-center">
          <div className="text-[var(--color-ink-muted)] text-xs">Matrix</div>
          <div className="font-mono text-sm">[[{a.toFixed(1)}, {b.toFixed(1)}], [{c.toFixed(1)}, {d.toFixed(1)}]]</div>
          <div className="text-xs mt-1">
            det = <span className={Math.abs(det) < 0.1 ? 'text-[var(--color-vector-red)] font-bold' : ''}>{det.toFixed(2)}</span>
            {rank < 2 && <span className="text-[var(--color-vector-red)] block">Rank = {rank} → null space exists</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
