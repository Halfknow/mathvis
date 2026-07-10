import { useState, useMemo } from 'react';

interface PartialFractionsVisProps {
  width?: number;
  height?: number;
}

/** A partial fraction preset: P(x) / [(x - r1)(x - r2)] = A/(x - r1) + B/(x - r2) */
type Preset = {
  /** Numerator polynomial P(x) */
  numerator: (x: number) => number;
  /** Full rational function P(x) / Q(x) */
  fn: (x: number) => number;
  /** Roots of denominator Q(x) */
  roots: [number, number];
  /** Correct partial-fraction coefficients */
  correctA: number;
  correctB: number;
  /** Display label for the rational function */
  label: string;
  /** LaTeX-ish numerator label */
  numLabel: string;
};

const PRESETS: Record<string, Preset> = {
  '1/[(x-1)(x+2)]': {
    numerator: () => 1,
    fn: (x) => 1 / ((x - 1) * (x + 2)),
    roots: [1, -2],
    correctA: 1 / 3,
    correctB: -1 / 3,
    label: '1 / [(x\u22121)(x+2)]',
    numLabel: '1',
  },
  '(5x+3)/[(x+1)(x-2)]': {
    numerator: (x) => 5 * x + 3,
    fn: (x) => (5 * x + 3) / ((x + 1) * (x - 2)),
    roots: [-1, 2],
    correctA: 2 / 3,
    correctB: 13 / 3,
    label: '(5x+3) / [(x+1)(x\u22122)]',
    numLabel: '5x+3',
  },
  '1/[(x-1)(x+3)]': {
    numerator: () => 1,
    fn: (x) => 1 / ((x - 1) * (x + 3)),
    roots: [1, -3],
    correctA: 1 / 4,
    correctB: -1 / 4,
    label: '1 / [(x\u22121)(x+3)]',
    numLabel: '1',
  },
};

const PRESET_KEYS = Object.keys(PRESETS);

export function PartialFractionsVis({
  width = 640,
  height = 400,
}: PartialFractionsVisProps) {
  const [presetKey, setPresetKey] = useState(PRESET_KEYS[0]);
  const [coeffA, setCoeffA] = useState(0);
  const [coeffB, setCoeffB] = useState(0);
  const [autoSolve, setAutoSolve] = useState(false);

  const preset = PRESETS[presetKey];
  const [r1, r2] = preset.roots;
  const cA = autoSolve ? preset.correctA : coeffA;
  const cB = autoSolve ? preset.correctB : coeffB;

  // Partial fraction terms
  const termA = (x: number) => cA / (x - r1);
  const termB = (x: number) => cB / (x - r2);
  const decomposedSum = (x: number) => termA(x) + termB(x);

  const isMatch = Math.abs(cA - preset.correctA) < 0.05 && Math.abs(cB - preset.correctB) < 0.05;

  // --- Plot geometry ---
  const padding = { top: 30, right: 30, bottom: 40, left: 50 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  // Dynamic x-range based on root positions
  const center = (r1 + r2) / 2;
  const span = Math.abs(r1 - r2);
  const xMin = center - span - 3;
  const xMax = center + span + 3;
  const yMin = -5;
  const yMax = 5;

  const sx = (x: number) => padding.left + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y: number) => padding.top + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  // Build an SVG path from a function, breaking at asymptotes and out-of-range
  const buildPath = useMemo(() => {
    return (fn: (x: number) => number, epsilon = 0.08) => {
      const segments: string[] = [];
      let currentSeg: string[] = [];
      const steps = 400;
      for (let i = 0; i <= steps; i++) {
        const x = xMin + (i / steps) * (xMax - xMin);
        // Skip points too close to an asymptote
        const nearAsymptote =
          Math.abs(x - r1) < epsilon || Math.abs(x - r2) < epsilon;
        if (nearAsymptote) {
          if (currentSeg.length > 0) {
            segments.push(currentSeg.join(' '));
            currentSeg = [];
          }
          continue;
        }
        const y = fn(x);
        if (isNaN(y) || !isFinite(y) || y < yMin - 2 || y > yMax + 2) {
          if (currentSeg.length > 0) {
            segments.push(currentSeg.join(' '));
            currentSeg = [];
          }
          continue;
        }
        const cmd = currentSeg.length === 0 ? 'M' : 'L';
        currentSeg.push(`${cmd}${sx(x).toFixed(1)},${sy(y).toFixed(1)}`);
      }
      if (currentSeg.length > 0) {
        segments.push(currentSeg.join(' '));
      }
      return segments;
    };
  }, [width, height, presetKey]);

  const originalPaths = useMemo(() => buildPath(preset.fn), [presetKey, buildPath]);
  const termAPaths = useMemo(() => buildPath(termA), [presetKey, cA, buildPath]);
  const termBPaths = useMemo(() => buildPath(termB), [presetKey, cB, buildPath]);
  const sumPaths = useMemo(() => buildPath(decomposedSum), [presetKey, cA, cB, buildPath]);

  // Gap shading between original and decomposed sum
  const gapRegions = useMemo(() => {
    const regions: string[] = [];
    const steps = 400;
    const epsilon = 0.08;
    for (let pass = 0; pass < 2; pass++) {
      const upperPts: string[] = [];
      const lowerPts: string[] = [];
      for (let i = 0; i <= steps; i++) {
        const x = xMin + (i / steps) * (xMax - xMin);
        if (Math.abs(x - r1) < epsilon || Math.abs(x - r2) < epsilon) {
          if (upperPts.length > 0 && lowerPts.length > 0) {
            // Close region
            const region =
              upperPts.join(' ') + ' ' + lowerPts.reverse().join(' ') + ' Z';
            regions.push(region);
            upperPts.length = 0;
            lowerPts.length = 0;
          }
          continue;
        }
        const origY = preset.fn(x);
        const sumY = decomposedSum(x);
        if (
          isNaN(origY) ||
          !isFinite(origY) ||
          isNaN(sumY) ||
          !isFinite(sumY) ||
          origY < yMin - 1 ||
          origY > yMax + 1 ||
          sumY < yMin - 1 ||
          sumY > yMax + 1
        ) {
          if (upperPts.length > 0 && lowerPts.length > 0) {
            const region =
              upperPts.join(' ') + ' ' + lowerPts.reverse().join(' ') + ' Z';
            regions.push(region);
            upperPts.length = 0;
            lowerPts.length = 0;
          }
          continue;
        }
        if (Math.abs(origY - sumY) < 0.01) continue;
        const uY = Math.max(origY, sumY);
        const lY = Math.min(origY, sumY);
        const uCmd = upperPts.length === 0 ? 'M' : 'L';
        const lCmd = lowerPts.length === 0 ? 'M' : 'L';
        upperPts.push(`${uCmd}${sx(x).toFixed(1)},${sy(uY).toFixed(1)}`);
        lowerPts.push(`${lCmd}${sx(x).toFixed(1)},${sy(lY).toFixed(1)}`);
      }
      // We only need one pass; break
      break;
    }
    return regions;
  }, [presetKey, cA, cB]);

  // Grid lines
  const gridLines = useMemo(() => {
    const lines: JSX.Element[] = [];
    for (let x = Math.ceil(xMin); x <= xMax; x++) {
      const isAxis = x === 0;
      lines.push(
        <line
          key={`v${x}`}
          x1={sx(x)} y1={sy(yMin)} x2={sx(x)} y2={sy(yMax)}
          stroke={isAxis ? 'var(--color-ink-faint)' : 'var(--color-rule)'}
          strokeWidth={isAxis ? 1 : 0.5}
        />
      );
    }
    for (let y = Math.ceil(yMin); y <= yMax; y++) {
      const isAxis = y === 0;
      lines.push(
        <line
          key={`h${y}`}
          x1={sx(xMin)} y1={sy(y)} x2={sx(xMax)} y2={sy(y)}
          stroke={isAxis ? 'var(--color-ink-faint)' : 'var(--color-rule)'}
          strokeWidth={isAxis ? 1 : 0.5}
        />
      );
    }
    return lines;
  }, [width, height, presetKey]);

  // Format coefficient for display
  const fmtCoeff = (v: number) => {
    if (Math.abs(v - Math.round(v)) < 0.001) return Math.round(v).toString();
    // Try simple fractions
    for (let d = 1; d <= 12; d++) {
      const n = v * d;
      if (Math.abs(n - Math.round(n)) < 0.01) {
        const num = Math.round(n);
        if (num < 0) return `-${Math.abs(num)}/${d}`;
        return `${num}/${d}`;
      }
    }
    return v.toFixed(2);
  };

  const rootLabel = (r: number) => {
    if (r === 1) return 'x\u22121';
    if (r === -1) return 'x+1';
    if (r > 0) return `x\u2212${r}`;
    return `x+${Math.abs(r)}`;
  };

  // Slider range for coefficients
  const sliderMin = -5;
  const sliderMax = 5;
  const sliderStep = 0.05;

  return (
    <div className="flex h-full w-full flex-col">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ background: 'var(--color-paper)' }}
      >
        <defs>
          <clipPath id="plotClip">
            <rect x={padding.left} y={padding.top} width={plotW} height={plotH} />
          </clipPath>
        </defs>

        {gridLines}

        {/* Clip the plot area */}
        <g clipPath="url(#plotClip)">
          {/* Gap shading */}
          {!isMatch &&
            gapRegions.map((d, i) => (
              <path
                key={`gap${i}`}
                d={d}
                fill="var(--color-vector-red)"
                opacity={0.12}
                stroke="none"
              />
            ))}

          {/* Partial fraction term A (dashed, green) */}
          {termAPaths.map((d, i) => (
            <path
              key={`termA${i}`}
              d={d}
              fill="none"
              stroke="var(--color-vector-green)"
              strokeWidth={1.5}
              strokeDasharray="5,3"
            />
          ))}

          {/* Partial fraction term B (dashed, yellow) */}
          {termBPaths.map((d, i) => (
            <path
              key={`termB${i}`}
              d={d}
              fill="none"
              stroke="var(--color-vector-yellow)"
              strokeWidth={1.5}
              strokeDasharray="5,3"
            />
          ))}

          {/* Decomposed sum (dashed, terracotta/accent) */}
          {sumPaths.map((d, i) => (
            <path
              key={`sum${i}`}
              d={d}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth={2}
              strokeDasharray="8,4"
            />
          ))}

          {/* Original rational function (solid blue) */}
          {originalPaths.map((d, i) => (
            <path
              key={`orig${i}`}
              d={d}
              fill="none"
              stroke="var(--color-vector-blue)"
              strokeWidth={2.5}
            />
          ))}
        </g>

        {/* Vertical asymptotes */}
        {[r1, r2].map((root) => (
          <line
            key={`asym${root}`}
            x1={sx(root)} y1={sy(yMin)}
            x2={sx(root)} y2={sy(yMax)}
            stroke="var(--color-vector-red)"
            strokeWidth={1}
            strokeDasharray="3,4"
            opacity={0.7}
          />
        ))}

        {/* Asymptote labels */}
        {[r1, r2].map((root) => (
          <text
            key={`asymLabel${root}`}
            x={sx(root) + 4}
            y={sy(yMax - 0.3)}
            className="text-[9px]"
            fill="var(--color-vector-red)"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            x={root}
          </text>
        ))}

        {/* Match indicator */}
        {isMatch && (
          <g>
            <rect
              x={width - 90}
              y={8}
              width={78}
              height={22}
              rx={4}
              fill="var(--color-vector-green)"
              opacity={0.15}
            />
            <text
              x={width - 51}
              y={23}
              textAnchor="middle"
              className="text-[11px] font-bold"
              fill="var(--color-vector-green)"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Match!
            </text>
          </g>
        )}

        {/* Legend */}
        <g>
          <line x1={12} y1={16} x2={32} y2={16} stroke="var(--color-vector-blue)" strokeWidth={2.5} />
          <text x={36} y={20} className="text-[10px]" fill="var(--color-ink-muted)" style={{ fontFamily: 'var(--font-sans)' }}>original</text>

          <line x1={12} y1={30} x2={32} y2={30} stroke="var(--color-vector-green)" strokeWidth={1.5} strokeDasharray="4,2" />
          <text x={36} y={34} className="text-[10px]" fill="var(--color-ink-muted)" style={{ fontFamily: 'var(--font-sans)' }}>A/({rootLabel(r1)})</text>

          <line x1={12} y1={44} x2={32} y2={44} stroke="var(--color-vector-yellow)" strokeWidth={1.5} strokeDasharray="4,2" />
          <text x={36} y={48} className="text-[10px]" fill="var(--color-ink-muted)" style={{ fontFamily: 'var(--font-sans)' }}>B/({rootLabel(r2)})</text>

          <line x1={12} y1={58} x2={32} y2={58} stroke="var(--color-accent)" strokeWidth={2} strokeDasharray="6,3" />
          <text x={36} y={62} className="text-[10px]" fill="var(--color-ink-muted)" style={{ fontFamily: 'var(--font-sans)' }}>sum</text>
        </g>
      </svg>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 border-t border-rule bg-paper-elevated px-4 py-3">
        {/* Preset selector */}
        <div className="flex gap-1">
          {PRESET_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setPresetKey(k);
                setCoeffA(0);
                setCoeffB(0);
              }}
              className={`rounded-sm border px-2 py-0.5 font-mono text-[10px] transition-colors duration-fast ${
                k === presetKey
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-rule bg-paper-elevated text-ink-muted hover:bg-surface-1'
              }`}
            >
              {PRESETS[k].label}
            </button>
          ))}
        </div>

        {/* Auto-solve toggle */}
        <label className="flex cursor-pointer items-center gap-2 font-sans text-xs text-ink-muted">
          <input
            type="checkbox"
            checked={autoSolve}
            onChange={(e) => setAutoSolve(e.target.checked)}
            className="accent-[var(--color-accent)]"
          />
          Auto-solve
        </label>
      </div>

      {/* Coefficient sliders */}
      <div className="flex flex-wrap items-center gap-4 border-t border-rule bg-paper-elevated px-4 py-3">
        <label className="flex items-center gap-2 font-sans text-xs text-ink-muted">
          <span className="font-mono text-[var(--color-vector-green)]">A</span>
          <input
            type="range"
            min={sliderMin}
            max={sliderMax}
            step={sliderStep}
            value={cA}
            onChange={(e) => setCoeffA(+e.target.value)}
            disabled={autoSolve}
            className="h-1 w-28 cursor-pointer accent-[var(--color-vector-green)] disabled:cursor-default disabled:opacity-50"
          />
          <span className="w-10 font-mono text-xs text-ink">{cA.toFixed(2)}</span>
        </label>

        <label className="flex items-center gap-2 font-sans text-xs text-ink-muted">
          <span className="font-mono text-[var(--color-vector-yellow)]">B</span>
          <input
            type="range"
            min={sliderMin}
            max={sliderMax}
            step={sliderStep}
            value={cB}
            onChange={(e) => setCoeffB(+e.target.value)}
            disabled={autoSolve}
            className="h-1 w-28 cursor-pointer accent-[var(--color-vector-yellow)] disabled:cursor-default disabled:opacity-50"
          />
          <span className="w-10 font-mono text-xs text-ink">{cB.toFixed(2)}</span>
        </label>

        {/* Readout: correct vs current */}
        <div className="ml-auto flex gap-3 font-mono text-[11px]">
          <span className="text-vector-green">
            A = {fmtCoeff(cA)}
            {!autoSolve && (
              <span className="text-ink-faint"> (correct: {fmtCoeff(preset.correctA)})</span>
            )}
          </span>
          <span className="text-vector-yellow">
            B = {fmtCoeff(cB)}
            {!autoSolve && (
              <span className="text-ink-faint"> (correct: {fmtCoeff(preset.correctB)})</span>
            )}
          </span>
        </div>
      </div>

      {/* Equation readout */}
      <div className="border-t border-rule bg-surface-1 px-4 py-2 text-center font-mono text-[11px] text-ink-muted">
        {preset.numLabel} / [({rootLabel(r1)})({rootLabel(r2)})] ={' '}
        <span className="text-[var(--color-vector-green)]">{fmtCoeff(cA)}</span>/({rootLabel(r1)}) +{' '}
        <span className="text-[var(--color-vector-yellow)]">{fmtCoeff(cB)}</span>/({rootLabel(r2)})
        {isMatch && (
          <span className="ml-2 text-[var(--color-vector-green)]">
            {' '}| Integral: {fmtCoeff(cA)} ln|x{r1 > 0 ? '\u2212' : '+'}{Math.abs(r1)}| + {fmtCoeff(cB)} ln|x{r2 > 0 ? '\u2212' : '+'}{Math.abs(r2)}| + C
          </span>
        )}
      </div>
    </div>
  );
}
