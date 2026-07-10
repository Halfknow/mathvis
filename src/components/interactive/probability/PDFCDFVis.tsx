import { useState, useMemo, useCallback } from 'react';

// ---------------------------------------------------------------------------
// PDFCDFVis — dual-view PDF + CDF visualization for continuous distributions
// ---------------------------------------------------------------------------

interface PDFCDFVisProps {
  width?: number;
  height?: number;
}

type DistType = 'uniform' | 'exponential' | 'normal';

interface DistConfig {
  label: string;
  xMin: number;
  xMax: number;
  pdf: (x: number, params: number[]) => number;
  cdf: (x: number, params: number[]) => number;
  paramDefaults: number[];
  paramLabels: string[];
  paramRanges: { min: number; max: number; step: number }[];
  yMaxPDF: (params: number[]) => number;
}

// --- Distribution math ---

function normalPDF(x: number, mu: number, sigma: number): number {
  const coeff = 1 / (sigma * Math.sqrt(2 * Math.PI));
  const exp = -0.5 * ((x - mu) / sigma) ** 2;
  return coeff * Math.exp(exp);
}

// Approximate normal CDF using the error function approximation
function normalCDF(x: number, mu: number, sigma: number): number {
  const z = (x - mu) / sigma;
  // Abramowitz & Stegun approximation
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const sign = z < 0 ? -1 : 1;
  const absZ = Math.abs(z);
  const t = 1 / (1 + p * absZ);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-absZ * absZ / 2);
  return 0.5 * (1 + sign * y);
}

const DISTRIBUTIONS: Record<DistType, DistConfig> = {
  uniform: {
    label: 'Uniform',
    xMin: -0.5,
    xMax: 2.5,
    pdf: (x, [a, b]) => (x >= a && x <= b ? 1 / (b - a) : 0),
    cdf: (x, [a, b]) => (x < a ? 0 : x > b ? 1 : (x - a) / (b - a)),
    paramDefaults: [0, 2],
    paramLabels: ['a', 'b'],
    paramRanges: [
      { min: -1, max: 1.5, step: 0.1 },
      { min: 0.5, max: 3, step: 0.1 },
    ],
    yMaxPDF: ([, b]) => 1.2 / (b - 0),
  },
  exponential: {
    label: 'Exponential',
    xMin: -0.2,
    xMax: 6,
    pdf: (x, [lambda]) => (x < 0 ? 0 : lambda * Math.exp(-lambda * x)),
    cdf: (x, [lambda]) => (x < 0 ? 0 : 1 - Math.exp(-lambda * x)),
    paramDefaults: [1],
    paramLabels: ['\u03BB'],
    paramRanges: [{ min: 0.2, max: 3, step: 0.1 }],
    yMaxPDF: ([lambda]) => lambda * 1.15,
  },
  normal: {
    label: 'Normal',
    xMin: -4,
    xMax: 4,
    pdf: (x, [mu, sigma]) => normalPDF(x, mu, sigma),
    cdf: (x, [mu, sigma]) => normalCDF(x, mu, sigma),
    paramDefaults: [0, 1],
    paramLabels: ['\u03BC', '\u03C3'],
    paramRanges: [
      { min: -2, max: 2, step: 0.1 },
      { min: 0.3, max: 2.5, step: 0.1 },
    ],
    yMaxPDF: ([, sigma]) => normalPDF(0, 0, sigma) * 1.15,
  },
};

export function PDFCDFVis({ width = 640, height = 380 }: PDFCDFVisProps) {
  const [distType, setDistType] = useState<DistType>('normal');
  const [params, setParams] = useState<number[]>(DISTRIBUTIONS.normal.paramDefaults);
  const [cursorX, setCursorX] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  const dist = DISTRIBUTIONS[distType];
  const { xMin, xMax } = dist;

  // Layout — split into two panels
  const pad = { top: 30, right: 16, bottom: 40, left: 44 };
  const gap = 24;
  const panelW = (width - pad.left - pad.right - gap) / 2;
  const plotH = height - pad.top - pad.bottom;

  // PDF panel: x in [xMin, xMax], y in [0, yMaxPDF]
  const yMaxPDF = dist.yMaxPDF(params);

  // CDF panel: same x range, y in [0, 1]
  const yMinCDF = 0;
  const yMaxCDF = 1;

  // Scales for PDF panel
  const pdfSx = useCallback(
    (x: number) => pad.left + ((x - xMin) / (xMax - xMin)) * panelW,
    [pad.left, xMin, xMax, panelW],
  );
  const pdfSy = useCallback(
    (y: number) => pad.top + plotH - (y / yMaxPDF) * plotH,
    [pad.top, plotH, yMaxPDF],
  );

  // Scales for CDF panel
  const cdfOffset = pad.left + panelW + gap;
  const cdfSx = useCallback(
    (x: number) => cdfOffset + ((x - xMin) / (xMax - xMin)) * panelW,
    [cdfOffset, xMin, xMax, panelW],
  );
  const cdfSy = useCallback(
    (y: number) => pad.top + plotH - ((y - yMinCDF) / (yMaxCDF - yMinCDF)) * plotH,
    [pad.top, plotH, yMinCDF, yMaxCDF],
  );

  // Generate PDF curve path
  const pdfCurvePath = useMemo(() => {
    const steps = 200;
    const parts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin);
      const y = dist.pdf(x, params);
      const cmd = i === 0 ? 'M' : 'L';
      parts.push(`${cmd}${pdfSx(x).toFixed(2)},${pdfSy(y).toFixed(2)}`);
    }
    return parts.join(' ');
  }, [dist, params, xMin, xMax, pdfSx, pdfSy]);

  // Shaded area under PDF from xMin to cursorX
  const pdfShadedPath = useMemo(() => {
    if (cursorX === null) return '';
    const steps = 150;
    const parts: string[] = [];
    const xStart = xMin;
    const xEnd = Math.min(cursorX, xMax);
    if (xEnd <= xStart) return '';
    for (let i = 0; i <= steps; i++) {
      const x = xStart + (i / steps) * (xEnd - xStart);
      const y = dist.pdf(x, params);
      const cmd = i === 0 ? 'M' : 'L';
      parts.push(`${cmd}${pdfSx(x).toFixed(2)},${pdfSy(y).toFixed(2)}`);
    }
    // Close to baseline
    parts.push(`L${pdfSx(xEnd).toFixed(2)},${pdfSy(0).toFixed(2)}`);
    parts.push(`L${pdfSx(xStart).toFixed(2)},${pdfSy(0).toFixed(2)}`);
    parts.push('Z');
    return parts.join(' ');
  }, [cursorX, dist, params, xMin, xMax, pdfSx, pdfSy]);

  // Generate CDF curve path
  const cdfCurvePath = useMemo(() => {
    const steps = 200;
    const parts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin);
      const y = dist.cdf(x, params);
      const cmd = i === 0 ? 'M' : 'L';
      parts.push(`${cmd}${cdfSx(x).toFixed(2)},${cdfSy(y).toFixed(2)}`);
    }
    return parts.join(' ');
  }, [dist, params, xMin, xMax, cdfSx, cdfSy]);

  // Current values at cursor
  const currentX = cursorX ?? (xMin + xMax) / 2;
  const currentPDF = dist.pdf(currentX, params);
  const currentCDF = dist.cdf(currentX, params);

  // Y-axis ticks for PDF
  const pdfYTicks = useMemo(() => {
    const rawStep = yMaxPDF / 4;
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const norm = rawStep / mag;
    let step: number;
    if (norm <= 1) step = mag;
    else if (norm <= 2) step = 2 * mag;
    else if (norm <= 5) step = 5 * mag;
    else step = 10 * mag;
    const ticks: number[] = [];
    for (let v = 0; v <= yMaxPDF; v += step) ticks.push(Math.round(v * 1000) / 1000);
    return ticks;
  }, [yMaxPDF]);

  // X-axis ticks
  const xTicks = useMemo(() => {
    const range = xMax - xMin;
    const rawStep = range / 6;
    const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const norm = rawStep / mag;
    let step: number;
    if (norm <= 1.5) step = mag;
    else if (norm <= 3.5) step = 2 * mag;
    else if (norm <= 7.5) step = 5 * mag;
    else step = 10 * mag;
    const ticks: number[] = [];
    for (let t = Math.ceil(xMin / step) * step; t <= xMax; t += step) {
      ticks.push(Math.round(t * 100) / 100);
    }
    return ticks;
  }, [xMin, xMax]);

  // Handle dragging on PDF panel
  const handlePdfMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = e.currentTarget;
      const rect = svg.getBoundingClientRect();
      setDragging(true);
      const update = (clientX: number) => {
        const frac = (clientX - rect.left) / rect.width;
        const svgX = frac * width;
        const val = xMin + ((svgX - pad.left) / panelW) * (xMax - xMin);
        setCursorX(Math.max(xMin, Math.min(xMax, val)));
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
    [width, pad.left, panelW, xMin, xMax],
  );

  const handleDistChange = useCallback(
    (newDist: DistType) => {
      setDistType(newDist);
      setParams(DISTRIBUTIONS[newDist].paramDefaults);
      setCursorX(null);
    },
    [],
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
        onMouseDown={handlePdfMouseDown}
      >
        {/* ===== PDF Panel ===== */}
        {/* Panel label */}
        <text
          x={pad.left + panelW / 2}
          y={pad.top - 14}
          textAnchor="middle"
          fill="var(--color-ink)"
          style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600 }}
        >
          PDF f(x)
        </text>

        {/* Y-axis gridlines */}
        {pdfYTicks.map((t) => (
          <line
            key={`pdf-grid-${t}`}
            x1={pad.left}
            y1={pdfSy(t)}
            x2={pad.left + panelW}
            y2={pdfSy(t)}
            stroke="var(--color-rule)"
            strokeWidth={0.5}
          />
        ))}

        {/* PDF axes */}
        <line
          x1={pad.left} y1={pdfSy(0)}
          x2={pad.left + panelW} y2={pdfSy(0)}
          stroke="var(--color-ink-faint)" strokeWidth={1}
        />
        <line
          x1={pad.left} y1={pad.top}
          x2={pad.left} y2={pad.top + plotH}
          stroke="var(--color-ink-faint)" strokeWidth={1}
        />

        {/* Y tick labels */}
        {pdfYTicks.map((t) => (
          <text
            key={`pdf-yt-${t}`}
            x={pad.left - 6}
            y={pdfSy(t) + 3}
            textAnchor="end"
            fill="var(--color-ink-faint)"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '9px' }}
          >
            {t.toFixed(2)}
          </text>
        ))}

        {/* X tick labels */}
        {xTicks.map((t) => (
          <text
            key={`pdf-xt-${t}`}
            x={pdfSx(t)}
            y={pdfSy(0) + 14}
            textAnchor="middle"
            fill="var(--color-ink-faint)"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '9px' }}
          >
            {t}
          </text>
        ))}

        {/* Shaded area under PDF */}
        {pdfShadedPath && (
          <path d={pdfShadedPath} fill="var(--color-vector-blue)" opacity={0.15} />
        )}

        {/* PDF curve */}
        <path
          d={pdfCurvePath}
          fill="none"
          stroke="var(--color-vector-blue)"
          strokeWidth={2}
        />

        {/* Cursor vertical line on PDF */}
        {cursorX !== null && (
          <line
            x1={pdfSx(cursorX)} y1={pad.top}
            x2={pdfSx(cursorX)} y2={pdfSy(0)}
            stroke="var(--color-accent)"
            strokeWidth={1.5}
            strokeDasharray="4,3"
          />
        )}

        {/* Cursor dot on PDF curve */}
        {cursorX !== null && (
          <circle
            cx={pdfSx(cursorX)}
            cy={pdfSy(currentPDF)}
            r={4}
            fill="var(--color-accent)"
            stroke="var(--color-paper)"
            strokeWidth={2}
          />
        )}

        {/* ===== Divider ===== */}
        <line
          x1={pad.left + panelW + gap / 2}
          y1={pad.top}
          x2={pad.left + panelW + gap / 2}
          y2={pad.top + plotH}
          stroke="var(--color-rule)"
          strokeWidth={1}
          strokeDasharray="2,4"
        />

        {/* ===== CDF Panel ===== */}
        {/* Panel label */}
        <text
          x={cdfOffset + panelW / 2}
          y={pad.top - 14}
          textAnchor="middle"
          fill="var(--color-ink)"
          style={{ fontFamily: 'var(--font-sans)', fontSize: '12px', fontWeight: 600 }}
        >
          CDF F(x)
        </text>

        {/* Y-axis gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={`cdf-grid-${t}`}
            x1={cdfOffset}
            y1={cdfSy(t)}
            x2={cdfOffset + panelW}
            y2={cdfSy(t)}
            stroke="var(--color-rule)"
            strokeWidth={0.5}
          />
        ))}

        {/* CDF axes */}
        <line
          x1={cdfOffset} y1={cdfSy(0)}
          x2={cdfOffset + panelW} y2={cdfSy(0)}
          stroke="var(--color-ink-faint)" strokeWidth={1}
        />
        <line
          x1={cdfOffset} y1={pad.top}
          x2={cdfOffset} y2={pad.top + plotH}
          stroke="var(--color-ink-faint)" strokeWidth={1}
        />

        {/* Y tick labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <text
            key={`cdf-yt-${t}`}
            x={cdfOffset - 6}
            y={cdfSy(t) + 3}
            textAnchor="end"
            fill="var(--color-ink-faint)"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '9px' }}
          >
            {t.toFixed(2)}
          </text>
        ))}

        {/* X tick labels */}
        {xTicks.map((t) => (
          <text
            key={`cdf-xt-${t}`}
            x={cdfSx(t)}
            y={cdfSy(0) + 14}
            textAnchor="middle"
            fill="var(--color-ink-faint)"
            style={{ fontFamily: 'var(--font-mono)', fontSize: '9px' }}
          >
            {t}
          </text>
        ))}

        {/* CDF curve */}
        <path
          d={cdfCurvePath}
          fill="none"
          stroke="var(--color-vector-green)"
          strokeWidth={2}
        />

        {/* Cursor vertical line on CDF */}
        {cursorX !== null && (
          <line
            x1={cdfSx(cursorX)} y1={pad.top}
            x2={cdfSx(cursorX)} y2={cdfSy(0)}
            stroke="var(--color-accent)"
            strokeWidth={1.5}
            strokeDasharray="4,3"
          />
        )}

        {/* Horizontal line on CDF at F(x) */}
        {cursorX !== null && (
          <line
            x1={cdfOffset} y1={cdfSy(currentCDF)}
            x2={cdfSx(cursorX)} y2={cdfSy(currentCDF)}
            stroke="var(--color-accent)"
            strokeWidth={1}
            strokeDasharray="3,3"
          />
        )}

        {/* Cursor dot on CDF curve */}
        {cursorX !== null && (
          <circle
            cx={cdfSx(cursorX)}
            cy={cdfSy(currentCDF)}
            r={4}
            fill="var(--color-accent)"
            stroke="var(--color-paper)"
            strokeWidth={2}
          />
        )}

        {/* Values display */}
        {cursorX !== null && (
          <g>
            <rect
              x={width / 2 - 110}
              y={height - pad.bottom + 18}
              width={220}
              height={20}
              rx={4}
              fill="var(--color-paper-elevated)"
              stroke="var(--color-rule)"
              strokeWidth={0.5}
            />
            <text
              x={width / 2}
              y={height - pad.bottom + 32}
              textAnchor="middle"
              fill="var(--color-ink)"
              style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}
            >
              {`x = ${currentX.toFixed(2)}   f(x) = ${currentPDF.toFixed(4)}   F(x) = ${currentCDF.toFixed(4)}`}
            </text>
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
        {/* Distribution type selector */}
        {(['uniform', 'exponential', 'normal'] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => handleDistChange(d)}
            style={{
              padding: '4px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: distType === d ? 'var(--color-accent)' : 'var(--color-rule)',
              background: distType === d ? 'var(--color-accent-soft)' : 'var(--color-paper)',
              color: distType === d ? 'var(--color-accent)' : 'var(--color-ink-muted)',
              fontFamily: 'var(--font-sans)',
              fontSize: '12px',
              fontWeight: distType === d ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {DISTRIBUTIONS[d].label}
          </button>
        ))}

        {/* Separator */}
        <div style={{ width: '1px', height: '20px', background: 'var(--color-rule)' }} />

        {/* Parameter sliders */}
        {dist.paramLabels.map((label, i) => (
          <label
            key={label}
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
              min={dist.paramRanges[i].min}
              max={dist.paramRanges[i].max}
              step={dist.paramRanges[i].step}
              value={params[i]}
              onChange={(e) => {
                const next = [...params];
                next[i] = +e.target.value;
                // For uniform, enforce a < b
                if (distType === 'uniform' && i === 0 && next[0] >= next[1]) {
                  next[0] = next[1] - 0.1;
                }
                if (distType === 'uniform' && i === 1 && next[1] <= next[0]) {
                  next[1] = next[0] + 0.1;
                }
                setParams(next);
              }}
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
              {params[i].toFixed(1)}
            </span>
          </label>
        ))}

        {/* Hint */}
        {cursorX === null && (
          <span
            style={{
              marginLeft: 'auto',
              fontFamily: 'var(--font-sans)',
              fontSize: '11px',
              color: 'var(--color-ink-faint)',
            }}
          >
            Click/drag on PDF panel to explore
          </span>
        )}
      </div>
    </div>
  );
}
