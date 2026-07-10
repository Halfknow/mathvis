import { useState, useMemo, useCallback } from 'react';

interface SamplingAnimationProps {
  width?: number;
  height?: number;
}

type DistributionType = 'uniform' | 'exponential' | 'bimodal';

interface DistSpec {
  mu: number;
  sigma2: number;
  sample: () => number;
  pdf: (x: number) => number;
  xMin: number;
  xMax: number;
  label: string;
}

const SAMPLE_SIZES = [1, 2, 5, 10, 30, 50, 100];

function normalPDF(x: number, mu: number, sigma: number): number {
  const coeff = 1 / (sigma * Math.sqrt(2 * Math.PI));
  const exp = -0.5 * Math.pow((x - mu) / sigma, 2);
  return coeff * Math.exp(exp);
}

function boxMullerNormal(mu: number, sigma: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mu + sigma * z;
}

const DISTRIBUTIONS: Record<DistributionType, DistSpec> = {
  uniform: {
    mu: 0.5,
    sigma2: 1 / 12,
    sample: () => Math.random(),
    pdf: (x) => (x >= 0 && x <= 1 ? 1 : 0),
    xMin: 0,
    xMax: 1,
    label: 'Uniform [0,1]',
  },
  exponential: {
    mu: 1,
    sigma2: 1,
    sample: () => -Math.log(Math.random()),
    pdf: (x) => (x >= 0 ? Math.exp(-x) : 0),
    xMin: 0,
    xMax: 6,
    label: 'Exponential (λ=1)',
  },
  bimodal: {
    mu: 5,
    sigma2: 9.25,
    sample: () => (Math.random() < 0.5 ? boxMullerNormal(2, 0.5) : boxMullerNormal(8, 0.5)),
    pdf: (x) => 0.5 * normalPDF(x, 2, 0.5) + 0.5 * normalPDF(x, 8, 0.5),
    xMin: 0,
    xMax: 10,
    label: 'Bimodal',
  },
};

export function SamplingAnimation({
  width = 640,
  height = 400,
}: SamplingAnimationProps) {
  const [distType, setDistType] = useState<DistributionType>('uniform');
  const [sampleSize, setSampleSize] = useState(30);
  const [sampleMeans, setSampleMeans] = useState<number[]>([]);

  const dist = DISTRIBUTIONS[distType];

  // Theoretical CLT parameters
  const cltMu = dist.mu;
  const cltSigma = Math.sqrt(dist.sigma2 / sampleSize);

  // Histogram range: centered on theoretical mean, ±4 theoretical SDs
  // but always wide enough to see the distribution
  const rangeHalf = Math.max(4 * cltSigma, dist.sigma2 * 0.5);
  const histXMin = cltMu - rangeHalf;
  const histXMax = cltMu + rangeHalf;

  // Layout constants
  const padding = { top: 24, right: 20, bottom: 44, left: 50 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const sx = (x: number) => padding.left + ((x - histXMin) / (histXMax - histXMin)) * plotW;

  const numBins = 40;
  const binWidth = (histXMax - histXMin) / numBins;

  // Compute histogram and determine y-max
  const histogram = useMemo(() => {
    if (sampleMeans.length === 0) {
      return { counts: new Array(numBins).fill(0) as number[], densityMax: 0 };
    }
    const counts = new Array(numBins).fill(0) as number[];
    for (const m of sampleMeans) {
      const idx = Math.floor((m - histXMin) / binWidth);
      if (idx >= 0 && idx < numBins) counts[idx]++;
    }
    // Convert counts to density: density = count / (total * binWidth)
    const densities = counts.map((c) => c / (sampleMeans.length * binWidth));
    const densityMax = Math.max(...densities);
    return { counts, densityMax };
  }, [sampleMeans, histXMin, binWidth, numBins]);

  function histYMax(): number {
    const pdfMax = normalPDF(cltMu, cltMu, cltSigma);
    const dataMax = histogram.densityMax || 0;
    return Math.max(pdfMax, dataMax) * 1.15;
  }

  // Histogram bar geometry
  const bars = useMemo(() => {
    const yMax = histYMax();
    return histogram.counts.map((count, i) => {
      const density = sampleMeans.length > 0 ? count / (sampleMeans.length * binWidth) : 0;
      const barH = (density / yMax) * plotH;
      return {
        x: sx(histXMin + i * binWidth),
        y: padding.top + plotH - barH,
        w: Math.max((plotW / numBins) - 1, 1),
        h: barH,
      };
    });
  }, [histogram, sampleMeans.length, histXMin, binWidth, numBins, plotW, plotH, cltMu, cltSigma, histXMax]);

  // Normal curve overlay path
  const normalCurvePath = useMemo(() => {
    const yMax = histYMax();
    const localSy = (y: number) => padding.top + plotH - (y / yMax) * plotH;
    const points: string[] = [];
    const steps = 200;
    for (let i = 0; i <= steps; i++) {
      const x = histXMin + (i / steps) * (histXMax - histXMin);
      const y = normalPDF(x, cltMu, cltSigma);
      const px = sx(x).toFixed(2);
      const py = localSy(y).toFixed(2);
      points.push(i === 0 ? `M${px},${py}` : `L${px},${py}`);
    }
    return points.join(' ');
  }, [histXMin, histXMax, cltMu, cltSigma, width, height]);

  // Source distribution inset path
  const insetPath = useMemo(() => {
    const insetPad = 4;
    const insetW = 120;
    const insetH = 60;
    const insetLeft = padding.left + insetPad;
    const insetTop = padding.top + insetPad;

    // Find PDF max for scaling
    let pdfMax = 0;
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const x = dist.xMin + (i / steps) * (dist.xMax - dist.xMin);
      pdfMax = Math.max(pdfMax, dist.pdf(x));
    }
    pdfMax = pdfMax * 1.1 || 1;

    const pts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const x = dist.xMin + (i / steps) * (dist.xMax - dist.xMin);
      const y = dist.pdf(x);
      const px = (insetLeft + (x - dist.xMin) / (dist.xMax - dist.xMin) * insetW).toFixed(2);
      const py = (insetTop + insetH - (y / pdfMax) * insetH).toFixed(2);
      pts.push(i === 0 ? `M${px},${py}` : `L${px},${py}`);
    }
    return { path: pts.join(' '), left: insetLeft, top: insetTop, w: insetW, h: insetH };
  }, [distType, dist, padding]);

  // X-axis ticks
  const axisTicks = useMemo(() => {
    const ticks: number[] = [];
    const rawStep = (histXMax - histXMin) / 6;
    // Round step to a nice value
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const niceFractions = [1, 2, 2.5, 5, 10];
    let step = mag;
    for (const f of niceFractions) {
      if (f * mag >= rawStep) { step = f * mag; break; }
    }
    for (let x = Math.ceil(histXMin / step) * step; x <= histXMax; x += step) {
      ticks.push(Math.round(x * 10000) / 10000);
    }
    return ticks;
  }, [histXMin, histXMax]);

  // Sampling functions
  const drawOneSample = useCallback(() => {
    let sum = 0;
    for (let i = 0; i < sampleSize; i++) {
      sum += dist.sample();
    }
    return sum / sampleSize;
  }, [distType, sampleSize]);

  const drawSamples = useCallback((count: number) => {
    const newMeans: number[] = [];
    for (let i = 0; i < count; i++) {
      newMeans.push(drawOneSample());
    }
    setSampleMeans((prev) => [...prev, ...newMeans]);
  }, [drawOneSample]);

  const handleDraw100 = useCallback(() => {
    // Batch all at once for a rapid animation feel
    drawSamples(100);
  }, [drawSamples]);

  const reset = useCallback(() => {
    setSampleMeans([]);
  }, []);

  // Computed statistics
  const stats = useMemo(() => {
    if (sampleMeans.length === 0) return null;
    const sum = sampleMeans.reduce((a, b) => a + b, 0);
    const mean = sum / sampleMeans.length;
    return { mean };
  }, [sampleMeans]);

  // Stats panel text
  const sampleMeanStr = stats ? stats.mean.toFixed(4) : '—';
  const nStr = sampleMeans.length.toLocaleString();
  const muStr = cltMu.toFixed(4);
  const seStr = cltSigma.toFixed(4);

  return (
    <div className="flex h-full w-full flex-col">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ background: 'var(--color-paper)', maxHeight: '100%' }}
      >
        {/* Histogram bars */}
        {bars.map((bar, i) =>
          bar.h > 0 ? (
            <rect
              key={i}
              x={bar.x}
              y={bar.y}
              width={bar.w}
              height={bar.h}
              fill="var(--color-vector-blue)"
              opacity={0.6}
            />
          ) : null
        )}

        {/* Normal curve overlay */}
        <path
          d={normalCurvePath}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={2.5}
          opacity={0.9}
        />

        {/* X-axis */}
        <line
          x1={padding.left}
          y1={padding.top + plotH}
          x2={width - padding.right}
          y2={padding.top + plotH}
          stroke="var(--color-ink-faint)"
          strokeWidth={1}
        />

        {/* X-axis ticks */}
        {axisTicks.map((t) => {
          const tx = sx(t);
          const baseline = padding.top + plotH;
          return (
            <g key={t}>
              <line
                x1={tx}
                y1={baseline}
                x2={tx}
                y2={baseline + 5}
                stroke="var(--color-ink-faint)"
              />
              <text
                x={tx}
                y={baseline + 18}
                textAnchor="middle"
                className="text-[10px]"
                fill="var(--color-ink-faint)"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {t.toFixed(2)}
              </text>
            </g>
          );
        })}

        {/* Theoretical mean line */}
        <line
          x1={sx(cltMu)}
          y1={padding.top}
          x2={sx(cltMu)}
          y2={padding.top + plotH}
          stroke="var(--color-accent)"
          strokeWidth={1}
          strokeDasharray="4,3"
          opacity={0.6}
        />

        {/* Source distribution inset */}
        <g>
          {/* Inset background */}
          <rect
            x={insetPath.left - 2}
            y={insetPath.top - 2}
            width={insetPath.w + 4}
            height={insetPath.h + 16}
            rx={4}
            fill="var(--color-paper-elevated)"
            stroke="var(--color-rule)"
            strokeWidth={0.5}
          />
          {/* Inset curve */}
          <path
            d={insetPath.path}
            fill="none"
            stroke="var(--color-vector-green)"
            strokeWidth={1.5}
          />
          {/* Inset baseline */}
          <line
            x1={insetPath.left}
            y1={insetPath.top + insetPath.h}
            x2={insetPath.left + insetPath.w}
            y2={insetPath.top + insetPath.h}
            stroke="var(--color-ink-faint)"
            strokeWidth={0.5}
          />
          {/* Inset label */}
          <text
            x={insetPath.left + insetPath.w / 2}
            y={insetPath.top + insetPath.h + 12}
            textAnchor="middle"
            className="text-[8px]"
            fill="var(--color-ink-faint)"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            source: {dist.label}
          </text>
        </g>

        {/* Legend */}
        <g>
          <rect
            x={width - padding.right - 130}
            y={padding.top + 4}
            width={126}
            height={40}
            rx={4}
            fill="var(--color-paper-elevated)"
            stroke="var(--color-rule)"
            strokeWidth={0.5}
          />
          <rect
            x={width - padding.right - 122}
            y={padding.top + 12}
            width={14}
            height={8}
            fill="var(--color-vector-blue)"
            opacity={0.6}
          />
          <text
            x={width - padding.right - 104}
            y={padding.top + 20}
            className="text-[9px]"
            fill="var(--color-ink-muted)"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            sample means
          </text>
          <line
            x1={width - padding.right - 122}
            y1={padding.top + 32}
            x2={width - padding.right - 108}
            y2={padding.top + 32}
            stroke="var(--color-accent)"
            strokeWidth={2}
          />
          <text
            x={width - padding.right - 104}
            y={padding.top + 36}
            className="text-[9px]"
            fill="var(--color-ink-muted)"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            CLT normal
          </text>
        </g>

        {/* Title */}
        <text
          x={width / 2}
          y={14}
          textAnchor="middle"
          className="text-[11px] font-medium"
          fill="var(--color-ink)"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Central Limit Theorem — Distribution of Sample Means
        </text>
      </svg>

      {/* Controls panel */}
      <div className="flex flex-col gap-0 border-t border-rule bg-paper-elevated">
        {/* Top row: distribution selector + sample size */}
        <div className="flex flex-wrap items-center gap-3 px-4 py-2">
          {/* Distribution selector */}
          <div className="flex gap-1">
            {(Object.keys(DISTRIBUTIONS) as DistributionType[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => { setDistType(d); setSampleMeans([]); }}
                className={`rounded-sm border px-2 py-0.5 font-sans text-[11px] transition-colors ${
                  d === distType
                    ? 'border-accent bg-accent-soft text-accent'
                    : 'border-rule bg-paper-elevated text-ink-muted hover:bg-surface-1'
                }`}
              >
                {DISTRIBUTIONS[d].label}
              </button>
            ))}
          </div>

          {/* Sample size slider */}
          <label className="flex items-center gap-2 font-sans text-xs text-ink-muted">
            n =
            <div className="flex gap-0.5">
              {SAMPLE_SIZES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setSampleSize(s); setSampleMeans([]); }}
                  className={`rounded-sm px-1.5 py-0.5 font-mono text-[10px] transition-colors ${
                    s === sampleSize
                      ? 'bg-accent text-white'
                      : 'text-ink-muted hover:bg-surface-1'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </label>
        </div>

        {/* Bottom row: action buttons + stats */}
        <div className="flex flex-wrap items-center gap-3 border-t border-rule px-4 py-2">
          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => drawSamples(1)}
              className="rounded-sm border border-rule bg-paper-elevated px-3 py-1 font-sans text-xs text-ink-muted hover:bg-surface-1 hover:text-ink transition-colors"
            >
              Draw 1
            </button>
            <button
              type="button"
              onClick={handleDraw100}
              className="rounded-sm border border-accent bg-accent-soft px-3 py-1 font-sans text-xs text-accent hover:bg-accent hover:text-white transition-colors"
            >
              Draw 100
            </button>
            <button
              type="button"
              onClick={reset}
              className="rounded-sm border border-rule bg-paper-elevated px-3 py-1 font-sans text-xs text-ink-faint hover:bg-surface-1 hover:text-ink transition-colors"
            >
              Reset
            </button>
          </div>

          {/* Statistics display */}
          <div className="ml-auto flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px]">
            <span className="text-ink-faint">
              means: <span className="text-ink-muted">{nStr}</span>
            </span>
            <span className="text-ink-faint">
              x̄̄ = <span className="text-vector-blue">{sampleMeanStr}</span>
            </span>
            <span className="text-ink-faint">
              μ = <span className="text-accent">{muStr}</span>
            </span>
            <span className="text-ink-faint">
              σ/√n = <span className="text-accent">{seStr}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
