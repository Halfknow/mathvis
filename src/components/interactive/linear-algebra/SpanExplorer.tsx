import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

export function SpanExplorer({ width = 640, height = 400 }: { width?: number; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [v1x, setV1x] = useState(2);
  const [v1y, setV1y] = useState(1);
  const [v2x, setV2x] = useState(1);
  const [v2y, setV2y] = useState(3);

  const det = v1x * v2y - v1y * v2x;
  const isIndependent = Math.abs(det) > 0.01;

  const draw = useCallback(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const padding = 40;
    const cx = width / 2;
    const cy = height / 2;
    const gridSize = 6;
    const plotSize = Math.min(width - padding * 2, height - padding * 2);
    const scale = plotSize / (gridSize * 2);
    const toX = (v: number) => cx + v * scale;
    const toY = (v: number) => cy - v * scale;

    const g = svg.append('g');

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

    if (isIndependent) {
      // Fill the entire plane with dots to show span = whole plane
      for (let ci = -gridSize * 2; ci <= gridSize * 2; ci += 0.5) {
        for (let cj = -gridSize * 2; cj <= gridSize * 2; cj += 0.5) {
          const px = ci * v1x + cj * v2x;
          const py = ci * v1y + cj * v2y;
          if (Math.abs(px) <= gridSize && Math.abs(py) <= gridSize) {
            g.append('circle')
              .attr('cx', toX(px)).attr('cy', toY(py)).attr('r', 1.2)
              .attr('fill', 'var(--color-accent)').attr('opacity', 0.15);
          }
        }
      }
    } else {
      // Draw the line they're stuck on
      const len = Math.sqrt(v1x * v1x + v1y * v1y);
      if (len > 0.01) {
        const dx = v1x / len, dy = v1y / len;
        g.append('line')
          .attr('x1', toX(-dx * gridSize * 2)).attr('y1', toY(-dy * gridSize * 2))
          .attr('x2', toX(dx * gridSize * 2)).attr('y2', toY(dy * gridSize * 2))
          .attr('stroke', 'var(--color-vector-red)').attr('stroke-width', 3)
          .attr('opacity', 0.3);
        // Dots on the line
        for (let ci = -gridSize * 2; ci <= gridSize * 2; ci += 0.3) {
          const px = ci * v1x;
          const py = ci * v1y;
          if (Math.abs(px) <= gridSize && Math.abs(py) <= gridSize) {
            g.append('circle')
              .attr('cx', toX(px)).attr('cy', toY(py)).attr('r', 2)
              .attr('fill', 'var(--color-vector-red)').attr('opacity', 0.25);
          }
        }
      }
    }

    const drawArrow = (tx: number, ty: number, color: string, sw: number) => {
      const px1 = toX(0), py1 = toY(0), px2 = toX(tx), py2 = toY(ty);
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

    drawArrow(v1x, v1y, 'var(--color-vector-blue)', 2.5);
    drawArrow(v2x, v2y, 'var(--color-vector-green)', 2.5);

    g.append('text').attr('x', toX(v1x) + 10).attr('y', toY(v1y) - 8)
      .attr('fill', 'var(--color-vector-blue)').attr('font-size', '12px').attr('font-weight', 'bold')
      .attr('font-family', 'var(--font-serif)')
      .text(`a=(${v1x.toFixed(1)},${v1y.toFixed(1)})`);
    g.append('text').attr('x', toX(v2x) + 10).attr('y', toY(v2y) - 8)
      .attr('fill', 'var(--color-vector-green)').attr('font-size', '12px').attr('font-weight', 'bold')
      .attr('font-family', 'var(--font-serif)')
      .text(`b=(${v2x.toFixed(1)},${v2y.toFixed(1)})`);

    // Status label
    const statusColor = isIndependent ? 'var(--color-vector-green)' : 'var(--color-vector-red)';
    const statusText = isIndependent ? 'Span = entire plane (independent)' : 'Span = a line (dependent)';
    g.append('text').attr('x', width - padding).attr('y', padding)
      .attr('text-anchor', 'end').attr('fill', statusColor)
      .attr('font-size', '12px').attr('font-weight', 'bold').attr('font-family', 'var(--font-sans)')
      .text(statusText);
    g.append('text').attr('x', width - padding).attr('y', padding + 16)
      .attr('text-anchor', 'end').attr('fill', 'var(--color-ink-muted)')
      .attr('font-size', '11px').attr('font-family', 'var(--font-mono)')
      .text(`det = ${det.toFixed(2)}`);

    g.append('circle').attr('cx', toX(0)).attr('cy', toY(0)).attr('r', 3).attr('fill', 'var(--color-ink)');
  }, [v1x, v1y, v2x, v2y, det, isIndependent, width, height]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <div className="not-prose space-y-3">
      <div className="rounded-md border border-rule overflow-hidden" style={{ background: 'var(--color-paper)' }}>
        <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ display: 'block' }} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <span className="font-sans text-xs font-bold" style={{ color: 'var(--color-vector-blue)' }}>a:</span>
          <span className="font-mono text-xs">x</span>
          <input type="range" min={-4} max={4} step={0.1} value={v1x} onChange={(e) => setV1x(parseFloat(e.target.value))} className="flex-1 h-1 accent-[var(--color-vector-blue)]" />
          <span className="font-mono text-xs">y</span>
          <input type="range" min={-4} max={4} step={0.1} value={v1y} onChange={(e) => setV1y(parseFloat(e.target.value))} className="flex-1 h-1 accent-[var(--color-vector-blue)]" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-sans text-xs font-bold" style={{ color: 'var(--color-vector-green)' }}>b:</span>
          <span className="font-mono text-xs">x</span>
          <input type="range" min={-4} max={4} step={0.1} value={v2x} onChange={(e) => setV2x(parseFloat(e.target.value))} className="flex-1 h-1 accent-[var(--color-vector-green)]" />
          <span className="font-mono text-xs">y</span>
          <input type="range" min={-4} max={4} step={0.1} value={v2y} onChange={(e) => setV2y(parseFloat(e.target.value))} className="flex-1 h-1 accent-[var(--color-vector-green)]" />
        </div>
      </div>
      <p className="text-xs font-sans text-ink-muted">Try making both vectors point in the same direction — watch the span collapse from a plane to a line.</p>
    </div>
  );
}
