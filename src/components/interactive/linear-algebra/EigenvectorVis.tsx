import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

export function EigenvectorVis({ width = 640, height = 480 }: { width?: number; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [a, setA] = useState(2);
  const [b, setB] = useState(0);
  const [c, setC] = useState(0);
  const [d, setD] = useState(3);
  const [t, setT] = useState(0);

  const trace = a + d;
  const det = a * d - b * c;
  const disc = trace * trace - 4 * det;

  const draw = useCallback((tVal: number) => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const padding = 40;
    const cx = width / 2;
    const cy = height / 2;
    const gridSize = 5;
    const plotSize = Math.min(width - padding * 2, height - padding * 2);
    const scale = plotSize / (gridSize * 2);
    const toX = (v: number) => cx + v * scale;
    const toY = (v: number) => cy - v * scale;

    const ma = 1 + (a - 1) * tVal;
    const mb = b * tVal;
    const mc = c * tVal;
    const md = 1 + (d - 1) * tVal;

    const g = svg.append('g');

    for (let i = -gridSize; i <= gridSize; i++) {
      const isAxis = i === 0;
      g.append('line').attr('x1', toX(-gridSize)).attr('y1', toY(i))
        .attr('x2', toX(gridSize)).attr('y2', toY(i))
        .attr('stroke', isAxis ? 'var(--color-ink-faint)' : 'var(--color-rule)')
        .attr('stroke-width', isAxis ? 1 : 0.3).attr('opacity', 0.4);
      g.append('line').attr('x1', toX(i)).attr('y1', toY(-gridSize))
        .attr('x2', toX(i)).attr('y2', toY(gridSize))
        .attr('stroke', isAxis ? 'var(--color-ink-faint)' : 'var(--color-rule)')
        .attr('stroke-width', isAxis ? 1 : 0.3).attr('opacity', 0.4);
    }

    const drawArrow = (ox: number, oy: number, tx: number, ty: number, color: string, sw: number, opacity: number) => {
      const px1 = toX(ox), py1 = toY(oy), px2 = toX(tx), py2 = toY(ty);
      const dx = px2 - px1, dy = py2 - py1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 3) return;
      const ux = dx / len, uy = dy / len, hl = 8;
      g.append('line').attr('x1', px1).attr('y1', py1)
        .attr('x2', px2 - ux * hl).attr('y2', py2 - uy * hl)
        .attr('stroke', color).attr('stroke-width', sw).attr('stroke-linecap', 'round').attr('opacity', opacity);
      g.append('polygon')
        .attr('points', [`${px2},${py2}`, `${px2 - ux * hl + uy * 4},${py2 - uy * hl - ux * 4}`, `${px2 - ux * hl - uy * 4},${py2 - uy * hl + ux * 4}`].join(' '))
        .attr('fill', color).attr('opacity', opacity);
    };

    // Circle of vectors -> ellipse
    const numVectors = 24;
    for (let i = 0; i < numVectors; i++) {
      const angle = (2 * Math.PI * i) / numVectors;
      const vx = Math.cos(angle) * 2;
      const vy = Math.sin(angle) * 2;
      const tx = ma * vx + mb * vy;
      const ty = mc * vx + md * vy;

      // Original (faint)
      drawArrow(0, 0, vx, vy, 'var(--color-ink-muted)', 1, 0.2);
      // Transformed
      drawArrow(0, 0, tx, ty, 'var(--color-vector-blue)', 1.5, 0.6);
    }

    // Eigenvectors (if real eigenvalues exist)
    if (disc >= 0) {
      const lambda1 = (trace + Math.sqrt(disc)) / 2;
      const lambda2 = (trace - Math.sqrt(disc)) / 2;

      // Find eigenvectors
      const findEigenvec = (lambda: number) => {
        if (Math.abs(b) > 0.001) return { x: b, y: lambda - a };
        if (Math.abs(c) > 0.001) return { x: lambda - d, y: c };
        if (Math.abs(lambda - a) < 0.001) return { x: 1, y: 0 };
        return { x: 0, y: 1 };
      };

      const ev1 = findEigenvec(lambda1);
      const ev2 = findEigenvec(lambda2);

      // Normalize
      const n1 = Math.sqrt(ev1.x * ev1.x + ev1.y * ev1.y) || 1;
      const n2 = Math.sqrt(ev2.x * ev2.x + ev2.y * ev2.y) || 1;
      ev1.x /= n1; ev1.y /= n1;
      ev2.x /= n2; ev2.y /= n2;

      const eigenScale = 4;

      // Eigenvector 1 line (through origin)
      g.append('line')
        .attr('x1', toX(-ev1.x * gridSize)).attr('y1', toY(-ev1.y * gridSize))
        .attr('x2', toX(ev1.x * gridSize)).attr('y2', toY(ev1.y * gridSize))
        .attr('stroke', 'var(--color-vector-yellow)').attr('stroke-width', 2.5)
        .attr('stroke-dasharray', '8,4').attr('opacity', 0.7);

      // Eigenvector 2 line (through origin)
      g.append('line')
        .attr('x1', toX(-ev2.x * gridSize)).attr('y1', toY(-ev2.y * gridSize))
        .attr('x2', toX(ev2.x * gridSize)).attr('y2', toY(ev2.y * gridSize))
        .attr('stroke', 'var(--color-vector-red)').attr('stroke-width', 2.5)
        .attr('stroke-dasharray', '8,4').attr('opacity', 0.7);

      // Eigenvector arrows (before and after transform)
      const te1x = ma * ev1.x * eigenScale + mb * ev1.y * eigenScale;
      const te1y = mc * ev1.x * eigenScale + md * ev1.y * eigenScale;
      drawArrow(0, 0, ev1.x * eigenScale, ev1.y * eigenScale, 'var(--color-vector-yellow)', 1, 0.3);
      drawArrow(0, 0, te1x, te1y, 'var(--color-vector-yellow)', 3, 0.9);

      const te2x = ma * ev2.x * eigenScale + mb * ev2.y * eigenScale;
      const te2y = mc * ev2.x * eigenScale + md * ev2.y * eigenScale;
      drawArrow(0, 0, ev2.x * eigenScale, ev2.y * eigenScale, 'var(--color-vector-red)', 1, 0.3);
      drawArrow(0, 0, te2x, te2y, 'var(--color-vector-red)', 3, 0.9);

      // Eigenvalue labels
      g.append('text').attr('x', toX(te1x) + 10).attr('y', toY(te1y) - 8)
        .attr('fill', 'var(--color-vector-yellow)').attr('font-size', '12px').attr('font-weight', 'bold')
        .attr('font-family', 'var(--font-mono)')
        .text(`λ₁=${lambda1.toFixed(2)}`);
      g.append('text').attr('x', toX(te2x) + 10).attr('y', toY(te2y) - 8)
        .attr('fill', 'var(--color-vector-red)').attr('font-size', '12px').attr('font-weight', 'bold')
        .attr('font-family', 'var(--font-mono)')
        .text(`λ₂=${lambda2.toFixed(2)}`);
    } else {
      g.append('text').attr('x', width / 2).attr('y', padding)
        .attr('text-anchor', 'middle').attr('fill', 'var(--color-ink-muted)')
        .attr('font-size', '13px').attr('font-family', 'var(--font-sans)')
        .text('No real eigenvalues — all vectors change direction');
    }

    g.append('circle').attr('cx', toX(0)).attr('cy', toY(0)).attr('r', 3).attr('fill', 'var(--color-ink)');
  }, [a, b, c, d, trace, det, disc, width, height]);

  useEffect(() => { draw(t); }, [draw, t]);

  const presets = [
    { label: 'Diagonal', a: 2, b: 0, c: 0, d: 3 },
    { label: 'Shear', a: 1, b: 1, c: 0, d: 1 },
    { label: 'Rotation', a: 0, b: -1, c: 1, d: 0 },
    { label: 'Reflection', a: 1, b: 0, c: 0, d: -1 },
    { label: 'Scale 2x', a: 2, b: 0, c: 0, d: 2 },
  ];

  return (
    <div className="not-prose space-y-3">
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button key={p.label} onClick={() => { setA(p.a); setB(p.b); setC(p.c); setD(p.d); setT(1); }}
            className="rounded border border-rule bg-paper-elevated px-3 py-1 text-xs font-sans font-medium text-ink-muted hover:border-accent hover:text-accent transition-colors"
          >{p.label}</button>
        ))}
      </div>
      <div className="rounded-md border border-rule overflow-hidden" style={{ background: 'var(--color-paper)' }}>
        <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ display: 'block' }} />
      </div>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="font-sans text-xs text-ink-muted w-20">Transform (t)</span>
          <input type="range" min={0} max={1} step={0.01} value={t}
            onChange={(e) => setT(parseFloat(e.target.value))}
            className="flex-1 h-1 accent-[var(--color-accent)]" />
          <span className="font-mono text-xs w-8 text-right" style={{ color: 'var(--color-accent)' }}>{t.toFixed(2)}</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          {[
            { label: 'a', val: a, set: setA, color: 'var(--color-vector-green)' },
            { label: 'b', val: b, set: setB, color: 'var(--color-accent)' },
            { label: 'c', val: c, set: setC, color: 'var(--color-vector-green)' },
            { label: 'd', val: d, set: setD, color: 'var(--color-accent)' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="font-mono text-xs text-ink-muted w-4">{s.label}</span>
              <input type="range" min={-3} max={3} step={0.1} value={s.val}
                onChange={(e) => { s.set(parseFloat(e.target.value)); setT(1); }}
                className="flex-1 h-1" style={{ accentColor: s.color }} />
              <span className="font-mono text-xs w-6 text-right">{s.val.toFixed(1)}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-4 pt-1">
          <span className="font-mono text-xs" style={{ color: 'var(--color-vector-yellow)' }}>■ eigenvector 1</span>
          <span className="font-mono text-xs" style={{ color: 'var(--color-vector-red)' }}>■ eigenvector 2</span>
          {disc >= 0 && (
            <span className="font-mono text-xs text-ink-muted">
              λ = {((trace + Math.sqrt(disc)) / 2).toFixed(2)}, {((trace - Math.sqrt(disc)) / 2).toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
