import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

type Perspective = 'row-col' | 'col-combo' | 'row-combo' | 'outer-product';

interface MatrixMultPerspectivesProps {
  width?: number;
  height?: number;
}

/* ------------------------------------------------------------------ */
/*  Helper: multiply two 2x2 matrices                                 */
/* ------------------------------------------------------------------ */
function matMul(
  a: number[][],
  b: number[][],
): number[][] {
  return [
    [a[0][0] * b[0][0] + a[0][1] * b[1][0], a[0][0] * b[0][1] + a[0][1] * b[1][1]],
    [a[1][0] * b[0][0] + a[1][1] * b[1][0], a[1][0] * b[0][1] + a[1][1] * b[1][1]],
  ];
}

/* ------------------------------------------------------------------ */
/*  Format a number nicely (drop trailing .0)                         */
/* ------------------------------------------------------------------ */
function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/* ------------------------------------------------------------------ */
/*  The component                                                      */
/* ------------------------------------------------------------------ */
export function MatrixMultPerspectives({
  width = 640,
  height = 400,
}: MatrixMultPerspectivesProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  /* ---- Matrix A entries ---- */
  const [a00, setA00] = useState(2);
  const [a01, setA01] = useState(1);
  const [a10, setA10] = useState(0);
  const [a11, setA11] = useState(1);

  /* ---- Matrix B entries ---- */
  const [b00, setB00] = useState(1);
  const [b01, setB01] = useState(0);
  const [b10, setB10] = useState(0);
  const [b11, setB11] = useState(1);

  /* ---- Perspective & highlight selector ---- */
  const [perspective, setPerspective] = useState<Perspective>('row-col');
  const [selector, setSelector] = useState(0);

  /* ---- Computed product ---- */
  const A: number[][] = [
    [a00, a01],
    [a10, a11],
  ];
  const B: number[][] = [
    [b00, b01],
    [b10, b11],
  ];
  const AB = matMul(A, B);

  /* ================================================================ */
  /*  Determine which cells are "active" for each perspective         */
  /* ================================================================ */

  /** Returns Sets of "r,c" strings for each matrix (A, B, AB) */
  function getActiveCells(): {
    aCells: Set<string>;
    bCells: Set<string>;
    abCells: Set<string>;
    /** A human-readable formula string for the current selection */
    formula: string;
  } {
    const aCells = new Set<string>();
    const bCells = new Set<string>();
    const abCells = new Set<string>();
    let formula = '';

    switch (perspective) {
      /* ---- Row x Column ---- */
      case 'row-col': {
        const i = Math.floor(selector / 2); // 0 or 1 for the row
        const j = selector % 2;             // 0 or 1 for the column
        // Row i of A
        aCells.add(`${i},0`);
        aCells.add(`${i},1`);
        // Column j of B
        bCells.add(`0,${j}`);
        bCells.add(`1,${j}`);
        // Entry (i,j) of AB
        abCells.add(`${i},${j}`);

        const dotVal = AB[i][j];
        formula = `row${i + 1}(A) · col${j + 1}(B) = ${fmt(A[i][0])}·${fmt(B[0][j])} + ${fmt(A[i][1])}·${fmt(B[1][j])} = ${fmt(dotVal)}`;
        break;
      }

      /* ---- Column Combo ---- */
      case 'col-combo': {
        const j = selector; // which column of AB (0 or 1)
        // All rows of A contribute
        aCells.add('0,0');
        aCells.add('0,1');
        aCells.add('1,0');
        aCells.add('1,1');
        // Column j of B
        bCells.add(`0,${j}`);
        bCells.add(`1,${j}`);
        // Column j of AB
        abCells.add(`0,${j}`);
        abCells.add(`1,${j}`);

        const b0j = B[0][j];
        const b1j = B[1][j];
        formula = `col${j + 1}(AB) = ${fmt(b0j)}·col1(A) + ${fmt(b1j)}·col2(A)`;
        break;
      }

      /* ---- Row Combo ---- */
      case 'row-combo': {
        const i = selector; // which row of AB (0 or 1)
        // Row i of A
        aCells.add(`${i},0`);
        aCells.add(`${i},1`);
        // All columns of B contribute
        bCells.add('0,0');
        bCells.add('0,1');
        bCells.add('1,0');
        bCells.add('1,1');
        // Row i of AB
        abCells.add(`${i},0`);
        abCells.add(`${i},1`);

        const ai0 = A[i][0];
        const ai1 = A[i][1];
        formula = `row${i + 1}(AB) = ${fmt(ai0)}·row1(B) + ${fmt(ai1)}·row2(B)`;
        break;
      }

      /* ---- Outer Product Sum ---- */
      case 'outer-product': {
        const k = selector; // rank-1 term index (0 or 1)
        // Column k of A
        aCells.add(`0,${k}`);
        aCells.add(`1,${k}`);
        // Row k of B
        bCells.add(`${k},0`);
        bCells.add(`${k},1`);
        // The rank-1 outer product fills all of AB
        abCells.add('0,0');
        abCells.add('0,1');
        abCells.add('1,0');
        abCells.add('1,1');

        const colA = [A[0][k], A[1][k]];
        const rowB = [B[k][0], B[k][1]];
        formula = `col${k + 1}(A) × row${k + 1}(B) = [${colA.map(fmt).join(', ')}] × [${rowB.map(fmt).join(', ')}]`;
        break;
      }
    }

    return { aCells, bCells, abCells, formula };
  }

  /* ================================================================ */
  /*  D3 draw                                                         */
  /* ================================================================ */
  const draw = useCallback(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { aCells, bCells, abCells, formula } = getActiveCells();

    /* ---- Layout constants ---- */
    const cellW = 60;
    const cellH = 40;
    const cellGap = 4;
    const matrixPad = 12; // padding inside bracket area
    const bracketW = 6;

    // Each matrix bounding-box width
    const matrixW = matrixPad * 2 + cellW * 2 + cellGap;
    const matrixH = matrixPad * 2 + cellH * 2 + cellGap;

    // Horizontal layout: [A] × [B] = [AB]
    const operatorGap = 28;
    const totalW = matrixW * 3 + operatorGap * 4;
    const offsetX = (width - totalW) / 2;
    const offsetY = (height - matrixH) / 2 - 16; // leave room for formula at bottom

    /* ---- Helper: draw a 2x2 matrix grid ---- */
    function drawMatrix(
      gParent: d3.Selection<SVGGElement, unknown, null, undefined>,
      mat: number[][],
      activeCells: Set<string>,
      topLeftX: number,
      topLeftY: number,
      label: string,
    ) {
      const g = gParent.append('g');

      // Label above
      g.append('text')
        .attr('x', topLeftX + matrixW / 2)
        .attr('y', topLeftY - 8)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--color-ink-muted)')
        .attr('font-size', '13px')
        .attr('font-family', 'var(--font-sans)')
        .text(label);

      // Brackets
      const bx = topLeftX + matrixPad;
      const by = topLeftY + matrixPad;
      const bw = cellW * 2 + cellGap;
      const bh = cellH * 2 + cellGap;

      // Left bracket
      g.append('path')
        .attr('d', `M${bx - 4},${by - 4} L${bx - 4 - bracketW},${by - 4} L${bx - 4 - bracketW},${by + bh + 4} L${bx - 4},${by + bh + 4}`)
        .attr('fill', 'none')
        .attr('stroke', 'var(--color-ink-muted)')
        .attr('stroke-width', 1.5);

      // Right bracket
      g.append('path')
        .attr('d', `M${bx + bw + 4},${by - 4} L${bx + bw + 4 + bracketW},${by - 4} L${bx + bw + 4 + bracketW},${by + bh + 4} L${bx + bw + 4},${by + bh + 4}`)
        .attr('fill', 'none')
        .attr('stroke', 'var(--color-ink-muted)')
        .attr('stroke-width', 1.5);

      // Cells
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          const key = `${r},${c}`;
          const isActive = activeCells.has(key);
          const cx = topLeftX + matrixPad + c * (cellW + cellGap);
          const cy = topLeftY + matrixPad + r * (cellH + cellGap);

          // Rounded rect background
          g.append('rect')
            .attr('x', cx)
            .attr('y', cy)
            .attr('width', cellW)
            .attr('height', cellH)
            .attr('rx', 4)
            .attr('ry', 4)
            .attr('fill', isActive ? 'var(--color-accent)' : 'var(--color-paper)')
            .attr('fill-opacity', isActive ? 0.12 : 1)
            .attr('stroke', isActive ? 'var(--color-accent)' : 'var(--color-rule)')
            .attr('stroke-width', isActive ? 2 : 1);

          // Value text
          g.append('text')
            .attr('x', cx + cellW / 2)
            .attr('y', cy + cellH / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('fill', isActive ? 'var(--color-accent)' : 'var(--color-ink)')
            .attr('font-size', '14px')
            .attr('font-family', 'var(--font-mono)')
            .attr('font-weight', isActive ? 'bold' : 'normal')
            .text(fmt(mat[r][c]));
        }
      }
    }

    /* ---- Place the three matrices ---- */
    const root = svg.append('g');

    const ax = offsetX;
    const bx = ax + matrixW + operatorGap;
    const abx = bx + matrixW + operatorGap;

    drawMatrix(root, A, aCells, ax, offsetY, 'A');
    drawMatrix(root, B, bCells, bx, offsetY, 'B');
    drawMatrix(root, AB, abCells, abx, offsetY, 'AB');

    /* ---- Operators: × and = ---- */
    const midYA = offsetY + matrixH / 2;
    root.append('text')
      .attr('x', ax + matrixW + operatorGap / 2)
      .attr('y', midYA)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', 'var(--color-ink-muted)')
      .attr('font-size', '18px')
      .attr('font-family', 'var(--font-mono)')
      .text('×');

    root.append('text')
      .attr('x', bx + matrixW + operatorGap / 2)
      .attr('y', midYA)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', 'var(--color-ink-muted)')
      .attr('font-size', '18px')
      .attr('font-family', 'var(--font-mono)')
      .text('=');

    /* ---- Outer Product: show rank-1 matrix annotation ---- */
    if (perspective === 'outer-product') {
      const k = selector;
      const colA = [A[0][k], A[1][k]];
      const rowB = [B[k][0], B[k][1]];
      // The rank-1 matrix
      const r1 = [
        [colA[0] * rowB[0], colA[0] * rowB[1]],
        [colA[1] * rowB[0], colA[1] * rowB[1]],
      ];

      // Draw the rank-1 matrix below the equation
      const r1Label = k === 0 ? 'rank-1 term #1' : 'rank-1 term #2';
      const r1TopLeftY = offsetY + matrixH + 16;
      const r1LeftX = abx;

      // Small label
      root.append('text')
        .attr('x', r1LeftX + matrixW / 2)
        .attr('y', r1TopLeftY - 6)
        .attr('text-anchor', 'middle')
        .attr('fill', 'var(--color-accent)')
        .attr('font-size', '11px')
        .attr('font-family', 'var(--font-sans)')
        .attr('font-style', 'italic')
        .text(r1Label);

      // Draw rank-1 matrix
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          const cx = r1LeftX + matrixPad + c * (cellW + cellGap);
          const cy = r1TopLeftY + matrixPad + r * (cellH + cellGap);

          root.append('rect')
            .attr('x', cx)
            .attr('y', cy)
            .attr('width', cellW)
            .attr('height', cellH)
            .attr('rx', 4)
            .attr('ry', 4)
            .attr('fill', 'var(--color-accent)')
            .attr('fill-opacity', 0.08)
            .attr('stroke', 'var(--color-accent)')
            .attr('stroke-width', 1.5);

          root.append('text')
            .attr('x', cx + cellW / 2)
            .attr('y', cy + cellH / 2)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('fill', 'var(--color-accent)')
            .attr('font-size', '13px')
            .attr('font-family', 'var(--font-mono)')
            .text(fmt(r1[r][c]));
        }
      }

      // Plus sign between terms (if selector === 0, show "+ ...")
      if (selector === 0) {
        const plusX = r1LeftX + matrixW + 12;
        const plusY = r1TopLeftY + matrixH / 2;
        root.append('text')
          .attr('x', plusX)
          .attr('y', plusY)
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('fill', 'var(--color-ink-faint)')
          .attr('font-size', '16px')
          .attr('font-family', 'var(--font-mono)')
          .text('+ ...');
      }
    }

    /* ---- Formula annotation below ---- */
    const formulaY = perspective === 'outer-product'
      ? offsetY + matrixH + 16 + matrixH + matrixPad + 14
      : offsetY + matrixH + 20;

    root.append('text')
      .attr('x', width / 2)
      .attr('y', Math.min(formulaY, height - 10))
      .attr('text-anchor', 'middle')
      .attr('fill', 'var(--color-ink-muted)')
      .attr('font-size', '12px')
      .attr('font-family', 'var(--font-mono)')
      .text(formula);
  }, [
    a00, a01, a10, a11,
    b00, b01, b10, b11,
    perspective, selector,
    width, height,
    A, B, AB,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  /* ================================================================ */
  /*  Slider handler factory                                          */
  /* ================================================================ */
  const handleSlider = (setter: (v: number) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(parseFloat(e.target.value) || 0);
    };

  /* ---- Selector range depends on perspective ---- */
  const selectorMax = perspective === 'row-col' ? 3 : 1;

  /* ---- Perspective button labels ---- */
  const perspectives: { key: Perspective; label: string }[] = [
    { key: 'row-col', label: 'Row \u00D7 Column' },
    { key: 'col-combo', label: 'Column Combo' },
    { key: 'row-combo', label: 'Row Combo' },
    { key: 'outer-product', label: 'Outer Product Sum' },
  ];

  /* ---- Selector label depends on perspective ---- */
  function getSelectorLabel(): string {
    switch (perspective) {
      case 'row-col': {
        const i = Math.floor(selector / 2);
        const j = selector % 2;
        return `Entry (${i + 1},${j + 1}) of AB`;
      }
      case 'col-combo':
        return `Column ${selector + 1} of AB`;
      case 'row-combo':
        return `Row ${selector + 1} of AB`;
      case 'outer-product':
        return `Rank-1 term ${selector + 1}`;
    }
  }

  return (
    <div className="not-prose space-y-3">
      {/* Perspective tabs */}
      <div className="flex flex-wrap gap-2">
        {perspectives.map((p) => (
          <button
            key={p.key}
            onClick={() => { setPerspective(p.key); setSelector(0); }}
            className={`rounded border px-3 py-1 text-xs font-sans font-medium transition-colors ${
              perspective === p.key
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-rule bg-paper-elevated text-ink-muted hover:border-accent hover:text-accent'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* SVG Canvas */}
      <div
        className="rounded-md border border-rule overflow-hidden"
        style={{ background: 'var(--color-paper)' }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          style={{ display: 'block' }}
        />
      </div>

      {/* Selector slider */}
      <div className="flex items-center gap-3">
        <span className="font-sans text-xs text-ink-muted w-36">
          {getSelectorLabel()}
        </span>
        <input
          type="range"
          min={0}
          max={selectorMax}
          step={1}
          value={selector}
          onChange={(e) => setSelector(parseInt(e.target.value, 10))}
          className="flex-1 h-1 accent-[var(--color-accent)]"
        />
        <span className="font-mono text-xs w-4 text-right" style={{ color: 'var(--color-accent)' }}>
          {selector}
        </span>
      </div>

      {/* Matrix A sliders */}
      <div className="space-y-1">
        <div className="font-sans text-xs text-ink-muted font-medium">Matrix A</div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          {[
            { label: 'a₁₁', val: a00, set: setA00, color: 'var(--color-vector-blue)' },
            { label: 'a₁₂', val: a01, set: setA01, color: 'var(--color-vector-blue)' },
            { label: 'a₂₁', val: a10, set: setA10, color: 'var(--color-vector-blue)' },
            { label: 'a₂₂', val: a11, set: setA11, color: 'var(--color-vector-blue)' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="font-mono text-xs text-ink-muted w-7">{s.label}</span>
              <input
                type="range"
                min={-3}
                max={3}
                step={0.1}
                value={s.val}
                onChange={handleSlider(s.set)}
                className="flex-1 h-1"
                style={{ accentColor: s.color }}
              />
              <span className="font-mono text-xs w-8 text-right">{s.val.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Matrix B sliders */}
      <div className="space-y-1">
        <div className="font-sans text-xs text-ink-muted font-medium">Matrix B</div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
          {[
            { label: 'b₁₁', val: b00, set: setB00, color: 'var(--color-vector-green)' },
            { label: 'b₁₂', val: b01, set: setB01, color: 'var(--color-vector-green)' },
            { label: 'b₂₁', val: b10, set: setB10, color: 'var(--color-vector-green)' },
            { label: 'b₂₂', val: b11, set: setB11, color: 'var(--color-vector-green)' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="font-mono text-xs text-ink-muted w-7">{s.label}</span>
              <input
                type="range"
                min={-3}
                max={3}
                step={0.1}
                value={s.val}
                onChange={handleSlider(s.set)}
                className="flex-1 h-1"
                style={{ accentColor: s.color }}
              />
              <span className="font-mono text-xs w-8 text-right">{s.val.toFixed(1)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
