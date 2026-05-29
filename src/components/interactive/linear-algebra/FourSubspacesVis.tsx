import { useRef, useEffect, useCallback } from 'react';

interface FourSubspacesVisProps {
  width?: number;
  height?: number;
}

export function FourSubspacesVis({
  width = 640,
  height = 420,
}: FourSubspacesVisProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const draw = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    svg.innerHTML = '';

    const ns = 'http://www.w3.org/2000/svg';
    const cx = width / 2;
    const cy = height / 2;

    const el = (tag: string, attrs: Record<string, string | number> = {}) => {
      const e = document.createElementNS(ns, tag);
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
      return e;
    };

    // Background
    const bg = el('rect', { width, height, fill: 'var(--color-surface)', rx: 8 });
    svg.appendChild(bg);

    // Title
    const title = el('text', {
      x: cx, y: 30, 'text-anchor': 'middle', fill: 'var(--color-ink)',
      'font-size': '1rem', 'font-weight': 'bold', 'font-family': 'var(--font-sans)',
    });
    title.textContent = 'The Four Fundamental Subspaces';
    svg.appendChild(title);

    // Subtitle
    const sub = el('text', {
      x: cx, y: 50, 'text-anchor': 'middle', fill: 'var(--color-muted)',
      'font-size': '0.75rem', 'font-family': 'var(--font-sans)',
    });
    sub.textContent = 'For an m × n matrix A with rank r';
    svg.appendChild(sub);

    // Layout: two columns
    // Left: Input space (ℝⁿ)
    // Right: Output space (ℝᵐ)

    const leftCx = cx - 150;
    const rightCx = cx + 150;
    const rowSpaceY = cy - 40;
    const nullSpaceY = cy + 50;
    const colSpaceY = cy - 40;
    const leftNullY = cy + 50;

    // Input space box
    const inputBox = el('rect', {
      x: leftCx - 100, y: cy - 100, width: 200, height: 200,
      fill: 'none', stroke: 'var(--color-border)', 'stroke-width': 1.5, rx: 8,
    });
    svg.appendChild(inputBox);

    const inputLabel = el('text', {
      x: leftCx, y: cy - 108, 'text-anchor': 'middle', fill: 'var(--color-ink)',
      'font-size': '0.8rem', 'font-weight': 'bold', 'font-family': 'var(--font-sans)',
    });
    inputLabel.textContent = 'Input Space (ℝⁿ)';
    svg.appendChild(inputLabel);

    // Output space box
    const outputBox = el('rect', {
      x: rightCx - 100, y: cy - 100, width: 200, height: 200,
      fill: 'none', stroke: 'var(--color-border)', 'stroke-width': 1.5, rx: 8,
    });
    svg.appendChild(outputBox);

    const outputLabel = el('text', {
      x: rightCx, y: cy - 108, 'text-anchor': 'middle', fill: 'var(--color-ink)',
      'font-size': '0.8rem', 'font-weight': 'bold', 'font-family': 'var(--font-sans)',
    });
    outputLabel.textContent = 'Output Space (ℝᵐ)';
    svg.appendChild(outputLabel);

    // Row space (top-left) — green ellipse
    const rowEllipse = el('ellipse', {
      cx: leftCx, cy: rowSpaceY, rx: 70, ry: 30,
      fill: '#4f8a5b', opacity: 0.2, stroke: '#4f8a5b', 'stroke-width': 2,
    });
    svg.appendChild(rowEllipse);
    const rowLabel = el('text', {
      x: leftCx, y: rowSpaceY - 2, 'text-anchor': 'middle', fill: '#4f8a5b',
      'font-size': '0.75rem', 'font-weight': 'bold', 'font-family': 'var(--font-sans)',
    });
    rowLabel.textContent = 'Row Space';
    svg.appendChild(rowLabel);
    const rowDim = el('text', {
      x: leftCx, y: rowSpaceY + 12, 'text-anchor': 'middle', fill: '#4f8a5b',
      'font-size': '0.65rem', 'font-family': 'var(--font-sans)',
    });
    rowDim.textContent = 'dim = r';
    svg.appendChild(rowDim);

    // Null space (bottom-left) — red ellipse
    const nullEllipse = el('ellipse', {
      cx: leftCx, cy: nullSpaceY, rx: 70, ry: 30,
      fill: '#b54a4a', opacity: 0.2, stroke: '#b54a4a', 'stroke-width': 2,
    });
    svg.appendChild(nullEllipse);
    const nullLabel = el('text', {
      x: leftCx, y: nullSpaceY - 2, 'text-anchor': 'middle', fill: '#b54a4a',
      'font-size': '0.75rem', 'font-weight': 'bold', 'font-family': 'var(--font-sans)',
    });
    nullLabel.textContent = 'Null Space';
    svg.appendChild(nullLabel);
    const nullDim = el('text', {
      x: leftCx, y: nullSpaceY + 12, 'text-anchor': 'middle', fill: '#b54a4a',
      'font-size': '0.65rem', 'font-family': 'var(--font-sans)',
    });
    nullDim.textContent = 'dim = n − r';
    svg.appendChild(nullDim);

    // Column space (top-right) — blue ellipse
    const colEllipse = el('ellipse', {
      cx: rightCx, cy: colSpaceY, rx: 70, ry: 30,
      fill: '#3b6cb7', opacity: 0.2, stroke: '#3b6cb7', 'stroke-width': 2,
    });
    svg.appendChild(colEllipse);
    const colLabel = el('text', {
      x: rightCx, y: colSpaceY - 2, 'text-anchor': 'middle', fill: '#3b6cb7',
      'font-size': '0.75rem', 'font-weight': 'bold', 'font-family': 'var(--font-sans)',
    });
    colLabel.textContent = 'Column Space';
    svg.appendChild(colLabel);
    const colDim = el('text', {
      x: rightCx, y: colSpaceY + 12, 'text-anchor': 'middle', fill: '#3b6cb7',
      'font-size': '0.65rem', 'font-family': 'var(--font-sans)',
    });
    colDim.textContent = 'dim = r';
    svg.appendChild(colDim);

    // Left null space (bottom-right) — purple ellipse
    const lnEllipse = el('ellipse', {
      cx: rightCx, cy: leftNullY, rx: 70, ry: 30,
      fill: '#9b59b6', opacity: 0.2, stroke: '#9b59b6', 'stroke-width': 2,
    });
    svg.appendChild(lnEllipse);
    const lnLabel = el('text', {
      x: rightCx, y: leftNullY - 2, 'text-anchor': 'middle', fill: '#9b59b6',
      'font-size': '0.75rem', 'font-weight': 'bold', 'font-family': 'var(--font-sans)',
    });
    lnLabel.textContent = 'Left Null Space';
    svg.appendChild(lnLabel);
    const lnDim = el('text', {
      x: rightCx, y: leftNullY + 12, 'text-anchor': 'middle', fill: '#9b59b6',
      'font-size': '0.65rem', 'font-family': 'var(--font-sans)',
    });
    lnDim.textContent = 'dim = m − r';
    svg.appendChild(lnDim);

    // Arrow: A maps Row Space → Column Space
    const arrow1 = el('line', {
      x1: leftCx + 75, y1: rowSpaceY, x2: rightCx - 75, y2: colSpaceY,
      stroke: 'var(--color-accent)', 'stroke-width': 2.5,
      'marker-end': 'url(#arrowhead-accent)',
    });
    svg.appendChild(arrow1);

    // Arrow: A maps Null Space → 0
    const arrow2 = el('line', {
      x1: leftCx + 75, y1: nullSpaceY, x2: rightCx - 40, y2: cy + 95,
      stroke: 'var(--color-muted)', 'stroke-width': 1.5, 'stroke-dasharray': '4,3',
      'marker-end': 'url(#arrowhead-muted)',
    });
    svg.appendChild(arrow2);

    // "0" label at center-right
    const zeroLabel = el('text', {
      x: rightCx - 35, y: cy + 100, 'text-anchor': 'middle', fill: 'var(--color-muted)',
      'font-size': '0.8rem', 'font-family': 'var(--font-sans)',
    });
    zeroLabel.textContent = '0';
    svg.appendChild(zeroLabel);

    // "A" label on the arrow
    const aLabel = el('text', {
      x: cx, y: rowSpaceY - 10, 'text-anchor': 'middle', fill: 'var(--color-accent)',
      'font-size': '0.85rem', 'font-weight': 'bold', 'font-family': 'var(--font-sans)',
    });
    aLabel.textContent = 'A';
    svg.appendChild(aLabel);

    // ⊥ symbols (orthogonal complement indicators)
    const perp1 = el('text', {
      x: leftCx, y: cy + 2, 'text-anchor': 'middle', fill: 'var(--color-muted)',
      'font-size': '0.7rem', 'font-family': 'var(--font-sans)',
    });
    perp1.textContent = '⊥';
    svg.appendChild(perp1);

    const perp2 = el('text', {
      x: rightCx, y: cy + 2, 'text-anchor': 'middle', fill: 'var(--color-muted)',
      'font-size': '0.7rem', 'font-family': 'var(--font-sans)',
    });
    perp2.textContent = '⊥';
    svg.appendChild(perp2);

    // Legend
    const legendY = height - 25;
    const legendItems = [
      { label: 'Row ⊥ Null', color: 'var(--color-muted)', x: cx - 120 },
      { label: 'Col ⊥ Left Null', color: 'var(--color-muted)', x: cx + 30 },
    ];

    legendItems.forEach(item => {
      const t = el('text', {
        x: item.x, y: legendY, fill: item.color,
        'font-size': '0.7rem', 'font-family': 'var(--font-sans)',
      });
      t.textContent = item.label;
      svg.appendChild(t);
    });

    // Arrow markers
    const defs = el('defs');
    const marker1 = el('marker', {
      id: 'arrowhead-accent', markerWidth: 10, markerHeight: 7,
      refX: 10, refY: 3.5, orient: 'auto',
    });
    const poly1 = el('polygon', { points: '0 0, 10 3.5, 0 7', fill: 'var(--color-accent)' });
    marker1.appendChild(poly1);
    defs.appendChild(marker1);

    const marker2 = el('marker', {
      id: 'arrowhead-muted', markerWidth: 10, markerHeight: 7,
      refX: 10, refY: 3.5, orient: 'auto',
    });
    const poly2 = el('polygon', { points: '0 0, 10 3.5, 0 7', fill: 'var(--color-muted)' });
    marker2.appendChild(poly2);
    defs.appendChild(marker2);

    svg.insertBefore(defs, svg.firstChild);

  }, [width, height]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
        padding: '0.5rem',
      }}>
        <svg ref={svgRef} width={width} height={height} style={{ display: 'block', margin: '0 auto' }} />
      </div>
      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-muted)', fontStyle: 'italic' }}>
        A maps the row space onto the column space. The null space maps to zero. Each pair (Row↔Null, Col↔Left Null) is an orthogonal complement.
      </div>
    </div>
  );
}
