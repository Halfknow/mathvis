import { useState, useMemo } from 'react';

interface PartsExplorerProps {
  width?: number;
  height?: number;
}

/* ------------------------------------------------------------------ */
/*  Example data                                                       */
/* ------------------------------------------------------------------ */

interface Example {
  label: string;
  integrand: string;
  uLabel: string;
  dvLabel: string;
  duLabel: string;
  vLabel: string;
  uvLabel: string;
  integralVDuLabel: string;
  resultLabel: string;
  liateType: 'L' | 'I' | 'A' | 'T' | 'E';
  /** For the area diagram: proportional split [∫u dv fraction, ∫v du fraction] */
  areaSplit: [number, number];
}

const EXAMPLES: Example[] = [
  {
    label: '\u222Bx\u00B7e\u02E3dx',
    integrand: 'x \u00B7 e\u02E3',
    uLabel: 'u = x',
    dvLabel: 'dv = e\u02E3 dx',
    duLabel: 'du = dx',
    vLabel: 'v = e\u02E3',
    uvLabel: 'xe\u02E3',
    integralVDuLabel: '\u222Be\u02E3 dx',
    resultLabel: 'xe\u02E3 \u2212 e\u02E3 + C',
    liateType: 'A',
    areaSplit: [0.55, 0.45],
  },
  {
    label: '\u222Bx\u00B7cos(x)dx',
    integrand: 'x \u00B7 cos(x)',
    uLabel: 'u = x',
    dvLabel: 'dv = cos(x) dx',
    duLabel: 'du = dx',
    vLabel: 'v = sin(x)',
    uvLabel: 'x sin(x)',
    integralVDuLabel: '\u222Bsin(x) dx',
    resultLabel: 'x sin(x) + cos(x) + C',
    liateType: 'A',
    areaSplit: [0.5, 0.5],
  },
  {
    label: '\u222Bln(x)dx',
    integrand: 'ln(x)',
    uLabel: 'u = ln(x)',
    dvLabel: 'dv = dx',
    duLabel: 'du = (1/x) dx',
    vLabel: 'v = x',
    uvLabel: 'x ln(x)',
    integralVDuLabel: '\u222Bx \u00B7 (1/x) dx',
    resultLabel: 'x ln(x) \u2212 x + C',
    liateType: 'L',
    areaSplit: [0.6, 0.4],
  },
  {
    label: '\u222Bx\u00B2\u00B7e\u02E3dx',
    integrand: 'x\u00B2 \u00B7 e\u02E3',
    uLabel: 'u = x\u00B2',
    dvLabel: 'dv = e\u02E3 dx',
    duLabel: 'du = 2x dx',
    vLabel: 'v = e\u02E3',
    uvLabel: 'x\u00B2e\u02E3',
    integralVDuLabel: '\u222B2x\u00B7e\u02E3 dx',
    resultLabel: 'x\u00B2e\u02E3 \u2212 2xe\u02E3 + 2e\u02E3 + C',
    liateType: 'A',
    areaSplit: [0.5, 0.5],
  },
];

const STEPS = [
  'Choose u and dv from the integrand',
  'Compute du (differentiate) and v (integrate)',
  'Apply the formula: \u222Bu dv = uv \u2212 \u222Bv du',
  'Simplify to get the result',
] as const;

const LIATE = [
  { key: 'L', label: 'Log', color: 'var(--color-vector-blue)' },
  { key: 'I', label: 'Inv Trig', color: 'var(--color-vector-green)' },
  { key: 'A', label: 'Algebraic', color: 'var(--color-accent)' },
  { key: 'T', label: 'Trig', color: 'var(--color-vector-yellow)' },
  { key: 'E', label: 'Exponential', color: 'var(--color-vector-red)' },
] as const;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PartsExplorer({
  width = 640,
  height = 400,
}: PartsExplorerProps) {
  const [exampleIdx, setExampleIdx] = useState(0);
  const [step, setStep] = useState(1);

  const ex = EXAMPLES[exampleIdx];

  // Reset step when changing example
  const selectExample = (idx: number) => {
    setExampleIdx(idx);
    setStep(1);
  };

  /* ---- Layout constants ---- */
  const svgW = width;
  const svgH = height - 90; // reserve for readout below

  // Area diagram region
  const diagX = 30;
  const diagY = 30;
  const diagW = svgW * 0.42;
  const diagH = svgH - 80;

  // Formula region
  const formulaX = diagX + diagW + 30;
  const formulaY = 30;
  const formulaW = svgW - formulaX - 20;

  // Animated fill progress based on step
  const splitA = ex.areaSplit[0];
  const splitB = ex.areaSplit[1];
  const totalSplit = splitA + splitB;
  const fracA = splitA / totalSplit; // fraction for ∫u dv region

  // Step-based visibility
  const showArea = step >= 3;
  const showResult = step >= 4;

  /* ---- Area diagram ---- */
  const areaDiag = useMemo(() => {
    const rx = 6;
    const partAW = diagW * fracA;

    return (
      <g>
        {/* Outer rectangle label */}
        <text
          x={diagX + diagW / 2}
          y={diagY - 10}
          textAnchor="middle"
          className="text-[11px] font-semibold"
          fill="var(--color-ink-muted)"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          Rectangle area = u \u00D7 v
        </text>

        {/* ∫u dv region (left part) */}
        <rect
          x={diagX}
          y={diagY}
          width={showArea ? partAW : diagW}
          height={diagH}
          rx={rx}
          fill={showArea ? 'var(--color-vector-blue)' : 'var(--color-accent-soft)'}
          opacity={showArea ? 0.3 : 0.15}
          stroke={showArea ? 'var(--color-vector-blue)' : 'var(--color-rule)'}
          strokeWidth={1.5}
        />
        {!showArea && (
          <text
            x={diagX + diagW / 2}
            y={diagY + diagH / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[13px]"
            fill="var(--color-ink-muted)"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            uv
          </text>
        )}

        {/* ∫v du region (right part, only visible at step 3+) */}
        {showArea && (
          <>
            <rect
              x={diagX + partAW}
              y={diagY}
              width={diagW - partAW}
              height={diagH}
              rx={rx}
              fill="var(--color-vector-green)"
              opacity={0.3}
              stroke="var(--color-vector-green)"
              strokeWidth={1.5}
            />
            {/* Dashed divider */}
            <line
              x1={diagX + partAW}
              y1={diagY}
              x2={diagX + partAW}
              y2={diagY + diagH}
              stroke="var(--color-ink-faint)"
              strokeWidth={1}
              strokeDasharray="4,3"
            />

            {/* Labels inside regions */}
            <text
              x={diagX + partAW / 2}
              y={diagY + diagH / 2 - 8}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[11px] font-semibold"
              fill="var(--color-vector-blue)"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {'\u222Bu dv'}
            </text>
            <text
              x={diagX + partAW / 2}
              y={diagY + diagH / 2 + 10}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[10px]"
              fill="var(--color-ink-faint)"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {ex.label}
            </text>

            <text
              x={diagX + partAW + (diagW - partAW) / 2}
              y={diagY + diagH / 2 - 8}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[11px] font-semibold"
              fill="var(--color-vector-green)"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {'\u222Bv du'}
            </text>
            <text
              x={diagX + partAW + (diagW - partAW) / 2}
              y={diagY + diagH / 2 + 10}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[10px]"
              fill="var(--color-ink-faint)"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {ex.integralVDuLabel}
            </text>
          </>
        )}

        {/* Side labels: u on left, v on bottom */}
        <text
          x={diagX - 10}
          y={diagY + diagH / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-[12px] font-semibold"
          fill="var(--color-accent)"
          style={{ fontFamily: 'var(--font-mono)' }}
          transform={`rotate(-90, ${diagX - 10}, ${diagY + diagH / 2})`}
        >
          u
        </text>
        <text
          x={diagX + diagW / 2}
          y={diagY + diagH + 18}
          textAnchor="middle"
          className="text-[12px] font-semibold"
          fill="var(--color-accent)"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          v
        </text>

        {/* Brace/annotation: total area = uv */}
        {showArea && (
          <text
            x={diagX + diagW / 2}
            y={diagY + diagH + 35}
            textAnchor="middle"
            className="text-[10px]"
            fill="var(--color-ink-muted)"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            total area = uv = {'\u222Bu dv'} + {'\u222Bv du'}
          </text>
        )}
      </g>
    );
  }, [ex, step, diagW, diagH, diagX, diagY, fracA, showArea]);

  /* ---- Formula and step display ---- */
  const formulaDisplay = useMemo(() => {
    const lineH = 26;
    let cy = formulaY + 14;

    const line = (text: string, color: string, bold = false) => {
      const el = (
        <text
          key={cy}
          x={formulaX}
          y={cy}
          className={`text-[12px] ${bold ? 'font-semibold' : ''}`}
          fill={color}
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {text}
        </text>
      );
      cy += lineH;
      return el;
    };

    const lines: JSX.Element[] = [];

    // Header
    lines.push(
      <text
        key="header"
        x={formulaX}
        y={cy}
        className="text-[11px] font-semibold"
        fill="var(--color-ink-muted)"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        Step {step}: {STEPS[step - 1]}
      </text>,
    );
    cy += lineH + 4;

    // Step 1: Choose u and dv
    if (step >= 1) {
      lines.push(line('Integrand: ' + ex.integrand, 'var(--color-ink)'));
    }

    if (step >= 1) {
      lines.push(line(ex.uLabel, 'var(--color-accent)', true));
      lines.push(line(ex.dvLabel, 'var(--color-vector-blue)', true));
    }

    // Step 2: Compute du and v
    if (step >= 2) {
      cy += 4;
      lines.push(
        <line
          key={`sep2-${cy}`}
          x1={formulaX}
          y1={cy - 10}
          x2={formulaX + formulaW}
          y2={cy - 10}
          stroke="var(--color-rule)"
          strokeWidth={1}
        />,
      );
      lines.push(line(ex.duLabel, 'var(--color-accent)', true));
      lines.push(line(ex.vLabel, 'var(--color-vector-blue)', true));
    }

    // Step 3: Apply formula
    if (step >= 3) {
      cy += 4;
      lines.push(
        <line
          key={`sep3-${cy}`}
          x1={formulaX}
          y1={cy - 10}
          x2={formulaX + formulaW}
          y2={cy - 10}
          stroke="var(--color-rule)"
          strokeWidth={1}
        />,
      );
      lines.push(line('\u222Bu dv = uv \u2212 \u222Bv du', 'var(--color-ink)', true));
      lines.push(line('  = ' + ex.uvLabel + ' \u2212 ' + ex.integralVDuLabel, 'var(--color-ink-muted)'));
    }

    // Step 4: Result
    if (step >= 4) {
      cy += 4;
      lines.push(
        <line
          key={`sep4-${cy}`}
          x1={formulaX}
          y1={cy - 10}
          x2={formulaX + formulaW}
          y2={cy - 10}
          stroke="var(--color-rule)"
          strokeWidth={1}
        />,
      );
      lines.push(line('= ' + ex.resultLabel, 'var(--color-vector-green)', true));
    }

    // Special note for example 4 (two applications)
    if (step >= 4 && exampleIdx === 3) {
      cy += 2;
      lines.push(
        <text
          key="note"
          x={formulaX}
          y={cy}
          className="text-[10px]"
          fill="var(--color-vector-yellow)"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          * Requires a second application of parts
        </text>,
      );
    }

    return <g>{lines}</g>;
  }, [ex, step, exampleIdx, formulaX, formulaY, formulaW]);

  /* ---- LIATE badges ---- */
  const liateBadges = useMemo(() => {
    const bx = diagX;
    const by = svgH - 28;
    const badgeW = 68;
    const gap = 6;

    return (
      <g>
        <text
          x={bx}
          y={by - 6}
          className="text-[10px] font-semibold"
          fill="var(--color-ink-faint)"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          LIATE priority:
        </text>
        {LIATE.map((item, i) => {
          const isActive = item.key === ex.liateType;
          const x = bx + i * (badgeW + gap);
          return (
            <g key={item.key}>
              <rect
                x={x}
                y={by}
                width={badgeW}
                height={20}
                rx={4}
                fill={isActive ? item.color : 'var(--color-surface-1)'}
                opacity={isActive ? 0.2 : 1}
                stroke={isActive ? item.color : 'var(--color-rule)'}
                strokeWidth={isActive ? 1.5 : 1}
              />
              <text
                x={x + badgeW / 2}
                y={by + 14}
                textAnchor="middle"
                className="text-[9px]"
                fill={isActive ? item.color : 'var(--color-ink-faint)'}
                style={{ fontFamily: 'var(--font-sans)', fontWeight: isActive ? 700 : 400 }}
              >
                {item.key}({item.label})
              </text>
            </g>
          );
        })}
      </g>
    );
  }, [ex, diagX, svgH]);

  return (
    <div className="flex h-full w-full flex-col">
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="w-full"
        style={{ background: 'var(--color-paper)' }}
      >
        {areaDiag}
        {formulaDisplay}
        {liateBadges}
      </svg>

      {/* Readout bar */}
      <div className="flex flex-wrap items-center gap-4 border-t border-rule bg-paper-elevated px-4 py-2 font-mono text-[11px]">
        <span className="text-accent">{ex.uLabel}</span>
        <span className="text-ink-faint">|</span>
        <span className="text-accent">{ex.duLabel}</span>
        <span className="text-ink-faint">|</span>
        <span className="text-vector-blue">{ex.dvLabel}</span>
        <span className="text-ink-faint">|</span>
        <span className="text-vector-blue">{ex.vLabel}</span>
        {!showResult && (
          <span className="ml-auto text-ink-faint">
            {step < 4 ? 'Complete all steps to see result' : ''}
          </span>
        )}
        {showResult && (
          <span className="ml-auto font-semibold text-vector-green">
            {ex.resultLabel}
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 border-t border-rule bg-paper-elevated px-4 py-3">
        {/* Step slider */}
        <label className="flex items-center gap-2 font-sans text-xs text-ink-muted">
          Step
          <input
            type="range"
            min={1}
            max={4}
            step={1}
            value={step}
            onChange={(e) => setStep(+e.target.value)}
            className="h-1 w-24 cursor-pointer accent-[var(--color-accent)]"
          />
          <span className="font-mono text-xs text-ink w-4">{step}</span>
        </label>

        {/* Example selector */}
        <div className="flex gap-1">
          {EXAMPLES.map((e, i) => (
            <button
              key={e.label}
              type="button"
              onClick={() => selectExample(i)}
              className={`rounded-sm border px-2 py-0.5 font-mono text-[11px] transition-colors duration-fast ${
                i === exampleIdx
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-rule bg-paper-elevated text-ink-muted hover:bg-surface-1'
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mode indicator */}
      <div className="border-t border-rule bg-surface-1 px-4 py-1 text-center font-sans text-[10px] text-ink-muted">
        Integration by Parts: {'\u222Bu dv = uv \u2212 \u222Bv du'}
      </div>
    </div>
  );
}
