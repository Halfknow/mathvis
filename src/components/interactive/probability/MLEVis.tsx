import { useState, useMemo, useCallback } from 'react';

// ---------------------------------------------------------------------------
// MLEVis — likelihood function explorer for Maximum Likelihood Estimation
// Bernoulli distribution: data = sequence of coin flips (H/T)
// ---------------------------------------------------------------------------

interface MLEVisProps {
  width?: number;
  height?: number;
}

type Flip = 'H' | 'T';

function logLikelihood(p: number, heads: number, tails: number): number {
  if (p <= 0 || p >= 1) return -Infinity;
  return heads * Math.log(p) + tails * Math.log(1 - p);
}

export function MLEVis({ width = 640, height = 360 }: MLEVisProps) {
  const [data, setData] = useState<Flip[]>(['H', 'H', 'T', 'H', 'H']);
  const [cursorP, setCursorP] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const n = data.length;
  const k = data.filter(d => d === 'H').length;
  const mle = n > 0 ? k / n : 0;

  // Layout
  const pad = { top: 30, right: 30, bottom: 50, left: 54 };
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  // X-axis: p in [0.01, 0.99]
  const pMin = 0.01;
  const pMax = 0.99;

  // Y range: find max log-likelihood (at MLE) and min (at boundaries)
  const maxLL = logLikelihood(mle, k, n - k);
  const minLL = Math.min(
    logLikelihood(pMin, k, n - k),
    logLikelihood(pMax, k, n - k),
  );
  const yTop = maxLL + Math.abs(maxLL - minLL) * 0.1;
  const yBottom = minLL - Math.abs(maxLL - minLL) * 0.15;

  const sx = useCallback(
    (p: number) => pad.left + ((p - pMin) / (pMax - pMin)) * plotW,
    [pad.left, plotW],
  );
  const sy = useCallback(
    (ll: number) => pad.top + plotH - ((ll - yBottom) / (yTop - yBottom)) * plotH,
    [pad.top, plotH, yTop, yBottom],
  );

  // Log-likelihood curve
  const curvePath = useMemo(() => {
    if (n === 0) return '';
    const steps = 200;
    const parts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const p = pMin + (i / steps) * (pMax - pMin);
      const ll = logLikelihood(p, k, n - k);
      if (!isFinite(ll)) continue;
      const cmd = parts.length === 0 ? 'M' : 'L';
      parts.push(`${cmd}${sx(p).toFixed(2)},${sy(ll).toFixed(2)}`);
    }
    return parts.join(' ');
  }, [n, k, sx, sy]);

  // Current cursor value
  const currentP = cursorP ?? mle;
  const currentLL = n > 0 ? logLikelihood(currentP, k, n - k) : 0;

  // X-axis ticks
  const pTicks = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9];

  // Y-axis ticks
  const yTicks = useMemo(() => {
    if (n === 0) return [];
    const range = yTop - yBottom;
    const rawStep = range / 5;
    const mag = Math.pow(10, Math.floor(Math.log10(Math.abs(rawStep))));
    const norm = rawStep / mag;
    let step: number;
    if (norm <= 1.5) step = mag;
    else if (norm <= 3.5) step = 2 * mag;
    else if (norm <= 7.5) step = 5 * mag;
    else step = 10 * mag;
    const ticks: number[] = [];
    for (let v = Math.ceil(yBottom / step) * step; v <= yTop; v += step) {
      ticks.push(Math.round(v * 100) / 100);
    }
    return ticks;
  }, [yTop, yBottom, n]);

  // Flip coin randomly
  const flipCoin = useCallback(() => {
    const result: Flip = Math.random() < 0.5 ? 'H' : 'T';
    setData(prev => [...prev, result]);
  }, []);

  const reset = useCallback(() => {
    setData([]);
    setCursorP(null);
  }, []);

  // Handle drag on chart
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      setDragging(true);
      const update = (clientX: number) => {
        const frac = (clientX - rect.left) / rect.width;
        const svgX = frac * width;
        const p = pMin + ((svgX - pad.left) / plotW) * (pMax - pMin);
        setCursorP(Math.max(pMin, Math.min(pMax, p)));
      };
      update(e.clientX);
      const onMove = (ev: MouseEvent) => update(ev.clientX);
      const onUp = () => {
        setDragging(false);
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [width, pad.left, plotW],
  );

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
          cursor: dragging ? 'ew-resize' : 'default',
        }}
        preserveAspectRatio="xMidYMid meet"
        onMouseDown={handleMouseDown}
      >
        {/* Title */}
        <text
          x={pad.left + plotW / 2}
          y={16}
          textAnchor="middle"
          fill="var(--color-ink)"
          style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600 }}
        >
          Log-Likelihood: {'\u2113'}(p) = k{'\u00B7'}ln(p) + (n\u2212k){'\u00B7'}ln(1\u2212p)
        </text>

        {/* Y-axis gridlines */}
        {yTicks.map((t) => (
          <line
            key={`grid-${t}`}
            x1={pad.left}
            y1={sy(t)}
            x2={pad.left + plotW}
            y2={sy(t)}
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
          <text
            key={`yt-${t}`}
            x={pad.left - 6}
            y={sy(t) + 3}
            textAnchor="end"
            fill="var(--color-ink-faint)"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '9px' }}
          >
            {t.toFixed(1)}
          </text>
        ))}

        {/* X tick labels */}
        {pTicks.map((t) => (
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
              {t.toFixed(1)}
            </text>
          </g>
        ))}

        {/* X-axis label */}
        <text
          x={pad.left + plotW / 2}
          y={pad.top + plotH + 30}
          textAnchor="middle"
          fill="var(--color-ink-muted)"
          style={{ fontFamily: 'var(--font-sans)', fontSize: '11px' }}
        >
          parameter p
        </text>

        {/* Log-likelihood curve */}
        {n > 0 && curvePath && (
          <path
            d={curvePath}
            fill="none"
            stroke="var(--color-vector-blue)"
            strokeWidth={2.5}
          />
        )}

        {/* MLE marker — diamond at peak */}
        {n > 0 && (
          <g>
            <polygon
              points={`${sx(mle)},${sy(maxLL) - 7} ${sx(mle) + 6},${sy(maxLL)} ${sx(mle)},${sy(maxLL) + 7} ${sx(mle) - 6},${sy(maxLL)}`}
              fill="var(--color-vector-yellow)"
              stroke="var(--color-ink)"
              strokeWidth={0.5}
            />
            <text
              x={sx(mle)}
              y={sy(maxLL) - 12}
              textAnchor="middle"
              fill="var(--color-vector-yellow)"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', fontWeight: 600 }}
            >
              {'\u0070\u0302'} = {mle.toFixed(3)}
            </text>
          </g>
        )}

        {/* Cursor vertical line */}
        {cursorP !== null && n > 0 && (
          <line
            x1={sx(cursorP)} y1={pad.top}
            x2={sx(cursorP)} y2={pad.top + plotH}
            stroke="var(--color-accent)"
            strokeWidth={1.5}
            strokeDasharray="4,3"
          />
        )}

        {/* Cursor dot on curve */}
        {cursorP !== null && n > 0 && isFinite(currentLL) && (
          <circle
            cx={sx(cursorP)}
            cy={sy(currentLL)}
            r={4}
            fill="var(--color-accent)"
            stroke="var(--color-paper)"
            strokeWidth={2}
          />
        )}

        {/* Empty state */}
        {n === 0 && (
          <text
            x={pad.left + plotW / 2}
            y={pad.top + plotH / 2}
            textAnchor="middle"
            fill="var(--color-ink-faint)"
            style={{ fontFamily: 'var(--font-sans)', fontSize: '14px' }}
          >
            Add some coin flips to see the likelihood curve
          </text>
        )}

        {/* Data dots display — bottom */}
        {n > 0 && (
          <g>
            {data.map((flip, i) => {
              const dotR = Math.max(3, Math.min(8, 200 / n));
              const maxPerRow = Math.floor(plotW / (dotR * 2.5));
              const row = Math.floor(i / maxPerRow);
              const col = i % maxPerRow;
              const dx = pad.left + col * dotR * 2.5 + dotR;
              const dy = pad.top + plotH + 38 + row * dotR * 2.5;
              return (
                <circle
                  key={i}
                  cx={dx}
                  cy={dy}
                  r={dotR}
                  fill={flip === 'H' ? 'var(--color-vector-blue)' : 'var(--color-ink-faint)'}
                  opacity={flip === 'H' ? 0.9 : 0.4}
                />
              );
            })}
          </g>
        )}
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
        {/* Add flips */}
        <button
          type="button"
          onClick={flipCoin}
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
          Flip coin
        </button>

        {/* Manual H */}
        <button
          type="button"
          onClick={() => setData(prev => [...prev, 'H'])}
          style={{
            padding: '4px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-vector-blue)',
            background: 'var(--color-vector-blue)',
            color: 'var(--color-paper)',
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          + H
        </button>

        {/* Manual T */}
        <button
          type="button"
          onClick={() => setData(prev => [...prev, 'T'])}
          style={{
            padding: '4px 14px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--color-ink-faint)',
            background: 'var(--color-paper)',
            color: 'var(--color-ink-muted)',
            fontFamily: 'var(--font-sans)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          + T
        </button>

        {/* Reset */}
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

        {/* Stats */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
          }}
        >
          <span style={{ color: 'var(--color-ink-faint)' }}>
            data: <span style={{ color: 'var(--color-ink)' }}>{data.join('') || '\u2014'}</span>
          </span>
          <span style={{ color: 'var(--color-ink-faint)' }}>
            n = <span style={{ color: 'var(--color-ink)' }}>{n}</span>
          </span>
          <span style={{ color: 'var(--color-ink-faint)' }}>
            k = <span style={{ color: 'var(--color-vector-blue)' }}>{k}</span>
          </span>
          <span style={{ color: 'var(--color-ink-faint)' }}>
            {'\u0070\u0302'} = <span style={{ color: 'var(--color-vector-yellow)', fontWeight: 600 }}>{n > 0 ? mle.toFixed(3) : '\u2014'}</span>
          </span>
          <span style={{ color: 'var(--color-ink-faint)' }}>
            {'\u2113'}({'\u0070\u0302'}) = <span style={{ color: 'var(--color-ink)' }}>{n > 0 ? maxLL.toFixed(2) : '\u2014'}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
