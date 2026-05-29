import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

function MatrixCell({ value }: { value: number }) {
  const formatted = Math.abs(value) < 1e-10 ? '0' : value.toFixed(3);
  return <span className="font-mono">{formatted}</span>;
}

function Matrix2x2({
  label,
  values,
  color,
}: {
  label: string;
  values: [number, number, number, number]; // [a11, a12, a21, a22]
  color?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xs text-[var(--color-ink-muted)] font-semibold mb-1">{label}</span>
      <div className="relative px-2 py-1">
        <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded" style={{ backgroundColor: color || 'var(--color-ink-muted)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-[3px] rounded" style={{ backgroundColor: color || 'var(--color-ink-muted)' }} />
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
          <MatrixCell value={values[0]} />
          <MatrixCell value={values[1]} />
          <MatrixCell value={values[2]} />
          <MatrixCell value={values[3]} />
        </div>
      </div>
    </div>
  );
}

export function QRDecompositionVis({ width = 640, height = 400 }: { width?: number; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [v1x, setV1x] = useState(3);
  const [v1y, setV1y] = useState(1);
  const [v2x, setV2x] = useState(1);
  const [v2y, setV2y] = useState(2);
  const [step, setStep] = useState(0); // 0=original, 1=gram-schmidt, 2=QR

  // Gram-Schmidt computations
  const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const u1x = len1 > 1e-10 ? v1x / len1 : 0;
  const u1y = len1 > 1e-10 ? v1y / len1 : 0;

  // Projection of v2 onto u1
  const dot2u1 = v2x * u1x + v2y * u1y;
  const projX = dot2u1 * u1x;
  const projY = dot2u1 * u1y;

  // Perpendicular component: v2' = v2 - proj
  const v2px = v2x - projX;
  const v2py = v2y - projY;
  const len2p = Math.sqrt(v2px * v2px + v2py * v2py);

  // u2 = normalized v2'
  const u2x = len2p > 1e-10 ? v2px / len2p : 0;
  const u2y = len2p > 1e-10 ? v2py / len2p : 0;

  // R matrix entries: R = Q^T * A
  const R11 = u1x * v1x + u1y * v1y;
  const R12 = u1x * v2x + u1y * v2y;
  const R21 = 0; // by construction
  const R22 = u2x * v2x + u2y * v2y;

  // Verification: Q^T * Q (should be identity)
  const QtQ_11 = u1x * u1x + u1y * u1y;
  const QtQ_12 = u1x * u2x + u1y * u2y;
  const QtQ_22 = u2x * u2x + u2y * u2y;

  // Verification: Q * R (should equal A)
  const QR_11 = u1x * R11 + u2x * R21;
  const QR_12 = u1x * R12 + u2x * R22;
  const QR_21 = u1y * R11 + u2y * R21;
  const QR_22 = u1y * R12 + u2y * R22;

  // Check if input is degenerate
  const isDegenerate = len1 < 0.01 || len2p < 0.01;

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

    // Axis labels
    g.append('text').attr('x', toX(gridSize) - 4).attr('y', toY(0) + 14)
      .attr('fill', 'var(--color-ink-faint)').attr('font-size', 10).attr('text-anchor', 'end').text('x');
    g.append('text').attr('x', toX(0) + 8).attr('y', toY(gridSize) + 12)
      .attr('fill', 'var(--color-ink-faint)').attr('font-size', 10).text('y');

    const drawArrow = (ox: number, oy: number, tx: number, ty: number, color: string, sw: number, dash?: string, label?: string, labelOffset?: { x: number; y: number }) => {
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
      if (label) {
        const off = labelOffset || { x: 8, y: -8 };
        g.append('text').attr('x', px2 + off.x).attr('y', py2 + off.y)
          .attr('fill', color).attr('font-size', 12).attr('font-weight', 600)
          .text(label);
      }
    };

    // Dashed helper line between two points (no arrowhead)
    const drawDashedLine = (x1: number, y1: number, x2: number, y2: number, color: string, sw: number = 1) => {
      g.append('line')
        .attr('x1', toX(x1)).attr('y1', toY(y1))
        .attr('x2', toX(x2)).attr('y2', toY(y2))
        .attr('stroke', color).attr('stroke-width', sw)
        .attr('stroke-dasharray', '4 3').attr('stroke-linecap', 'round');
    };

    // Step 0: Original vectors
    if (step === 0) {
      drawArrow(0, 0, v1x, v1y, 'var(--color-vector-blue)', 2.5, undefined, 'v1', { x: 8, y: -8 });
      drawArrow(0, 0, v2x, v2y, 'var(--color-vector-green)', 2.5, undefined, 'v2', { x: 8, y: -8 });
    }

    // Step 1: Gram-Schmidt process
    if (step === 1) {
      // Original vectors faded
      drawArrow(0, 0, v1x, v1y, 'var(--color-vector-blue)', 1.5, '4 3', 'v1', { x: 8, y: -8 });
      drawArrow(0, 0, v2x, v2y, 'var(--color-vector-green)', 1.5, '4 3', 'v2', { x: 8, y: -8 });

      // u1 = v1 / ||v1|| (shown at unit length for clarity)
      drawArrow(0, 0, u1x, u1y, 'var(--color-vector-blue)', 2.5, undefined, 'u1', { x: 8, y: 16 });

      // Projection of v2 onto u1
      drawArrow(0, 0, projX, projY, 'var(--color-ink-muted)', 1.5, '4 3');

      // Dashed line from v2 tip to projection tip (showing subtraction)
      drawDashedLine(projX, projY, v2x, v2y, 'var(--color-vector-green)', 1);

      // u2 = perpendicular component (normalized)
      if (len2p > 0.01) {
        drawArrow(0, 0, u2x, u2y, 'var(--color-vector-yellow)', 2.5, undefined, 'u2', { x: 8, y: -8 });
      }

      // Right angle marker between u1 and u2
      if (len2p > 0.1) {
        const ms = 0.2;
        const p1x = u1x * ms, p1y = u1y * ms;
        const p2x = p1x + u2x * ms, p2y = p1y + u2y * ms;
        const p3x = u2x * ms, p3y = u2y * ms;
        g.append('polyline')
          .attr('points', `${toX(p1x)},${toY(p1y)} ${toX(p2x)},${toY(p2y)} ${toX(p3x)},${toY(p3y)}`)
          .attr('fill', 'none').attr('stroke', 'var(--color-vector-yellow)').attr('stroke-width', 1);
      }
    }

    // Step 2: QR result
    if (step === 2) {
      // Q columns as solid arrows
      drawArrow(0, 0, u1x, u1y, 'var(--color-vector-blue)', 2.5, undefined, 'q1 = u1', { x: 8, y: 16 });
      if (len2p > 0.01) {
        drawArrow(0, 0, u2x, u2y, 'var(--color-vector-yellow)', 2.5, undefined, 'q2 = u2', { x: 8, y: -8 });
      }

      // Faded originals for reference
      drawArrow(0, 0, v1x, v1y, 'var(--color-vector-blue)', 1, '4 3');
      drawArrow(0, 0, v2x, v2y, 'var(--color-vector-green)', 1, '4 3');

      // Right angle marker
      if (len2p > 0.1) {
        const ms = 0.2;
        const p1x = u1x * ms, p1y = u1y * ms;
        const p2x = p1x + u2x * ms, p2y = p1y + u2y * ms;
        const p3x = u2x * ms, p3y = u2y * ms;
        g.append('polyline')
          .attr('points', `${toX(p1x)},${toY(p1y)} ${toX(p2x)},${toY(p2y)} ${toX(p3x)},${toY(p3y)}`)
          .attr('fill', 'none').attr('stroke', 'var(--color-vector-yellow)').attr('stroke-width', 1);
      }

      // "Q" and "R" labels on the diagram
      g.append('text').attr('x', toX(-gridSize) + 8).attr('y', toY(gridSize) - 8)
        .attr('fill', 'var(--color-ink-muted)').attr('font-size', 11).attr('font-style', 'italic')
        .text('faded: original v1, v2');
    }

  }, [v1x, v1y, v2x, v2y, step, len1, u1x, u1y, dot2u1, projX, projY, v2px, v2py, len2p, u2x, u2y, width, height]);

  useEffect(() => { draw(); }, [draw]);

  return (
    <div className="not-prose space-y-3">
      <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} className="w-full bg-[var(--color-paper)] rounded-lg border border-[var(--color-rule)]" />

      {/* Step buttons */}
      <div className="flex gap-2 mb-2">
        {(['Original', 'Gram-Schmidt', 'QR'] as const).map((label, i) => (
          <button key={i} onClick={() => setStep(i)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${step === i ? 'bg-[var(--color-accent)] text-white' : 'bg-[var(--color-surface-1)] text-[var(--color-ink-muted)]'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <label className="text-[var(--color-vector-blue)] font-semibold">v1 (column 1)</label>
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
          <label className="text-[var(--color-vector-green)] font-semibold">v2 (column 2)</label>
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

      {/* Orthogonality check (step >= 1) */}
      {step >= 1 && !isDegenerate && (
        <div className="text-center text-sm bg-[var(--color-surface-1)] rounded-lg p-2">
          u1 &middot; u2 = <span className="font-mono font-semibold">{(u1x * u2x + u1y * u2y).toFixed(4)}</span>
          {Math.abs(u1x * u2x + u1y * u2y) < 0.01 && (
            <span className="text-[var(--color-vector-yellow)] ml-2">Orthogonal!</span>
          )}
        </div>
      )}

      {/* Degenerate case warning */}
      {isDegenerate && (
        <div className="text-center text-sm bg-[var(--color-surface-2)] rounded-lg p-2 text-[var(--color-vector-red)]">
          {len1 < 0.01
            ? 'v1 is the zero vector -- cannot normalize.'
            : 'v2 is a scalar multiple of v1 -- no perpendicular component exists.'}
        </div>
      )}

      {/* Matrix display area (step >= 1) */}
      {step >= 1 && !isDegenerate && (
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Matrix2x2
            label="A"
            values={[v1x, v2x, v1y, v2y]}
            color="var(--color-ink)"
          />
          <span className="text-[var(--color-ink-muted)] text-lg font-light mt-4">=</span>
          <Matrix2x2
            label="Q"
            values={[u1x, u2x, u1y, u2y]}
            color="var(--color-vector-blue)"
          />
          <Matrix2x2
            label="R"
            values={[R11, R12, R21, R22]}
            color="var(--color-vector-yellow)"
          />
        </div>
      )}

      {/* R entry explanations (step >= 1) */}
      {step >= 1 && !isDegenerate && (
        <div className="text-xs text-[var(--color-ink-muted)] bg-[var(--color-surface-1)] rounded-lg p-2 space-y-0.5">
          <div>R<sub>11</sub> = u1 &middot; v1 = <span className="font-mono">{R11.toFixed(3)}</span> (||v1|| = ||v1||)</div>
          <div>R<sub>12</sub> = u1 &middot; v2 = <span className="font-mono">{R12.toFixed(3)}</span></div>
          <div>R<sub>21</sub> = u2 &middot; v1 = <span className="font-mono">0</span> (always, by construction)</div>
          <div>R<sub>22</sub> = u2 &middot; v2 = <span className="font-mono">{R22.toFixed(3)}</span></div>
        </div>
      )}

      {/* Verification (step 2) */}
      {step === 2 && !isDegenerate && (
        <div className="bg-[var(--color-surface-1)] rounded-lg p-3 space-y-2">
          <div className="text-xs font-semibold text-[var(--color-ink-muted)] uppercase tracking-wide">Verification</div>

          {/* Q^T * Q = I */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold">Q<sup>T</sup>Q</span>
            <span className="text-[var(--color-ink-muted)]">=</span>
            <span className="font-mono">
              [{QtQ_11.toFixed(3)}, {QtQ_12.toFixed(3)}; {QtQ_12.toFixed(3)}, {QtQ_22.toFixed(3)}]
            </span>
            {Math.abs(QtQ_11 - 1) < 0.01 && Math.abs(QtQ_12) < 0.01 && Math.abs(QtQ_22 - 1) < 0.01 ? (
              <span className="text-[var(--color-vector-green)] font-medium ml-1">= I</span>
            ) : (
              <span className="text-[var(--color-vector-red)] ml-1">not identity</span>
            )}
          </div>

          {/* Q * R = A */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold">QR</span>
            <span className="text-[var(--color-ink-muted)]">=</span>
            <span className="font-mono">
              [{QR_11.toFixed(3)}, {QR_12.toFixed(3)}; {QR_21.toFixed(3)}, {QR_22.toFixed(3)}]
            </span>
            {Math.abs(QR_11 - v1x) < 0.01 && Math.abs(QR_12 - v2x) < 0.01 &&
             Math.abs(QR_21 - v1y) < 0.01 && Math.abs(QR_22 - v2y) < 0.01 ? (
              <span className="text-[var(--color-vector-green)] font-medium ml-1">= A</span>
            ) : (
              <span className="text-[var(--color-vector-red)] ml-1">not equal to A</span>
            )}
          </div>

          {/* Dot product detail */}
          <div className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
            <span>u1 &middot; u1 = <span className="font-mono">{QtQ_11.toFixed(4)}</span></span>
            <span className="mx-1">|</span>
            <span>u1 &middot; u2 = <span className="font-mono">{QtQ_12.toFixed(4)}</span></span>
            <span className="mx-1">|</span>
            <span>u2 &middot; u2 = <span className="font-mono">{QtQ_22.toFixed(4)}</span></span>
          </div>
        </div>
      )}
    </div>
  );
}
