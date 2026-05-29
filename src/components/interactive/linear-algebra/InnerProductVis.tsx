import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

interface InnerProductVisProps {
  width?: number;
  height?: number;
}

export function InnerProductVis({
  width = 640,
  height = 400,
}: InnerProductVisProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [a1, setA1] = useState(1);
  const [a2, setA2] = useState(0);
  const [a3, setA3] = useState(-1);
  const [b1, setB1] = useState(0);
  const [b2, setB2] = useState(1);
  const [b3, setB3] = useState(0);

  const draw = useCallback(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const pad = { top: 30, right: 30, bottom: 40, left: 50 };
    const pw = width - pad.left - pad.right;
    const ph = height - pad.top - pad.bottom;

    const g = svg.append('g').attr('transform', `translate(${pad.left},${pad.top})`);

    const xMin = -0.5, xMax = 1.5;
    const yMin = -3, yMax = 3;
    const xScale = d3.scaleLinear().domain([xMin, xMax]).range([0, pw]);
    const yScale = d3.scaleLinear().domain([yMin, yMax]).range([ph, 0]);

    // Axes
    g.append('line').attr('x1', 0).attr('y1', yScale(0)).attr('x2', pw).attr('y2', yScale(0))
      .attr('stroke', 'var(--color-border)').attr('stroke-width', 1);
    g.append('line').attr('x1', xScale(0)).attr('y1', 0).attr('x2', xScale(0)).attr('y2', ph)
      .attr('stroke', 'var(--color-border)').attr('stroke-width', 1);

    // Tick labels
    [0, 0.5, 1.0].forEach(t => {
      g.append('text').attr('x', xScale(t)).attr('y', yScale(0) + 16)
        .attr('text-anchor', 'middle').attr('fill', 'var(--color-muted)')
        .attr('font-size', '0.7rem').text(t.toFixed(1));
    });

    const lineGen = d3.line<{ x: number; y: number }>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y));

    // f(x) = a1 + a2*x + a3*x^2
    const f = (x: number) => a1 + a2 * x + a3 * x * x;
    // g(x) = b1 + b2*x + b3*x^2
    const gFunc = (x: number) => b1 + b2 * x + b3 * x * x;

    const pts = d3.range(xMin + 0.01, xMax - 0.01, 0.01).map(x => ({ x, y: 0 }));

    // Draw f
    const ptsF = pts.map(p => ({ x: p.x, y: f(p.x) }));
    g.append('path').datum(ptsF)
      .attr('d', lineGen).attr('fill', 'none')
      .attr('stroke', '#3498db').attr('stroke-width', 2);

    // Draw g
    const ptsG = pts.map(p => ({ x: p.x, y: gFunc(p.x) }));
    g.append('path').datum(ptsG)
      .attr('d', lineGen).attr('fill', 'none')
      .attr('stroke', '#2ecc71').attr('stroke-width', 2);

    // Shade f(x)*g(x) area (positive = blue, negative = red)
    const areaGen = d3.area<{ x: number; y: number; yBase: number }>()
      .x(d => xScale(d.x))
      .y0(d => yScale(d.yBase))
      .y1(d => yScale(d.y));

    const productPts = pts.map(p => {
      const prod = f(p.x) * gFunc(p.x);
      return { x: p.x, y: prod, yBase: 0 };
    });

    // Positive areas
    const posPts = productPts.map(p => ({ ...p, y: Math.max(0, p.y) }));
    g.append('path').datum(posPts)
      .attr('d', areaGen).attr('fill', '#3498db').attr('opacity', 0.2);

    // Negative areas
    const negPts = productPts.map(p => ({ ...p, y: Math.min(0, p.y) }));
    g.append('path').datum(negPts)
      .attr('d', areaGen).attr('fill', '#e74c3c').attr('opacity', 0.2);

    // Draw product line (faint)
    const ptsProd = productPts.map(p => ({ x: p.x, y: p.y }));
    g.append('path').datum(ptsProd)
      .attr('d', lineGen).attr('fill', 'none')
      .attr('stroke', '#f39c12').attr('stroke-width', 1.5)
      .attr('stroke-dasharray', '4,3');

    // Compute inner product (numerical integration via Simpson's rule)
    const n = pts.length;
    let integral = 0;
    for (let i = 0; i < n; i++) {
      const prod = f(pts[i].x) * gFunc(pts[i].x);
      const dx = (xMax - xMin - 0.02) / n;
      if (i === 0 || i === n - 1) {
        integral += prod * dx;
      } else if (i % 2 === 1) {
        integral += 4 * prod * dx;
      } else {
        integral += 2 * prod * dx;
      }
    }
    integral /= 3;

    // Labels
    const fLabel = `f = ${a1} + ${a2}x + ${a3}x²`.replace(/\+ -/g, '- ');
    const gLabel = `g = ${b1} + ${b2}x + ${b3}x²`.replace(/\+ -/g, '- ');

    g.append('text').attr('x', 5).attr('y', 15)
      .attr('fill', '#3498db').attr('font-size', '0.75rem').text(fLabel);
    g.append('text').attr('x', 5).attr('y', 30)
      .attr('fill', '#2ecc71').attr('font-size', '0.75rem').text(gLabel);
    g.append('text').attr('x', 5).attr('y', 45)
      .attr('fill', '#f39c12').attr('font-size', '0.75rem').attr('stroke-dasharray', '3,2')
      .text('f·g (shaded)');
    g.append('text').attr('x', pw - 5).attr('y', 15)
      .attr('text-anchor', 'end').attr('fill', 'var(--color-accent)')
      .attr('font-size', '0.85rem').attr('font-weight', 'bold')
      .text(`⟨f,g⟩ = ${integral.toFixed(3)}`);

    // Orthogonality indicator
    if (Math.abs(integral) < 0.05) {
      g.append('text').attr('x', pw - 5).attr('y', 35)
        .attr('text-anchor', 'end').attr('fill', '#2ecc71')
        .attr('font-size', '0.8rem').attr('font-weight', 'bold')
        .text('⊥ ORTHOGONAL');
    }

  }, [width, height, a1, a2, a3, b1, b2, b3]);

  useEffect(() => { draw(); }, [draw]);

  const sliderStyle = {
    width: '100%',
    accentColor: 'var(--color-accent)' as const,
  };

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

      <div style={{
        marginTop: '0.75rem',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
      }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#3498db', marginBottom: '0.25rem', fontWeight: 'bold' }}>
            f(x) = a + bx + cx²
          </div>
          {[
            { label: 'a', val: a1, set: setA1 },
            { label: 'b', val: a2, set: setA2 },
            { label: 'c', val: a3, set: setA3 },
          ].map(({ label, val, set }) => (
            <div key={`f${label}`} style={{ marginBottom: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                {label} = {val.toFixed(1)}
              </label>
              <input type="range" min="-3" max="3" step="0.1" value={val}
                onChange={e => set(parseFloat(e.target.value))} style={sliderStyle} />
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#2ecc71', marginBottom: '0.25rem', fontWeight: 'bold' }}>
            g(x) = a + bx + cx²
          </div>
          {[
            { label: 'a', val: b1, set: setB1 },
            { label: 'b', val: b2, set: setB2 },
            { label: 'c', val: b3, set: setB3 },
          ].map(({ label, val, set }) => (
            <div key={`g${label}`} style={{ marginBottom: '0.25rem' }}>
              <label style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>
                {label} = {val.toFixed(1)}
              </label>
              <input type="range" min="-3" max="3" step="0.1" value={val}
                onChange={e => set(parseFloat(e.target.value))} style={sliderStyle} />
            </div>
          ))}
        </div>
      </div>

      <div style={{
        marginTop: '0.5rem',
        fontSize: '0.8rem',
        color: 'var(--color-muted)',
        fontStyle: 'italic',
      }}>
        Blue shading: positive contribution to inner product. Red shading: negative contribution.
        When the total area is zero, the functions are orthogonal.
      </div>
    </div>
  );
}
