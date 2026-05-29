import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

interface FunctionSpaceVisProps {
  width?: number;
  height?: number;
}

export function FunctionSpaceVis({
  width = 640,
  height = 400,
}: FunctionSpaceVisProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mode, setMode] = useState<'add' | 'scale' | 'basis'>('add');
  const [c1, setC1] = useState(1);
  const [c2, setC2] = useState(1);
  const [c3, setC3] = useState(0);
  const [scalar, setScalar] = useState(2);

  const draw = useCallback(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const pad = { top: 30, right: 30, bottom: 40, left: 50 };
    const pw = width - pad.left - pad.right;
    const ph = height - pad.top - pad.bottom;

    const g = svg.append('g').attr('transform', `translate(${pad.left},${pad.top})`);

    const xScale = d3.scaleLinear().domain([-2.5, 2.5]).range([0, pw]);
    const yScale = d3.scaleLinear().domain([-6, 6]).range([ph, 0]);

    // Axes
    g.append('line').attr('x1', 0).attr('y1', yScale(0)).attr('x2', pw).attr('y2', yScale(0))
      .attr('stroke', 'var(--color-border)').attr('stroke-width', 1);
    g.append('line').attr('x1', xScale(0)).attr('y1', 0).attr('x2', xScale(0)).attr('y2', ph)
      .attr('stroke', 'var(--color-border)').attr('stroke-width', 1);

    // X-axis labels
    const xTicks = [-2, -1, 1, 2];
    xTicks.forEach(t => {
      g.append('text')
        .attr('x', xScale(t)).attr('y', yScale(0) + 16)
        .attr('text-anchor', 'middle').attr('fill', 'var(--color-muted)')
        .attr('font-size', '0.7rem').text(t);
    });

    const lineGen = d3.line<{ x: number; y: number }>()
      .x(d => xScale(d.x))
      .y(d => yScale(d.y));

    const pts = d3.range(-2.4, 2.41, 0.05).map(x => ({ x, y: 0 }));

    if (mode === 'add') {
      // f(x) = c1 * (1) + c2 * x
      const f = (x: number) => c1 + c2 * x;
      const ptsF = pts.map(p => ({ x: p.x, y: f(p.x) }));

      // Show basis functions
      const ptsOne = pts.map(p => ({ x: p.x, y: 1 }));
      const ptsX = pts.map(p => ({ x: p.x, y: p.x }));

      g.append('path').datum(ptsOne)
        .attr('d', lineGen).attr('fill', 'none')
        .attr('stroke', '#3498db').attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,3').attr('opacity', 0.5);
      g.append('path').datum(ptsX)
        .attr('d', lineGen).attr('fill', 'none')
        .attr('stroke', '#2ecc71').attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,3').attr('opacity', 0.5);

      // Result
      g.append('path').datum(ptsF)
        .attr('d', lineGen).attr('fill', 'none')
        .attr('stroke', 'var(--color-accent)').attr('stroke-width', 2.5);

      // Labels
      g.append('text').attr('x', pw - 5).attr('y', yScale(1) - 5)
        .attr('text-anchor', 'end').attr('fill', '#3498db')
        .attr('font-size', '0.7rem').text('1');
      g.append('text').attr('x', pw - 5).attr('y', yScale(2) - 5)
        .attr('text-anchor', 'end').attr('fill', '#2ecc71')
        .attr('font-size', '0.7rem').text('x');
      g.append('text').attr('x', pw - 5).attr('y', yScale(f(2.2)) - 8)
        .attr('text-anchor', 'end').attr('fill', 'var(--color-accent)')
        .attr('font-size', '0.75rem').attr('font-weight', 'bold')
        .text(`${c1} + ${c2}x`);

    } else if (mode === 'scale') {
      // Scale f(x) = 1 + x by scalar
      const f = (x: number) => 1 + x;
      const ptsOrig = pts.map(p => ({ x: p.x, y: f(p.x) }));
      const ptsScaled = pts.map(p => ({ x: p.x, y: scalar * f(p.x) }));

      g.append('path').datum(ptsOrig)
        .attr('d', lineGen).attr('fill', 'none')
        .attr('stroke', 'var(--color-muted)').attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,3');
      g.append('path').datum(ptsScaled)
        .attr('d', lineGen).attr('fill', 'none')
        .attr('stroke', 'var(--color-accent)').attr('stroke-width', 2.5);

      g.append('text').attr('x', pw - 5).attr('y', yScale(f(2.2)) - 5)
        .attr('text-anchor', 'end').attr('fill', 'var(--color-muted)')
        .attr('font-size', '0.7rem').text('1 + x');
      g.append('text').attr('x', pw - 5).attr('y', yScale(scalar * f(2.2)) - 8)
        .attr('text-anchor', 'end').attr('fill', 'var(--color-accent)')
        .attr('font-size', '0.75rem').attr('font-weight', 'bold')
        .text(`${scalar}(1 + x)`);

    } else {
      // Basis decomposition: show 1, x, x² and the combination
      const f = (x: number) => c1 + c2 * x + c3 * x * x;
      const ptsF = pts.map(p => ({ x: p.x, y: f(p.x) }));

      // Basis functions
      const ptsOne = pts.map(p => ({ x: p.x, y: 1 }));
      const ptsX = pts.map(p => ({ x: p.x, y: p.x }));
      const ptsX2 = pts.map(p => ({ x: p.x, y: p.x * p.x }));

      g.append('path').datum(ptsOne)
        .attr('d', lineGen).attr('fill', 'none')
        .attr('stroke', '#3498db').attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,3').attr('opacity', 0.5);
      g.append('path').datum(ptsX)
        .attr('d', lineGen).attr('fill', 'none')
        .attr('stroke', '#2ecc71').attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,3').attr('opacity', 0.5);
      g.append('path').datum(ptsX2)
        .attr('d', lineGen).attr('fill', 'none')
        .attr('stroke', '#9b59b6').attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,3').attr('opacity', 0.5);

      // Combination
      g.append('path').datum(ptsF)
        .attr('d', lineGen).attr('fill', 'none')
        .attr('stroke', 'var(--color-accent)').attr('stroke-width', 2.5);

      g.append('text').attr('x', pw - 5).attr('y', yScale(1) - 5)
        .attr('text-anchor', 'end').attr('fill', '#3498db')
        .attr('font-size', '0.7rem').text('1');
      g.append('text').attr('x', pw - 5).attr('y', yScale(2) - 5)
        .attr('text-anchor', 'end').attr('fill', '#2ecc71')
        .attr('font-size', '0.7rem').text('x');
      g.append('text').attr('x', pw - 5).attr('y', yScale(4) - 5)
        .attr('text-anchor', 'end').attr('fill', '#9b59b6')
        .attr('font-size', '0.7rem').text('x²');

      const label = `${c1} + ${c2}x + ${c3}x²`.replace(/\+ -/g, '- ');
      g.append('text').attr('x', pw - 5).attr('y', 15)
        .attr('text-anchor', 'end').attr('fill', 'var(--color-accent)')
        .attr('font-size', '0.75rem').attr('font-weight', 'bold')
        .text(label);
    }

  }, [width, height, mode, c1, c2, c3, scalar]);

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

      <div style={{ marginTop: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
          {(['add', 'scale', 'basis'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{
                padding: '0.3rem 0.6rem',
                background: mode === m ? 'var(--color-accent)' : 'var(--color-surface)',
                color: mode === m ? '#fff' : 'var(--color-text)',
                border: '1px solid var(--color-border)',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                textTransform: 'capitalize',
              }}>
              {m === 'add' ? 'f + g' : m === 'scale' ? 'c · f' : 'c₁ + c₂x + c₃x²'}
            </button>
          ))}
        </div>

        {mode === 'add' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#3498db' }}>c₁ (coefficient of 1): {c1}</label>
              <input type="range" min="-3" max="3" step="0.1" value={c1}
                onChange={e => setC1(parseFloat(e.target.value))} style={sliderStyle} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#2ecc71' }}>c₂ (coefficient of x): {c2}</label>
              <input type="range" min="-3" max="3" step="0.1" value={c2}
                onChange={e => setC2(parseFloat(e.target.value))} style={sliderStyle} />
            </div>
          </div>
        )}

        {mode === 'scale' && (
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--color-muted)' }}>
              Scalar: {scalar}
            </label>
            <input type="range" min="-3" max="3" step="0.1" value={scalar}
              onChange={e => setScalar(parseFloat(e.target.value))} style={sliderStyle} />
          </div>
        )}

        {mode === 'basis' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#3498db' }}>a = {c1}</label>
              <input type="range" min="-3" max="3" step="0.1" value={c1}
                onChange={e => setC1(parseFloat(e.target.value))} style={sliderStyle} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#2ecc71' }}>b = {c2}</label>
              <input type="range" min="-3" max="3" step="0.1" value={c2}
                onChange={e => setC2(parseFloat(e.target.value))} style={sliderStyle} />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#9b59b6' }}>c = {c3}</label>
              <input type="range" min="-3" max="3" step="0.1" value={c3}
                onChange={e => setC3(parseFloat(e.target.value))} style={sliderStyle} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
