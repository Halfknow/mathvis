import { useState, useMemo } from 'react';

interface ConvergenceTestExplorerProps {
  width?: number;
  height?: number;
}

/* ------------------------------------------------------------------ */
/*  Series definitions                                                 */
/* ------------------------------------------------------------------ */

type Verdict = 'CONVERGES' | 'DIVERGES' | 'INCONCLUSIVE' | null;

interface TestStep {
  test: string;
  question: string;
  computation: string;
  result: string;
  verdict: Verdict;
  /** Which branch was taken: 'yes' | 'no' | 'continue' */
  branch: 'yes' | 'no' | 'continue';
}

interface SeriesDef {
  label: string;
  texLabel: string;
  steps: TestStep[];
}

const SERIES: SeriesDef[] = [
  {
    label: '\u2211 n!/n\u207F',
    texLabel: '\u2211 n!/n\u207F',
    steps: [
      {
        test: 'Divergence test',
        question: 'Does a\u2099 \u2192 0?',
        computation: 'lim n\u2192\u221E n!/n\u207F = 0  (Stirling\u2019s approx)',
        result: 'a\u2099 \u2192 0  \u2714',
        verdict: null,
        branch: 'yes',
      },
      {
        test: 'Known form?',
        question: 'Is it p-series or geometric?',
        computation: 'n!/n\u207F is neither p-series nor geometric',
        result: 'No known form',
        verdict: null,
        branch: 'no',
      },
      {
        test: 'Ratio test',
        question: 'Compute L = lim|a\u2099\u208A\u2081/a\u2099|',
        computation: 'L = lim (n+1)!/n! \u00B7 n\u207F/(n+1)^(n+1) = lim (n/(n+1))\u207F = 1/e \u2248 0.368',
        result: 'L \u2248 0.368 < 1',
        verdict: 'CONVERGES',
        branch: 'yes',
      },
    ],
  },
  {
    label: '\u2211 1/n\u00B2',
    texLabel: '\u2211 1/n\u00B2',
    steps: [
      {
        test: 'Divergence test',
        question: 'Does a\u2099 \u2192 0?',
        computation: 'lim n\u2192\u221E 1/n\u00B2 = 0',
        result: 'a\u2099 \u2192 0  \u2714',
        verdict: null,
        branch: 'yes',
      },
      {
        test: 'Known form?',
        question: 'Is it p-series or geometric?',
        computation: '\u2211 1/n\u00B2 is a p-series with p = 2',
        result: 'p-series, p = 2 > 1',
        verdict: 'CONVERGES',
        branch: 'yes',
      },
    ],
  },
  {
    label: '\u2211 1/n (harmonic)',
    texLabel: '\u2211 1/n',
    steps: [
      {
        test: 'Divergence test',
        question: 'Does a\u2099 \u2192 0?',
        computation: 'lim n\u2192\u221E 1/n = 0',
        result: 'a\u2099 \u2192 0  \u2714',
        verdict: null,
        branch: 'yes',
      },
      {
        test: 'Known form?',
        question: 'Is it p-series or geometric?',
        computation: '\u2211 1/n is a p-series with p = 1',
        result: 'p-series, p = 1 \u2264 1',
        verdict: 'DIVERGES',
        branch: 'no',
      },
    ],
  },
  {
    label: '\u2211 n\u00B3/2\u207F',
    texLabel: '\u2211 n\u00B3/2\u207F',
    steps: [
      {
        test: 'Divergence test',
        question: 'Does a\u2099 \u2192 0?',
        computation: 'lim n\u2192\u221E n\u00B3/2\u207F = 0  (exponential dominates polynomial)',
        result: 'a\u2099 \u2192 0  \u2714',
        verdict: null,
        branch: 'yes',
      },
      {
        test: 'Known form?',
        question: 'Is it p-series or geometric?',
        computation: 'n\u00B3/2\u207F is neither p-series nor geometric',
        result: 'No known form',
        verdict: null,
        branch: 'no',
      },
      {
        test: 'Ratio test',
        question: 'Compute L = lim|a\u2099\u208A\u2081/a\u2099|',
        computation: 'L = lim (n+1)\u00B3/n\u00B3 \u00B7 2\u207F/2\u207F\u207A\u00B9 = lim (1+1/n)\u00B3 / 2 = 1/2',
        result: 'L = 0.5 < 1',
        verdict: 'CONVERGES',
        branch: 'yes',
      },
    ],
  },
  {
    label: '\u2211 (\u22121)\u207F/n',
    texLabel: '\u2211 (\u22121)\u207F/n',
    steps: [
      {
        test: 'Divergence test',
        question: 'Does a\u2099 \u2192 0?',
        computation: 'lim n\u2192\u221E (\u22121)\u207F/n \u2192 0  (|a\u2099| = 1/n \u2192 0)',
        result: 'a\u2099 \u2192 0  \u2714',
        verdict: null,
        branch: 'yes',
      },
      {
        test: 'Known form?',
        question: 'Is it p-series or geometric?',
        computation: '\u2211 (\u22121)\u207F/n is an alternating series',
        result: 'Alternating, not standard p/geometric',
        verdict: null,
        branch: 'no',
      },
      {
        test: 'Ratio test',
        question: 'Compute L = lim|a\u2099\u208A\u2081/a\u2099|',
        computation: 'L = lim |(\u22121)^(n+1)/(n+1)| \u00B7 |n/(\u22121)\u207F| = lim n/(n+1) = 1',
        result: 'L = 1  (inconclusive)',
        verdict: null,
        branch: 'continue',
      },
      {
        test: 'Alternating series test',
        question: 'Is |a\u2099| decreasing and \u2192 0?',
        computation: '1/n is decreasing, and 1/n \u2192 0',
        result: 'Conditions met',
        verdict: 'CONVERGES',
        branch: 'yes',
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Flowchart node definitions                                         */
/* ------------------------------------------------------------------ */

interface FlowNode {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Filled if this is a terminal verdict node */
  verdict?: Verdict;
}

interface FlowEdge {
  from: string;
  to: string;
  label: string;
  branch: 'yes' | 'no' | 'continue';
  /** Control points for the path, relative layout hints */
  side?: 'left' | 'right' | 'center';
}

const NODE_H = 36;
const NODE_RX = 8;

function buildNodes(cx: number, topY: number, spacing: number): FlowNode[] {
  return [
    { id: 'div-test',   label: 'Divergence test',    x: cx, y: topY,               w: 140, h: NODE_H },
    { id: 'div-no',     label: 'DIVERGES',            x: cx + 170, y: topY,         w: 100, h: NODE_H, verdict: 'DIVERGES' },
    { id: 'known',      label: 'Known form?',         x: cx, y: topY + spacing,     w: 140, h: NODE_H },
    { id: 'known-yes',  label: 'Apply rule',          x: cx + 170, y: topY + spacing, w: 100, h: NODE_H, verdict: 'CONVERGES' },
    { id: 'ratio',      label: 'Ratio test',          x: cx, y: topY + spacing * 2, w: 140, h: NODE_H },
    { id: 'ratio-conv', label: 'CONVERGES',           x: cx - 170, y: topY + spacing * 2 - 12, w: 100, h: NODE_H, verdict: 'CONVERGES' },
    { id: 'ratio-div',  label: 'DIVERGES',            x: cx + 170, y: topY + spacing * 2 - 12, w: 100, h: NODE_H, verdict: 'DIVERGES' },
    { id: 'compare',    label: 'Comparison test',     x: cx, y: topY + spacing * 3, w: 150, h: NODE_H },
    { id: 'integral',   label: 'Integral test',       x: cx, y: topY + spacing * 4, w: 150, h: NODE_H },
  ];
}

function buildEdges(): FlowEdge[] {
  return [
    { from: 'div-test',  to: 'div-no',     label: 'No',   branch: 'no',  side: 'right' },
    { from: 'div-test',  to: 'known',      label: 'Yes',  branch: 'yes', side: 'center' },
    { from: 'known',     to: 'known-yes',  label: 'Yes',  branch: 'yes', side: 'right' },
    { from: 'known',     to: 'ratio',      label: 'No',   branch: 'no',  side: 'center' },
    { from: 'ratio',     to: 'ratio-conv', label: 'L<1',  branch: 'yes', side: 'left' },
    { from: 'ratio',     to: 'ratio-div',  label: 'L>1',  branch: 'no',  side: 'right' },
    { from: 'ratio',     to: 'compare',    label: 'L=1',  branch: 'continue', side: 'center' },
    { from: 'compare',   to: 'integral',   label: '',     branch: 'continue', side: 'center' },
  ];
}

/* ------------------------------------------------------------------ */
/*  Helper: map step index to highlighted flowchart path               */
/* ------------------------------------------------------------------ */

/** Returns the set of node IDs that should be highlighted at the given step */
function activePathNodes(series: SeriesDef, step: number): Set<string> {
  const active = new Set<string>();
  if (step < 0) return active;

  const stepsSeen = Math.min(step, series.steps.length - 1);

  for (let i = 0; i <= stepsSeen; i++) {
    const s = series.steps[i];

    if (s.test === 'Divergence test') {
      active.add('div-test');
      if (s.branch === 'no') active.add('div-no');
    }
    if (s.test === 'Known form?') {
      active.add('known');
      if (s.branch === 'yes') active.add('known-yes');
    }
    if (s.test === 'Ratio test') {
      active.add('ratio');
      if (s.branch === 'yes') active.add('ratio-conv');
      if (s.branch === 'no') active.add('ratio-div');
    }
    if (s.test === 'Alternating series test' || s.test === 'Comparison test') {
      active.add('compare');
    }
    if (s.test === 'Integral test') {
      active.add('integral');
    }
  }
  return active;
}

/** Returns the set of edge keys (from->to) that should be highlighted */
function activePathEdges(series: SeriesDef, step: number): Set<string> {
  const active = new Set<string>();
  if (step < 0) return active;

  const stepsSeen = Math.min(step, series.steps.length - 1);

  for (let i = 0; i <= stepsSeen; i++) {
    const s = series.steps[i];

    if (s.test === 'Divergence test') {
      active.add(s.branch === 'no' ? 'div-test->div-no' : 'div-test->known');
    }
    if (s.test === 'Known form?') {
      active.add(s.branch === 'yes' ? 'known->known-yes' : 'known->ratio');
    }
    if (s.test === 'Ratio test') {
      if (s.branch === 'yes') active.add('ratio->ratio-conv');
      else if (s.branch === 'no') active.add('ratio->ratio-div');
      else active.add('ratio->compare');
    }
    if (s.test === 'Alternating series test' || s.test === 'Comparison test') {
      active.add('compare->integral');
    }
  }
  return active;
}

/* ------------------------------------------------------------------ */
/*  Color helpers                                                      */
/* ------------------------------------------------------------------ */

function verdictColor(v: Verdict | null, isActive: boolean): string {
  if (!isActive) return 'var(--color-ink-faint)';
  if (v === 'CONVERGES') return 'var(--color-vector-green)';
  if (v === 'DIVERGES') return 'var(--color-vector-red)';
  return 'var(--color-vector-yellow)';
}

function verdictBg(v: Verdict | null, isActive: boolean): string {
  if (!isActive) return 'var(--color-surface-2)';
  if (v === 'CONVERGES') return '#d4edda';
  if (v === 'DIVERGES') return '#f8d7da';
  return '#fff3cd';
}

function nodeStroke(node: FlowNode, isActive: boolean, isCurrent: boolean): string {
  if (isCurrent) return 'var(--color-vector-blue)';
  if (node.verdict && isActive) return verdictColor(node.verdict, true);
  if (isActive) return 'var(--color-accent)';
  return 'var(--color-rule)';
}

function nodeFill(node: FlowNode, isActive: boolean, isCurrent: boolean): string {
  if (isCurrent) return '#dbeafe';
  if (node.verdict && isActive) return verdictBg(node.verdict, true);
  if (isActive) return 'var(--color-accent-soft)';
  return 'var(--color-paper-elevated)';
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function ConvergenceTestExplorer({
  width = 640,
  height = 400,
}: ConvergenceTestExplorerProps) {
  const [seriesIdx, setSeriesIdx] = useState(0);
  const [step, setStep] = useState(-1);

  const series = SERIES[seriesIdx];
  const maxSteps = series.steps.length - 1;

  const currentStep = Math.min(step, maxSteps);

  // Layout
  const flowchartCx = width * 0.38;
  const flowchartTopY = 40;
  const flowchartSpacing = 65;
  const nodes = useMemo(() => buildNodes(flowchartCx, flowchartTopY, flowchartSpacing), [flowchartCx, flowchartTopY, flowchartSpacing]);
  const edges = useMemo(() => buildEdges(), []);

  const activeNodes = activePathNodes(series, currentStep);
  const activeEdges = activePathEdges(series, currentStep);

  // Which node is "currently being executed" (the last step's test)
  const currentTestId = currentStep >= 0 ? stepToNodeId(series.steps[currentStep]?.test) : null;

  // Right panel
  const panelX = width * 0.66;
  const panelW = width - panelX - 12;
  const panelY = 20;

  function handleSeriesChange(idx: number) {
    setSeriesIdx(idx);
    setStep(-1);
  }

  function handleAutoPlay() {
    setStep(-1);
    let i = -1;
    const interval = setInterval(() => {
      i++;
      setStep(i);
      if (i >= SERIES[seriesIdx].steps.length - 1) clearInterval(interval);
    }, 900);
  }

  return (
    <div className="flex h-full w-full flex-col">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ background: 'var(--color-paper)' }}
      >
        {/* ----- Title ----- */}
        <text
          x={flowchartCx}
          y={18}
          textAnchor="middle"
          fill="var(--color-ink-muted)"
          style={{ fontFamily: 'var(--font-sans)', fontSize: '11px' }}
        >
          Convergence Test Decision Flowchart
        </text>

        {/* ----- Edges ----- */}
        {edges.map((edge) => {
          const fromNode = nodes.find((n) => n.id === edge.from)!;
          const toNode = nodes.find((n) => n.id === edge.to)!;
          const key = `${edge.from}->${edge.to}`;
          const isActive = activeEdges.has(key);

          // Compute path — treat undefined side as center
          const side = edge.side ?? 'center';
          const fromX = fromNode.x + (side === 'left' ? 0 : side === 'right' ? fromNode.w : fromNode.w / 2);
          const fromY = fromNode.y + fromNode.h / 2;
          const toX = toNode.x + (side === 'left' ? toNode.w : side === 'right' ? 0 : toNode.w / 2);
          const toY = toNode.y + toNode.h / 2;

          let pathD: string;
          if (side === 'center') {
            // Straight vertical
            pathD = `M${fromX},${fromY} L${toX},${toY}`;
          } else if (side === 'right') {
            // Curve right
            pathD = `M${fromX},${fromY} C${fromX + 30},${fromY} ${toX + 30},${toY} ${toX},${toY}`;
          } else {
            // Curve left
            pathD = `M${fromX},${fromY} C${fromX - 30},${fromY} ${toX - 30},${toY} ${toX},${toY}`;
          }

          return (
            <g key={key}>
              <path
                d={pathD}
                fill="none"
                stroke={isActive ? 'var(--color-vector-blue)' : 'var(--color-rule)'}
                strokeWidth={isActive ? 2 : 1}
                strokeDasharray={isActive ? undefined : '4,2'}
              />
              {edge.label && (
                <text
                  x={(fromX + toX) / 2 + (side === 'right' ? 18 : side === 'left' ? -18 : 8)}
                  y={(fromY + toY) / 2}
                  textAnchor={side === 'right' ? 'start' : side === 'left' ? 'end' : 'start'}
                  dominantBaseline="middle"
                  fill={isActive ? 'var(--color-vector-blue)' : 'var(--color-ink-faint)'}
                  style={{ fontFamily: 'var(--font-sans)', fontSize: '9px' }}
                >
                  {edge.label}
                </text>
              )}
              {/* Arrowhead */}
              <polygon
                points={arrowHead(fromX, toX, fromY, toY)}
                fill={isActive ? 'var(--color-vector-blue)' : 'var(--color-rule)'}
              />
            </g>
          );
        })}

        {/* ----- Nodes ----- */}
        {nodes.map((node) => {
          const isActive = activeNodes.has(node.id);
          const isCurrent = node.id === currentTestId;
          const isVerdict = !!node.verdict;

          return (
            <g key={node.id}>
              <rect
                x={node.x}
                y={node.y}
                width={node.w}
                height={node.h}
                rx={isVerdict ? 16 : NODE_RX}
                ry={isVerdict ? 16 : NODE_RX}
                fill={nodeFill(node, isActive, isCurrent)}
                stroke={nodeStroke(node, isActive, isCurrent)}
                strokeWidth={isCurrent ? 2.5 : isActive ? 1.5 : 1}
                style={{ transition: 'fill 0.2s, stroke 0.2s' }}
              />
              <text
                x={node.x + node.w / 2}
                y={node.y + node.h / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fill={isActive ? (isVerdict ? verdictColor(node.verdict, true) : 'var(--color-ink)') : 'var(--color-ink-faint)'}
                style={{
                  fontFamily: isVerdict ? 'var(--font-sans)' : 'var(--font-sans)',
                  fontSize: isVerdict ? '11px' : '10px',
                  fontWeight: isCurrent ? 600 : 400,
                }}
              >
                {node.label}
              </text>
            </g>
          );
        })}

        {/* ----- Divider line ----- */}
        <line
          x1={panelX - 8}
          y1={panelY}
          x2={panelX - 8}
          y2={height - 20}
          stroke="var(--color-rule)"
          strokeWidth={1}
          strokeDasharray="3,3"
        />

        {/* ----- Right Panel: Working Example ----- */}
        <text
          x={panelX}
          y={panelY + 4}
          fill="var(--color-ink)"
          style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 600 }}
        >
          Series: {series.texLabel}
        </text>

        {currentStep >= 0 && (
          <>
            {series.steps.slice(0, currentStep + 1).map((s, i) => {
              const yPos = panelY + 24 + i * 68;
              const isLast = i === currentStep;
              return (
                <g key={i}>
                  {/* Step number badge */}
                  <circle
                    cx={panelX + 10}
                    cy={yPos + 8}
                    r={8}
                    fill={isLast ? 'var(--color-vector-blue)' : 'var(--color-surface-2)'}
                    stroke={isLast ? 'var(--color-vector-blue)' : 'var(--color-rule)'}
                    strokeWidth={1}
                  />
                  <text
                    x={panelX + 10}
                    y={yPos + 8}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={isLast ? 'white' : 'var(--color-ink-faint)'}
                    style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', fontWeight: 600 }}
                  >
                    {i + 1}
                  </text>

                  {/* Test name */}
                  <text
                    x={panelX + 24}
                    y={yPos + 5}
                    fill={isLast ? 'var(--color-ink)' : 'var(--color-ink-muted)'}
                    style={{ fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 600 }}
                  >
                    {s.test}
                  </text>

                  {/* Question */}
                  <text
                    x={panelX + 24}
                    y={yPos + 18}
                    fill="var(--color-ink-faint)"
                    style={{ fontFamily: 'var(--font-sans)', fontSize: '9px' }}
                  >
                    {truncate(s.question, 36)}
                  </text>

                  {/* Computation (only show for current/latest step) */}
                  {isLast && (
                    <text
                      x={panelX + 24}
                      y={yPos + 30}
                      fill="var(--color-ink-muted)"
                      style={{ fontFamily: 'var(--font-mono)', fontSize: '8px' }}
                    >
                      {truncate(s.computation, 42)}
                    </text>
                  )}

                  {/* Result */}
                  <text
                    x={panelX + 24}
                    y={yPos + (isLast ? 42 : 30)}
                    fill={
                      s.verdict === 'CONVERGES'
                        ? 'var(--color-vector-green)'
                        : s.verdict === 'DIVERGES'
                          ? 'var(--color-vector-red)'
                          : 'var(--color-ink-muted)'
                    }
                    style={{ fontFamily: 'var(--font-sans)', fontSize: '9px', fontWeight: 600 }}
                  >
                    {s.result}
                  </text>

                  {/* Verdict badge */}
                  {s.verdict && (
                    <rect
                      x={panelX + 24}
                      y={yPos + (isLast ? 49 : 37)}
                      width={72}
                      height={14}
                      rx={7}
                      fill={verdictBg(s.verdict, true)}
                      stroke={verdictColor(s.verdict, true)}
                      strokeWidth={0.5}
                    />
                  )}
                  {s.verdict && (
                    <text
                      x={panelX + 60}
                      y={yPos + (isLast ? 56 : 44)}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={verdictColor(s.verdict, true)}
                      style={{ fontFamily: 'var(--font-sans)', fontSize: '8px', fontWeight: 700 }}
                    >
                      {s.verdict === 'CONVERGES' ? 'CONVERGES' : s.verdict === 'DIVERGES' ? 'DIVERGES' : 'INCONCLUSIVE'}
                    </text>
                  )}
                </g>
              );
            })}
          </>
        )}

        {/* Prompt if no step selected */}
        {currentStep < 0 && (
          <text
            x={panelX + panelW / 2}
            y={height / 2}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--color-ink-faint)"
            style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontStyle: 'italic' }}
          >
            Use the step slider or Auto Play
          </text>
        )}

        {/* ----- Bottom readout bar ----- */}
        <rect
          x={0}
          y={height - 28}
          width={width}
          height={28}
          fill="var(--color-surface-1)"
        />
        <line
          x1={0}
          y1={height - 28}
          x2={width}
          y2={height - 28}
          stroke="var(--color-rule)"
          strokeWidth={1}
        />
        <text
          x={12}
          y={height - 12}
          dominantBaseline="central"
          fill="var(--color-ink-muted)"
          style={{ fontFamily: 'var(--font-sans)', fontSize: '10px' }}
        >
          {currentStep >= 0
            ? `Step ${currentStep + 1}/${series.steps.length}: ${series.steps[currentStep].test}`
            : 'Select a step to begin'}
        </text>
        {currentStep >= 0 && series.steps[currentStep].verdict && (
          <text
            x={width - 12}
            y={height - 12}
            textAnchor="end"
            dominantBaseline="central"
            fill={verdictColor(series.steps[currentStep].verdict, true)}
            style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', fontWeight: 700 }}
          >
            Verdict: {series.steps[currentStep].verdict}
          </text>
        )}
      </svg>

      {/* ----- Controls bar ----- */}
      <div className="flex flex-wrap items-center gap-4 border-t border-rule bg-paper-elevated px-4 py-3">
        {/* Preset selector */}
        <div className="flex gap-1">
          {SERIES.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSeriesChange(i)}
              className={`rounded-sm border px-2 py-0.5 font-mono text-[11px] transition-colors duration-fast ${
                i === seriesIdx
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-rule bg-paper-elevated text-ink-muted hover:bg-surface-1'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Step slider */}
        <label className="flex items-center gap-2 font-sans text-xs text-ink-muted">
          Step:
          <input
            type="range"
            min={-1}
            max={maxSteps}
            step={1}
            value={currentStep}
            onChange={(e) => setStep(+e.target.value)}
            className="h-1 w-28 cursor-pointer accent-[var(--color-accent)]"
          />
          <span className="font-mono text-xs text-ink w-16">
            {currentStep < 0 ? 'start' : `${currentStep + 1}/${maxSteps + 1}`}
          </span>
        </label>

        {/* Auto play */}
        <button
          type="button"
          onClick={handleAutoPlay}
          className="rounded-sm border border-accent bg-accent-soft px-3 py-0.5 font-sans text-[11px] text-accent transition-colors duration-fast hover:bg-accent hover:text-white"
        >
          Auto Play
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Utilities                                                          */
/* ------------------------------------------------------------------ */

function stepToNodeId(testName: string | undefined): string | null {
  if (!testName) return null;
  if (testName === 'Divergence test') return 'div-test';
  if (testName === 'Known form?') return 'known';
  if (testName === 'Ratio test') return 'ratio';
  if (testName === 'Comparison test') return 'compare';
  if (testName === 'Alternating series test') return 'compare';
  if (testName === 'Integral test') return 'integral';
  return null;
}

function arrowHead(fromX: number, toX: number, fromY: number, toY: number): string {
  const size = 5;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  // Tip at (toX, toY)
  const tipX = toX;
  const tipY = toY;
  // Base points perpendicular
  const bx1 = tipX - ux * size - uy * size * 0.5;
  const by1 = tipY - uy * size + ux * size * 0.5;
  const bx2 = tipX - ux * size + uy * size * 0.5;
  const by2 = tipY - uy * size - ux * size * 0.5;
  return `${tipX},${tipY} ${bx1},${by1} ${bx2},${by2}`;
}

function truncate(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen - 1) + '\u2026';
}
