import { useState, useMemo, useCallback, useRef, useEffect } from 'react';

interface LLNAnimationProps {
  width?: number;
  height?: number;
}

type DistType = 'die' | 'coin' | 'uniform';

interface DistConfig {
  label: string;
  mu: number;
  variance: number;
  yMin: number;
  yMax: number;
  sample: () => number;
  yTicks: number[];
}

const DISTRIBUTIONS: Record<DistType, DistConfig> = {
  die: {
    label: 'Fair die',
    mu: 3.5,
    variance: 35 / 12,
    yMin: 0.5,
    yMax: 6.5,
    sample: () => Math.floor(Math.random() * 6) + 1,
    yTicks: [1, 2, 3, 3.5, 4, 5, 6],
  },
  coin: {
    label: 'Biased coin (p=0.3)',
    mu: 0.3,
    variance: 0.3 * (1 - 0.3),
    yMin: -0.05,
    yMax: 1.05,
    sample: () => (Math.random() < 0.3 ? 1 : 0),
    yTicks: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
  },
  uniform: {
    label: 'Uniform [0,1]',
    mu: 0.5,
    variance: 1 / 12,
    yMin: -0.05,
    yMax: 1.05,
    sample: () => Math.random(),
    yTicks: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],
  },
};

const PADDING = { top: 24, right: 20, bottom: 36, left: 48 };

export function LLNAnimation({ width = 640, height = 360 }: LLNAnimationProps) {
  const [distType, setDistType] = useState<DistType>('die');
  const [samples, setSamples] = useState<number[]>([]);
  const [runningAverages, setRunningAverages] = useState<number[]>([]);
  const dist = DISTRIBUTIONS[distType];
  const { mu, variance } = dist;

  const plotW = width - PADDING.left - PADDING.right;
  const plotH = height - PADDING.top - PADDING.bottom;

  // Current stats
  const n = samples.length;
  const currentAvg = n > 0 ? runningAverages[n - 1] : 0;
  const deviation = n > 0 ? Math.abs(currentAvg - mu) : 0;
  const converged = deviation < 0.01 && n > 0;

  // X-axis: 0 to max(n, 20) so the chart never looks empty
  const xMax = Math.max(n, 20);
  const { yMin, yMax } = dist;

  // Scale functions
  const sx = useCallback(
    (x: number) => PADDING.left + (x / xMax) * plotW,
    [xMax, plotW],
  );
  const sy = useCallback(
    (y: number) => PADDING.top + plotH - ((y - yMin) / (yMax - yMin)) * plotH,
    [yMin, yMax, plotH],
  );

  // Generate x-axis tick values
  const xTicks = useMemo(() => {
    if (n <= 0) return [];
    const rawStep = xMax / 5;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const residual = rawStep / magnitude;
    let step: number;
    if (residual <= 1.5) step = magnitude;
    else if (residual <= 3.5) step = 2 * magnitude;
    else if (residual <= 7.5) step = 5 * magnitude;
    else step = 10 * magnitude;
    step = Math.max(step, 1);
    const ticks: number[] = [];
    for (let t = step; t <= xMax; t += step) {
      ticks.push(Math.round(t));
    }
    return ticks;
  }, [n, xMax]);

  // Downsample running averages for SVG path when n is large
  const { linePath, bandUpperPath, bandLowerPath, fillPath } = useMemo(() => {
    if (n === 0) return { linePath: '', bandUpperPath: '', bandLowerPath: '', fillPath: '' };

    // Downsample to at most 600 points for SVG performance
    const maxPoints = 600;
    const step = n <= maxPoints ? 1 : Math.ceil(n / maxPoints);
    const indices: number[] = [];
    for (let i = 0; i < n; i += step) {
      indices.push(i);
    }
    // Always include the last point
    if (indices[indices.length - 1] !== n - 1) {
      indices.push(n - 1);
    }

    const lineParts: string[] = [];
    const upperParts: string[] = [];
    const lowerParts: string[] = [];

    for (let j = 0; j < indices.length; j++) {
      const idx = indices[j];
      const sampleNum = idx + 1;
      const avg = runningAverages[idx];
      const sigma_n = Math.sqrt(variance / sampleNum);
      const px = sx(sampleNum).toFixed(2);
      const pyLine = sy(avg).toFixed(2);
      const pyUpper = sy(Math.min(avg + sigma_n, yMax)).toFixed(2);
      const pyLower = sy(Math.max(avg - sigma_n, yMin)).toFixed(2);

      const cmd = j === 0 ? 'M' : 'L';
      lineParts.push(`${cmd}${px},${pyLine}`);
      upperParts.push(`${cmd}${px},${pyUpper}`);
      lowerParts.push(`${cmd}${px},${pyLower}`);
    }

    const bandFill = [...upperParts, ...lowerParts.slice().reverse()].join(' ');

    return {
      linePath: lineParts.join(' '),
      bandUpperPath: upperParts.join(' '),
      bandLowerPath: lowerParts.join(' '),
      fillPath: bandFill + ' Z',
    };
  }, [n, runningAverages, variance, sx, sy, yMin, yMax]);

  // Theoretical convergence band: mu +/- sigma/sqrt(n)
  const { theoryUpperPath, theoryLowerPath, theoryFillPath } = useMemo(() => {
    if (n === 0) return { theoryUpperPath: '', theoryLowerPath: '', theoryFillPath: '' };

    const maxPoints = 300;
    const step = Math.max(1, Math.ceil(n / maxPoints));
    const upperParts: string[] = [];
    const lowerParts: string[] = [];

    for (let i = 1; i <= n; i += step) {
      const sigma_n = Math.sqrt(variance / i);
      const px = sx(i).toFixed(2);
      const pyUpper = sy(Math.min(mu + sigma_n, yMax)).toFixed(2);
      const pyLower = sy(Math.max(mu - sigma_n, yMin)).toFixed(2);
      const cmd = i === 1 ? 'M' : 'L';
      upperParts.push(`${cmd}${px},${pyUpper}`);
      lowerParts.push(`${cmd}${px},${pyLower}`);
    }
    // Always include n
    if (n > 1) {
      const sigma_n = Math.sqrt(variance / n);
      const px = sx(n).toFixed(2);
      upperParts.push(`L${px},${sy(Math.min(mu + sigma_n, yMax)).toFixed(2)}`);
      lowerParts.push(`L${px},${sy(Math.max(mu - sigma_n, yMin)).toFixed(2)}`);
    }

    const fill = [...upperParts, ...lowerParts.slice().reverse()].join(' ') + ' Z';

    return {
      theoryUpperPath: upperParts.join(' '),
      theoryLowerPath: lowerParts.join(' '),
      theoryFillPath: fill,
    };
  }, [n, mu, variance, sx, sy, yMin, yMax]);

  // Add samples
  const addSamples = useCallback(
    (count: number) => {
      const newSamples: number[] = [];
      for (let i = 0; i < count; i++) {
        newSamples.push(dist.sample());
      }

      setSamples((prev) => {
        const all = [...prev, ...newSamples];
        const allAvgs: number[] = [];
        let sum = 0;
        for (let i = 0; i < all.length; i++) {
          sum += all[i];
          allAvgs.push(sum / (i + 1));
        }
        setRunningAverages(allAvgs);
        return all;
      });
    },
    [dist],
  );

  // Animated "Flip 10": add one sample per frame
  const animQueueRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  const animateSamples = useCallback(
    (total: number) => {
      animQueueRef.current = total;
      if (animFrameRef.current) return; // already animating

      const tick = () => {
        if (animQueueRef.current <= 0) {
          animFrameRef.current = null;
          return;
        }
        addSamples(1);
        animQueueRef.current -= 1;
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    },
    [addSamples],
  );

  // Cleanup animation on unmount or distribution change
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      animQueueRef.current = 0;
    };
  }, [distType]);

  const handleReset = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    animQueueRef.current = 0;
    setSamples([]);
    setRunningAverages([]);
  }, []);

  const handleDistChange = useCallback(
    (newDist: DistType) => {
      handleReset();
      setDistType(newDist);
    },
    [handleReset],
  );

  // Format number for display
  const fmt = (v: number, digits = 4) => v.toFixed(digits);

  return (
    <div className="flex h-full w-full flex-col">
      {/* Main SVG chart */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ background: 'var(--color-paper)', maxHeight: '100%' }}
      >
        {/* Grid lines (horizontal at y ticks) */}
        {dist.yTicks.map((yt) => (
          <line
            key={`grid-y-${yt}`}
            x1={PADDING.left}
            y1={sy(yt)}
            x2={width - PADDING.right}
            y2={sy(yt)}
            stroke="var(--color-rule)"
            strokeWidth={0.5}
          />
        ))}

        {/* Axes */}
        <line
          x1={PADDING.left}
          y1={height - PADDING.bottom}
          x2={width - PADDING.right}
          y2={height - PADDING.bottom}
          stroke="var(--color-ink-faint)"
          strokeWidth={1}
        />
        <line
          x1={PADDING.left}
          y1={PADDING.top}
          x2={PADDING.left}
          y2={height - PADDING.bottom}
          stroke="var(--color-ink-faint)"
          strokeWidth={1}
        />

        {/* Y-axis ticks */}
        {dist.yTicks.map((yt) => (
          <g key={`ytick-${yt}`}>
            <line
              x1={PADDING.left - 4}
              y1={sy(yt)}
              x2={PADDING.left}
              y2={sy(yt)}
              stroke="var(--color-ink-faint)"
              strokeWidth={1}
            />
            <text
              x={PADDING.left - 8}
              y={sy(yt) + 3}
              textAnchor="end"
              fill="var(--color-ink-faint)"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}
            >
              {Number.isInteger(yt) ? yt : yt.toFixed(1)}
            </text>
          </g>
        ))}

        {/* X-axis ticks */}
        {xTicks.map((xt) => (
          <g key={`xtick-${xt}`}>
            <line
              x1={sx(xt)}
              y1={height - PADDING.bottom}
              x2={sx(xt)}
              y2={height - PADDING.bottom + 4}
              stroke="var(--color-ink-faint)"
              strokeWidth={1}
            />
            <text
              x={sx(xt)}
              y={height - PADDING.bottom + 16}
              textAnchor="middle"
              fill="var(--color-ink-faint)"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}
            >
              {xt}
            </text>
          </g>
        ))}

        {/* X-axis label */}
        <text
          x={PADDING.left + plotW / 2}
          y={height - 4}
          textAnchor="middle"
          fill="var(--color-ink-faint)"
          style={{ fontFamily: 'var(--font-sans)', fontSize: '11px' }}
        >
          sample number
        </text>

        {/* True mean line (dashed) */}
        <line
          x1={PADDING.left}
          y1={sy(mu)}
          x2={width - PADDING.right}
          y2={sy(mu)}
          stroke="var(--color-accent)"
          strokeWidth={1.5}
          strokeDasharray="6,4"
        />
        <text
          x={width - PADDING.right + 2}
          y={sy(mu) + 4}
          fill="var(--color-accent)"
          style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}
        >
          &#956;={mu}
        </text>

        {/* Theoretical convergence band (mu +/- sigma/sqrt(n)) */}
        {n > 0 && theoryFillPath && (
          <path
            d={theoryFillPath}
            fill="var(--color-vector-blue)"
            opacity={0.08}
            stroke="none"
          />
        )}

        {/* Running average line */}
        {n > 0 && linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="var(--color-vector-blue)"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
        )}

        {/* Current point indicator */}
        {n > 0 && (
          <circle
            cx={sx(n)}
            cy={sy(currentAvg)}
            r={4}
            fill="var(--color-vector-blue)"
            stroke="var(--color-paper)"
            strokeWidth={2}
          />
        )}

        {/* Legend */}
        <line x1={PADDING.left + 8} y1={12} x2={PADDING.left + 28} y2={12} stroke="var(--color-vector-blue)" strokeWidth={1.5} />
        <text x={PADDING.left + 32} y={16} fill="var(--color-ink-muted)" style={{ fontFamily: 'var(--font-sans)', fontSize: '10px' }}>
          running avg
        </text>
        <line x1={PADDING.left + 108} y1={12} x2={PADDING.left + 128} y2={12} stroke="var(--color-accent)" strokeWidth={1.5} strokeDasharray="4,3" />
        <text x={PADDING.left + 132} y={16} fill="var(--color-ink-muted)" style={{ fontFamily: 'var(--font-sans)', fontSize: '10px' }}>
          true mean &#956;
        </text>
        <rect x={PADDING.left + 218} y={6} width={12} height={12} fill="var(--color-vector-blue)" opacity={0.15} />
        <text x={PADDING.left + 234} y={16} fill="var(--color-ink-muted)" style={{ fontFamily: 'var(--font-sans)', fontSize: '10px' }}>
          &#177;&#963;/&#8730;n
        </text>
      </svg>

      {/* Controls panel */}
      <div className="flex flex-col gap-2 border-t border-rule bg-paper-elevated px-4 py-3">
        {/* Distribution selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="font-sans text-[11px] text-ink-faint"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Distribution:
          </span>
          {(['die', 'coin', 'uniform'] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleDistChange(d)}
              className={`rounded-sm border px-2 py-0.5 text-[11px] transition-colors duration-fast ${
                d === distType
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-rule bg-paper-elevated text-ink-muted hover:bg-surface-1'
              }`}
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {DISTRIBUTIONS[d].label}
            </button>
          ))}
        </div>

        {/* Action buttons + stats */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => addSamples(1)}
              className="rounded-sm border border-rule bg-paper-elevated px-3 py-1 font-sans text-xs text-ink-muted transition-colors duration-fast hover:bg-surface-1 hover:text-ink"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Flip 1
            </button>
            <button
              type="button"
              onClick={() => animateSamples(10)}
              className="rounded-sm border border-rule bg-paper-elevated px-3 py-1 font-sans text-xs text-ink-muted transition-colors duration-fast hover:bg-surface-1 hover:text-ink"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Flip 10
            </button>
            <button
              type="button"
              onClick={() => addSamples(100)}
              className="rounded-sm border border-rule bg-paper-elevated px-3 py-1 font-sans text-xs text-ink-muted transition-colors duration-fast hover:bg-surface-1 hover:text-ink"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Flip 100
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-sm border border-rule bg-paper-elevated px-3 py-1 font-sans text-xs text-ink-muted transition-colors duration-fast hover:bg-surface-1 hover:text-ink"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Reset
            </button>
          </div>

          {/* Stats display */}
          <div className="ml-auto flex flex-wrap items-center gap-3 text-[11px]" style={{ fontFamily: 'var(--font-mono)' }}>
            <span className="text-ink-faint">
              n = <span className="text-ink">{n}</span>
            </span>
            <span className="text-ink-faint">
              avg = <span className="text-vector-blue">{n > 0 ? fmt(currentAvg) : '—'}</span>
            </span>
            <span className="text-ink-faint">
              &#956; = <span className="text-accent">{mu}</span>
            </span>
            <span className="text-ink-faint">
              |avg &#8722; &#956;| ={' '}
              <span className={converged ? 'text-vector-green' : 'text-ink'}>
                {n > 0 ? fmt(deviation) : '—'}
              </span>
            </span>
            {converged && (
              <span
                className="rounded-sm bg-surface-1 px-2 py-0.5 text-[11px] font-semibold text-vector-green"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                Converged!
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
