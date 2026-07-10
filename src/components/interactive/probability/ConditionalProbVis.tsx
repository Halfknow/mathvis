import { useState } from 'react';

interface ConditionalProbVisProps {
  width?: number;
  height?: number;
}

export function ConditionalProbVis({
  width = 640,
  height = 340,
}: ConditionalProbVisProps) {
  const [pA, setPA] = useState(0.5);
  const [pB, setPB] = useState(0.4);
  const [pAB, setPAB] = useState(0.2);

  // Constrain P(A∩B) ≤ min(P(A), P(B))
  const clampedPAB = Math.min(pAB, Math.min(pA, pB));

  // Derived calculations
  const pAGivenB = clampedPAB / pB;
  const pBGivenA = clampedPAB / pA;
  const pAxpB = pA * pB;
  const isIndependent = Math.abs(clampedPAB - pAxpB) < 0.015;

  // Venn diagram geometry
  // Circle radii scale with probability: map [0.05, 0.95] → [50, 120]
  const minProb = 0.05;
  const maxProb = 0.95;
  const minRadius = 50;
  const maxRadius = 120;

  const radiusFor = (p: number) =>
    minRadius + ((p - minProb) / (maxProb - minProb)) * (maxRadius - minRadius);

  const rA = radiusFor(pA);
  const rB = radiusFor(pB);

  // Center positions: circles overlap proportional to P(A∩B)
  // When P(A∩B) = min(P(A),P(B)), circles are maximally overlapped
  // When P(A∩B) = 0, circles are just touching (distance = rA + rB)
  const cx = width / 2;
  const cy = height / 2 - 10;

  // Maximum overlap: the smaller circle is mostly inside the larger
  // distance between centers when fully containing the smaller: |rA - rB|
  // distance between centers when no overlap: rA + rB
  const maxOverlapDist = Math.abs(rA - rB);
  const noOverlapDist = rA + rB;
  const maxPAB = Math.min(pA, pB);

  // Interpolate center-to-center distance based on P(A∩B)/maxPAB
  // ratio 0 → no overlap (far apart), ratio 1 → maximum overlap
  const overlapRatio = maxPAB > 0 ? clampedPAB / maxPAB : 0;
  const centerDist = noOverlapDist - overlapRatio * (noOverlapDist - maxOverlapDist);

  const cxA = cx - centerDist / 2;
  const cxB = cx + centerDist / 2;

  // Compute the intersection clip paths for the overlap region
  // We use SVG clipPath to create the intersection of both circles
  const overlapId = 'venn-overlap';

  // Labels positioned in non-overlapping parts
  const labelAx = cxA - rA * 0.35;
  const labelBx = cxB + rB * 0.35;
  const labelY = cy;

  // Format helpers
  const fmt = (v: number) => v.toFixed(3);
  const fmtPct = (v: number) => (v * 100).toFixed(1) + '%';

  // Slider style
  const sliderClass =
    'h-1 w-full cursor-pointer accent-[var(--color-accent)]';

  return (
    <div className="flex w-full flex-col">
      {/* Venn diagram */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ background: 'var(--color-paper)' }}
      >
        <defs>
          {/* Clip path: circle A clipped by circle B = intersection region */}
          <clipPath id={overlapId}>
            <circle cx={cxB} cy={cy} r={rB} />
          </clipPath>
        </defs>

        {/* Circle A */}
        <circle
          cx={cxA}
          cy={cy}
          r={rA}
          fill="var(--color-vector-blue)"
          opacity={0.25}
          stroke="var(--color-vector-blue)"
          strokeWidth={1.5}
          strokeOpacity={0.6}
        />

        {/* Circle B */}
        <circle
          cx={cxB}
          cy={cy}
          r={rB}
          fill="var(--color-vector-green)"
          opacity={0.25}
          stroke="var(--color-vector-green)"
          strokeWidth={1.5}
          strokeOpacity={0.6}
        />

        {/* Overlap region: draw circle A again, clipped to circle B, with blended purple */}
        <circle
          cx={cxA}
          cy={cy}
          r={rA}
          fill="var(--color-accent)"
          opacity={0.35}
          clipPath={`url(#${overlapId})`}
        />

        {/* Label A — in non-overlapping part */}
        <text
          x={labelAx}
          y={labelY}
          textAnchor="middle"
          dominantBaseline="central"
          className="text-[18px] font-bold select-none"
          fill="var(--color-vector-blue)"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          A
        </text>

        {/* Label B — in non-overlapping part */}
        <text
          x={labelBx}
          y={labelY}
          textAnchor="middle"
          dominantBaseline="central"
          className="text-[18px] font-bold select-none"
          fill="var(--color-vector-green)"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          B
        </text>

        {/* P(A) label inside circle A */}
        <text
          x={cxA - rA * 0.05}
          y={cy + rA * 0.45}
          textAnchor="middle"
          className="text-[11px] select-none"
          fill="var(--color-ink-faint)"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {fmtPct(pA)}
        </text>

        {/* P(B) label inside circle B */}
        <text
          x={cxB + rB * 0.05}
          y={cy + rB * 0.45}
          textAnchor="middle"
          className="text-[11px] select-none"
          fill="var(--color-ink-faint)"
          style={{ fontFamily: 'var(--font-mono)' }}
        >
          {fmtPct(pB)}
        </text>

        {/* P(A∩B) label in overlap region */}
        {clampedPAB > 0.01 && (
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="central"
            className="text-[11px] select-none"
            fill="var(--color-accent)"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {fmtPct(clampedPAB)}
          </text>
        )}

        {/* "A∩B" label above overlap */}
        {clampedPAB > 0.01 && (
          <text
            x={cx}
            y={cy - Math.min(rA, rB) * 0.35}
            textAnchor="middle"
            className="text-[10px] select-none"
            fill="var(--color-ink-faint)"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            A and B
          </text>
        )}
      </svg>

      {/* Sliders */}
      <div className="grid grid-cols-3 gap-4 border-t border-rule bg-paper-elevated px-4 py-3">
        <label className="flex flex-col gap-1">
          <span className="font-sans text-[11px] text-ink-muted">
            P(A) = <span className="font-mono text-ink">{fmt(pA)}</span>
          </span>
          <input
            type="range"
            min={minProb}
            max={maxProb}
            step={0.01}
            value={pA}
            onChange={(e) => setPA(+e.target.value)}
            className={sliderClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-sans text-[11px] text-ink-muted">
            P(B) = <span className="font-mono text-ink">{fmt(pB)}</span>
          </span>
          <input
            type="range"
            min={minProb}
            max={maxProb}
            step={0.01}
            value={pB}
            onChange={(e) => setPB(+e.target.value)}
            className={sliderClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-sans text-[11px] text-ink-muted">
            P(A and B) = <span className="font-mono text-ink">{fmt(clampedPAB)}</span>
          </span>
          <input
            type="range"
            min={0}
            max={Math.min(pA, pB)}
            step={0.01}
            value={clampedPAB}
            onChange={(e) => setPAB(+e.target.value)}
            className={sliderClass}
          />
        </label>
      </div>

      {/* Calculations */}
      <div className="grid grid-cols-3 gap-4 border-t border-rule bg-surface-1 px-4 py-3">
        {/* P(A|B) — highlighted */}
        <div className="flex flex-col gap-0.5 rounded-sm border px-3 py-2" style={{ borderColor: 'var(--color-accent)', background: 'var(--color-accent-soft)' }}>
          <span className="font-sans text-[10px]" style={{ color: 'var(--color-accent)' }}>
            P(A | B)
          </span>
          <span className="font-mono text-sm" style={{ color: 'var(--color-accent)' }}>
            {fmt(clampedPAB)} / {fmt(pB)} = {isNaN(pAGivenB) ? '---' : fmt(pAGivenB)}
          </span>
        </div>

        {/* P(B|A) */}
        <div className="flex flex-col gap-0.5 px-3 py-2">
          <span className="font-sans text-[10px]" style={{ color: 'var(--color-ink-faint)' }}>
            P(B | A)
          </span>
          <span className="font-mono text-sm" style={{ color: 'var(--color-ink)' }}>
            {fmt(clampedPAB)} / {fmt(pA)} = {isNaN(pBGivenA) ? '---' : fmt(pBGivenA)}
          </span>
        </div>

        {/* Independence check */}
        <div className="flex flex-col gap-0.5 px-3 py-2">
          <span className="font-sans text-[10px]" style={{ color: 'var(--color-ink-faint)' }}>
            Independent?
          </span>
          <span className="font-sans text-sm" style={{ color: isIndependent ? 'var(--color-vector-green)' : 'var(--color-vector-red)' }}>
            {isIndependent ? 'Yes' : 'No'}
          </span>
          <span className="font-mono text-[10px]" style={{ color: 'var(--color-ink-faint)' }}>
            P(A)P(B) = {fmt(pAxpB)}
          </span>
        </div>
      </div>
    </div>
  );
}
