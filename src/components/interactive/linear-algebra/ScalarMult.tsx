import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

interface ScalarMultProps {
  width?: number;
  height?: number;
}

export function ScalarMult({ width = 640, height = 400 }: ScalarMultProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [vx, setVx] = useState(2);
  const [vy, setVy] = useState(1);
  const [scalar, setScalar] = useState(2);

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

    // Grid
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

    // The line through origin and v (shows direction)
    const dirLen = Math.sqrt(vx * vx + vy * vy);
    if (dirLen > 0.01) {
      const dx = vx / dirLen, dy = vy / dirLen;
      g.append('line')
        .attr('x1', toX(-dx * gridSize)).attr('y1', toY(-dy * gridSize))
        .attr('x2', toX(dx * gridSize)).attr('y2', toY(dy * gridSize))
        .attr('stroke', 'var(--color-rule)').attr('stroke-width', 1)
        .attr('stroke-dasharray', '4,4').attr('opacity', 0.5);
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

    // Original vector (blue)
    drawArrow(0, 0, vx, vy, 'var(--color-vector-blue)', 2.5);
    g.append('circle').attr('cx', toX(vx)).attr('cy', toY(vy)).attr('r', 4).attr('fill', 'var(--color-vector-blue)');

    // Scaled vector
    const sx = vx * scalar, sy = vy * scalar;
    const scaledColor = scalar < 0 ? 'var(--color-vector-red)' : 'var(--color-vector-green)';
    drawArrow(0, 0, sx, sy, scaledColor, 3);
    g.append('circle').attr('cx', toX(sx)).attr('cy', toY(sy)).attr('r', 5).attr('fill', scaledColor);

    // Labels
    g.append('text').attr('x', toX(vx) + 10).attr('y', toY(vy) - 8)
      .attr('fill', 'var(--color-vector-blue)').attr('font-size', '12px').attr('font-weight', 'bold')
      .attr('font-family', 'var(--font-serif)')
      .text(`v = (${vx.toFixed(1)}, ${vy.toFixed(1)})`);

    const scalarLabel = scalar === Math.round(scalar) ? scalar.toString() : scalar.toFixed(1);
    g.append('text').attr('x', toX(sx) + 10).attr('y', toY(sy) - 8)
      .attr('fill', scaledColor).attr('font-size', '12px').attr('font-weight', 'bold')
      .attr('font-family', 'var(--font-serif)')
      .text(`${scalarLabel}v = (${sx.toFixed(1)}, ${sy.toFixed(1)})`);

    // Length info
    const origLen = Math.sqrt(vx * vx + vy * vy).toFixed(2);
    const scaledLen = (Math.abs(scalar) * Math.sqrt(vx * vx + vy * vy)).toFixed(2);
    g.append('text').attr('x', width - padding).attr('y', padding)
      .attr('text-anchor', 'end').attr('fill', 'var(--color-ink-muted)')
      .attr('font-size', '11px').attr('font-family', 'var(--font-mono)')
      .text(`|v| = ${origLen}`);
    g.append('text').attr('x', width - padding).attr('y', padding + 16)
      .attr('text-anchor', 'end').attr('fill', scaledColor)
      .attr('font-size', '11px').attr('font-family', 'var(--font-mono)')
      .text(`|${scalarLabel}v| = ${scaledLen}`);

    g.append('circle').attr('cx', toX(0)).attr('cy', toY(0)).attr('r', 3).attr('fill', 'var(--color-ink)');
  }, [vx, vy, scalar, width, height]);

  useEffect(() => { draw(); }, [draw]);

  const presets = [
    { label: 'x2 (stretch)', s: 2 },
    { label: 'x0.5 (shrink)', s: 0.5 },
    { label: 'x0 (collapse)', s: 0 },
    { label: 'x-1 (flip)', s: -1 },
    { label: 'x-2 (flip+stretch)', s: -2 },
  ];

  return (
    <div className="not-prose space-y-3">
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button key={p.label} onClick={() => setScalar(p.s)}
            className={`rounded border px-3 py-1 text-xs font-sans font-medium transition-colors ${
              scalar === p.s ? 'border-accent bg-accent/10 text-accent' : 'border-rule bg-paper-elevated text-ink-muted hover:border-accent'
            }`}
          >{p.label}</button>
        ))}
      </div>
      <div className="rounded-md border border-rule overflow-hidden" style={{ background: 'var(--color-paper)' }}>
        <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ display: 'block' }} />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="font-sans text-xs text-ink-muted w-20">Scalar (c)</span>
          <input type="range" min={-3} max={3} step={0.1} value={scalar}
            onChange={(e) => setScalar(parseFloat(e.target.value))}
            className="flex-1 h-1 accent-[var(--color-accent)]" />
          <span className="font-mono text-sm font-bold w-10 text-right" style={{ color: scalar < 0 ? 'var(--color-vector-red)' : 'var(--color-accent)' }}>
            {scalar.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-sans text-xs text-ink-muted w-20">Vector v</span>
          <span className="font-mono text-xs text-ink-muted">x</span>
          <input type="range" min={-4} max={4} step={0.5} value={vx}
            onChange={(e) => setVx(parseFloat(e.target.value))}
            className="flex-1 h-1 accent-[var(--color-vector-blue)]" />
          <span className="font-mono text-xs text-ink-muted">y</span>
          <input type="range" min={-4} max={4} step={0.5} value={vy}
            onChange={(e) => setVy(parseFloat(e.target.value))}
            className="flex-1 h-1 accent-[var(--color-vector-blue)]" />
        </div>
      </div>
    </div>
  );
}
