import { useState, useMemo, useCallback } from 'react';

// ---------------------------------------------------------------------------
// RandomWalkVis — random walk path ensemble visualization (1D)
// Each step: +1 or -1 with equal probability (simple symmetric random walk)
// ---------------------------------------------------------------------------

interface RandomWalkVisProps {
  width?: number;
  height?: number;
}

interface WalkPath {
  positions: number[];
}

const STEPS_OPTIONS = [50, 100, 200, 500];

function generateWalk(steps: number): WalkPath {
  const positions = [0]; // start at 0
  for (let i = 0; i < steps; i++) {
    const step = Math.random() < 0.5 ? 1 : -1;
    positions.push(positions[i] + step);
  }
  return { positions };
}

export function RandomWalkVis({ width = 640, height = 380 }: RandomWalkVisProps) {
  const [paths, setPaths] = useState<WalkPath[]>([]);
  const [numSteps, setNumSteps] = useState(100);
  const [targetPathCount, setTargetPathCount] = useState(10);

  // Layout
  const pad = { top: 24, right: 20, bottom: 40, left: 48 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  const numPaths = paths.length;
  const actualSteps = paths.length > 0 ? paths[0].positions.length - 1 : numSteps;

  // Y range: theoretical spread +/- sqrt(n), with some padding
  const spread = Math.sqrt(actualSteps);
  const yMin = -spread * 2.5;
  const yMax = spread * 2.5;

  // X range: 0 to numSteps
  const xMax = Math.max(actualSteps, 10);

  // Scales
  const sx = useCallback(
    (x: number) => pad.left + (x / xMax) * plotW,
    [pad.left, plotW, xMax],
  );
  const sy = useCallback(
    (y: number) => pad.top + plotH - ((y - yMin) / (yMax - yMin)) * plotH,
    [pad.top, plotH, yMin, yMax],
  );

  // X-axis ticks
  const xTicks = useMemo(() => {
    const rawStep = xMax / 6;
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const norm = rawStep / mag;
    let step: number;
    if (norm <= 1.5) step = mag;
    else if (norm <= 3.5) step = 2 * mag;
    else if (norm <= 7.5) step = 5 * mag;
    else step = 10 * mag;
    step = Math.max(step, 1);
    const ticks: number[] = [];
    for (let t = 0; t <= xMax; t += step) ticks.push(Math.round(t));
    return ticks;
  }, [xMax]);

  // Y-axis ticks
  const yTicks = useMemo(() => {
    const range = yMax - yMin;
    const rawStep = range / 6;
    const mag = Math.pow(10, Math.floor(Math.log10(Math.abs(rawStep))));
    const norm = rawStep / mag;
    let step: number;
    if (norm <= 1.5) step = mag;
    else if (norm <= 3.5) step = 2 * mag;
    else if (norm <= 7.5) step = 5 * mag;
    else step = 10 * mag;
    step = Math.max(step, 1);
    const ticks: number[] = [];
    for (let t = Math.ceil(yMin / step) * step; t <= yMax; t += step) {
      ticks.push(Math.round(t));
    }
    return ticks;
  }, [yMin, yMax]);

  // Envelope paths (shaded +/- sqrt(n) region)
  const { envelopePath, envelopeFill } = useMemo(() => {
    const upperParts: string[] = [];
    const lowerParts: string[] = [];
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const n = Math.max(1, Math.round((i / steps) * xMax));
      const s = Math.sqrt(n);
      const px = sx(n).toFixed(2);
      const pyUp = sy(s).toFixed(2);
      const pyLo = sy(-s).toFixed(2);
      const cmd = i === 0 ? 'M' : 'L';
      upperParts.push(`${cmd}${px},${pyUp}`);
      lowerParts.push(`${cmd}${px},${pyLo}`);
    }
    return {
      envelopePath: [...upperParts, ...lowerParts.slice().reverse()].join(' '),
      envelopeFill: [...upperParts, ...lowerParts.slice().reverse()].join(' ') + ' Z',
    };
  }, [xMax, sx, sy]);

  // Downsample and build path strings for each walk
  const walkPaths = useMemo(() => {
    return paths.map((walk, walkIdx) => {
      const n = walk.positions.length;
      const maxPts = 300;
      const step = n <= maxPts ? 1 : Math.ceil(n / maxPts);
      const parts: string[] = [];
      for (let i = 0; i < n; i += step) {
        const px = sx(i).toFixed(2);
        const py = sy(walk.positions[i]).toFixed(2);
        const cmd = parts.length === 0 ? 'M' : 'L';
        parts.push(`${cmd}${px},${py}`);
      }
      // Always include last point
      if (n > 0) {
        parts.push(`L${sx(n - 1).toFixed(2)},${sy(walk.positions[n - 1]).toFixed(2)}`);
      }
      const d = parts.join(' ');
      const isLatest = walkIdx === paths.length - 1;
      return { d, isLatest };
    });
  }, [paths, sx, sy]);

  // Actions
  const addPaths = useCallback(
    (count: number) => {
      const newPaths: WalkPath[] = [];
      for (let i = 0; i < count; i++) {
        newPaths.push(generateWalk(numSteps));
      }
      setPaths(prev => [...prev, ...newPaths].slice(0, 200));
    },
    [numSteps],
  );

  const reset = useCallback(() => {
    setPaths([]);
  }, []);

  const handleStepsChange = useCallback(
    (newSteps: number) => {
      setNumSteps(newSteps);
      setPaths([]);
    },
    [],
  );

  // Current theoretical spread
  const currentSpread = Math.sqrt(numSteps);

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
        {yTicks.map((t) => (
          <line
            key={`grid-y-${t}`}
            x1={pad.left} y1={sy(t)}
            x2={pad.left + plotW} y2={sy(t)}
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

        {/* Y tick labels */}
        {yTicks.map((t) => (
          <g key={`yt-${t}`}>
            <line
              x1={pad.left - 4} y1={sy(t)}
              x2={pad.left} y2={sy(t)}
              stroke="var(--color-ink-faint)"
            />
            <text
              x={pad.left - 8}
              y={sy(t) + 3}
              textAnchor="end"
              fill="var(--color-ink-faint)"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '9px' }}
            >
              {t}
            </text>
          </g>
        ))}

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
          step number
        </text>

        {/* E[S_n] = 0 dashed line */}
        <line
          x1={pad.left} y1={sy(0)}
          x2={pad.left + plotW} y2={sy(0)}
          stroke="var(--color-ink-faint)"
          strokeWidth={1}
          strokeDasharray="4,4"
        />
        <text
          x={pad.left + plotW + 3}
          y={sy(0) + 3}
          fill="var(--color-ink-faint)"
          style={{ fontFamily: 'var(--font-sans)', fontSize: '9px' }}
        >
          E[S] = 0
        </text>

        {/* +/- sqrt(n) envelope (shaded region) */}
        <path
          d={envelopeFill}
          fill="var(--color-vector-yellow)"
          opacity={0.08}
          stroke="none"
        />
        {/* Envelope boundary lines */}
        <path
          d={envelopePath}
          fill="none"
          stroke="var(--color-vector-yellow)"
          strokeWidth={1}
          strokeDasharray="4,3"
          opacity={0.5}
        />

        {/* Walk paths */}
        {walkPaths.map((wp, i) => (
          <path
            key={i}
            d={wp.d}
            fill="none"
            stroke="var(--color-vector-blue)"
            strokeWidth={wp.isLatest ? 2 : 0.8}
            opacity={wp.isLatest ? 0.9 : 0.12}
            strokeLinejoin="round"
          />
        ))}

        {/* Legend */}
        <g>
          <line
            x1={pad.left + 8} y1={pad.top + 6}
            x2={pad.left + 28} y2={pad.top + 6}
            stroke="var(--color-vector-blue)" strokeWidth={2}
          />
          <text
            x={pad.left + 32} y={pad.top + 10}
            fill="var(--color-ink-muted)"
            style={{ fontFamily: 'var(--font-sans)', fontSize: '10px' }}
          >
            walk paths ({numPaths})
          </text>
          <rect
            x={pad.left + 118} y={pad.top}
            width={12} height={12}
            fill="var(--color-vector-yellow)"
            opacity={0.2}
          />
          <text
            x={pad.left + 134} y={pad.top + 10}
            fill="var(--color-ink-muted)"
            style={{ fontFamily: 'var(--font-sans)', fontSize: '10px' }}
          >
            {'\u00B1\u221An envelope'}
          </text>
        </g>
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
          onClick={() => addPaths(1)}
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
          Add 1 path
        </button>
        <button
          type="button"
          onClick={() => addPaths(50)}
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
          Add 50 paths
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

        {/* Steps selector */}
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '11px',
            color: 'var(--color-ink-faint)',
          }}
        >
          Steps:
        </span>
        {STEPS_OPTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => handleStepsChange(s)}
            style={{
              padding: '3px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: numSteps === s ? 'var(--color-accent)' : 'var(--color-rule)',
              background: numSteps === s ? 'var(--color-accent-soft)' : 'var(--color-paper)',
              color: numSteps === s ? 'var(--color-accent)' : 'var(--color-ink-muted)',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: numSteps === s ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {s}
          </button>
        ))}

        {/* Stats */}
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
          }}
        >
          <span style={{ color: 'var(--color-ink-faint)' }}>
            paths: <span style={{ color: 'var(--color-ink)' }}>{numPaths}</span>
          </span>
          <span style={{ color: 'var(--color-ink-faint)' }}>
            steps: <span style={{ color: 'var(--color-ink)' }}>{numSteps}</span>
          </span>
          <span style={{ color: 'var(--color-ink-faint)' }}>
            {'\u03C3'} = {'\u221A'}n = <span style={{ color: 'var(--color-vector-yellow)' }}>{currentSpread.toFixed(1)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
