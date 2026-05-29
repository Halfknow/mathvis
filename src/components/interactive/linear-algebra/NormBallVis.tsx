import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

export function NormBallVis({ width = 640, height = 400 }: { width?: number; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [px, setPx] = useState(0.6);
  const [py, setPy] = useState(0.4);
  const [showL1, setShowL1] = useState(true);
  const [showL2, setShowL2] = useState(true);
  const [showLinf, setShowLinf] = useState(true);

  const l1 = Math.abs(px) + Math.abs(py);
  const l2 = Math.sqrt(px * px + py * py);
  const linf = Math.max(Math.abs(px), Math.abs(py));

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

    // Grid lines
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

    // Axis labels
    g.append('text').attr('x', toX(gridSize) - 4).attr('y', toY(0) - 8)
      .attr('text-anchor', 'end').attr('fill', 'var(--color-ink-faint)')
      .attr('font-size', '11px').attr('font-family', 'var(--font-mono)')
      .text('x');
    g.append('text').attr('x', toX(0) + 8).attr('y', toY(gridSize) + 14)
      .attr('text-anchor', 'start').attr('fill', 'var(--color-ink-faint)')
      .attr('font-size', '11px').attr('font-family', 'var(--font-mono)')
      .text('y');

    // Tick marks at ±1
    for (const v of [-1, 1]) {
      g.append('text').attr('x', toX(v)).attr('y', toY(0) + 16)
        .attr('text-anchor', 'middle').attr('fill', 'var(--color-ink-faint)')
        .attr('font-size', '10px').attr('font-family', 'var(--font-mono)')
        .text(v.toString());
      g.append('text').attr('x', toX(0) - 10).attr('y', toY(v) + 4)
        .attr('text-anchor', 'middle').attr('fill', 'var(--color-ink-faint)')
        .attr('font-size', '10px').attr('font-family', 'var(--font-mono)')
        .text(v.toString());
    }

    // L∞ unit ball (square) — draw first so it's behind
    if (showLinf) {
      const linfPts: [number, number][] = [
        [1, 1], [-1, 1], [-1, -1], [1, -1], [1, 1],
      ];
      g.append('polygon')
        .attr('points', linfPts.map(([x, y]) => `${toX(x)},${toY(y)}`).join(' '))
        .attr('fill', 'var(--color-accent)')
        .attr('fill-opacity', 0.08)
        .attr('stroke', 'var(--color-accent)')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.7);
    }

    // L1 unit ball (diamond)
    if (showL1) {
      const l1Pts: [number, number][] = [
        [1, 0], [0, 1], [-1, 0], [0, -1], [1, 0],
      ];
      g.append('polygon')
        .attr('points', l1Pts.map(([x, y]) => `${toX(x)},${toY(y)}`).join(' '))
        .attr('fill', 'var(--color-vector-green)')
        .attr('fill-opacity', 0.08)
        .attr('stroke', 'var(--color-vector-green)')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.7);
    }

    // L2 unit ball (circle)
    if (showL2) {
      const points = 120;
      const l2Pts: string[] = [];
      for (let i = 0; i <= points; i++) {
        const angle = (2 * Math.PI * i) / points;
        const x = Math.cos(angle);
        const y = Math.sin(angle);
        l2Pts.push(`${toX(x)},${toY(y)}`);
      }
      g.append('polygon')
        .attr('points', l2Pts.join(' '))
        .attr('fill', 'var(--color-vector-blue)')
        .attr('fill-opacity', 0.08)
        .attr('stroke', 'var(--color-vector-blue)')
        .attr('stroke-width', 2)
        .attr('stroke-opacity', 0.7);
    }

    // Dashed lines from point to axes (crosshair)
    g.append('line')
      .attr('x1', toX(px)).attr('y1', toY(0))
      .attr('x2', toX(px)).attr('y2', toY(py))
      .attr('stroke', 'var(--color-ink-muted)').attr('stroke-width', 0.8)
      .attr('stroke-dasharray', '3,3').attr('opacity', 0.5);
    g.append('line')
      .attr('x1', toX(0)).attr('y1', toY(py))
      .attr('x2', toX(px)).attr('y2', toY(py))
      .attr('stroke', 'var(--color-ink-muted)').attr('stroke-width', 0.8)
      .attr('stroke-dasharray', '3,3').attr('opacity', 0.5);

    // Point
    g.append('circle')
      .attr('cx', toX(px)).attr('cy', toY(py)).attr('r', 5)
      .attr('fill', 'var(--color-ink)').attr('stroke', 'var(--color-paper-elevated)')
      .attr('stroke-width', 1.5);

    // Point label
    g.append('text').attr('x', toX(px) + 10).attr('y', toY(py) - 8)
      .attr('fill', 'var(--color-ink)').attr('font-size', '11px')
      .attr('font-family', 'var(--font-mono)')
      .text(`(${px.toFixed(2)}, ${py.toFixed(2)})`);

    // Origin dot
    g.append('circle').attr('cx', toX(0)).attr('cy', toY(0)).attr('r', 3).attr('fill', 'var(--color-ink)');

    // Norm readout box (top-right)
    let readoutY = padding;
    const readoutX = width - padding;
    if (showL2) {
      g.append('text').attr('x', readoutX).attr('y', readoutY)
        .attr('text-anchor', 'end').attr('fill', 'var(--color-vector-blue)')
        .attr('font-size', '12px').attr('font-weight', 'bold').attr('font-family', 'var(--font-mono)')
        .text(`||p||₂ = ${l2.toFixed(3)}`);
      readoutY += 18;
    }
    if (showL1) {
      g.append('text').attr('x', readoutX).attr('y', readoutY)
        .attr('text-anchor', 'end').attr('fill', 'var(--color-vector-green)')
        .attr('font-size', '12px').attr('font-weight', 'bold').attr('font-family', 'var(--font-mono)')
        .text(`||p||₁ = ${l1.toFixed(3)}`);
      readoutY += 18;
    }
    if (showLinf) {
      g.append('text').attr('x', readoutX).attr('y', readoutY)
        .attr('text-anchor', 'end').attr('fill', 'var(--color-accent)')
        .attr('font-size', '12px').attr('font-weight', 'bold').attr('font-family', 'var(--font-mono)')
        .text(`||p||∞ = ${linf.toFixed(3)}`);
    }
  }, [px, py, l1, l2, linf, showL1, showL2, showLinf, width, height]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <div className="not-prose space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => setShowL2(!showL2)}
          className={`rounded border px-3 py-1 text-xs font-sans font-medium transition-colors ${
            showL2 ? 'border-[var(--color-vector-blue)] bg-[var(--color-vector-blue)]/10 text-[var(--color-vector-blue)]' : 'border-rule bg-paper-elevated text-ink-muted hover:border-[var(--color-vector-blue)]'
          }`}
        >{showL2 ? 'L₂ ON' : 'L₂'}</button>
        <button onClick={() => setShowL1(!showL1)}
          className={`rounded border px-3 py-1 text-xs font-sans font-medium transition-colors ${
            showL1 ? 'border-[var(--color-vector-green)] bg-[var(--color-vector-green)]/10 text-[var(--color-vector-green)]' : 'border-rule bg-paper-elevated text-ink-muted hover:border-[var(--color-vector-green)]'
          }`}
        >{showL1 ? 'L₁ ON' : 'L₁'}</button>
        <button onClick={() => setShowLinf(!showLinf)}
          className={`rounded border px-3 py-1 text-xs font-sans font-medium transition-colors ${
            showLinf ? 'border-accent bg-accent/10 text-accent' : 'border-rule bg-paper-elevated text-ink-muted hover:border-accent'
          }`}
        >{showLinf ? 'L∞ ON' : 'L∞'}</button>
      </div>
      <div className="rounded-md border border-rule overflow-hidden" style={{ background: 'var(--color-paper)' }}>
        <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ display: 'block' }} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-ink-muted">pₓ</span>
          <input type="range" min={-4} max={4} step={0.05} value={px} onChange={(e) => setPx(parseFloat(e.target.value))} className="flex-1 h-1 accent-[var(--color-ink)]" />
          <span className="font-mono text-xs text-ink-muted w-10 text-right">{px.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-ink-muted">pᵧ</span>
          <input type="range" min={-4} max={4} step={0.05} value={py} onChange={(e) => setPy(parseFloat(e.target.value))} className="flex-1 h-1 accent-[var(--color-ink)]" />
          <span className="font-mono text-xs text-ink-muted w-10 text-right">{py.toFixed(2)}</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        {showL2 && (
          <div className="rounded border border-rule px-2 py-1.5" style={{ background: 'var(--color-paper-elevated)' }}>
            <div className="font-mono text-[10px] text-ink-muted">||p||₂</div>
            <div className="font-mono text-sm font-bold" style={{ color: 'var(--color-vector-blue)' }}>{l2.toFixed(3)}</div>
          </div>
        )}
        {showL1 && (
          <div className="rounded border border-rule px-2 py-1.5" style={{ background: 'var(--color-paper-elevated)' }}>
            <div className="font-mono text-[10px] text-ink-muted">||p||₁</div>
            <div className="font-mono text-sm font-bold" style={{ color: 'var(--color-vector-green)' }}>{l1.toFixed(3)}</div>
          </div>
        )}
        {showLinf && (
          <div className="rounded border border-rule px-2 py-1.5" style={{ background: 'var(--color-paper-elevated)' }}>
            <div className="font-mono text-[10px] text-ink-muted">||p||∞</div>
            <div className="font-mono text-sm font-bold" style={{ color: 'var(--color-accent)' }}>{linf.toFixed(3)}</div>
          </div>
        )}
      </div>
    </div>
  );
}
