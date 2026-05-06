import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

interface VectorAdditionProps {
  width?: number;
  height?: number;
}

export function VectorAddition({ width = 640, height = 400 }: VectorAdditionProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [v1, setV1] = useState({ x: 3, y: 1 });
  const [v2, setV2] = useState({ x: 1, y: 2 });
  const [dragging, setDragging] = useState<'v1' | 'v2' | null>(null);
  const [showParallelogram, setShowParallelogram] = useState(false);

  const sum = { x: v1.x + v2.x, y: v1.y + v2.y };

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
    const fromPx = (px: number) => Math.round(((px - cx) / scale) * 4) / 4;
    const fromPy = (py: number) => Math.round(((cy - py) / scale) * 4) / 4;

    const g = svg.append('g');

    // Grid
    for (let i = -gridSize; i <= gridSize; i++) {
      const isAxis = i === 0;
      g.append('line')
        .attr('x1', toX(-gridSize)).attr('y1', toY(i))
        .attr('x2', toX(gridSize)).attr('y2', toY(i))
        .attr('stroke', isAxis ? 'var(--color-ink-faint)' : 'var(--color-rule)')
        .attr('stroke-width', isAxis ? 1 : 0.4);
      g.append('line')
        .attr('x1', toX(i)).attr('y1', toY(-gridSize))
        .attr('x2', toX(i)).attr('y2', toY(gridSize))
        .attr('stroke', isAxis ? 'var(--color-ink-faint)' : 'var(--color-rule)')
        .attr('stroke-width', isAxis ? 1 : 0.4);
    }

    // Parallelogram (optional)
    if (showParallelogram) {
      const pts = [
        `${toX(0)},${toY(0)}`,
        `${toX(v1.x)},${toY(v1.y)}`,
        `${toX(sum.x)},${toY(sum.y)}`,
        `${toX(v2.x)},${toY(v2.y)}`,
      ].join(' ');
      g.append('polygon')
        .attr('points', pts)
        .attr('fill', 'var(--color-accent)')
        .attr('fill-opacity', 0.08)
        .attr('stroke', 'var(--color-accent)')
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,4')
        .attr('stroke-opacity', 0.5);
    }

    const drawArrow = (x1: number, y1: number, x2: number, y2: number, color: string, sw: number, dash?: string) => {
      const dx = x2 - x1, dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 3) return;
      const ux = dx / len, uy = dy / len;
      const hl = 10;
      g.append('line')
        .attr('x1', x1).attr('y1', y1)
        .attr('x2', x2 - ux * hl).attr('y2', y2 - uy * hl)
        .attr('stroke', color).attr('stroke-width', sw)
        .attr('stroke-linecap', 'round')
        .attr('stroke-dasharray', dash || 'none');
      g.append('polygon')
        .attr('points', [
          `${x2},${y2}`,
          `${x2 - ux * hl + uy * 5},${y2 - uy * hl - ux * 5}`,
          `${x2 - ux * hl - uy * 5},${y2 - uy * hl + ux * 5}`,
        ].join(' '))
        .attr('fill', color);
    };

    // v1 from origin (blue)
    drawArrow(toX(0), toY(0), toX(v1.x), toY(v1.y), 'var(--color-vector-blue)', 2.5);

    // v2 from tip of v1 (green) — head-to-tail
    drawArrow(toX(v1.x), toY(v1.y), toX(sum.x), toY(sum.y), 'var(--color-vector-green)', 2.5);

    if (showParallelogram) {
      // v1 from tip of v2 (blue, dashed)
      drawArrow(toX(v2.x), toY(v2.y), toX(sum.x), toY(sum.y), 'var(--color-vector-blue)', 1.5, '5,5');
      // v2 from origin (green, dashed)
      drawArrow(toX(0), toY(0), toX(v2.x), toY(v2.y), 'var(--color-vector-green)', 1.5, '5,5');
    }

    // Sum vector (accent, dashed)
    drawArrow(toX(0), toY(0), toX(sum.x), toY(sum.y), 'var(--color-accent)', 3, '8,4');

    // Drag handles
    const makeHandle = (px: number, py: number, color: string) => {
      g.append('circle').attr('cx', px).attr('cy', py).attr('r', 10)
        .attr('fill', color).attr('opacity', 0.15)
        .attr('class', 'cursor-grab');
      g.append('circle').attr('cx', px).attr('cy', py).attr('r', 6)
        .attr('fill', color).attr('class', 'cursor-grab');
    };

    makeHandle(toX(v1.x), toY(v1.y), 'var(--color-vector-blue)');
    makeHandle(toX(v1.x + v2.x), toY(v1.y + v2.y), 'var(--color-vector-green)');

    // Labels
    g.append('text').attr('x', toX(v1.x) + 10).attr('y', toY(v1.y) - 10)
      .attr('fill', 'var(--color-vector-blue)').attr('font-size', '12px').attr('font-weight', 'bold')
      .attr('font-family', 'var(--font-serif)')
      .text(`a = (${v1.x.toFixed(1)}, ${v1.y.toFixed(1)})`);

    g.append('text').attr('x', toX(v2.x) + 10).attr('y', toY(v2.y) - 10)
      .attr('fill', 'var(--color-vector-green)').attr('font-size', '12px').attr('font-weight', 'bold')
      .attr('font-family', 'var(--font-serif)')
      .text(`b = (${v2.x.toFixed(1)}, ${v2.y.toFixed(1)})`);

    g.append('text').attr('x', toX(sum.x) + 10).attr('y', toY(sum.y) + 16)
      .attr('fill', 'var(--color-accent)').attr('font-size', '13px').attr('font-weight', 'bold')
      .attr('font-family', 'var(--font-serif)')
      .text(`a+b = (${sum.x.toFixed(1)}, ${sum.y.toFixed(1)})`);

    g.append('circle').attr('cx', toX(0)).attr('cy', toY(0)).attr('r', 3).attr('fill', 'var(--color-ink)');

  }, [v1, v2, sum, showParallelogram, width, height]);

  useEffect(() => { draw(); }, [draw]);

  const handlePointerDown = (target: 'v1' | 'v2') => {
    setDragging(target);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svg = d3.select(svgRef.current);
    const padding = 40;
    const cx = width / 2;
    const cy = height / 2;
    const gridSize = 6;
    const plotSize = Math.min(width - padding * 2, height - padding * 2);
    const scale = plotSize / (gridSize * 2);

    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;
    const mx = Math.round(((px - cx) / scale) * 2) / 2;
    const my = Math.round(((cy - py) / scale) * 2) / 2;

    if (dragging === 'v1') setV1({ x: mx, y: my });
    else setV2({ x: mx, y: my });
  };

  return (
    <div className="not-prose space-y-3">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowParallelogram(!showParallelogram)}
          className={`rounded border px-3 py-1 text-xs font-sans font-medium transition-colors ${
            showParallelogram
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-rule bg-paper-elevated text-ink-muted hover:border-accent'
          }`}
        >
          {showParallelogram ? 'Parallelogram ON' : 'Show parallelogram'}
        </button>
        <span className="text-xs font-sans text-ink-muted">Drag the blue and green dots to change vectors</span>
      </div>
      <div className="rounded-md border border-rule overflow-hidden" style={{ background: 'var(--color-paper)' }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          style={{ display: 'block', touchAction: 'none' }}
          onPointerMove={handlePointerMove}
          onPointerUp={() => setDragging(null)}
          onPointerLeave={() => setDragging(null)}
        />
      </div>
    </div>
  );
}
