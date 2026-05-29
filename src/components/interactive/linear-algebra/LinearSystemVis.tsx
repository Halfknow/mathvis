import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

export function LinearSystemVis({ width = 640, height = 400 }: { width?: number; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<'row' | 'column'>('row');
  // System: a1*x + b1*y = d1, a2*x + b2*y = d2
  const [a1, setA1] = useState(1); const [b1, setB1] = useState(2); const [d1, setD1] = useState(5);
  const [a2, setA2] = useState(2); const [b2, setB2] = useState(-1); const [d2, setD2] = useState(3);

  const det = a1 * b2 - a2 * b1;
  const solX = Math.abs(det) > 0.01 ? (d1 * b2 - d2 * b1) / det : null;
  const solY = Math.abs(det) > 0.01 ? (a1 * d2 - a2 * d1) / det : null;

  const draw = useCallback(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const cx = width / 2, cy = height / 2, gridSize = 6;
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

    if (view === 'row') {
      // Row picture: two lines
      const drawLine = (a: number, b: number, d: number, color: string) => {
        const pts: [number, number][] = [];
        if (Math.abs(b) > 0.01) {
          pts.push([-gridSize, (d - a * (-gridSize)) / b], [gridSize, (d - a * gridSize) / b]);
        } else if (Math.abs(a) > 0.01) {
          const xVal = d / a;
          pts.push([xVal, -gridSize], [xVal, gridSize]);
        }
        if (pts.length === 2) {
          g.append('line')
            .attr('x1', toX(pts[0][0])).attr('y1', toY(pts[0][1]))
            .attr('x2', toX(pts[1][0])).attr('y2', toY(pts[1][1]))
            .attr('stroke', color).attr('stroke-width', 2.5).attr('stroke-linecap', 'round');
        }
      };
      drawLine(a1, b1, d1, 'var(--color-vector-blue)');
      drawLine(a2, b2, d2, 'var(--color-vector-green)');

      // Solution point
      if (solX !== null && solY !== null && Math.abs(solX) < gridSize && Math.abs(solY) < gridSize) {
        g.append('circle').attr('cx', toX(solX)).attr('cy', toY(solY)).attr('r', 7)
          .attr('fill', 'var(--color-accent)');
        g.append('text').attr('x', toX(solX) + 12).attr('y', toY(solY) + 4)
          .attr('fill', 'var(--color-accent)').attr('font-size', 12).attr('font-weight', 600)
          .text(`(${solX.toFixed(1)}, ${solY.toFixed(1)})`);
      }

      // Legend
      g.append('text').attr('x', 15).attr('y', 25).attr('fill', 'var(--color-vector-blue)').attr('font-size', 12).attr('font-weight', 600)
        .text(`Eq1: ${a1}x + ${b1}y = ${d1}`);
      g.append('text').attr('x', 15).attr('y', 42).attr('fill', 'var(--color-vector-green)').attr('font-size', 12).attr('font-weight', 600)
        .text(`Eq2: ${a2}x + ${b2}y = ${d2}`);
    } else {
      // Column picture: column vectors + target
      drawArrow(0, 0, a1, a2, 'var(--color-vector-blue)', 2.5);
      drawArrow(0, 0, b1, b2, 'var(--color-vector-green)', 2.5);
      drawArrow(0, 0, d1, d2, 'var(--color-accent)', 2.5);

      // Decomposition arrows if solution exists
      if (solX !== null && solY !== null) {
        const midX = solX * a1, midY = solX * a2;
        g.append('line').attr('x1', toX(0)).attr('y1', toY(0))
          .attr('x2', toX(midX)).attr('y2', toY(midY))
          .attr('stroke', 'var(--color-vector-blue)').attr('stroke-width', 1.5).attr('stroke-dasharray', '4 3').attr('opacity', 0.6);
        g.append('line').attr('x1', toX(midX)).attr('y1', toY(midY))
          .attr('x2', toX(d1)).attr('y2', toY(d2))
          .attr('stroke', 'var(--color-vector-green)').attr('stroke-width', 1.5).attr('stroke-dasharray', '4 3').attr('opacity', 0.6);
      }

      g.append('text').attr('x', toX(a1) + 8).attr('y', toY(a2) - 8)
        .attr('fill', 'var(--color-vector-blue)').attr('font-size', 12).attr('font-weight', 600).text('col1');
      g.append('text').attr('x', toX(b1) + 8).attr('y', toY(b2) - 8)
        .attr('fill', 'var(--color-vector-green)').attr('font-size', 12).attr('font-weight', 600).text('col2');
      g.append('text').attr('x', toX(d1) + 8).attr('y', toY(d2) - 8)
        .attr('fill', 'var(--color-accent)').attr('font-size', 12).attr('font-weight', 600).text('b');
    }

  }, [a1, b1, d1, a2, b2, d2, view, solX, solY, width, height]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <div className="space-y-3">
      <div className="flex gap-2 mb-2">
        <button onClick={() => setView('row')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === 'row' ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface-1)] text-[var(--color-ink-muted)]'}`}>Row picture</button>
        <button onClick={() => setView('column')} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${view === 'column' ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface-1)] text-[var(--color-ink-muted)]'}`}>Column picture</button>
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full bg-[var(--color-paper)] rounded-lg border border-[var(--color-rule)]" />

      <div className="grid grid-cols-3 gap-2 text-sm">
        <div>
          <label className="text-[var(--color-ink-muted)] text-xs">a1</label>
          <input type="range" min={-4} max={4} step={0.1} value={a1} onChange={e => setA1(+e.target.value)} className="w-full accent-[var(--color-vector-blue)]" />
        </div>
        <div>
          <label className="text-[var(--color-ink-muted)] text-xs">b1</label>
          <input type="range" min={-4} max={4} step={0.1} value={b1} onChange={e => setB1(+e.target.value)} className="w-full accent-[var(--color-vector-blue)]" />
        </div>
        <div>
          <label className="text-[var(--color-ink-muted)] text-xs">d1</label>
          <input type="range" min={-8} max={8} step={0.5} value={d1} onChange={e => setD1(+e.target.value)} className="w-full accent-[var(--color-vector-blue)]" />
        </div>
        <div>
          <label className="text-[var(--color-ink-muted)] text-xs">a2</label>
          <input type="range" min={-4} max={4} step={0.1} value={a2} onChange={e => setA2(+e.target.value)} className="w-full accent-[var(--color-vector-green)]" />
        </div>
        <div>
          <label className="text-[var(--color-ink-muted)] text-xs">b2</label>
          <input type="range" min={-4} max={4} step={0.1} value={b2} onChange={e => setB2(+e.target.value)} className="w-full accent-[var(--color-vector-green)]" />
        </div>
        <div>
          <label className="text-[var(--color-ink-muted)] text-xs">d2</label>
          <input type="range" min={-8} max={8} step={0.5} value={d2} onChange={e => setD2(+e.target.value)} className="w-full accent-[var(--color-vector-green)]" />
        </div>
      </div>

      <div className="text-center text-sm bg-[var(--color-surface-1)] rounded-lg p-2">
        {Math.abs(det) > 0.01
          ? <span className="font-mono">det = {det.toFixed(2)} → unique solution: ({solX?.toFixed(2)}, {solY?.toFixed(2)})</span>
          : <span className="font-mono text-[var(--color-vector-red)]">det = {det.toFixed(2)} → no unique solution (lines parallel)</span>
        }
      </div>
    </div>
  );
}
