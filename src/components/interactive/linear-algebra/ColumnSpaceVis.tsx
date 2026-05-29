import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

interface ColumnSpaceVisProps {
  width?: number;
  height?: number;
}

export function ColumnSpaceVis({
  width = 640,
  height = 480,
}: ColumnSpaceVisProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [a, setA] = useState(1);
  const [b, setB] = useState(0.5);
  const [c, setC] = useState(0);
  const [d, setD] = useState(1);

  const det = a * d - b * c;
  const rank = Math.abs(det) < 0.01 ? 1 : 2;

  const draw = useCallback(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const pad = 40;
    const pw = width - pad * 2;
    const ph = height - pad * 2;
    const cx = width / 2;
    const cy = height / 2;
    const gridSize = 5;
    const scale = Math.min(pw, ph) / (gridSize * 2);

    const toX = (v: number) => cx + v * scale;
    const toY = (v: number) => cy - v * scale;

    const g = svg.append('g');

    // Faint axes
    g.append('line').attr('x1', 0).attr('y1', cy).attr('x2', width).attr('y2', cy)
      .attr('stroke', 'var(--color-border)').attr('stroke-width', 0.5);
    g.append('line').attr('x1', cx).attr('y1', 0).attr('x2', cx).attr('y2', height)
      .attr('stroke', 'var(--color-border)').attr('stroke-width', 0.5);

    // Column vectors
    const col1 = [a, c];
    const col2 = [b, d];

    // Generate random input vectors and transform them
    const numSamples = 200;
    const colors = d3.schemeTableau10;
    const rng = (seed: number) => {
      let s = seed;
      return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    };
    const rand = rng(42);

    // Sample input vectors from unit circle + grid
    for (let i = 0; i < numSamples; i++) {
      const inX = (rand() - 0.5) * 8;
      const inY = (rand() - 0.5) * 8;

      // Apply transformation
      const outX = a * inX + b * inY;
      const outY = c * inX + d * inY;

      const sx = toX(outX);
      const sy = toY(outY);

      if (sx > -10 && sx < width + 10 && sy > -10 && sy < height + 10) {
        g.append('circle')
          .attr('cx', sx).attr('cy', sy).attr('r', 2.5)
          .attr('fill', 'var(--color-accent)')
          .attr('opacity', 0.4);
      }
    }

    // Draw column vectors as arrows
    const arrowHead = (x1: number, y1: number, x2: number, y2: number, color: string) => {
      g.append('line').attr('x1', x1).attr('y1', y1).attr('x2', x2).attr('y2', y2)
        .attr('stroke', color).attr('stroke-width', 2.5);
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLen = 10;
      g.append('polygon')
        .attr('points', [
          [x2, y2],
          [x2 - headLen * Math.cos(angle - 0.3), y2 - headLen * Math.sin(angle - 0.3)],
          [x2 - headLen * Math.cos(angle + 0.3), y2 - headLen * Math.sin(angle + 0.3)],
        ].map(p => p.join(',')).join(' '))
        .attr('fill', color);
    };

    // Column 1 arrow
    arrowHead(toX(0), toY(0), toX(col1[0]), toY(col1[1]), '#3b6cb7');
    // Column 2 arrow
    arrowHead(toX(0), toY(0), toX(col2[0]), toY(col2[1]), '#4f8a5b');

    // Labels
    g.append('text').attr('x', toX(col1[0]) + 5).attr('y', toY(col1[1]) - 8)
      .attr('fill', '#3b6cb7').attr('font-size', '0.8rem').attr('font-weight', 'bold')
      .text('col₁');
    g.append('text').attr('x', toX(col2[0]) + 5).attr('y', toY(col2[1]) - 8)
      .attr('fill', '#4f8a5b').attr('font-size', '0.8rem').attr('font-weight', 'bold')
      .text('col₂');

    // Info text
    g.append('text').attr('x', pad).attr('y', pad - 10)
      .attr('fill', 'var(--color-accent)').attr('font-size', '0.85rem').attr('font-weight', 'bold')
      .text(`Rank = ${rank}  |  det = ${det.toFixed(2)}`);

    if (rank === 1) {
      g.append('text').attr('x', pad).attr('y', pad + 8)
        .attr('fill', 'var(--color-vector-red)').attr('font-size', '0.75rem')
        .text('Columns are collinear — column space is a LINE');
    } else {
      g.append('text').attr('x', pad).attr('y', pad + 8)
        .attr('fill', 'var(--color-muted)').attr('font-size', '0.75rem')
        .text('Columns span the plane — column space is all of ℝ²');
    }

  }, [width, height, a, b, c, d, det, rank]);

  useEffect(() => { draw(); }, [draw]);

  const sliderStyle = { width: '100%', accentColor: 'var(--color-accent)' as const };

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
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.5rem',
        marginTop: '0.75rem',
      }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#3b6cb7', marginBottom: '0.25rem' }}>Column 1</div>
          <label style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>a = {a}</label>
          <input type="range" min="-2" max="2" step="0.1" value={a}
            onChange={e => setA(parseFloat(e.target.value))} style={sliderStyle} />
          <label style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>c = {c}</label>
          <input type="range" min="-2" max="2" step="0.1" value={c}
            onChange={e => setC(parseFloat(e.target.value))} style={sliderStyle} />
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#4f8a5b', marginBottom: '0.25rem' }}>Column 2</div>
          <label style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>b = {b}</label>
          <input type="range" min="-2" max="2" step="0.1" value={b}
            onChange={e => setB(parseFloat(e.target.value))} style={sliderStyle} />
          <label style={{ fontSize: '0.75rem', color: 'var(--color-muted)' }}>d = {d}</label>
          <input type="range" min="-2" max="2" step="0.1" value={d}
            onChange={e => setD(parseFloat(e.target.value))} style={sliderStyle} />
        </div>
      </div>

      <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--color-muted)', fontStyle: 'italic' }}>
        Terracotta dots: random inputs after transformation. Blue/green arrows: column vectors. When columns align (rank 1), all outputs collapse onto a line.
      </div>
    </div>
  );
}
