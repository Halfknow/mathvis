import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

interface MatrixTransform2DProps {
  width?: number;
  height?: number;
  initialA?: number;
  initialB?: number;
  initialC?: number;
  initialD?: number;
}

export function MatrixTransform2D({
  width = 640,
  height = 480,
  initialA = 1,
  initialB = 0,
  initialC = 0,
  initialD = 1,
}: MatrixTransform2DProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [a, setA] = useState(initialA);
  const [b, setB] = useState(initialB);
  const [c, setC] = useState(initialC);
  const [d, setD] = useState(initialD);
  const [animating, setAnimating] = useState(false);
  const animTRef = useRef(0);

  const det = a * d - b * c;

  const draw = useCallback((t: number) => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const padding = 40;
    const plotW = width - padding * 2;
    const plotH = height - padding * 2;
    const cx = width / 2;
    const cy = height / 2;
    const gridSize = 4;
    const scale = Math.min(plotW, plotH) / (gridSize * 2);

    const toSvgX = (v: number) => cx + v * scale;
    const toSvgY = (v: number) => cy - v * scale;

    const ma = 1 + (a - 1) * t;
    const mb = 0 + b * t;
    const mc = 0 + c * t;
    const md = 1 + (d - 1) * t;

    const g = svg.append('g');

    // Original grid (faint)
    for (let i = -gridSize; i <= gridSize; i++) {
      const isAxis = i === 0;
      g.append('line')
        .attr('x1', toSvgX(-gridSize)).attr('y1', toSvgY(i))
        .attr('x2', toSvgX(gridSize)).attr('y2', toSvgY(i))
        .attr('stroke', isAxis ? 'var(--color-ink-faint)' : 'var(--color-rule)')
        .attr('stroke-width', isAxis ? 1 : 0.3)
        .attr('stroke-dasharray', isAxis ? 'none' : '3,3')
        .attr('opacity', 0.4);
      g.append('line')
        .attr('x1', toSvgX(i)).attr('y1', toSvgY(-gridSize))
        .attr('x2', toSvgX(i)).attr('y2', toSvgY(gridSize))
        .attr('stroke', isAxis ? 'var(--color-ink-faint)' : 'var(--color-rule)')
        .attr('stroke-width', isAxis ? 1 : 0.3)
        .attr('stroke-dasharray', isAxis ? 'none' : '3,3')
        .attr('opacity', 0.4);
    }

    // Transformed grid
    const gridColor = det === 0 ? 'var(--color-vector-red)' : 'var(--color-vector-blue)';
    for (let i = -gridSize; i <= gridSize; i++) {
      // Horizontal lines: (x, i) -> (ma*x + mb*i, mc*x + md*i)
      const hPoints: string[] = [];
      for (let x = -gridSize; x <= gridSize; x += 0.5) {
        const tx = ma * x + mb * i;
        const ty = mc * x + md * i;
        hPoints.push(`${toSvgX(tx)},${toSvgY(ty)}`);
      }
      g.append('polyline')
        .attr('points', hPoints.join(' '))
        .attr('fill', 'none')
        .attr('stroke', i === 0 ? 'var(--color-vector-green)' : gridColor)
        .attr('stroke-width', i === 0 ? 2 : 1.2)
        .attr('opacity', i === 0 ? 0.9 : 0.7);

      // Vertical lines: (i, y) -> (ma*i + mb*y, mc*i + md*y)
      const vPoints: string[] = [];
      for (let y = -gridSize; y <= gridSize; y += 0.5) {
        const tx = ma * i + mb * y;
        const ty = mc * i + md * y;
        vPoints.push(`${toSvgX(tx)},${toSvgY(ty)}`);
      }
      g.append('polyline')
        .attr('points', vPoints.join(' '))
        .attr('fill', 'none')
        .attr('stroke', i === 0 ? 'var(--color-accent)' : gridColor)
        .attr('stroke-width', i === 0 ? 2 : 1.2)
        .attr('opacity', i === 0 ? 0.9 : 0.7);
    }

    // Unit square -> parallelogram
    const sq: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]];
    const transformed = sq.map(([x, y]) => [ma * x + mb * y, mc * x + md * y]);
    const polyPoints = transformed.map(([x, y]) => `${toSvgX(x)},${toSvgY(y)}`).join(' ');
    g.append('polygon')
      .attr('points', polyPoints)
      .attr('fill', 'var(--color-accent)')
      .attr('fill-opacity', 0.15)
      .attr('stroke', 'var(--color-accent)')
      .attr('stroke-width', 2);

    // Basis vectors
    // e1 arrow
    const e1x = ma * 1 + mb * 0;
    const e1y = mc * 1 + md * 0;
    drawArrow(g, toSvgX(0), toSvgY(0), toSvgX(e1x), toSvgY(e1y), 'var(--color-vector-green)', 3);
    g.append('text')
      .attr('x', toSvgX(e1x) + 8).attr('y', toSvgY(e1y) - 8)
      .attr('fill', 'var(--color-vector-green)')
      .attr('font-size', '13px').attr('font-weight', 'bold')
      .attr('font-family', 'var(--font-serif)')
      .text(`(${e1x.toFixed(1)}, ${e1y.toFixed(1)})`);

    // e2 arrow
    const e2x = ma * 0 + mb * 1;
    const e2y = mc * 0 + md * 1;
    drawArrow(g, toSvgX(0), toSvgY(0), toSvgX(e2x), toSvgY(e2y), 'var(--color-accent)', 3);
    g.append('text')
      .attr('x', toSvgX(e2x) + 8).attr('y', toSvgY(e2y) - 8)
      .attr('fill', 'var(--color-accent)')
      .attr('font-size', '13px').attr('font-weight', 'bold')
      .attr('font-family', 'var(--font-serif)')
      .text(`(${e2x.toFixed(1)}, ${e2y.toFixed(1)})`);

    // Origin dot
    g.append('circle')
      .attr('cx', toSvgX(0)).attr('cy', toSvgY(0))
      .attr('r', 4).attr('fill', 'var(--color-ink)');

    // Det label
    const detColor = det < 0 ? 'var(--color-vector-red)' : det === 0 ? 'var(--color-vector-red)' : 'var(--color-vector-green)';
    const currentDet = (ma * md - mb * mc).toFixed(2);
    g.append('text')
      .attr('x', width - padding).attr('y', padding - 10)
      .attr('text-anchor', 'end')
      .attr('fill', detColor)
      .attr('font-size', '14px').attr('font-weight', 'bold')
      .attr('font-family', 'var(--font-mono)')
      .text(`det = ${currentDet}`);

    // Area label
    const area = Math.abs(ma * md - mb * mc).toFixed(2);
    g.append('text')
      .attr('x', width - padding).attr('y', padding + 8)
      .attr('text-anchor', 'end')
      .attr('fill', 'var(--color-ink-muted)')
      .attr('font-size', '12px')
      .attr('font-family', 'var(--font-mono)')
      .text(`area = ${area}`);
  }, [a, b, c, d, width, height, det]);

  function drawArrow(
    g: d3.Selection<SVGGElement, unknown, null, undefined>,
    x1: number, y1: number, x2: number, y2: number,
    color: string, strokeWidth: number,
  ) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 2) return;
    const ux = dx / len;
    const uy = dy / len;
    const headLen = 10;
    const tipX = x2 - ux * 2;
    const tipY = y2 - uy * 2;
    const baseX = tipX - ux * headLen;
    const baseY = tipY - uy * headLen;

    g.append('line')
      .attr('x1', x1).attr('y1', y1).attr('x2', baseX).attr('y2', baseY)
      .attr('stroke', color).attr('stroke-width', strokeWidth)
      .attr('stroke-linecap', 'round');

    g.append('polygon')
      .attr('points', [
        `${tipX},${tipY}`,
        `${baseX + uy * 5},${baseY - ux * 5}`,
        `${baseX - uy * 5},${baseY + ux * 5}`,
      ].join(' '))
      .attr('fill', color);
  }

  useEffect(() => {
    if (animating) {
      animTRef.current = 0;
      const timer = d3.timer((elapsed) => {
        animTRef.current = Math.min(elapsed / 600, 1);
        const eased = d3.easeCubicInOut(animTRef.current);
        draw(eased);
        if (animTRef.current >= 1) {
          timer.stop();
          setAnimating(false);
        }
      });
      return () => timer.stop();
    } else {
      draw(1);
    }
  }, [draw, animating]);

  const handleMatrixChange = (setter: (v: number) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(parseFloat(e.target.value) || 0);
  };

  const presets = [
    { label: 'Identity', a: 1, b: 0, c: 0, d: 1 },
    { label: 'Rotation 90°', a: 0, b: -1, c: 1, d: 0 },
    { label: 'Scale 2x', a: 2, b: 0, c: 0, d: 2 },
    { label: 'Shear', a: 1, b: 1, c: 0, d: 1 },
    { label: 'Reflect x', a: 1, b: 0, c: 0, d: -1 },
    { label: 'Collapse', a: 1, b: 2, c: 0.5, d: 1 },
  ];

  const applyPreset = (p: typeof presets[0]) => {
    setA(p.a); setB(p.b); setC(p.c); setD(p.d);
    setAnimating(true);
  };

  return (
    <div className="not-prose space-y-3">
      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => applyPreset(p)}
            className="rounded border border-rule bg-paper-elevated px-3 py-1 text-xs font-sans font-medium text-ink-muted hover:border-accent hover:text-accent transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* SVG Canvas */}
      <div className="rounded-md border border-rule overflow-hidden" style={{ background: 'var(--color-paper)' }}>
        <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ display: 'block' }} />
      </div>

      {/* Matrix sliders */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-ink-muted w-6">a</span>
          <input type="range" min={-3} max={3} step={0.1} value={a}
            onChange={handleMatrixChange(setA)}
            className="flex-1 h-1 accent-[var(--color-vector-green)]" />
          <span className="font-mono text-xs w-8 text-right" style={{ color: 'var(--color-vector-green)' }}>{a.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-ink-muted w-6">b</span>
          <input type="range" min={-3} max={3} step={0.1} value={b}
            onChange={handleMatrixChange(setB)}
            className="flex-1 h-1 accent-[var(--color-accent)]" />
          <span className="font-mono text-xs w-8 text-right" style={{ color: 'var(--color-accent)' }}>{b.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-ink-muted w-6">c</span>
          <input type="range" min={-3} max={3} step={0.1} value={c}
            onChange={handleMatrixChange(setC)}
            className="flex-1 h-1 accent-[var(--color-vector-green)]" />
          <span className="font-mono text-xs w-8 text-right" style={{ color: 'var(--color-vector-green)' }}>{c.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-ink-muted w-6">d</span>
          <input type="range" min={-3} max={3} step={0.1} value={d}
            onChange={handleMatrixChange(setD)}
            className="flex-1 h-1 accent-[var(--color-accent)]" />
          <span className="font-mono text-xs w-8 text-right" style={{ color: 'var(--color-accent)' }}>{d.toFixed(1)}</span>
        </div>
      </div>

      {/* Matrix display */}
      <div className="flex items-center justify-center gap-3">
        <div className="text-center">
          <div className="text-xs text-ink-muted font-sans mb-1">Matrix</div>
          <div className="font-mono text-sm border-l-2 border-r-2 border-accent px-2 py-1 inline-flex flex-col items-center">
            <span><span style={{ color: 'var(--color-vector-green)' }}>{a.toFixed(1)}</span> &nbsp; <span style={{ color: 'var(--color-accent)' }}>{b.toFixed(1)}</span></span>
            <span><span style={{ color: 'var(--color-vector-green)' }}>{c.toFixed(1)}</span> &nbsp; <span style={{ color: 'var(--color-accent)' }}>{d.toFixed(1)}</span></span>
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-ink-muted font-sans mb-1">Determinant</div>
          <div className="font-mono text-lg font-bold" style={{ color: det < 0 ? 'var(--color-vector-red)' : det === 0 ? 'var(--color-vector-red)' : 'var(--color-vector-green)' }}>
            {det.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
