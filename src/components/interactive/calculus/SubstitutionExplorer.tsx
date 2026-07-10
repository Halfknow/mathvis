import { useState, useMemo } from 'react';

interface SubstitutionExplorerProps {
  width?: number;
  height?: number;
}

type SubstitutionDef = {
  /** Integrand f(x) — the original function of x */
  fn: (x: number) => number;
  /** u as a function of x */
  uOfX: (x: number) => number;
  /** The integrand expressed in terms of u: g(u) where ∫g(u)du is the substituted integral */
  gu: (u: number) => number;
  /** Antiderivative expressed in u (for shading the substituted curve's area) */
  antiderivU: (u: number) => number;
  /** Antiderivative expressed back in x — the final result */
  antiderivX: (x: number) => number;
  /** Label for the original integral, LaTeX-like */
  labelOrig: string;
  /** Label for u substitution */
  labelU: string;
  /** Label for du */
  labelDu: string;
  /** Label for the substituted integral */
  labelSub: string;
  /** Label for the final result */
  labelResult: string;
  /** Button display name */
  shortLabel: string;
  /** x-axis range for plotting */
  xMin: number;
  xMax: number;
  /** Integration bounds [a, b] */
  a: number;
  b: number;
};

const PRESETS: Record<string, SubstitutionDef> = {
  '2x·cos(x²)': {
    fn: (x) => 2 * x * Math.cos(x * x),
    uOfX: (x) => x * x,
    gu: (u) => Math.cos(u),
    antiderivU: (u) => Math.sin(u),
    antiderivX: (x) => Math.sin(x * x),
    labelOrig: '\u222B 2x\u00B7cos(x\u00B2) dx',
    labelU: 'u = x\u00B2',
    labelDu: 'du = 2x dx',
    labelSub: '\u222B cos(u) du',
    labelResult: 'sin(x\u00B2) + C',
    shortLabel: '2x\u00B7cos(x\u00B2)',
    xMin: -2,
    xMax: 2,
    a: -1.5,
    b: 1.5,
  },
  'x\u00B7e^(x\u00B2)': {
    fn: (x) => x * Math.exp(x * x),
    uOfX: (x) => x * x,
    gu: (u) => 0.5 * Math.exp(u),
    antiderivU: (u) => 0.5 * Math.exp(u),
    antiderivX: (x) => 0.5 * Math.exp(x * x),
    labelOrig: '\u222B x\u00B7e^(x\u00B2) dx',
    labelU: 'u = x\u00B2',
    labelDu: 'du = 2x dx  \u2192  \u00BDdu = x dx',
    labelSub: '\u00BD \u222B e\u1D58 du',
    labelResult: '\u00BDe^(x\u00B2) + C',
    shortLabel: 'x\u00B7e^(x\u00B2)',
    xMin: -1.5,
    xMax: 1.5,
    a: -1,
    b: 1,
  },
  '3x\u00B2(x\u00B3+1)\u2074': {
    fn: (x) => 3 * x * x * Math.pow(x * x * x + 1, 4),
    uOfX: (x) => x * x * x + 1,
    gu: (u) => Math.pow(u, 4),
    antiderivU: (u) => Math.pow(u, 5) / 5,
    antiderivX: (x) => Math.pow(x * x * x + 1, 5) / 5,
    labelOrig: '\u222B 3x\u00B2(x\u00B3+1)\u2074 dx',
    labelU: 'u = x\u00B3+1',
    labelDu: 'du = 3x\u00B2 dx',
    labelSub: '\u222B u\u2074 du',
    labelResult: '(x\u00B3+1)\u2075/5 + C',
    shortLabel: '3x\u00B2(x\u00B3+1)\u2074',
    xMin: -1.5,
    xMax: 1.5,
    a: -1,
    b: 1,
  },
  'cos(x)\u00B7sin(x)': {
    fn: (x) => Math.cos(x) * Math.sin(x),
    uOfX: (x) => Math.sin(x),
    gu: (u) => u,
    antiderivU: (u) => (u * u) / 2,
    antiderivX: (x) => (Math.sin(x) * Math.sin(x)) / 2,
    labelOrig: '\u222B cos(x)\u00B7sin(x) dx',
    labelU: 'u = sin(x)',
    labelDu: 'du = cos(x) dx',
    labelSub: '\u222B u du',
    labelResult: '\u00BDsin\u00B2(x) + C',
    shortLabel: 'cos(x)\u00B7sin(x)',
    xMin: -2,
    xMax: 4,
    a: 0,
    b: Math.PI / 2,
  },
};

export function SubstitutionExplorer({
  width = 640,
  height = 400,
}: SubstitutionExplorerProps) {
  const [presetKey, setPresetKey] = useState('2x\u00B7cos(x\u00B2)');
  const [showMapping, setShowMapping] = useState(true);
  const [showSubstituted, setShowSubstituted] = useState(true);

  const preset = PRESETS[presetKey];
  const { fn, uOfX, gu, antiderivX, a, b } = preset;

  // Plot layout — top region for graph, bottom strip for readout
  const plotHeight = height - 80;
  const readoutY = plotHeight + 4;

  const padding = { top: 20, right: 30, bottom: 36, left: 50 };
  const plotW = width - padding.left - padding.right;
  const plotH = plotHeight - padding.top - padding.bottom;

  const xMin = preset.xMin;
  const xMax = preset.xMax;

  // Compute y range from function samples
  const { yMin, yMax } = useMemo(() => {
    let flo = 0, fhi = 0;
    let glo = 0, ghi = 0;
    for (let i = 0; i <= 200; i++) {
      const x = xMin + (i / 200) * (xMax - xMin);
      const y = fn(x);
      const u = uOfX(x);
      const g = gu(u);
      if (y < flo) flo = y;
      if (y > fhi) fhi = y;
      if (g < glo) glo = g;
      if (g > ghi) ghi = g;
    }
    const pad = Math.max((fhi - flo) * 0.15, 0.5);
    return {
      yMin: Math.min(flo, glo) - pad,
      yMax: Math.max(fhi, ghi) + pad,
    };
  }, [presetKey]);

  // Scale helpers — x axis maps x values, y axis maps both f(x) and g(u) values
  const sx = (x: number) => padding.left + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y: number) => padding.top + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  // Build SVG path for a function
  const buildPath = useMemo(() => {
    return (fnToPlot: (t: number) => number, tMin: number, tMax: number) => {
      const pts: string[] = [];
      const steps = 300;
      for (let i = 0; i <= steps; i++) {
        const t = tMin + (i / steps) * (tMax - tMin);
        const y = fnToPlot(t);
        if (y < yMin - 5 || y > yMax + 5) {
          if (pts.length > 0 && !pts[pts.length - 1].startsWith('M')) {
            // restart
          }
          continue;
        }
        pts.push(`${pts.length === 0 ? 'M' : 'L'}${sx(t).toFixed(1)},${sy(y).toFixed(1)}`);
      }
      return pts.join(' ');
    };
  }, [width, height, presetKey]);

  // Original integrand f(x)
  const origPath = useMemo(() => buildPath(fn, xMin, xMax), [presetKey, buildPath]);

  // Substituted integrand g(u), plotted against the x-axis via u = u(x)
  // i.e., we plot g(u(x)) as a function of x
  const subPath = useMemo(() => {
    if (!showSubstituted) return '';
    return buildPath((x: number) => gu(uOfX(x)), xMin, xMax);
  }, [presetKey, showSubstituted, buildPath]);

  // Antiderivative in x for the result view
  const antiderivPath = useMemo(() => buildPath(antiderivX, xMin, xMax), [presetKey, buildPath]);

  // Shaded region under f(x) between a and b
  const shadedArea = useMemo(() => {
    const pts: string[] = [];
    const steps = 200;
    // Start at (a, 0)
    pts.push(`M${sx(a).toFixed(1)},${sy(0).toFixed(1)}`);
    for (let i = 0; i <= steps; i++) {
      const x = a + (i / steps) * (b - a);
      const y = fn(x);
      pts.push(`L${sx(x).toFixed(1)},${sy(Math.max(yMin, Math.min(yMax, y))).toFixed(1)}`);
    }
    // Close back to (b, 0)
    pts.push(`L${sx(b).toFixed(1)},${sy(0).toFixed(1)}`);
    pts.push('Z');
    return pts.join(' ');
  }, [presetKey, width]);

  // Mapping arrows — connect x values to corresponding u values
  const mappingArrows = useMemo(() => {
    if (!showMapping) return [];
    const arrows: Array<{ x1: number; y1: number; x2: number; y2: number; label: string }> = [];
    const nArrows = 7;
    for (let i = 1; i < nArrows; i++) {
      const x = a + (i / nArrows) * (b - a);
      const fVal = fn(x);
      const uVal = uOfX(x);
      const gVal = gu(uVal);
      // Arrow from f(x) point down to g(u(x)) point
      arrows.push({
        x1: sx(x),
        y1: sy(fVal),
        x2: sx(x),
        y2: sy(gVal),
        label: `u=${uVal.toFixed(1)}`,
      });
    }
    return arrows;
  }, [presetKey, showMapping, width]);

  // Grid lines
  const gridLines = useMemo(() => {
    const lines: JSX.Element[] = [];
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
      const isAxis = x === 0;
      lines.push(
        <line
          key={`v${x}`}
          x1={sx(x)} y1={sy(yMin)}
          x2={sx(x)} y2={sy(yMax)}
          stroke={isAxis ? 'var(--color-ink-faint)' : 'var(--color-rule)'}
          strokeWidth={isAxis ? 1 : 0.5}
        />,
      );
    }
    const yStep = Math.max(1, Math.round((yMax - yMin) / 10));
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y += yStep) {
      const isAxis = y === 0;
      lines.push(
        <line
          key={`h${y}`}
          x1={sx(xMin)} y1={sy(y)}
          x2={sx(xMax)} y2={sy(y)}
          stroke={isAxis ? 'var(--color-ink-faint)' : 'var(--color-rule)'}
          strokeWidth={isAxis ? 1 : 0.5}
        />,
      );
    }
    return lines;
  }, [presetKey, width]);

  // Integration bound lines
  const boundLines = useMemo(() => (
    <>
      <line
        x1={sx(a)} y1={sy(yMin)}
        x2={sx(a)} y2={sy(yMax)}
        stroke="var(--color-accent)"
        strokeWidth={1.5}
        strokeDasharray="4,3"
      />
      <line
        x1={sx(b)} y1={sy(yMin)}
        x2={sx(b)} y2={sy(yMax)}
        stroke="var(--color-accent)"
        strokeWidth={1.5}
        strokeDasharray="4,3"
      />
    </>
  ), [presetKey, width]);

  // Compute numerical integral for readout
  const numericalIntegral = useMemo(() => {
    let sum = 0;
    const steps = 1000;
    const dx = (b - a) / steps;
    for (let i = 0; i < steps; i++) {
      const x = a + (i + 0.5) * dx;
      sum += fn(x) * dx;
    }
    return sum;
  }, [presetKey]);

  const exactValue = antiderivX(b) - antiderivX(a);

  return (
    <div className="flex h-full w-full flex-col">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ background: 'var(--color-paper)' }}
      >
        {gridLines}

        {/* Shaded area under original integrand */}
        <path
          d={shadedArea}
          fill="var(--color-vector-blue)"
          opacity={0.12}
        />

        {/* Mapping arrows from f(x) to g(u(x)) */}
        {showMapping && mappingArrows.map((arrow, i) => (
          <g key={`map${i}`}>
            <line
              x1={arrow.x1} y1={arrow.y1}
              x2={arrow.x2} y2={arrow.y2}
              stroke="var(--color-ink-faint)"
              strokeWidth={1}
              strokeDasharray="2,2"
              opacity={0.6}
            />
            {/* Small dot at each end */}
            <circle cx={arrow.x1} cy={arrow.y1} r={2.5} fill="var(--color-vector-blue)" opacity={0.7} />
            <circle cx={arrow.x2} cy={arrow.y2} r={2.5} fill="var(--color-vector-green)" opacity={0.7} />
          </g>
        ))}

        {boundLines}

        {/* Original integrand f(x) */}
        <path
          d={origPath}
          fill="none"
          stroke="var(--color-vector-blue)"
          strokeWidth={2.5}
        />

        {/* Substituted integrand g(u(x)) — plotted vs x */}
        {showSubstituted && subPath && (
          <path
            d={subPath}
            fill="none"
            stroke="var(--color-vector-green)"
            strokeWidth={2}
            strokeDasharray="8,4"
          />
        )}

        {/* Antiderivative (result) curve */}
        <path
          d={antiderivPath}
          fill="none"
          stroke="var(--color-vector-yellow)"
          strokeWidth={1.5}
          strokeDasharray="3,3"
        />

        {/* Bound labels */}
        <text
          x={sx(a)} y={sy(yMin) + 14}
          textAnchor="middle"
          className="text-[10px]"
          fill="var(--color-accent)"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          a={a.toFixed(1)}
        </text>
        <text
          x={sx(b)} y={sy(yMin) + 14}
          textAnchor="middle"
          className="text-[10px]"
          fill="var(--color-accent)"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          b={b.toFixed(1)}
        </text>

        {/* Legend */}
        <g>
          <line x1={width - 160} y1={18} x2={width - 140} y2={18} stroke="var(--color-vector-blue)" strokeWidth={2.5} />
          <text x={width - 135} y={22} className="text-[10px]" fill="var(--color-ink-muted)" style={{ fontFamily: 'var(--font-sans)' }}>f(x) original</text>
        </g>
        {showSubstituted && (
          <g>
            <line x1={width - 160} y1={32} x2={width - 140} y2={32} stroke="var(--color-vector-green)" strokeWidth={2} strokeDasharray="8,4" />
            <text x={width - 135} y={36} className="text-[10px]" fill="var(--color-ink-muted)" style={{ fontFamily: 'var(--font-sans)' }}>g(u) substituted</text>
          </g>
        )}
        <g>
          <line x1={width - 160} y1={46} x2={width - 140} y2={46} stroke="var(--color-vector-yellow)" strokeWidth={1.5} strokeDasharray="3,3" />
          <text x={width - 135} y={50} className="text-[10px]" fill="var(--color-ink-muted)" style={{ fontFamily: 'var(--font-sans)' }}>result</text>
        </g>

        {/* Readout strip at bottom */}
        <rect
          x={0} y={readoutY}
          width={width} height={76}
          fill="var(--color-surface-1)"
        />
        <line
          x1={0} y1={readoutY}
          x2={width} y2={readoutY}
          stroke="var(--color-rule)"
          strokeWidth={1}
        />

        {/* Step labels */}
        <text x={12} y={readoutY + 16} className="text-[11px]" fill="var(--color-vector-blue)" style={{ fontFamily: 'var(--font-mono)' }}>
          Step 1: {preset.labelOrig}
        </text>
        <text x={12} y={readoutY + 32} className="text-[11px]" fill="var(--color-vector-green)" style={{ fontFamily: 'var(--font-mono)' }}>
          Step 2: {preset.labelU}  ,  {preset.labelDu}  \u2192  {preset.labelSub}
        </text>
        <text x={12} y={readoutY + 48} className="text-[11px]" fill="var(--color-vector-yellow)" style={{ fontFamily: 'var(--font-mono)' }}>
          Step 3: = {preset.labelResult}
        </text>
        <text x={12} y={readoutY + 66} className="text-[10px]" fill="var(--color-ink-faint)" style={{ fontFamily: 'var(--font-mono)' }}>
          numerical \u2248 {numericalIntegral.toFixed(4)}   exact = {exactValue.toFixed(4)}
        </text>

        {/* Axis labels */}
        <text
          x={width / 2} y={plotHeight - 2}
          textAnchor="middle"
          className="text-[11px]"
          fill="var(--color-ink-muted)"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          x
        </text>
      </svg>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 border-t border-rule bg-paper-elevated px-4 py-3">
        <div className="flex gap-1">
          {Object.keys(PRESETS).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setPresetKey(k)}
              className={`rounded-sm border px-2 py-0.5 font-mono text-[11px] transition-colors duration-fast ${
                k === presetKey
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-rule bg-paper-elevated text-ink-muted hover:bg-surface-1'
              }`}
            >
              {PRESETS[k].shortLabel}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <label className="flex items-center gap-1.5 font-sans text-[11px] text-ink-muted">
            <input
              type="checkbox"
              checked={showMapping}
              onChange={(e) => setShowMapping(e.target.checked)}
              className="accent-[var(--color-accent)]"
            />
            mapping
          </label>
          <label className="flex items-center gap-1.5 font-sans text-[11px] text-ink-muted">
            <input
              type="checkbox"
              checked={showSubstituted}
              onChange={(e) => setShowSubstituted(e.target.checked)}
              className="accent-[var(--color-accent)]"
            />
            g(u)
          </label>
        </div>

        <div className="ml-auto font-mono text-[11px] text-ink-muted">
          <span className="text-vector-blue">f(x)</span>
          {' \u2192 '}
          <span className="text-vector-green">g(u)</span>
          {' \u2192 '}
          <span className="text-vector-yellow">F(x)</span>
        </div>
      </div>
    </div>
  );
}
