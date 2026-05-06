import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

export function DotProductVis({ width = 640, height = 400 }: { width?: number; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [v1x, setV1x] = useState(3);
  const [v1y, setV1y] = useState(1);
  const [v2x, setV2x] = useState(1);
  const [v2y, setV2y] = useState(3);
  const [showProjection, setShowProjection] = useState(true);

  const dot = v1x * v2x + v1y * v2y;
  const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const len2 = Math.sqrt(v2x * v2x + v2y * v2y);
  const cosAngle = len1 > 0 && len2 > 0 ? dot / (len1 * len2) : 0;
  const angleDeg = (Math.acos(Math.max(-1, Math.min(1, cosAngle))) * 180 / Math.PI);
  const projScalar = len1 > 0 ? dot / (len1 * len1) : 0;
  const projX = projScalar * v1x;
  const projY = projScalar * v1y;

  const draw = useCallback(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const padding = 50;
    const cx = width / 2;
    const cy = height / 2;
    const gridSize = 5;
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

    if (showProjection && len1 > 0.01) {
      // Line through v1 (extended)
      const dx1 = v1x / len1, dy1 = v1y / len1;
      g.append('line')
        .attr('x1', toX(-dx1 * gridSize)).attr('y1', toY(-dy1 * gridSize))
        .attr('x2', toX(dx1 * gridSize)).attr('y2', toY(dy1 * gridSize))
        .attr('stroke', 'var(--color-vector-blue)').attr('stroke-width', 0.8)
        .attr('stroke-dasharray', '4,4').attr('opacity', 0.3);

      // Projection vector
      drawArrow(0, 0, projX, projY, 'var(--color-accent)', 2.5);

      // Projection line (v2 tip -> projection)
      g.append('line')
        .attr('x1', toX(v2x)).attr('y1', toY(v2y))
        .attr('x2', toX(projX)).attr('y2', toY(projY))
        .attr('stroke', 'var(--color-ink-muted)').attr('stroke-width', 1)
        .attr('stroke-dasharray', '3,3').attr('opacity', 0.6);

      // Right angle marker
      const pLen = Math.sqrt(projX * projX + projY * projY);
      if (pLen > 0.3) {
        const px = projX / pLen, py = projY / pLen;
        const markerSize = 8;
        const mx1 = toX(projX) + px * markerSize;
        const my1 = toY(projY) - py * markerSize;
        const perpX = -py, perpY = px;
        const mx2 = mx1 + perpX * markerSize;
        const my2 = my1 - perpY * markerSize;
        const mx3 = toX(projX) + perpX * markerSize;
        const my3 = toY(projY) - perpY * markerSize;
        g.append('polyline')
          .attr('points', `${toX(projX)},${toY(projY)} ${mx1},${my1} ${mx2},${my2} ${mx3},${my3}`)
          .attr('fill', 'none').attr('stroke', 'var(--color-ink-muted)').attr('stroke-width', 1).attr('opacity', 0.5);
      }

      // Projection label
      g.append('text').attr('x', toX(projX) + 10).attr('y', toY(projY) + 16)
        .attr('fill', 'var(--color-accent)').attr('font-size', '11px').attr('font-family', 'var(--font-mono)')
        .text(`proj = (${projX.toFixed(1)}, ${projY.toFixed(1)})`);
    }

    // v1 (blue)
    drawArrow(0, 0, v1x, v1y, 'var(--color-vector-blue)', 2.5);
    // v2 (green)
    drawArrow(0, 0, v2x, v2y, 'var(--color-vector-green)', 2.5);

    // Angle arc
    if (len1 > 0.01 && len2 > 0.01) {
      const a1 = Math.atan2(v1y, v1x);
      const a2 = Math.atan2(v2y, v2x);
      const arcR = 25;
      const arc = d3.arc()({ innerRadius: 0, outerRadius: arcR, startAngle: 0, endAngle: Math.abs(a2 - a1) });
      if (arc) {
        g.append('path')
          .attr('d', arc)
          .attr('transform', `translate(${toX(0)},${toY(0)}) rotate(${-Math.min(a1, a2) * 180 / Math.PI})`)
          .attr('fill', 'var(--color-accent)').attr('fill-opacity', 0.2);
      }
    }

    // Labels
    g.append('text').attr('x', toX(v1x) + 8).attr('y', toY(v1y) - 10)
      .attr('fill', 'var(--color-vector-blue)').attr('font-size', '12px').attr('font-weight', 'bold')
      .attr('font-family', 'var(--font-serif)')
      .text(`a = (${v1x.toFixed(1)}, ${v1y.toFixed(1)})`);
    g.append('text').attr('x', toX(v2x) + 8).attr('y', toY(v2y) - 10)
      .attr('fill', 'var(--color-vector-green)').attr('font-size', '12px').attr('font-weight', 'bold')
      .attr('font-family', 'var(--font-serif)')
      .text(`b = (${v2x.toFixed(1)}, ${v2y.toFixed(1)})`);

    // Info box
    g.append('text').attr('x', width - padding).attr('y', padding)
      .attr('text-anchor', 'end').attr('fill', dot >= 0 ? 'var(--color-vector-green)' : 'var(--color-vector-red)')
      .attr('font-size', '14px').attr('font-weight', 'bold').attr('font-family', 'var(--font-mono)')
      .text(`a·b = ${dot.toFixed(2)}`);
    g.append('text').attr('x', width - padding).attr('y', padding + 18)
      .attr('text-anchor', 'end').attr('fill', 'var(--color-ink-muted)')
      .attr('font-size', '11px').attr('font-family', 'var(--font-mono)')
      .text(`θ = ${angleDeg.toFixed(1)}°`);
    g.append('text').attr('x', width - padding).attr('y', padding + 34)
      .attr('text-anchor', 'end').attr('fill', 'var(--color-ink-muted)')
      .attr('font-size', '11px').attr('font-family', 'var(--font-mono)')
      .text(`cos θ = ${cosAngle.toFixed(3)}`);

    g.append('circle').attr('cx', toX(0)).attr('cy', toY(0)).attr('r', 3).attr('fill', 'var(--color-ink)');
  }, [v1x, v1y, v2x, v2y, dot, cosAngle, angleDeg, projX, projY, showProjection, len1, width, height]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <div className="not-prose space-y-3">
      <div className="flex items-center gap-3">
        <button onClick={() => setShowProjection(!showProjection)}
          className={`rounded border px-3 py-1 text-xs font-sans font-medium transition-colors ${
            showProjection ? 'border-accent bg-accent/10 text-accent' : 'border-rule bg-paper-elevated text-ink-muted hover:border-accent'
          }`}
        >{showProjection ? 'Projection ON' : 'Show projection'}</button>
      </div>
      <div className="rounded-md border border-rule overflow-hidden" style={{ background: 'var(--color-paper)' }}>
        <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ display: 'block' }} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <span className="font-sans text-xs font-bold" style={{ color: 'var(--color-vector-blue)' }}>a:</span>
          <span className="font-mono text-xs text-ink-muted">x</span>
          <input type="range" min={-4} max={4} step={0.1} value={v1x} onChange={(e) => setV1x(parseFloat(e.target.value))} className="flex-1 h-1 accent-[var(--color-vector-blue)]" />
          <span className="font-mono text-xs text-ink-muted">y</span>
          <input type="range" min={-4} max={4} step={0.1} value={v1y} onChange={(e) => setV1y(parseFloat(e.target.value))} className="flex-1 h-1 accent-[var(--color-vector-blue)]" />
        </div>
        <div className="flex items-center gap-2">
          <span className="font-sans text-xs font-bold" style={{ color: 'var(--color-vector-green)' }}>b:</span>
          <span className="font-mono text-xs text-ink-muted">x</span>
          <input type="range" min={-4} max={4} step={0.1} value={v2x} onChange={(e) => setV2x(parseFloat(e.target.value))} className="flex-1 h-1 accent-[var(--color-vector-green)]" />
          <span className="font-mono text-xs text-ink-muted">y</span>
          <input type="range" min={-4} max={4} step={0.1} value={v2y} onChange={(e) => setV2y(parseFloat(e.target.value))} className="flex-1 h-1 accent-[var(--color-vector-green)]" />
        </div>
      </div>
    </div>
  );
}
