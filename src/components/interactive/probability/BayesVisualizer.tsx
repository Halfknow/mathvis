import { useState, useMemo, useCallback, useRef, useEffect } from 'react';

interface BayesVisualizerProps {
  width?: number;
  height?: number;
}

type ViewMode = 'grid' | 'formula';

const GRID_SIZE = 100;
const TOTAL = GRID_SIZE * GRID_SIZE;

const COLORS = {
  tp: '#4f8a5b',           // --color-vector-green
  fp: 'rgba(181, 74, 74, 0.5)', // --color-vector-red at 0.5 opacity
  fn: '#d4a02a',           // --color-vector-yellow
  tn: '#ffffff',           // --color-paper-elevated
};

export function BayesVisualizer({
  width = 640,
  height = 440,
}: BayesVisualizerProps) {
  const [view, setView] = useState<ViewMode>('grid');
  const [prior, setPrior] = useState(0.01);
  const [sensitivity, setSensitivity] = useState(0.95);
  const [specificity, setSpecificity] = useState(0.95);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Derived Bayes quantities
  const bayes = useMemo(() => {
    const pDisease = prior;
    const pNoDisease = 1 - prior;
    const pPosGivenDisease = sensitivity;
    const pNegGivenNoDisease = specificity;
    const pPosGivenNoDisease = 1 - specificity;

    const pPos = pPosGivenDisease * pDisease + pPosGivenNoDisease * pNoDisease;

    const pDiseaseGivenPos = pPos > 0
      ? (pPosGivenDisease * pDisease) / pPos
      : 0;

    // Counts out of 10,000
    const tp = Math.round(pPosGivenDisease * pDisease * TOTAL);
    const fn = Math.round(pDisease * TOTAL) - tp;
    const tn = Math.round(pNegGivenNoDisease * pNoDisease * TOTAL);
    const fp = Math.round(pNoDisease * TOTAL) - tn;

    return {
      prior: pDisease,
      sensitivity: pPosGivenDisease,
      specificity: pNegGivenNoDisease,
      pPosGivenNoDisease,
      pPos,
      posterior: pDiseaseGivenPos,
      tp,
      fp,
      tn,
      fn,
    };
  }, [prior, sensitivity, specificity]);

  // Build the grid data as an ImageData-compatible array
  // We group cells by category and draw them on canvas for performance
  const gridData = useMemo(() => {
    const tpCount = bayes.tp;
    const fnCount = bayes.fn;
    const fpCount = bayes.fp;

    // Assign cells: first fill disease-positive rows, then disease-negative
    // Disease rows come first (top of grid)
    const cells: Uint8Array = new Uint8Array(TOTAL); // 0=tn, 1=tp, 2=fp, 3=fn
    let idx = 0;

    // True Positives
    for (let i = 0; i < tpCount && idx < TOTAL; i++, idx++) {
      cells[idx] = 1;
    }
    // False Negatives
    for (let i = 0; i < fnCount && idx < TOTAL; i++, idx++) {
      cells[idx] = 3;
    }
    // False Positives
    for (let i = 0; i < fpCount && idx < TOTAL; i++, idx++) {
      cells[idx] = 2;
    }
    // True Negatives fill the rest
    for (; idx < TOTAL; idx++) {
      cells[idx] = 0;
    }

    return cells;
  }, [bayes]);

  // Draw on canvas — batched by color for performance
  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = 4;
    const gap = 0.5;
    const stride = cellSize + gap;
    const canvasSize = GRID_SIZE * stride;

    canvas.width = canvasSize;
    canvas.height = canvasSize;
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    // Background fills true-negative cells
    ctx.fillStyle = '#faf7f2'; // --color-paper
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Batch draw by category to minimize fillStyle changes
    const categories: { id: number; color: string }[] = [
      { id: 3, color: COLORS.fn },  // false negative
      { id: 2, color: COLORS.fp },  // false positive
      { id: 1, color: COLORS.tp },  // true positive
      // category 0 (true negative) is already the background
    ];

    for (const { id, color } of categories) {
      ctx.fillStyle = color;
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          if (gridData[row * GRID_SIZE + col] === id) {
            ctx.fillRect(col * stride, row * stride, cellSize, cellSize);
          }
        }
      }
    }
  }, [gridData]);

  useEffect(() => {
    if (view === 'grid') {
      drawGrid();
    }
  }, [view, drawGrid]);

  // Slider helper: format probability as percentage
  const fmtPct = (v: number, decimals = 1) =>
    `${(v * 100).toFixed(decimals)}%`;

  // SVG layout constants
  const svgPad = { top: 30, right: 30, bottom: 20, left: 30 };
  const svgW = width;
  const formulaH = height - 60; // leave room for posterior result

  return (
    <div className="flex h-full w-full flex-col">
      {/* View toggle */}
      <div className="flex items-center gap-2 border-b border-rule bg-paper-elevated px-4 py-2">
        <button
          type="button"
          onClick={() => setView('grid')}
          className={`rounded-sm border px-3 py-1 font-sans text-xs transition-colors duration-150 ${
            view === 'grid'
              ? 'border-accent bg-accent-soft text-accent'
              : 'border-rule bg-paper-elevated text-ink-muted hover:bg-surface-1'
          }`}
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Grid View
        </button>
        <button
          type="button"
          onClick={() => setView('formula')}
          className={`rounded-sm border px-3 py-1 font-sans text-xs transition-colors duration-150 ${
            view === 'formula'
              ? 'border-accent bg-accent-soft text-accent'
              : 'border-rule bg-paper-elevated text-ink-muted hover:bg-surface-1'
          }`}
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Formula View
        </button>

        <span
          className="ml-auto font-mono text-sm font-semibold"
          style={{ fontFamily: 'var(--font-mono)', color: 'var(--color-accent)' }}
        >
          P(disease | positive) = {fmtPct(bayes.posterior, 2)}
        </span>
      </div>

      {/* Main visualization area */}
      {view === 'grid' ? (
        <div
          className="flex items-center justify-center p-4"
          style={{ background: 'var(--color-paper)' }}
        >
          <div className="flex items-start gap-6">
            {/* Canvas grid */}
            <div
              className="relative"
              style={{
                width: 320,
                height: 320,
                border: '1px solid var(--color-rule)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'hidden',
                background: 'var(--color-paper)',
              }}
            >
              <canvas
                ref={canvasRef}
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            {/* Legend + summary */}
            <div className="flex flex-col gap-3" style={{ minWidth: 180 }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-ink-muted)', marginBottom: 4 }}>
                Out of 10,000 people:
              </div>

              {/* True Positive */}
              <div className="flex items-center gap-2">
                <span
                  style={{
                    display: 'inline-block',
                    width: 14,
                    height: 14,
                    borderRadius: 2,
                    background: 'var(--color-vector-green)',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-ink)' }}>
                    True Positive
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-vector-green)', fontWeight: 600 }}>
                    {bayes.tp.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* False Positive */}
              <div className="flex items-center gap-2">
                <span
                  style={{
                    display: 'inline-block',
                    width: 14,
                    height: 14,
                    borderRadius: 2,
                    background: 'var(--color-vector-red)',
                    opacity: 0.5,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-ink)' }}>
                    False Positive
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-vector-red)', fontWeight: 600 }}>
                    {bayes.fp.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* False Negative */}
              <div className="flex items-center gap-2">
                <span
                  style={{
                    display: 'inline-block',
                    width: 14,
                    height: 14,
                    borderRadius: 2,
                    background: 'var(--color-vector-yellow)',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-ink)' }}>
                    False Negative
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-vector-yellow)', fontWeight: 600 }}>
                    {bayes.fn.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* True Negative */}
              <div className="flex items-center gap-2">
                <span
                  style={{
                    display: 'inline-block',
                    width: 14,
                    height: 14,
                    borderRadius: 2,
                    background: 'var(--color-paper-elevated)',
                    border: '1px solid var(--color-rule)',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-ink)' }}>
                    True Negative
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--color-ink-faint)', fontWeight: 600 }}>
                    {bayes.tn.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div
                style={{
                  borderTop: '1px solid var(--color-rule)',
                  margin: '4px 0',
                }}
              />

              {/* Positive tests summary */}
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-ink-muted)' }}>
                <span style={{ color: 'var(--color-ink)' }}>All positives:</span>{' '}
                {(bayes.tp + bayes.fp).toLocaleString()}
              </div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: 'var(--color-ink-muted)' }}>
                <span style={{ color: 'var(--color-ink)' }}>Actually diseased:</span>{' '}
                {bayes.tp.toLocaleString()}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: 'var(--color-accent)',
                  marginTop: 2,
                }}
              >
                {bayes.tp + bayes.fp > 0
                  ? `${bayes.tp} / ${bayes.tp + bayes.fp} = ${fmtPct(bayes.posterior, 1)}`
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Formula View */
        <svg
          viewBox={`0 0 ${svgW} ${formulaH}`}
          className="w-full"
          style={{ background: 'var(--color-paper)' }}
        >
          {/* Title */}
          <text
            x={svgW / 2}
            y={svgPad.top + 4}
            textAnchor="middle"
            style={{ fontFamily: 'var(--font-sans)', fontSize: '14px', fontWeight: 600, fill: 'var(--color-ink)' }}
          >
            Bayes' Theorem — Medical Test Example
          </text>

          {/* Formula line 1: P(H|E) = P(E|H) * P(H) / P(E) */}
          <text x={svgW / 2} y={svgPad.top + 50} textAnchor="middle" style={{ fontFamily: 'var(--font-mono)', fontSize: '16px', fill: 'var(--color-ink)' }}>
            <tspan style={{ fill: 'var(--color-accent)', fontWeight: 700 }}>P(H|E)</tspan>
            <tspan> = </tspan>
            <tspan style={{ fill: 'var(--color-vector-blue)' }}>P(E|H)</tspan>
            <tspan> × </tspan>
            <tspan style={{ fill: 'var(--color-vector-green)' }}>P(H)</tspan>
            <tspan> / </tspan>
            <tspan style={{ fill: 'var(--color-ink-muted)' }}>P(E)</tspan>
          </text>

          {/* Divider line */}
          <line
            x1={svgPad.left + 40}
            y1={svgPad.top + 70}
            x2={svgW - svgPad.right - 40}
            y2={svgPad.top + 70}
            stroke="var(--color-rule)"
            strokeWidth={1}
          />

          {/* Numerator line */}
          <text x={svgPad.left + 60} y={svgPad.top + 100} style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fill: 'var(--color-ink-muted)' }}>
            Numerator:
          </text>
          <text x={svgPad.left + 60} y={svgPad.top + 122} style={{ fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
            <tspan style={{ fill: 'var(--color-vector-blue)' }}>P(positive | disease)</tspan>
            <tspan> × </tspan>
            <tspan style={{ fill: 'var(--color-vector-green)' }}>P(disease)</tspan>
            <tspan style={{ fill: 'var(--color-ink)' }}> = </tspan>
            <tspan style={{ fill: 'var(--color-vector-blue)' }}>{fmtPct(bayes.sensitivity)}</tspan>
            <tspan> × </tspan>
            <tspan style={{ fill: 'var(--color-vector-green)' }}>{fmtPct(bayes.prior)}</tspan>
            <tspan style={{ fill: 'var(--color-ink)' }}> = </tspan>
            <tspan style={{ fill: 'var(--color-ink)', fontWeight: 600 }}>{fmtPct(bayes.sensitivity * bayes.prior, 3)}</tspan>
          </text>

          {/* Denominator line */}
          <text x={svgPad.left + 60} y={svgPad.top + 156} style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fill: 'var(--color-ink-muted)' }}>
            Evidence P(E) = P(pos|disease)P(disease) + P(pos|healthy)P(healthy):
          </text>
          <text x={svgPad.left + 60} y={svgPad.top + 178} style={{ fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
            <tspan style={{ fill: 'var(--color-vector-blue)' }}>{fmtPct(bayes.sensitivity)}</tspan>
            <tspan> × </tspan>
            <tspan style={{ fill: 'var(--color-vector-green)' }}>{fmtPct(bayes.prior)}</tspan>
            <tspan> + </tspan>
            <tspan style={{ fill: 'var(--color-vector-red)' }}>{fmtPct(bayes.pPosGivenNoDisease)}</tspan>
            <tspan> × </tspan>
            <tspan style={{ fill: 'var(--color-vector-green)' }}>{fmtPct(1 - bayes.prior)}</tspan>
            <tspan style={{ fill: 'var(--color-ink)' }}> = </tspan>
            <tspan style={{ fill: 'var(--color-ink)', fontWeight: 600 }}>{fmtPct(bayes.pPos, 3)}</tspan>
          </text>

          {/* Divider */}
          <line
            x1={svgPad.left + 40}
            y1={svgPad.top + 196}
            x2={svgW - svgPad.right - 40}
            y2={svgPad.top + 196}
            stroke="var(--color-rule)"
            strokeWidth={1}
          />

          {/* Prior section */}
          <text x={svgPad.left + 60} y={svgPad.top + 224} style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fill: 'var(--color-ink-muted)' }}>
            Prior
          </text>
          <text x={svgPad.left + 120} y={svgPad.top + 224} style={{ fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
            <tspan style={{ fill: 'var(--color-vector-green)' }}>P(disease)</tspan>
            <tspan style={{ fill: 'var(--color-ink)' }}> = </tspan>
            <tspan style={{ fontWeight: 600 }}>{fmtPct(bayes.prior, 2)}</tspan>
          </text>

          {/* Likelihood */}
          <text x={svgPad.left + 60} y={svgPad.top + 252} style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fill: 'var(--color-ink-muted)' }}>
            Likelihood
          </text>
          <text x={svgPad.left + 120} y={svgPad.top + 252} style={{ fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
            <tspan style={{ fill: 'var(--color-vector-blue)' }}>P(positive|disease)</tspan>
            <tspan style={{ fill: 'var(--color-ink)' }}> = </tspan>
            <tspan style={{ fontWeight: 600 }}>{fmtPct(bayes.sensitivity)}</tspan>
          </text>

          {/* Evidence */}
          <text x={svgPad.left + 60} y={svgPad.top + 280} style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fill: 'var(--color-ink-muted)' }}>
            Evidence
          </text>
          <text x={svgPad.left + 120} y={svgPad.top + 280} style={{ fontFamily: 'var(--font-mono)', fontSize: '14px' }}>
            <tspan style={{ fill: 'var(--color-ink-muted)' }}>P(positive)</tspan>
            <tspan style={{ fill: 'var(--color-ink)' }}> = </tspan>
            <tspan style={{ fontWeight: 600 }}>{fmtPct(bayes.pPos, 3)}</tspan>
          </text>

          {/* Posterior — the main result */}
          <line
            x1={svgPad.left + 40}
            y1={svgPad.top + 300}
            x2={svgW - svgPad.right - 40}
            y2={svgPad.top + 300}
            stroke="var(--color-accent)"
            strokeWidth={1.5}
            strokeDasharray="4,3"
          />
          <text
            x={svgW / 2}
            y={svgPad.top + 330}
            textAnchor="middle"
            style={{ fontFamily: 'var(--font-sans)', fontSize: '13px', fill: 'var(--color-ink-muted)' }}
          >
            Posterior
          </text>
          <text
            x={svgW / 2}
            y={svgPad.top + 358}
            textAnchor="middle"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '22px', fontWeight: 700, fill: 'var(--color-accent)' }}
          >
            P(disease | positive) = {fmtPct(bayes.posterior, 2)}
          </text>
        </svg>
      )}

      {/* Controls panel */}
      <div
        className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t px-4 py-3"
        style={{
          borderColor: 'var(--color-rule)',
          background: 'var(--color-paper-elevated)',
        }}
      >
        {/* Prior slider */}
        <label
          className="flex items-center gap-2"
          style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--color-ink-muted)' }}
        >
          <span style={{ color: 'var(--color-vector-green)', fontWeight: 600, minWidth: 70 }}>
            P(disease)
          </span>
          <input
            type="range"
            min={0.001}
            max={0.5}
            step={0.001}
            value={prior}
            onChange={(e) => setPrior(+e.target.value)}
            className="h-1 w-24 cursor-pointer"
            style={{ accentColor: 'var(--color-vector-green)' }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--color-ink)',
              minWidth: 48,
              textAlign: 'right',
            }}
          >
            {fmtPct(prior, 1)}
          </span>
        </label>

        {/* Sensitivity slider */}
        <label
          className="flex items-center gap-2"
          style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--color-ink-muted)' }}
        >
          <span style={{ color: 'var(--color-vector-blue)', fontWeight: 600, minWidth: 110 }}>
            P(pos | disease)
          </span>
          <input
            type="range"
            min={0.5}
            max={1.0}
            step={0.01}
            value={sensitivity}
            onChange={(e) => setSensitivity(+e.target.value)}
            className="h-1 w-24 cursor-pointer"
            style={{ accentColor: 'var(--color-vector-blue)' }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--color-ink)',
              minWidth: 42,
              textAlign: 'right',
            }}
          >
            {fmtPct(sensitivity)}
          </span>
        </label>

        {/* Specificity slider */}
        <label
          className="flex items-center gap-2"
          style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', color: 'var(--color-ink-muted)' }}
        >
          <span style={{ color: 'var(--color-vector-red)', fontWeight: 600, minWidth: 130 }}>
            P(neg | healthy)
          </span>
          <input
            type="range"
            min={0.5}
            max={1.0}
            step={0.01}
            value={specificity}
            onChange={(e) => setSpecificity(+e.target.value)}
            className="h-1 w-24 cursor-pointer"
            style={{ accentColor: 'var(--color-vector-red)' }}
          />
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: 'var(--color-ink)',
              minWidth: 42,
              textAlign: 'right',
            }}
          >
            {fmtPct(specificity)}
          </span>
        </label>

        {/* Posterior result */}
        <div
          className="ml-auto flex items-center gap-2"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          <span style={{ fontSize: '11px', color: 'var(--color-ink-faint)' }}>
            Posterior:
          </span>
          <span
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--color-accent)',
              lineHeight: 1,
            }}
          >
            {fmtPct(bayes.posterior, 2)}
          </span>
        </div>
      </div>
    </div>
  );
}
