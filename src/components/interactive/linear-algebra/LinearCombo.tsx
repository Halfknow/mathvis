import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

export function LinearCombo({ width = 640, height = 420 }: { width?: number; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [c1, setC1] = useState(1.5);
  const [c2, setC2] = useState(1);
  const [v1x, setV1x] = useState(2);
  const [v1y, setV1y] = useState(0);
  const [v2x, setV2x] = useState(0);
  const [v2y, setV2y] = useState(2);

  const result = { x: c1 * v1x + c2 * v2x, y: c1 * v1y + c2 * v2y };

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

    const drawArrow = (ox: number, oy: number, tx: number, ty: number, color: string, sw: number, dash?: string) => {
      const px1 = toX(ox), py1 = toY(oy), px2 = toX(tx), py2 = toY(ty);
      const dx = px2 - px1, dy = py2 - py1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 3) return;
      const ux = dx / len, uy = dy / len, hl = 10;
      g.append('line').attr('x1', px1).attr('y1', py1)
        .attr('x2', px2 - ux * hl).attr('y2', py2 - uy * hl)
        .attr('stroke', color).attr('stroke-width', sw).attr('stroke-linecap', 'round')
        .attr('stroke-dasharray', dash || 'none');
      g.append('polygon')
        .attr('points', [`${px2},${py2}`, `${px2 - ux * hl + uy * 5},${py2 - uy * hl - ux * 5}`, `${px2 - ux * hl - uy * 5},${py2 - uy * hl + ux * 5}`].join(' '))
        .attr('fill', color);
    };

    // c1*v1 (blue, from origin)
    const c1x = c1 * v1x, c1y_ = c1 * v1y;
    drawArrow(0, 0, c1x, c1y_, 'var(--color-vector-blue)', 2.5);

    // c2*v2 (green, from tip of c1*v1 — head-to-tail)
    const c2x = c2 * v2x, c2y_ = c2 * v2y;
    drawArrow(c1x, c1y_, c1x + c2x, c1y_ + c2y_, 'var(--color-vector-green)', 2.5);

    // Result (accent)
    drawArrow(0, 0, result.x, result.y, 'var(--color-accent)', 3, '6,4');

    // Ghost basis vectors (faint)
    drawArrow(0, 0, v1x, v1y, 'var(--color-vector-blue)', 1, '3,3');
    drawArrow(0, 0, v2x, v2y, 'var(--color-vector-green)', 1, '3,3');

    // Result dot
    g.append('circle').attr('cx', toX(result.x)).attr('cy', toY(result.y)).attr('r', 6)
      .attr('fill', 'var(--color-accent)').attr('opacity', 0.8);

    // Labels
    g.append('text').attr('x', toX(v1x) + 8).attr('y', toY(v1y) + 16)
      .attr('fill', 'var(--color-vector-blue)').attr('font-size', '11px').attr('font-family', 'var(--font-mono)').attr('opacity', 0.6)
      .text(`a=(${v1x},${v1y})`);
    g.append('text').attr('x', toX(v2x) + 8).attr('y', toY(v2y) + 16)
      .attr('fill', 'var(--color-vector-green)').attr('font-size', '11px').attr('font-family', 'var(--font-mono)').attr('opacity', 0.6)
      .text(`b=(${v2x},${v2y})`);

    g.append('text').attr('x', toX(result.x) + 10).attr('y', toY(result.y) - 10)
      .attr('fill', 'var(--color-accent)').attr('font-size', '13px').attr('font-weight', 'bold')
      .attr('font-family', 'var(--font-serif)')
      .text(`(${result.x.toFixed(1)}, ${result.y.toFixed(1)})`);

    // Formula
    g.append('text').attr('x', width - padding).attr('y', padding)
      .attr('text-anchor', 'end').attr('fill', 'var(--color-ink-muted)')
      .attr('font-size', '11px').attr('font-family', 'var(--font-mono)')
      .text(`${c1.toFixed(1)}a + ${c2.toFixed(1)}b`);

    g.append('circle').attr('cx', toX(0)).attr('cy', toY(0)).attr('r', 3).attr('fill', 'var(--color-ink)');
  }, [c1, c2, v1x, v1y, v2x, v2y, result.x, result.y, width, height]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <div className="not-prose space-y-3">
      <div className="rounded-md border border-rule overflow-hidden" style={{ background: 'var(--color-paper)' }}>
        <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ display: 'block' }} />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-sans text-xs font-bold w-6" style={{ color: 'var(--color-vector-blue)' }}>c₁</span>
          <input type="range" min={-3} max={3} step={0.1} value={c1}
            onChange={(e) => setC1(parseFloat(e.target.value))}
            className="flex-1 h-1 accent-[var(--color-vector-blue)]" />
          <span className="font-mono text-xs w-8 text-right" style={{ color: 'var(--color-vector-blue)' }}>{c1.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-sans text-xs font-bold w-6" style={{ color: 'var(--color-vector-green)' }}>c₂</span>
          <input type="range" min={-3} max={3} step={0.1} value={c2}
            onChange={(e) => setC2(parseFloat(e.target.value))}
            className="flex-1 h-1 accent-[var(--color-vector-green)]" />
          <span className="font-mono text-xs w-8 text-right" style={{ color: 'var(--color-vector-green)' }}>{c2.toFixed(1)}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-2 pt-2 border-t border-rule">
          <div className="flex items-center gap-2">
            <span className="font-sans text-xs text-ink-muted">a:</span>
            <span className="font-mono text-xs">x</span>
            <input type="range" min={-4} max={4} step={0.5} value={v1x} onChange={(e) => setV1x(parseFloat(e.target.value))} className="flex-1 h-1 accent-[var(--color-vector-blue)]" />
            <span className="font-mono text-xs">y</span>
            <input type="range" min={-4} max={4} step={0.5} value={v1y} onChange={(e) => setV1y(parseFloat(e.target.value))} className="flex-1 h-1 accent-[var(--color-vector-blue)]" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-sans text-xs text-ink-muted">b:</span>
            <span className="font-mono text-xs">x</span>
            <input type="range" min={-4} max={4} step={0.5} value={v2x} onChange={(e) => setV2x(parseFloat(e.target.value))} className="flex-1 h-1 accent-[var(--color-vector-green)]" />
            <span className="font-mono text-xs">y</span>
            <input type="range" min={-4} max={4} step={0.5} value={v2y} onChange={(e) => setV2y(parseFloat(e.target.value))} className="flex-1 h-1 accent-[var(--color-vector-green)]" />
          </div>
        </div>
      </div>
    </div>
  );
}
