import { useState, useMemo, useCallback } from 'react';

// ---------------------------------------------------------------------------
// CIAnimation — "dancing confidence intervals" animation
// Population: N(50, 10^2), sample from it to build CIs
// ---------------------------------------------------------------------------

interface CIAnimationProps {
  width?: number;
  height?: number;
}

interface CI {
  lower: number;
  upper: number;
  covers: boolean;
}

const MU = 50;
const SIGMA = 10;

const CONFIDENCE_LEVELS = [0.80, 0.90, 0.95, 0.99];
const SAMPLE_SIZES = [10, 25, 50, 100];

// Inverse of the standard normal CDF (approximation)
function normalQuantile(p: number): number {
  // Rational approximation for the probit function
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p === 0.5) return 0;

  const a = [
    -3.969683028665376e+01, 2.209460984245205e+02,
    -2.759285104469687e+02, 1.383577518672690e+02,
    -3.066479806614716e+01, 2.506628277459239e+00,
  ];
  const b = [
    -5.447609879822406e+01, 1.615858368580409e+02,
    -1.556989798598866e+02, 6.680131188771972e+01,
    -1.328068155288572e+01,
  ];

  const pLow = 0.02425;
  const q = Math.min(p, 1 - p);

  let r = 0.0;
  let y = 0.0;

  if (q > pLow) {
    // Rational approximation for central region
    r = q - 0.5;
    const d = r * r;
    y = r + r * (a[0] * d * (a[1] + d * (a[2] + d * (a[3] + d * (a[4] + d * a[5]))))) /
      (1 + d * (b[0] + d * (b[1] + d * (b[2] + d * (b[3] + d * b[4])))));
  } else {
    // Rational approximation for tail region
    r = Math.sqrt(-2 * Math.log(q));
    y = -(a[0] + r * (a[1] + r * (a[2] + r * (a[3] + r * (a[4] + r * a[5]))))) /
      (1 + r * (b[0] + r * (b[1] + r * (b[2] + r * (b[3] + r * b[4])))));
  }

  return p < 0.5 ? y : -y;
}

// Box-Muller normal sample
function normalSample(mu: number, sigma: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mu + sigma * z;
}

function generateCI(n: number, confidence: number): CI {
  // Sample n values from N(MU, SIGMA^2)
  let sum = 0;
  for (let i = 0; i < n; i++) {
    sum += normalSample(MU, SIGMA);
  }
  const xBar = sum / n;
  const se = SIGMA / Math.sqrt(n);
  const z = normalQuantile(1 - (1 - confidence) / 2);
  const lower = xBar - z * se;
  const upper = xBar + z * se;
  return { lower, upper, covers: lower <= MU && MU <= upper };
}

export function CIAnimation({ width = 640, height = 400 }: CIAnimationProps) {
  const [cis, setCis] = useState<CI[]>([]);
  const [confidence, setConfidence] = useState(0.95);
  const [sampleSize, setSampleSize] = useState(25);

  // Stats
  const totalCIs = cis.length;
  const coveringCIs = cis.filter(ci => ci.covers).length;
  const coverageRate = totalCIs > 0 ? coveringCIs / totalCIs : 0;

  // Layout
  const pad = { top: 24, right: 40, bottom: 44, left: 54 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  // X range: show range around MU
  const halfRange = SIGMA * 3;
  const xMin = MU - halfRange;
  const xMax = MU + halfRange;

  const sx = useCallback(
    (x: number) => pad.left + ((x - xMin) / (xMax - xMin)) * plotW,
    [pad.left, plotW, xMin, xMax],
  );

  // Y range: 0 to max(totalCIs, 10)
  const yMax = Math.max(totalCIs, 10);
  const ciHeight = plotH / yMax;

  const sy = useCallback(
    (i: number) => pad.top + i * ciHeight + ciHeight / 2,
    [pad.top, ciHeight],
  );

  // X-axis ticks
  const xTicks = useMemo(() => {
    const ticks: number[] = [];
    for (let t = Math.ceil(xMin); t <= xMax; t += 5) ticks.push(t);
    return ticks;
  }, [xMin, xMax]);

  // Add CIs
  const addCIs = useCallback(
    (count: number) => {
      const newCIs: CI[] = [];
      for (let i = 0; i < count; i++) {
        newCIs.push(generateCI(sampleSize, confidence));
      }
      setCis(prev => [...prev, ...newCIs].slice(0, 100));
    },
    [sampleSize, confidence],
  );

  const reset = useCallback(() => {
    setCis([]);
  }, []);

  // Generate all path data for CIs — using lines instead of rects for efficiency
  const ciElements = useMemo(() => {
    return cis.map((ci, i) => {
      const y = sy(i);
      const x1 = sx(ci.lower);
      const x2 = sx(ci.upper);
      const color = ci.covers ? 'var(--color-vector-green)' : 'var(--color-vector-red)';
      return { y, x1, x2, color };
    });
  }, [cis, sy, sx]);

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
        {/* Grid lines */}
        {xTicks.map((t) => (
          <line
            key={`grid-${t}`}
            x1={sx(t)} y1={pad.top}
            x2={sx(t)} y2={pad.top + plotH}
            stroke="var(--color-rule)"
            strokeWidth={0.5}
          />
        ))}

        {/* Axes */}
        <line
          x1={pad.left} y1={pad.top + plotH}
          x2={pad.left + plotW} y2={pad.top + plotH}
          stroke="var(--color-ink-faint)" strokeWidth={1}
        />
        <line
          x1={pad.left} y1={pad.top}
          x2={pad.left} y2={pad.top + plotH}
          stroke="var(--color-ink-faint)" strokeWidth={1}
        />

        {/* X tick labels */}
        {xTicks.map((t) => (
          <g key={`xt-${t}`}>
            <line
              x1={sx(t)} y1={pad.top + plotH}
              x2={sx(t)} y2={pad.top + plotH + 4}
              stroke="var(--color-ink-faint)"
            />
            <text
              x={sx(t)}
              y={pad.top + plotH + 16}
              textAnchor="middle"
              fill="var(--color-ink-faint)"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '9px' }}
            >
              {t}
            </text>
          </g>
        ))}

        {/* X-axis label */}
        <text
          x={pad.left + plotW / 2}
          y={height - 4}
          textAnchor="middle"
          fill="var(--color-ink-muted)"
          style={{ fontFamily: 'var(--font-sans)', fontSize: '11px' }}
        >
          value
        </text>

        {/* True mean line (dashed) */}
        <line
          x1={sx(MU)} y1={pad.top}
          x2={sx(MU)} y2={pad.top + plotH}
          stroke="var(--color-accent)"
          strokeWidth={2}
          strokeDasharray="6,4"
        />
        <text
          x={sx(MU)}
          y={pad.top - 6}
          textAnchor="middle"
          fill="var(--color-accent)"
          style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 600 }}
        >
          {'\u03BC'} = {MU}
        </text>

        {/* CI line segments */}
        {ciElements.map((el, i) => (
          <g key={i}>
            {/* Line segment */}
            <line
              x1={el.x1} y1={el.y}
              x2={el.x2} y2={el.y}
              stroke={el.color}
              strokeWidth={Math.max(1, ciHeight * 0.6)}
              strokeLinecap="round"
              opacity={0.8}
            />
            {/* End caps */}
            <line
              x1={el.x1} y1={el.y - ciHeight * 0.3}
              x2={el.x1} y2={el.y + ciHeight * 0.3}
              stroke={el.color}
              strokeWidth={1}
              opacity={0.8}
            />
            <line
              x1={el.x2} y1={el.y - ciHeight * 0.3}
              x2={el.x2} y2={el.y + ciHeight * 0.3}
              stroke={el.color}
              strokeWidth={1}
              opacity={0.8}
            />
          </g>
        ))}

        {/* Legend */}
        <g>
          <line
            x1={pad.left + 8} y1={pad.top + 4}
            x2={pad.left + 28} y2={pad.top + 4}
            stroke="var(--color-vector-green)" strokeWidth={3}
          />
          <text
            x={pad.left + 32} y={pad.top + 8}
            fill="var(--color-ink-muted)"
            style={{ fontFamily: 'var(--font-sans)', fontSize: '10px' }}
          >
            covers {'\u03BC'}
          </text>
          <line
            x1={pad.left + 98} y1={pad.top + 4}
            x2={pad.left + 118} y2={pad.top + 4}
            stroke="var(--color-vector-red)" strokeWidth={3}
          />
          <text
            x={pad.left + 122} y={pad.top + 8}
            fill="var(--color-ink-muted)"
            style={{ fontFamily: 'var(--font-sans)', fontSize: '10px' }}
          >
            misses {'\u03BC'}
          </text>
        </g>

        {/* Stats — top right */}
        <text
          x={width - pad.right}
          y={pad.top + 4}
          textAnchor="end"
          fill="var(--color-ink)"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
        >
          {totalCIs} CIs
        </text>
        <text
          x={width - pad.right}
          y={pad.top + 18}
          textAnchor="end"
          fill="var(--color-vector-green)"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
        >
          {coveringCIs} covering {'\u03BC'}
        </text>
        <text
          x={width - pad.right}
          y={pad.top + 32}
          textAnchor="end"
          fill="var(--color-ink-faint)"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
        >
          {'coverage: ' + (totalCIs > 0 ? (coverageRate * 100).toFixed(1) + '%' : '\u2014')}
        </text>
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
        {/* Action buttons */}
        <button
          type="button"
          onClick={() => addCIs(1)}
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
          Add 1 CI
        </button>
        <button
          type="button"
          onClick={() => addCIs(25)}
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
          Add 25 CIs
        </button>
        <button
          type="button"
          onClick={reset}
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
          Reset
        </button>

        {/* Separator */}
        <div style={{ width: '1px', height: '20px', background: 'var(--color-rule)' }} />

        {/* Confidence level selector */}
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            color: 'var(--color-ink-faint)',
          }}
        >
          Confidence:
        </span>
        {CONFIDENCE_LEVELS.map((cl) => (
          <button
            key={cl}
            type="button"
            onClick={() => { setConfidence(cl); reset(); }}
            style={{
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: confidence === cl ? 'var(--color-accent)' : 'var(--color-rule)',
              background: confidence === cl ? 'var(--color-accent-soft)' : 'var(--color-paper)',
              color: confidence === cl ? 'var(--color-accent)' : 'var(--color-ink-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: confidence === cl ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {(cl * 100).toFixed(0)}%
          </button>
        ))}

        {/* Separator */}
        <div style={{ width: '1px', height: '20px', background: 'var(--color-rule)' }} />

        {/* Sample size selector */}
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            color: 'var(--color-ink-faint)',
          }}
        >
          n:
        </span>
        {SAMPLE_SIZES.map((sz) => (
          <button
            key={sz}
            type="button"
            onClick={() => { setSampleSize(sz); reset(); }}
            style={{
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: sampleSize === sz ? 'var(--color-accent)' : 'var(--color-rule)',
              background: sampleSize === sz ? 'var(--color-accent-soft)' : 'var(--color-paper)',
              color: sampleSize === sz ? 'var(--color-accent)' : 'var(--color-ink-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: sampleSize === sz ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {sz}
          </button>
        ))}
      </div>
    </div>
  );
}
