import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

export function GramSchmidtVis({ width = 640, height = 400 }: { width?: number; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [v1x, setV1x] = useState(3);
  const [v1y, setV1y] = useState(1);
  const [v2x, setV2x] = useState(1);
  const [v2y, setV2y] = useState(2);
  const [step, setStep] = useState(0); // 0=original, 1=normalized u1, 2=full orthogonal

  const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
  // u1 = normalized v1
  const u1x = len1 > 0 ? v1x / len1 : 0;
  const u1y = len1 > 0 ? v1y / len1 : 0;
  // proj of v2 onto u1
  const dot2u1 = v2x * u1x + v2y * u1y;
  const projX = dot2u1 * u1x;
  const projY = dot2u1 * u1y;
  // v2' = v2 - proj
  const v2px = v2x - projX;
  const v2py = v2y - projY;
  const len2p = Math.sqrt(v2px * v2px + v2py * v2py);
  // u2 = normalized v2'
  const u2x = len2p > 0 ? v2px / len2p : 0;
  const u2y = len2p > 0 ? v2py / len2p : 0;

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

    // Step 0: Original vectors (faded)
    drawArrow(0, 0, v1x, v1y, 'var(--color-vector-blue)', step >= 1 ? 1.5 : 2.5, step >= 1 ? '4 3' : undefined);
    drawArrow(0, 0, v2x, v2y, 'var(--color-vector-green)', step >= 1 ? 1.5 : 2.5, step >= 1 ? '4 3' : undefined);

    // Labels for original
    g.append('text').attr('x', toX(v1x) + 8).attr('y', toY(v1y) - 8)
      .attr('fill', 'var(--color-vector-blue)').attr('font-size', 12).attr('font-weight', step === 0 ? 600 : 400)
      .text('v1');
    g.append('text').attr('x', toX(v2x) + 8).attr('y', toY(v2y) - 8)
      .attr('fill', 'var(--color-vector-green)').attr('font-size', 12).attr('font-weight', step === 0 ? 600 : 400)
      .text('v2');

    if (step >= 1) {
      // u1 (normalized v1, shown at same length for visibility)
      const displayU1x = u1x * len1, displayU1y = u1y * len1;
      drawArrow(0, 0, displayU1x, displayU1y, 'var(--color-vector-blue)', 2.5);
      g.append('text').attr('x', toX(displayU1x) + 8).attr('y', toY(displayU1y) + 16)
        .attr('fill', 'var(--color-vector-blue)').attr('font-size', 12).attr('font-weight', 600)
        .text('u1 (normalized)');
    }

    if (step >= 2) {
      // Projection of v2 onto u1 (to be subtracted)
      drawArrow(0, 0, projX, projY, 'var(--color-ink-muted)', 1.5, '4 3');

      // v2' = v2 - proj
      drawArrow(0, 0, v2px, v2py, 'var(--color-vector-yellow)', 2.5);

      // u2 (normalized v2', at same display length)
      const displayU2x = u2x * len2p, displayU2y = u2y * len2p;
      if (len2p > 0.1) {
        g.append('text').attr('x', toX(v2px) + 8).attr('y', toY(v2py) - 8)
          .attr('fill', 'var(--color-vector-yellow)').attr('font-size', 12).attr('font-weight', 600)
          .text("u2 (perpendicular)");
      }

      // Right angle marker
      if (len2p > 0.3) {
        const ms = 0.25;
        const aDir = { x: u1x, y: u1y };
        const pDir = { x: u2x, y: u2y };
        const base = { x: 0, y: 0 };
        const p1x = base.x + aDir.x * ms, p1y = base.y + aDir.y * ms;
        const p2x = p1x + pDir.x * ms, p2y = p1y + pDir.y * ms;
        const p3x = base.x + pDir.x * ms, p3y = base.y + pDir.y * ms;
        g.append('polyline')
          .attr('points', `${toX(p1x)},${toY(p1y)} ${toX(p2x)},${toY(p2y)} ${toX(p3x)},${toY(p3y)}`)
          .attr('fill', 'none').attr('stroke', 'var(--color-vector-yellow)').attr('stroke-width', 1);
      }
    }

  }, [v1x, v1y, v2x, v2y, step, len1, u1x, u1y, dot2u1, projX, projY, v2px, v2py, len2p, u2x, u2y, width, height]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <div className="space-y-3">
      <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full bg-[var(--color-paper)] rounded-lg border border-[var(--color-rule)]" />

      <div className="flex gap-2 mb-2">
        {(['Original', 'Step 1: Normalize v1', 'Step 2: Remove projection'] as const).map((label, i) => (
          <button key={i} onClick={() => setStep(i)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${step === i ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface-1)] text-[var(--color-ink-muted)]'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <label className="text-[var(--color-vector-blue)] font-semibold">v1</label>
          <div className="flex gap-2 mt-1">
            <input type="range" min={-4} max={4} step={0.1} value={v1x} onChange={e => setV1x(+e.target.value)} className="flex-1 accent-[var(--color-vector-blue)]" />
            <span className="font-mono text-xs w-8 text-right">{v1x.toFixed(1)}</span>
          </div>
          <div className="flex gap-2 mt-1">
            <input type="range" min={-4} max={4} step={0.1} value={v1y} onChange={e => setV1y(+e.target.value)} className="flex-1 accent-[var(--color-vector-blue)]" />
            <span className="font-mono text-xs w-8 text-right">{v1y.toFixed(1)}</span>
          </div>
        </div>
        <div>
          <label className="text-[var(--color-vector-green)] font-semibold">v2</label>
          <div className="flex gap-2 mt-1">
            <input type="range" min={-4} max={4} step={0.1} value={v2x} onChange={e => setV2x(+e.target.value)} className="flex-1 accent-[var(--color-vector-green)]" />
            <span className="font-mono text-xs w-8 text-right">{v2x.toFixed(1)}</span>
          </div>
          <div className="flex gap-2 mt-1">
            <input type="range" min={-4} max={4} step={0.1} value={v2y} onChange={e => setV2y(+e.target.value)} className="flex-1 accent-[var(--color-vector-green)]" />
            <span className="font-mono text-xs w-8 text-right">{v2y.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {step >= 2 && (
        <div className="text-center text-sm bg-[var(--color-surface-1)] rounded-lg p-2">
          u1 . u2 = <span className="font-mono font-semibold">{(u1x * u2x + u1y * u2y).toFixed(4)}</span>
          {Math.abs(u1x * u2x + u1y * u2y) < 0.01 && <span className="text-[var(--color-vector-yellow)] ml-2">Perpendicular! ✓</span>}
        </div>
      )}
    </div>
  );
}
