import { useState, useMemo, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DistType = 'bernoulli' | 'binomial' | 'poisson';

interface DiscreteDistVisProps {
  width?: number;   // default 640
  height?: number;  // default 360
  initialDist?: DistType;
}

interface BarData {
  x: number;
  prob: number;
}

// ---------------------------------------------------------------------------
// Math helpers — no external dependencies
// ---------------------------------------------------------------------------

/** Binomial coefficient C(n, k) = n! / (k! * (n-k)!) */
function binomCoeff(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  // Use the smaller side for efficiency
  let kEff = k;
  if (kEff > n - kEff) kEff = n - kEff;
  let result = 1;
  for (let i = 0; i < kEff; i++) {
    result = (result * (n - i)) / (i + 1);
  }
  return result;
}

/** Bernoulli PMF: P(X=k) = p^k * (1-p)^(1-k), k in {0,1} */
function bernoulliPMF(k: number, p: number): number {
  if (k === 0) return 1 - p;
  if (k === 1) return p;
  return 0;
}

/** Binomial PMF: P(X=k) = C(n,k) * p^k * (1-p)^(n-k) */
function binomialPMF(k: number, n: number, p: number): number {
  if (k < 0 || k > n) return 0;
  return binomCoeff(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

/** Poisson PMF: P(X=k) = lambda^k * e^(-lambda) / k!
 *  Computed iteratively to avoid overflow. */
function poissonPMF(k: number, lambda: number): number {
  if (k < 0 || lambda <= 0) return 0;
  // Build up iteratively: P(0) = e^(-lambda), P(k) = P(k-1) * lambda / k
  let prob = Math.exp(-lambda);
  for (let i = 1; i <= k; i++) {
    prob *= lambda / i;
  }
  return prob;
}

/** Generate bars for the chosen distribution */
function generateBars(dist: DistType, p: number, n: number, lambda: number): BarData[] {
  const bars: BarData[] = [];

  if (dist === 'bernoulli') {
    bars.push({ x: 0, prob: bernoulliPMF(0, p) });
    bars.push({ x: 1, prob: bernoulliPMF(1, p) });
  } else if (dist === 'binomial') {
    for (let k = 0; k <= n; k++) {
      bars.push({ x: k, prob: binomialPMF(k, n, p) });
    }
  } else {
    // Poisson — extend until probability drops below threshold (cap at 80 bars)
    for (let k = 0; k < 80; k++) {
      const prob = poissonPMF(k, lambda);
      bars.push({ x: k, prob });
      if (prob < 0.001 && k > lambda) break; // go past the mean before stopping
    }
  }

  return bars;
}

/** Compute E[X] and Var(X) analytically */
function computeMoments(dist: DistType, p: number, n: number, lambda: number): { mean: number; variance: number } {
  if (dist === 'bernoulli') {
    return { mean: p, variance: p * (1 - p) };
  } else if (dist === 'binomial') {
    return { mean: n * p, variance: n * p * (1 - p) };
  } else {
    return { mean: lambda, variance: lambda };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DiscreteDistVis({
  width = 640,
  height = 360,
  initialDist = 'binomial',
}: DiscreteDistVisProps) {
  // State — distribution type
  const [dist, setDist] = useState<DistType>(initialDist);

  // State — parameters
  const [p, setP] = useState(0.5);
  const [n, setN] = useState(10);
  const [lambda, setLambda] = useState(4);

  // State — UI toggles
  const [showMean, setShowMean] = useState(true);
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Derived data
  const bars = useMemo(() => generateBars(dist, p, n, lambda), [dist, p, n, lambda]);
  const moments = useMemo(() => computeMoments(dist, p, n, lambda), [dist, p, n, lambda]);

  // Layout constants
  const padding = { top: 30, right: 24, bottom: 50, left: 54 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const maxProb = useMemo(() => {
    const m = Math.max(...bars.map((b) => b.prob), 0.01);
    return m * 1.15; // headroom
  }, [bars]);

  const barCount = bars.length;
  // Adaptive gap: shrinks for many bars so they always fit. Max 4px, min 0.5px.
  const maxGap = 4;
  const idealGap = plotW / barCount * 0.12;
  const barGap = Math.max(0.5, Math.min(maxGap, idealGap));
  const barWidth = Math.max(1, (plotW - barGap * (barCount + 1)) / barCount);

  // Scales
  const scaleY = useCallback(
    (y: number) => padding.top + plotH - (y / maxProb) * plotH,
    [padding.top, plotH, maxProb],
  );

  // X position for bar k — evenly spaced
  const barX = useCallback(
    (k: number) => padding.left + barGap + k * (barWidth + barGap),
    [padding.left, barGap, barWidth],
  );

  // Map a continuous x-value (integer or float) to pixel x-coordinate.
  // Centers each bar at barX(i) + barWidth/2, then interpolates linearly.
  const scaleXValue = useCallback(
    (xVal: number): number => {
      if (barCount <= 1) return barX(0) + barWidth / 2;
      // Map the x-domain [bars[0].x .. bars[barCount-1].x] to pixel range
      const xFirst = bars[0].x;
      const xLast = bars[barCount - 1].x;
      const fraction = (xVal - xFirst) / (xLast - xFirst || 1);
      const pixelFirst = barX(0) + barWidth / 2;
      const pixelLast = barX(barCount - 1) + barWidth / 2;
      return pixelFirst + fraction * (pixelLast - pixelFirst);
    },
    [barCount, barX, barWidth, bars],
  );

  // Tick positions along the x-axis — show every label for small counts, otherwise every few
  const xTicks = useMemo(() => {
    if (barCount <= 16) return bars.map((b) => b.x);
    const step = Math.ceil(barCount / 15);
    return bars.filter((b) => b.x % step === 0).map((b) => b.x);
  }, [bars, barCount]);

  // Y-axis ticks
  const yTicks = useMemo(() => {
    const rawStep = maxProb / 5;
    // Round to a nice step
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const normalized = rawStep / mag;
    let niceStep: number;
    if (normalized <= 1) niceStep = 1 * mag;
    else if (normalized <= 2) niceStep = 2 * mag;
    else if (normalized <= 5) niceStep = 5 * mag;
    else niceStep = 10 * mag;

    const ticks: number[] = [];
    for (let v = 0; v <= maxProb; v += niceStep) {
      ticks.push(Math.round(v * 10000) / 10000);
    }
    return ticks;
  }, [maxProb]);

  // Label for distribution selector
  const distLabels: { key: DistType; label: string }[] = [
    { key: 'bernoulli', label: 'Bernoulli' },
    { key: 'binomial', label: 'Binomial' },
    { key: 'poisson', label: 'Poisson' },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* ---- Chart ---- */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{
          width: '100%',
          background: 'var(--color-paper)',
          borderRadius: 'var(--radius-sm)',
          display: 'block',
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Y-axis ticks & gridlines */}
        {yTicks.map((t) => (
          <g key={`y-${t}`}>
            <line
              x1={padding.left}
              y1={scaleY(t)}
              x2={width - padding.right}
              y2={scaleY(t)}
              stroke="var(--color-rule)"
              strokeWidth={0.5}
            />
            <text
              x={padding.left - 6}
              y={scaleY(t) + 3}
              textAnchor="end"
              fill="var(--color-ink-faint)"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}
            >
              {t.toFixed(t >= 0.1 ? 2 : 3)}
            </text>
          </g>
        ))}

        {/* X-axis base line */}
        <line
          x1={padding.left}
          y1={scaleY(0)}
          x2={width - padding.right}
          y2={scaleY(0)}
          stroke="var(--color-ink-faint)"
          strokeWidth={1}
        />

        {/* Y-axis base line */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={scaleY(0)}
          stroke="var(--color-ink-faint)"
          strokeWidth={1}
        />

        {/* Bars */}
        {bars.map((bar, i) => {
          const bx = barX(i);
          const barH = (bar.prob / maxProb) * plotH;
          const by = scaleY(bar.prob);
          const isHovered = hoveredBar === i;

          return (
            <g key={bar.x}>
              <rect
                x={bx}
                y={by}
                width={barWidth}
                height={barH}
                fill="var(--color-vector-blue)"
                opacity={isHovered ? 0.95 : 0.7}
                style={{ transition: 'height 0.3s ease, y 0.3s ease, opacity 0.15s ease' }}
                rx={1}
                onMouseEnter={() => setHoveredBar(i)}
                onMouseLeave={() => setHoveredBar(null)}
              />
            </g>
          );
        })}

        {/* X-axis tick labels */}
        {xTicks.map((tick) => {
          const cx = scaleXValue(tick);
          return (
            <g key={`xtick-${tick}`}>
              <line
                x1={cx}
                y1={scaleY(0)}
                x2={cx}
                y2={scaleY(0) + 4}
                stroke="var(--color-ink-faint)"
                strokeWidth={1}
              />
              <text
                x={cx}
                y={scaleY(0) + 16}
                textAnchor="middle"
                fill="var(--color-ink-faint)"
                style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Mean indicator (dashed vertical line) */}
        {showMean && (() => {
          const meanPx = scaleXValue(moments.mean);
          return (
            <>
              <line
                x1={meanPx}
                y1={padding.top}
                x2={meanPx}
                y2={scaleY(0)}
                stroke="var(--color-accent)"
                strokeWidth={1.5}
                strokeDasharray="5,4"
                style={{ transition: 'all 0.3s ease' }}
              />
              <text
                x={meanPx}
                y={padding.top - 8}
                textAnchor="middle"
                fill="var(--color-accent)"
                style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 500 }}
              >
                E[X] = {Number.isInteger(moments.mean) ? moments.mean : moments.mean.toFixed(2)}
              </text>
            </>
          );
        })()}

        {/* Hovered bar tooltip */}
        {hoveredBar !== null && bars[hoveredBar] && (
          <g>
            <rect
              x={barX(hoveredBar) + barWidth / 2 - 42}
              y={scaleY(bars[hoveredBar].prob) - 24}
              width={84}
              height={20}
              rx={4}
              fill="var(--color-paper-elevated)"
              stroke="var(--color-rule)"
              strokeWidth={0.5}
            />
            <text
              x={barX(hoveredBar) + barWidth / 2}
              y={scaleY(bars[hoveredBar].prob) - 10}
              textAnchor="middle"
              fill="var(--color-ink)"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
            >
              P({bars[hoveredBar].x}) = {bars[hoveredBar].prob.toFixed(4)}
            </text>
          </g>
        )}

        {/* E[X] and Var(X) annotations — bottom-right */}
        <text
          x={width - padding.right}
          y={padding.top + 4}
          textAnchor="end"
          fill="var(--color-vector-green)"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
        >
          Var(X) = {Number.isInteger(moments.variance) ? moments.variance : moments.variance.toFixed(3)}
        </text>
      </svg>

      {/* ---- Controls panel ---- */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '12px',
          borderTop: '1px solid var(--color-rule)',
          background: 'var(--color-paper-elevated)',
          padding: '10px 16px',
          borderRadius: '0 0 var(--radius-sm) var(--radius-sm)',
        }}
      >
        {/* Distribution type selector */}
        {distLabels.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => setDist(d.key)}
            style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: dist === d.key ? 'var(--color-accent)' : 'var(--color-rule)',
              background: dist === d.key ? 'var(--color-accent-soft)' : 'var(--color-paper)',
              color: dist === d.key ? 'var(--color-accent)' : 'var(--color-ink-muted)',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              fontWeight: dist === d.key ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {d.label}
          </button>
        ))}

        {/* Separator */}
        <div
          style={{
            width: '1px',
            height: '20px',
            background: 'var(--color-rule)',
          }}
        />

        {/* Parameter sliders — conditional on distribution type */}
        {dist === 'bernoulli' && (
          <SliderControl
            label="p"
            value={p}
            min={0.01}
            max={0.99}
            step={0.01}
            displayValue={p.toFixed(2)}
            onChange={setP}
          />
        )}

        {dist === 'binomial' && (
          <>
            <SliderControl
              label="n"
              value={n}
              min={2}
              max={30}
              step={1}
              displayValue={String(n)}
              onChange={(v) => setN(Math.round(v))}
            />
            <SliderControl
              label="p"
              value={p}
              min={0.01}
              max={0.99}
              step={0.01}
              displayValue={p.toFixed(2)}
              onChange={setP}
            />
          </>
        )}

        {dist === 'poisson' && (
          <SliderControl
            label="λ"
            value={lambda}
            min={0.5}
            max={20}
            step={0.1}
            displayValue={lambda.toFixed(1)}
            onChange={setLambda}
          />
        )}

        {/* Separator */}
        <div
          style={{
            width: '1px',
            height: '20px',
            background: 'var(--color-rule)',
          }}
        />

        {/* Show mean toggle */}
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
            checked={showMean}
            onChange={(e) => setShowMean(e.target.checked)}
            style={{ accentColor: 'var(--color-accent)', cursor: 'pointer' }}
          />
          Show mean
        </label>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Slider sub-component (keeps the control panel DRY)
// ---------------------------------------------------------------------------

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onChange: (v: number) => void;
}

function SliderControl({ label, value, min, max, step, displayValue, onChange }: SliderControlProps) {
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontFamily: 'var(--font-sans)',
        fontSize: '12px',
        color: 'var(--color-ink-muted)',
      }}
    >
      {label}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          width: '72px',
          height: '4px',
          cursor: 'pointer',
          accentColor: 'var(--color-accent)',
        }}
      />
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--color-ink)',
          minWidth: '32px',
        }}
      >
        {displayValue}
      </span>
    </label>
  );
}
