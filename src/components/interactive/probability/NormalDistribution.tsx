import { useState, useMemo, useRef, useEffect } from 'react';

interface NormalDistributionProps {
  initialMu?: number;
  initialSigma?: number;
  width?: number;
  height?: number;
}

function normalPDF(x: number, mu: number, sigma: number): number {
  const coeff = 1 / (sigma * Math.sqrt(2 * Math.PI));
  const exp = -0.5 * Math.pow((x - mu) / sigma, 2);
  return coeff * Math.exp(exp);
}

export function NormalDistribution({
  initialMu = 0,
  initialSigma = 1,
  width = 640,
  height = 360,
}: NormalDistributionProps) {
  const [mu, setMu] = useState(initialMu);
  const [sigma, setSigma] = useState(initialSigma);
  const [samples, setSamples] = useState<number[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const xMin = mu - 4 * sigma;
  const xMax = mu + 4 * sigma;
  const yMax = normalPDF(mu, mu, sigma) * 1.15;

  const scaleX = (x: number) => padding.left + ((x - xMin) / (xMax - xMin)) * plotW;
  const scaleY = (y: number) => padding.top + plotH - (y / yMax) * plotH;

  const curvePath = useMemo(() => {
    const points: string[] = [];
    const steps = 200;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin);
      const y = normalPDF(x, mu, sigma);
      const px = scaleX(x).toFixed(2);
      const py = scaleY(y).toFixed(2);
      points.push(i === 0 ? `M${px},${py}` : `L${px},${py}`);
    }
    return points.join(' ');
  }, [mu, sigma, width, height]);

  const fillPath = useMemo(() => {
    return `${curvePath} L${scaleX(xMax).toFixed(2)},${scaleY(0).toFixed(2)} L${scaleX(xMin).toFixed(2)},${scaleY(0).toFixed(2)} Z`;
  }, [curvePath, mu, sigma, width, height]);

  const addSamples = (n: number) => {
    const newSamples: number[] = [];
    for (let i = 0; i < n; i++) {
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      newSamples.push(mu + sigma * z);
    }
    setSamples((prev) => [...prev, ...newSamples].slice(-500));
  };

  const histogramBars = useMemo(() => {
    if (samples.length === 0) return [];
    const bins = 40;
    const binWidth = (xMax - xMin) / bins;
    const counts = new Array(bins).fill(0);
    for (const s of samples) {
      const idx = Math.floor((s - xMin) / binWidth);
      if (idx >= 0 && idx < bins) counts[idx]++;
    }
    const maxCount = Math.max(...counts);
    return counts.map((c, i) => ({
      x: scaleX(xMin + i * binWidth),
      y: scaleY((c / maxCount) * yMax * 0.9),
      w: (plotW / bins) - 1,
      h: scaleY(0) - scaleY((c / maxCount) * yMax * 0.9),
    }));
  }, [samples, mu, sigma, width, height]);

  const axisTicks = useMemo(() => {
    const ticks: number[] = [];
    const step = sigma;
    for (let x = Math.ceil(xMin / step) * step; x <= xMax; x += step) {
      ticks.push(Math.round(x * 100) / 100);
    }
    return ticks;
  }, [xMin, xMax, sigma]);

  return (
    <div className="flex h-full w-full flex-col">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ background: 'var(--color-paper)', maxHeight: '100%' }}
      >
        {/* Histogram bars */}
        {histogramBars.map((bar, i) => (
          <rect
            key={i}
            x={bar.x}
            y={bar.y}
            width={bar.w}
            height={bar.h}
            fill="var(--color-vector-blue)"
            opacity={0.2}
          />
        ))}

        {/* Filled area under curve */}
        <path d={fillPath} fill="var(--color-vector-blue)" opacity={0.08} />

        {/* Curve */}
        <path
          d={curvePath}
          fill="none"
          stroke="var(--color-vector-blue)"
          strokeWidth={2.5}
        />

        {/* Axes */}
        <line
          x1={padding.left} y1={scaleY(0)}
          x2={width - padding.right} y2={scaleY(0)}
          stroke="var(--color-ink-faint)"
          strokeWidth={1}
        />

        {/* X-axis ticks */}
        {axisTicks.map((t) => (
          <g key={t}>
            <line x1={scaleX(t)} y1={scaleY(0)} x2={scaleX(t)} y2={scaleY(0) + 5} stroke="var(--color-ink-faint)" />
            <text x={scaleX(t)} y={scaleY(0) + 18} textAnchor="middle" className="text-[10px]" fill="var(--color-ink-faint)" style={{ fontFamily: 'var(--font-mono)' }}>{t}</text>
          </g>
        ))}

        {/* Mu indicator */}
        <line x1={scaleX(mu)} y1={padding.top} x2={scaleX(mu)} y2={scaleY(0)} stroke="var(--color-accent)" strokeWidth={1} strokeDasharray="4,3" />
        <text x={scaleX(mu)} y={padding.top - 5} textAnchor="middle" className="text-[11px] font-medium" fill="var(--color-accent)" style={{ fontFamily: 'var(--font-sans)' }}>μ = {mu.toFixed(1)}</text>

        {/* Sigma brackets */}
        <line x1={scaleX(mu - sigma)} y1={scaleY(0) + 28} x2={scaleX(mu + sigma)} y2={scaleY(0) + 28} stroke="var(--color-vector-green)" strokeWidth={1.5} markerStart="url(#sigma-cap)" markerEnd="url(#sigma-cap)" />
        <text x={scaleX(mu)} y={scaleY(0) + 38} textAnchor="middle" className="text-[10px]" fill="var(--color-vector-green)" style={{ fontFamily: 'var(--font-mono)' }}>σ = {sigma.toFixed(1)}</text>

        <defs>
          <marker id="sigma-cap" markerWidth="1" markerHeight="8" refX="0.5" refY="4" orient="auto">
            <line x1="0.5" y1="0" x2="0.5" y2="8" stroke="var(--color-vector-green)" strokeWidth="1.5" />
          </marker>
        </defs>
      </svg>

      {/* Controls */}
      <div className="flex items-center gap-4 border-t border-rule bg-paper-elevated px-4 py-3">
        <label className="flex items-center gap-2 font-sans text-xs text-ink-muted">
          μ
          <input
            type="range"
            min={-3}
            max={3}
            step={0.1}
            value={mu}
            onChange={(e) => { setMu(+e.target.value); setSamples([]); }}
            className="h-1 w-20 cursor-pointer accent-[var(--color-accent)]"
          />
          <span className="font-mono text-xs text-ink w-8">{mu.toFixed(1)}</span>
        </label>
        <label className="flex items-center gap-2 font-sans text-xs text-ink-muted">
          σ
          <input
            type="range"
            min={0.3}
            max={3}
            step={0.1}
            value={sigma}
            onChange={(e) => { setSigma(+e.target.value); setSamples([]); }}
            className="h-1 w-20 cursor-pointer accent-[var(--color-accent)]"
          />
          <span className="font-mono text-xs text-ink w-8">{sigma.toFixed(1)}</span>
        </label>
        <button
          type="button"
          onClick={() => addSamples(50)}
          className="ml-auto rounded-sm border border-rule bg-paper-elevated px-3 py-1 font-sans text-xs text-ink-muted hover:bg-surface-1 hover:text-ink transition-colors duration-fast"
        >
          Sample +50
        </button>
        {samples.length > 0 && (
          <span className="font-mono text-[10px] text-ink-faint">{samples.length} samples</span>
        )}
      </div>
    </div>
  );
}
