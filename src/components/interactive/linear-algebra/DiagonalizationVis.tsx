import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

export function DiagonalizationVis({ width = 640, height = 400 }: { width?: number; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [a, setA] = useState(2);
  const [b, setB] = useState(1);
  const [c, setC] = useState(1);
  const [d, setD] = useState(3);

  // Eigenvalues of 2x2: lambda^2 - tr*lambda + det = 0
  const tr = a + d;
  const det = a * d - b * c;
  const disc = tr * tr - 4 * det;
  const hasReal = disc >= 0;
  const l1 = hasReal ? (tr + Math.sqrt(disc)) / 2 : 0;
  const l2 = hasReal ? (tr - Math.sqrt(disc)) / 2 : 0;

  // Eigenvector for l1: (A - l1*I)v = 0
  const e1x = hasReal ? b : 0, e1y = hasReal ? (l1 - a) : 0;
  const e1len = Math.sqrt(e1x * e1x + e1y * e1y);
  const ev1x = e1len > 0 ? e1x / e1len : 1, ev1y = e1len > 0 ? e1y / e1len : 0;
  const e2x = hasReal ? b : 0, e2y = hasReal ? (l2 - a) : 0;
  const e2len = Math.sqrt(e2x * e2x + e2y * e2y);
  const ev2x = e2len > 0 ? e2x / e2len : 0, ev2y = e2len > 0 ? e2y / e2len : 1;

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

    // Eigenbasis grid (dashed)
    if (hasReal) {
      for (let n = -4; n <= 4; n++) {
        const sx1 = n * ev1x + (-4) * ev2x, sy1 = n * ev1y + (-4) * ev2y;
        const ex1 = n * ev1x + 4 * ev2x, ey1 = n * ev1y + 4 * ev2y;
        g.append('line').attr('x1', toX(sx1)).attr('y1', toY(sy1))
          .attr('x2', toX(ex1)).attr('y2', toY(ey1))
          .attr('stroke', 'var(--color-vector-yellow)').attr('stroke-width', 0.4).attr('stroke-dasharray', '3 3').attr('opacity', 0.4);

        const sx2 = n * ev2x + (-4) * ev1x, sy2 = n * ev2y + (-4) * ev1y;
        const ex2 = n * ev2x + 4 * ev1x, ey2 = n * ev2y + 4 * ev1y;
        g.append('line').attr('x1', toX(sx2)).attr('y1', toY(sy2))
          .attr('x2', toX(ex2)).attr('y2', toY(ey2))
          .attr('stroke', 'var(--color-vector-yellow)').attr('stroke-width', 0.4).attr('stroke-dasharray', '3 3').attr('opacity', 0.4);
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

    // Eigenvectors (bold, with labels)
    if (hasReal) {
      drawArrow(0, 0, ev1x * 4, ev1y * 4, 'var(--color-vector-red)', 2.5);
      drawArrow(0, 0, -ev1x * 4, -ev1y * 4, 'var(--color-vector-red)', 1.5);
      drawArrow(0, 0, ev2x * 4, ev2y * 4, 'var(--color-vector-yellow)', 2.5);
      drawArrow(0, 0, -ev2x * 4, -ev2y * 4, 'var(--color-vector-yellow)', 1.5);

      g.append('text').attr('x', toX(ev1x * 4) + 8).attr('y', toY(ev1y * 4) - 8)
        .attr('fill', 'var(--color-vector-red)').attr('font-size', 13).attr('font-weight', 600)
        .text(`e1 (λ=${l1.toFixed(2)})`);
      g.append('text').attr('x', toX(ev2x * 4) + 8).attr('y', toY(ev2y * 4) - 8)
        .attr('fill', 'var(--color-vector-yellow)').attr('font-size', 13).attr('font-weight', 600)
        .text(`e2 (λ=${l2.toFixed(2)})`);
    } else {
      g.append('text').attr('x', width / 2).attr('y', 30)
        .attr('text-anchor', 'middle').attr('fill', 'var(--color-vector-red)').attr('font-size', 14).attr('font-weight', 600)
        .text('No real eigenvalues (discriminant < 0)');
    }

  }, [a, b, c, d, hasReal, l1, l2, ev1x, ev1y, ev2x, ev2y, width, height]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <div className="space-y-3">
      <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full bg-[var(--color-paper)] rounded-lg border border-[var(--color-rule)]" />

      <div className="text-sm">
        <label className="text-[var(--color-ink-muted)]">Matrix A</label>
        <div className="grid grid-cols-2 gap-1 mt-1">
          <input type="range" min={-4} max={4} step={0.1} value={a} onChange={e => setA(+e.target.value)} className="accent-[var(--color-vector-blue)]" />
          <input type="range" min={-4} max={4} step={0.1} value={b} onChange={e => setB(+e.target.value)} className="accent-[var(--color-vector-blue)]" />
          <input type="range" min={-4} max={4} step={0.1} value={c} onChange={e => setC(+e.target.value)} className="accent-[var(--color-vector-blue)]" />
          <input type="range" min={-4} max={4} step={0.1} value={d} onChange={e => setD(+e.target.value)} className="accent-[var(--color-vector-blue)]" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-sm bg-[var(--color-surface-1)] rounded-lg p-3">
        <div>
          <div className="text-[var(--color-ink-muted)] text-xs">Matrix</div>
          <div className="font-mono">[[{a.toFixed(1)}, {b.toFixed(1)}], [{c.toFixed(1)}, {d.toFixed(1)}]]</div>
        </div>
        <div>
          <div className="text-[var(--color-ink-muted)] text-xs">Eigenvalues</div>
          <div className="font-mono">{hasReal ? `${l1.toFixed(2)}, ${l2.toFixed(2)}` : 'complex'}</div>
        </div>
        <div>
          <div className="text-[var(--color-ink-muted)] text-xs">Diagonal D</div>
          <div className="font-mono">{hasReal ? `[[${l1.toFixed(1)}, 0], [0, ${l2.toFixed(1)}]]` : 'N/A'}</div>
        </div>
      </div>
    </div>
  );
}
