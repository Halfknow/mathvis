import { useState, useMemo, useCallback } from 'react';

// ---------------------------------------------------------------------------
// ExpectationVis — interactive balance-point / fulcrum visualization
// ---------------------------------------------------------------------------

interface ExpectationVisProps {
  width?: number;
  height?: number;
}

type PresetKey = 'fairDie' | 'biasedCoin' | 'uniform' | 'custom';

interface MassPoint {
  value: number;   // x-value on the seesaw
  prob: number;    // probability mass (height of block)
}

interface Preset {
  label: string;
  masses: MassPoint[];
}

const PRESETS: Record<PresetKey, Preset> = {
  fairDie: {
    label: 'Fair die',
    masses: [
      { value: 1, prob: 1 / 6 },
      { value: 2, prob: 1 / 6 },
      { value: 3, prob: 1 / 6 },
      { value: 4, prob: 1 / 6 },
      { value: 5, prob: 1 / 6 },
      { value: 6, prob: 1 / 6 },
    ],
  },
  biasedCoin: {
    label: 'Biased coin (p=0.7)',
    masses: [
      { value: 0, prob: 0.3 },
      { value: 1, prob: 0.7 },
    ],
  },
  uniform: {
    label: 'Uniform [1..4]',
    masses: [
      { value: 1, prob: 0.25 },
      { value: 2, prob: 0.25 },
      { value: 3, prob: 0.25 },
      { value: 4, prob: 0.25 },
    ],
  },
  custom: {
    label: 'Custom',
    masses: [
      { value: 1, prob: 0.15 },
      { value: 2, prob: 0.25 },
      { value: 3, prob: 0.35 },
      { value: 4, prob: 0.15 },
      { value: 5, prob: 0.10 },
    ],
  },
};

function computeStats(masses: MassPoint[]): { mean: number; variance: number; std: number } {
  let mean = 0;
  for (const m of masses) mean += m.value * m.prob;
  let variance = 0;
  for (const m of masses) variance += m.prob * (m.value - mean) ** 2;
  return { mean, variance, std: Math.sqrt(variance) };
}

export function ExpectationVis({ width = 640, height = 360 }: ExpectationVisProps) {
  const [preset, setPreset] = useState<PresetKey>('fairDie');
  const [customMasses, setCustomMasses] = useState<MassPoint[]>(PRESETS.custom.masses.map(m => ({ ...m })));
  const [fulcrumOverride, setFulcrumOverride] = useState<number | null>(null);
  const [showVariance, setShowVariance] = useState(false);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);

  const masses = preset === 'custom' ? customMasses : PRESETS[preset].masses;
  const stats = useMemo(() => computeStats(masses), [masses]);
  const fulcrumX = fulcrumOverride ?? stats.mean;

  // Layout
  const pad = { top: 40, right: 40, bottom: 60, left: 40 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  // Value range
  const vals = masses.map(m => m.value);
  const minVal = Math.min(...vals) - 1;
  const maxVal = Math.max(...vals) + 1;
  const valRange = maxVal - minVal;

  const scaleX = useCallback(
    (v: number) => pad.left + ((v - minVal) / valRange) * plotW,
    [pad.left, minVal, valRange, plotW],
  );

  // Seesaw geometry
  const barY = pad.top + plotH * 0.35;     // vertical position of the bar
  const barThick = 6;
  const maxBlockH = plotH * 0.35;
  const maxProb = Math.max(...masses.map(m => m.prob), 0.01);

  // Tilt angle based on fulcrum offset from E[X]
  const offset = fulcrumX - stats.mean;
  const tiltDeg = Math.max(-12, Math.min(12, offset * 8));
  const tiltRad = (tiltDeg * Math.PI) / 180;

  // Seesaw rotation center = fulcrum position
  const fulcrumPx = scaleX(fulcrumX);
  const seesawCenterY = barY + barThick / 2;

  // Fulcrum triangle
  const fulcrumTipY = barY + barThick + 4;
  const fulcrumBaseY = fulcrumTipY + 24;

  // Variance arrows
  const varianceY = fulcrumBaseY + 30;

  // Handle custom mass drag
  const handleCustomDrag = useCallback(
    (idx: number, clientY: number, svgRect: DOMRect) => {
      const svgY = ((clientY - svgRect.top) / svgRect.height) * height;
      // Convert y position back to probability
      const blockBottomY = barY; // reference point for block base
      const dragRange = maxBlockH;
      const newProb = Math.max(0.01, Math.min(0.99, (blockBottomY - svgY) / dragRange * maxProb));
      setCustomMasses(prev => {
        const next = [...prev];
        next[idx] = { ...next[idx], prob: Math.round(newProb * 100) / 100 };
        // Renormalize
        const total = next.reduce((s, m) => s + m.prob, 0);
        return next.map(m => ({ ...m, prob: m.prob / total }));
      });
    },
    [barY, maxBlockH, maxProb, height],
  );

  const presetKeys: { key: PresetKey; label: string }[] = [
    { key: 'fairDie', label: 'Fair die' },
    { key: 'biasedCoin', label: 'Biased coin' },
    { key: 'uniform', label: 'Uniform' },
    { key: 'custom', label: 'Custom' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{
          width: '100%',
          background: 'var(--color-paper)',
          borderRadius: 'var(--radius-sm)',
          display: 'block',
          userSelect: 'none',
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Axis line at barY level */}
        {masses.map((m) => {
          const px = scaleX(m.value);
          return (
            <g key={`tick-${m.value}`}>
              <line
                x1={px} y1={barY + barThick}
                x2={px} y2={barY + barThick + 6}
                stroke="var(--color-ink-faint)"
                strokeWidth={1}
              />
              <text
                x={px} y={barY + barThick + 18}
                textAnchor="middle"
                fill="var(--color-ink-muted)"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
              >
                {m.value}
              </text>
            </g>
          );
        })}

        {/* Seesaw bar — rotated around fulcrum */}
        <g
          transform={`rotate(${tiltDeg}, ${fulcrumPx}, ${seesawCenterY})`}
        >
          {/* Bar */}
          <rect
            x={scaleX(minVal + 0.3)}
            y={barY}
            width={scaleX(maxVal - 0.3) - scaleX(minVal + 0.3)}
            height={barThick}
            fill="var(--color-ink-faint)"
            rx={3}
          />

          {/* Mass blocks */}
          {masses.map((m, i) => {
            const px = scaleX(m.value);
            const blockH = Math.max(4, (m.prob / maxProb) * maxBlockH);
            const bw = Math.min(36, plotW / (masses.length + 1) * 0.6);
            const isCorrect = Math.abs(fulcrumX - stats.mean) < 0.05;
            const blockColor = isCorrect ? 'var(--color-vector-blue)' : 'var(--color-vector-blue)';

            return (
              <g key={`block-${i}`}>
                <rect
                  x={px - bw / 2}
                  y={barY - blockH}
                  width={bw}
                  height={blockH}
                  fill={blockColor}
                  opacity={0.8}
                  rx={2}
                  style={{
                    cursor: preset === 'custom' ? 'ns-resize' : 'default',
                    transition: 'height 0.2s ease, y 0.2s ease',
                  }}
                  onMouseDown={
                    preset === 'custom'
                      ? (e) => {
                          setDraggingIdx(i);
                          const svgEl = (e.target as SVGElement).closest('svg');
                          if (svgEl) {
                            const rect = svgEl.getBoundingClientRect();
                            handleCustomDrag(i, e.clientY, rect);
                          }
                        }
                      : undefined
                  }
                />
                {/* Probability label on block */}
                <text
                  x={px}
                  y={barY - blockH - 4}
                  textAnchor="middle"
                  fill="var(--color-ink-muted)"
                  style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}
                >
                  {m.prob.toFixed(2)}
                </text>
              </g>
            );
          })}
        </g>

        {/* Fulcrum triangle */}
        <polygon
          points={`${fulcrumPx},${fulcrumTipY} ${fulcrumPx - 10},${fulcrumBaseY} ${fulcrumPx + 10},${fulcrumBaseY}`}
          fill="var(--color-accent)"
          opacity={0.9}
          style={{ cursor: 'ew-resize', transition: 'x 0.1s ease' }}
          onMouseDown={(e) => {
            const startX = e.clientX;
            const startFulcrum = fulcrumX;
            const svgEl = (e.target as SVGElement).closest('svg');
            if (!svgEl) return;

            const onMove = (ev: MouseEvent) => {
              const rect = svgEl.getBoundingClientRect();
              const dx = ev.clientX - startX;
              const dVal = (dx / rect.width) * (width / plotW) * valRange;
              setFulcrumOverride(Math.max(minVal, Math.min(maxVal, startFulcrum + dVal)));
            };
            const onUp = () => {
              window.removeEventListener('mousemove', onMove);
              window.removeEventListener('mouseup', onUp);
            };
            window.addEventListener('mousemove', onMove);
            window.addEventListener('mouseup', onUp);
          }}
        />

        {/* Fulcrum label */}
        <text
          x={fulcrumPx}
          y={fulcrumBaseY + 14}
          textAnchor="middle"
          fill="var(--color-accent)"
          style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 500 }}
        >
          fulcrum = {fulcrumX.toFixed(2)}
        </text>

        {/* Balance indicator */}
        {Math.abs(fulcrumX - stats.mean) < 0.08 ? (
          <text
            x={width / 2}
            y={pad.top + 14}
            textAnchor="middle"
            fill="var(--color-vector-green)"
            style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600 }}
          >
            Balanced! Fulcrum is at E[X]
          </text>
        ) : (
          <text
            x={width / 2}
            y={pad.top + 14}
            textAnchor="middle"
            fill="var(--color-vector-red)"
            style={{ fontFamily: 'var(--font-sans)', fontSize: '12px' }}
          >
            Tilted — drag fulcrum to balance point
          </text>
        )}

        {/* Variance spread arrows */}
        {showVariance && (
          <g>
            {/* Left arrow: E[X] - sigma */}
            <line
              x1={scaleX(stats.mean)}
              y1={varianceY}
              x2={scaleX(stats.mean - stats.std)}
              y2={varianceY}
              stroke="var(--color-vector-green)"
              strokeWidth={2}
              markerEnd="url(#arrow-left-green)"
            />
            {/* Right arrow: E[X] + sigma */}
            <line
              x1={scaleX(stats.mean)}
              y1={varianceY}
              x2={scaleX(stats.mean + stats.std)}
              y2={varianceY}
              stroke="var(--color-vector-green)"
              strokeWidth={2}
              markerEnd="url(#arrow-right-green)"
            />
            {/* Center dot at E[X] */}
            <circle
              cx={scaleX(stats.mean)}
              cy={varianceY}
              r={3}
              fill="var(--color-accent)"
            />
            {/* Label */}
            <text
              x={scaleX(stats.mean)}
              y={varianceY + 16}
              textAnchor="middle"
              fill="var(--color-vector-green)"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}
            >
              {'\u00B1\u03C3 = \u00B1' + stats.std.toFixed(2)}
            </text>

            {/* Shaded spread region */}
            <rect
              x={scaleX(stats.mean - stats.std)}
              y={varianceY - 8}
              width={scaleX(stats.mean + stats.std) - scaleX(stats.mean - stats.std)}
              height={16}
              fill="var(--color-vector-green)"
              opacity={0.08}
              rx={4}
            />
          </g>
        )}

        {/* Stats display — top right */}
        <g>
          <text
            x={width - pad.right}
            y={pad.top}
            textAnchor="end"
            fill="var(--color-ink)"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
          >
            {'E[X] = ' + stats.mean.toFixed(3)}
          </text>
          <text
            x={width - pad.right}
            y={pad.top + 16}
            textAnchor="end"
            fill="var(--color-ink-faint)"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
          >
            {'Var(X) = ' + stats.variance.toFixed(3)}
          </text>
          <text
            x={width - pad.right}
            y={pad.top + 32}
            textAnchor="end"
            fill="var(--color-ink-faint)"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
          >
            {'\u03C3 = ' + stats.std.toFixed(3)}
          </text>
        </g>

        {/* Arrow markers */}
        <defs>
          <marker
            id="arrow-right-green"
            markerWidth="8"
            markerHeight="6"
            refX="8"
            refY="3"
            orient="auto"
          >
            <path d="M0,0 L8,3 L0,6" fill="var(--color-vector-green)" />
          </marker>
          <marker
            id="arrow-left-green"
            markerWidth="8"
            markerHeight="6"
            refX="0"
            refY="3"
            orient="auto-start-reverse"
          >
            <path d="M8,0 L0,3 L8,6" fill="var(--color-vector-green)" />
          </marker>
        </defs>
      </svg>

      {/* Controls */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '10px',
          borderTop: '1px solid var(--color-rule)',
          background: 'var(--color-paper-elevated)',
          padding: '10px 16px',
          borderRadius: '0 0 var(--radius-sm) var(--radius-sm)',
        }}
      >
        {/* Preset buttons */}
        {presetKeys.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => {
              setPreset(p.key);
              setFulcrumOverride(null);
              if (p.key === 'custom') {
                setCustomMasses(PRESETS.custom.masses.map(m => ({ ...m })));
              }
            }}
            style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: preset === p.key ? 'var(--color-accent)' : 'var(--color-rule)',
              background: preset === p.key ? 'var(--color-accent-soft)' : 'var(--color-paper)',
              color: preset === p.key ? 'var(--color-accent)' : 'var(--color-ink-muted)',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              fontWeight: preset === p.key ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {p.label}
          </button>
        ))}

        {/* Separator */}
        <div style={{ width: '1px', height: '20px', background: 'var(--color-rule)' }} />

        {/* Show variance toggle */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            color: 'var(--color-ink-muted)',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <input
            type="checkbox"
            checked={showVariance}
            onChange={(e) => setShowVariance(e.target.checked)}
            style={{ accentColor: 'var(--color-accent)', cursor: 'pointer' }}
          />
          Show Variance
        </label>

        {/* Reset fulcrum button */}
        {fulcrumOverride !== null && (
          <button
            type="button"
            onClick={() => setFulcrumOverride(null)}
            style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-rule)',
              background: 'var(--color-paper)',
              color: 'var(--color-ink-muted)',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            Reset fulcrum
          </button>
        )}

        {/* Custom mode hint */}
        {preset === 'custom' && (
          <span
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              color: 'var(--color-ink-faint)',
            }}
          >
            Drag blocks to change probabilities
          </span>
        )}
      </div>
    </div>
  );
}
