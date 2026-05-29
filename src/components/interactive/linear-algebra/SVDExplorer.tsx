import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { useAnimatedPreset } from './useAnimatedPreset';

const presetList = [
  { label: 'Circle → Ellipse', a: 2, b: 1, c: 0, d: 1, t: 1 },
  { label: 'Pure scaling', a: 3, b: 0, c: 0, d: 2, t: 1 },
  { label: 'Rank deficient', a: 1, b: 2, c: 0.5, d: 1, t: 1 },
  { label: 'Rotation-like', a: 0, b: -2, c: 2, d: 0, t: 1 },
  { label: 'Reset', a: 2, b: 1, c: 0, d: 1, t: 0 },
];

export function SVDExplorer({ width = 640, height = 400 }: { width?: number; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [a, setA] = useState(2);
  const [b, setB] = useState(1);
  const [c, setC] = useState(0);
  const [d, setD] = useState(1);
  const [t, setT] = useState(1);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const { applyPreset, animating } = useAnimatedPreset(
    () => ({ a, b, c, d, t }),
    useCallback((vals) => {
      setA(vals.a); setB(vals.b); setC(vals.c); setD(vals.d); setT(vals.t);
    }, []),
  );

  // SVD via 2x2 analytical method
  const ata00 = a * a + c * c, ata01 = a * b + c * d;
  const ata10 = a * b + c * d, ata11 = b * b + d * d;
  const trATA = ata00 + ata11;
  const detATA = ata00 * ata11 - ata01 * ata10;
  const discATA = trATA * trATA - 4 * detATA;

  const s1sq = discATA >= 0 ? (trATA + Math.sqrt(discATA)) / 2 : 0;
  const s2sq = discATA >= 0 ? (trATA - Math.sqrt(discATA)) / 2 : 0;
  const s1 = Math.sqrt(Math.max(0, s1sq));
  const s2 = Math.sqrt(Math.max(0, s2sq));

  const v1x = Math.abs(ata01) > 0.001 ? ata01 : 1;
  const v1y = Math.abs(ata01) > 0.001 ? (s1sq - ata00) : 0;
  const v1len = Math.sqrt(v1x * v1x + v1y * v1y);
  const nv1x = v1len > 0 ? v1x / v1len : 1, nv1y = v1len > 0 ? v1y / v1len : 0;
  const nv2x = -nv1y, nv2y = nv1x;

  const conditionNumber = s2 > 0.001 ? s1 / s2 : Infinity;

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

    // Draw unit circle transformed by A*t
    const numPts = 64;
    const pts: [number, number][] = [];
    for (let i = 0; i < numPts; i++) {
      const angle = (2 * Math.PI * i) / numPts;
      const ux = Math.cos(angle), uy = Math.sin(angle);

      let px: number, py: number;
      if (t <= 0.01) {
        px = ux * 2; py = uy * 2;
      } else {
        const coeffV1 = ux * nv1x + uy * nv1y;
        const coeffV2 = ux * nv2x + uy * nv2y;
        const stretchFactor = Math.min((t - 0) / 0.5, 1);
        const stretched1 = coeffV1 * (1 + (s1 - 1) * stretchFactor);
        const stretched2 = coeffV2 * (1 + (s2 - 1) * stretchFactor);
        px = (stretched1 * nv1x + stretched2 * nv2x) * 2;
        py = (stretched1 * nv1y + stretched2 * nv2y) * 2;
      }
      pts.push([toX(px), toY(py)]);
    }

    if (pts.length > 0) {
      g.append('polygon')
        .attr('points', pts.map(p => `${p[0]},${p[1]}`).join(' '))
        .attr('fill', 'var(--color-vector-blue)').attr('fill-opacity', 0.08)
        .attr('stroke', 'var(--color-vector-blue)').attr('stroke-width', 2);
    }

    // Singular value axes
    if (s1 > 0.01) {
      g.append('line').attr('x1', toX(-nv1x * s1 * 2)).attr('y1', toY(-nv1y * s1 * 2))
        .attr('x2', toX(nv1x * s1 * 2)).attr('y2', toY(nv1y * s1 * 2))
        .attr('stroke', 'var(--color-vector-red)').attr('stroke-width', 2).attr('stroke-dasharray', '5 3');
    }
    if (s2 > 0.01) {
      g.append('line').attr('x1', toX(-nv2x * s2 * 2)).attr('y1', toY(-nv2y * s2 * 2))
        .attr('x2', toX(nv2x * s2 * 2)).attr('y2', toY(nv2y * s2 * 2))
        .attr('stroke', 'var(--color-vector-yellow)').attr('stroke-width', 2).attr('stroke-dasharray', '5 3');
    }

    // Labels
    if (s1 > 0.1) {
      g.append('text').attr('x', toX(nv1x * s1 * 2) + 8).attr('y', toY(nv1y * s1 * 2) - 5)
        .attr('fill', 'var(--color-vector-red)').attr('font-size', 12).attr('font-weight', 600)
        .text(`σ₁=${s1.toFixed(2)}`);
    }
    if (s2 > 0.05) {
      g.append('text').attr('x', toX(nv2x * s2 * 2) + 8).attr('y', toY(nv2y * s2 * 2) - 5)
        .attr('fill', 'var(--color-vector-yellow)').attr('font-size', 12).attr('font-weight', 600)
        .text(`σ₂=${s2.toFixed(2)}`);
    }

    // Stage label
    const stageText = t <= 0.01 ? 'Unit circle' : t <= 0.5 ? 'Stretching...' : 'A = UΣVᵀ';
    g.append('text').attr('x', width - 10).attr('y', 20)
      .attr('text-anchor', 'end').attr('fill', 'var(--color-ink-muted)').attr('font-size', 12)
      .text(stageText);

    // Condition number label
    const kappaColor = conditionNumber === Infinity ? 'var(--color-vector-red)'
      : conditionNumber >= 10 ? 'var(--color-vector-red)'
      : conditionNumber >= 3 ? 'var(--color-vector-yellow)'
      : 'var(--color-vector-green)';
    const kappaText = conditionNumber === Infinity ? 'κ = ∞ (singular)'
      : `κ = ${conditionNumber.toFixed(1)}`;
    g.append('text').attr('x', width - 10).attr('y', 38)
      .attr('text-anchor', 'end').attr('fill', kappaColor).attr('font-size', 11)
      .attr('font-family', 'var(--font-mono)')
      .text(kappaText);

  }, [a, b, c, d, s1, s2, nv1x, nv1y, nv2x, nv2y, t, width, height, conditionNumber]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <div className="not-prose space-y-3">
      <div className="flex flex-wrap gap-2">
        {presetList.map((p) => (
          <button
            key={p.label}
            onClick={() => {
              setActivePreset(p.label);
              applyPreset({ a: p.a, b: p.b, c: p.c, d: p.d, t: p.t });
            }}
            className={`rounded border px-3 py-1 text-xs font-sans font-medium transition-colors ${
              activePreset === p.label
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-rule bg-paper-elevated text-ink-muted hover:border-accent hover:text-accent'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full bg-[var(--color-paper)] rounded-lg border border-[var(--color-rule)]" />

      <div>
        <label className="text-[var(--color-ink-muted)] text-sm">Animation</label>
        <input type="range" min={0} max={1} step={0.01} value={t} onChange={e => setT(+e.target.value)} className="w-full accent-[var(--color-accent)]" />
      </div>

      <div className="text-sm">
        <label className="text-[var(--color-ink-muted)]">Matrix A</label>
        <div className="grid grid-cols-2 gap-1 mt-1">
          <input type="range" min={-4} max={4} step={0.1} value={a} onChange={e => setA(+e.target.value)} className="accent-[var(--color-vector-blue)]" />
          <input type="range" min={-4} max={4} step={0.1} value={b} onChange={e => setB(+e.target.value)} className="accent-[var(--color-vector-blue)]" />
          <input type="range" min={-4} max={4} step={0.1} value={c} onChange={e => setC(+e.target.value)} className="accent-[var(--color-vector-blue)]" />
          <input type="range" min={-4} max={4} step={0.1} value={d} onChange={e => setD(+e.target.value)} className="accent-[var(--color-vector-blue)]" />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 text-center text-sm bg-[var(--color-surface-1)] rounded-lg p-3">
        <div>
          <div className="text-[var(--color-ink-muted)] text-xs">Matrix A</div>
          <div className="font-mono text-xs">[[{a.toFixed(1)},{b.toFixed(1)}],[{c.toFixed(1)},{d.toFixed(1)}]]</div>
        </div>
        <div>
          <div className="text-[var(--color-vector-red)] text-xs">σ₁</div>
          <div className="font-mono font-semibold">{s1.toFixed(3)}</div>
        </div>
        <div>
          <div className="text-[var(--color-vector-yellow)] text-xs">σ₂</div>
          <div className="font-mono font-semibold">{s2.toFixed(3)}</div>
        </div>
        <div>
          <div className="text-xs" style={{ color: conditionNumber >= 10 ? 'var(--color-vector-red)' : conditionNumber >= 3 ? 'var(--color-vector-yellow)' : 'var(--color-vector-green)' }}>κ = σ₁/σ₂</div>
          <div className="font-mono font-semibold">{conditionNumber === Infinity ? '∞' : conditionNumber.toFixed(1)}</div>
        </div>
      </div>
    </div>
  );
}
