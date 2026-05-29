import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

export function ProjectionVis({ width = 640, height = 400 }: { width?: number; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [ax, setAx] = useState(3);
  const [ay, setAy] = useState(1);
  const [bx, setBx] = useState(1);
  const [by, setBy] = useState(3);

  const dotAB = ax * bx + ay * by;
  const dotAA = ax * ax + ay * ay;
  const lenA = Math.sqrt(dotAA);
  const lenB = Math.sqrt(bx * bx + by * by);
  const scalar = dotAA > 0 ? dotAB / dotAA : 0;
  const projX = scalar * ax;
  const projY = scalar * ay;
  const perpX = bx - projX;
  const perpY = by - projY;

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

    // Vector a (blue) — the target direction
    drawArrow(0, 0, ax, ay, 'var(--color-vector-blue)', 2.5);

    // Vector b (green)
    drawArrow(0, 0, bx, by, 'var(--color-vector-green)', 2.5);

    // Projection of b onto a (orange dashed)
    if (Math.abs(projX) > 0.01 || Math.abs(projY) > 0.01) {
      drawArrow(0, 0, projX, projY, 'var(--color-accent)', 2.5);

      // Perpendicular drop line (dashed)
      g.append('line')
        .attr('x1', toX(bx)).attr('y1', toY(by))
        .attr('x2', toX(projX)).attr('y2', toY(projY))
        .attr('stroke', 'var(--color-ink-muted)').attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4 3');

      // Right angle marker at projection point
      const perpLen = Math.sqrt(perpX * perpX + perpY * perpY);
      if (perpLen > 0.3) {
        const markerSize = 0.25;
        const aDir = { x: ax / lenA, y: ay / lenA };
        const pDir = { x: perpX / perpLen, y: perpY / perpLen };
        const mx1 = toX(projX + aDir.x * markerSize);
        const my1 = toY(projY + aDir.y * markerSize);
        const mx2 = toX(projX + aDir.x * markerSize + pDir.x * markerSize);
        const my2 = toY(projY + aDir.y * markerSize + pDir.y * markerSize);
        const mx3 = toX(projX + pDir.x * markerSize);
        const my3 = toY(projY + pDir.y * markerSize);
        g.append('polyline')
          .attr('points', `${mx1},${my1} ${mx2},${my2} ${mx3},${my3}`)
          .attr('fill', 'none').attr('stroke', 'var(--color-ink-muted)').attr('stroke-width', 1);
      }
    }

    // Labels
    g.append('text').attr('x', toX(ax) + 8).attr('y', toY(ay) - 8)
      .attr('fill', 'var(--color-vector-blue)').attr('font-size', 14).attr('font-weight', 600)
      .text('a');
    g.append('text').attr('x', toX(bx) + 8).attr('y', toY(by) - 8)
      .attr('fill', 'var(--color-vector-green)').attr('font-size', 14).attr('font-weight', 600)
      .text('b');

  }, [ax, ay, bx, by, lenA, perpX, perpY, projX, projY, width, height]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <div className="space-y-3">
      <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full bg-[var(--color-paper)] rounded-lg border border-[var(--color-rule)]" />

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <label className="text-[var(--color-ink-muted)]">a direction</label>
          <div className="flex gap-2 mt-1">
            <input type="range" min={-4} max={4} step={0.1} value={ax} onChange={e => setAx(+e.target.value)} className="flex-1 accent-[var(--color-vector-blue)]" />
            <span className="font-mono text-xs w-8 text-right">{ax.toFixed(1)}</span>
          </div>
          <div className="flex gap-2 mt-1">
            <input type="range" min={-4} max={4} step={0.1} value={ay} onChange={e => setAy(+e.target.value)} className="flex-1 accent-[var(--color-vector-blue)]" />
            <span className="font-mono text-xs w-8 text-right">{ay.toFixed(1)}</span>
          </div>
        </div>
        <div>
          <label className="text-[var(--color-ink-muted)]">b vector</label>
          <div className="flex gap-2 mt-1">
            <input type="range" min={-4} max={4} step={0.1} value={bx} onChange={e => setBx(+e.target.value)} className="flex-1 accent-[var(--color-vector-green)]" />
            <span className="font-mono text-xs w-8 text-right">{bx.toFixed(1)}</span>
          </div>
          <div className="flex gap-2 mt-1">
            <input type="range" min={-4} max={4} step={0.1} value={by} onChange={e => setBy(+e.target.value)} className="flex-1 accent-[var(--color-vector-green)]" />
            <span className="font-mono text-xs w-8 text-right">{by.toFixed(1)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center text-sm bg-[var(--color-surface-1)] rounded-lg p-3">
        <div>
          <div className="text-[var(--color-ink-muted)] text-xs">a . b</div>
          <div className="font-mono font-semibold">{dotAB.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-[var(--color-ink-muted)] text-xs">scalar</div>
          <div className="font-mono font-semibold text-[var(--color-accent)]">{scalar.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-[var(--color-ink-muted)] text-xs">projection</div>
          <div className="font-mono font-semibold text-[var(--color-accent)]">({projX.toFixed(1)}, {projY.toFixed(1)})</div>
        </div>
      </div>
    </div>
  );
}
