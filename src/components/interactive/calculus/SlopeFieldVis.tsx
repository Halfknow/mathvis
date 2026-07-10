import { useState, useMemo, useCallback } from 'react';

interface SlopeFieldVisProps {
  width?: number;
  height?: number;
}

type DiffEq = {
  slopeFn: (x: number, y: number) => number;
  label: string;
  // Numerical solution via Euler's method
  solve: (x0: number, y0: number, xEnd: number, steps: number) => Array<{ x: number; y: number }>;
};

const EQUATIONS: Record<string, DiffEq> = {
  'dy/dx = y': {
    slopeFn: (_x, y) => y,
    label: "dy/dx = y",
    solve: (x0, y0, xEnd, steps) => {
      const dx = (xEnd - x0) / steps;
      const pts = [{ x: x0, y: y0 }];
      let y = y0;
      for (let i = 0; i < steps; i++) {
        const x = x0 + i * dx;
        y = y + y * dx; // dy/dx = y
        pts.push({ x: x + dx, y });
      }
      return pts;
    },
  },
  'dy/dx = -x/y': {
    slopeFn: (x, y) => y !== 0 ? -x / y : 0,
    label: "dy/dx = −x/y",
    solve: (x0, y0, xEnd, steps) => {
      const dx = (xEnd - x0) / steps;
      const pts = [{ x: x0, y: y0 }];
      let x = x0, y = y0;
      for (let i = 0; i < steps; i++) {
        const slope = y !== 0 ? -x / y : 0;
        y = y + slope * dx;
        x = x + dx;
        pts.push({ x, y });
      }
      return pts;
    },
  },
  'dy/dx = x+y': {
    slopeFn: (x, y) => x + y,
    label: "dy/dx = x + y",
    solve: (x0, y0, xEnd, steps) => {
      const dx = (xEnd - x0) / steps;
      const pts = [{ x: x0, y: y0 }];
      let x = x0, y = y0;
      for (let i = 0; i < steps; i++) {
        const slope = x + y;
        y = y + slope * dx;
        x = x + dx;
        pts.push({ x, y });
      }
      return pts;
    },
  },
  'dy/dx = sin(xy)': {
    slopeFn: (x, y) => Math.sin(x * y),
    label: "dy/dx = sin(xy)",
    solve: (x0, y0, xEnd, steps) => {
      const dx = (xEnd - x0) / steps;
      const pts = [{ x: x0, y: y0 }];
      let x = x0, y = y0;
      for (let i = 0; i < steps; i++) {
        const slope = Math.sin(x * y);
        y = y + slope * dx;
        x = x + dx;
        pts.push({ x, y });
      }
      return pts;
    },
  },
};

export function SlopeFieldVis({
  width = 640,
  height = 400,
}: SlopeFieldVisProps) {
  const [eqKey, setEqKey] = useState('dy/dx = y');
  const [initialPoints, setInitialPoints] = useState<Array<{ x: number; y: number }>>([]);
  const eq = EQUATIONS[eqKey];

  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const xMin = -4;
  const xMax = 4;
  const yMin = -4;
  const yMax = 4;

  const sx = (x: number) => padding.left + ((x - xMin) / (xMax - xMin)) * plotW;
  const sy = (y: number) => padding.top + plotH - ((y - yMin) / (yMax - yMin)) * plotH;
  const invSx = (px: number) => xMin + ((px - padding.left) / plotW) * (xMax - xMin);
  const invSy = (py: number) => yMin + ((padding.top + plotH - py) / plotH) * (yMax - yMin);

  const gridSize = 0.5;
  const tickLen = 0.2;

  const slopeTicks = useMemo(() => {
    const ticks: Array<{ x: number; y: number; dx: number; dy: number }> = [];
    for (let x = xMin + gridSize / 2; x < xMax; x += gridSize) {
      for (let y = yMin + gridSize / 2; y < yMax; y += gridSize) {
        const slope = eq.slopeFn(x, y);
        const mag = Math.sqrt(1 + slope * slope);
        const dx = tickLen / mag;
        const dy = slope * tickLen / mag;
        ticks.push({ x, y, dx, dy });
      }
    }
    return ticks;
  }, [eqKey]);

  const solutionCurves = useMemo(() => {
    return initialPoints.map((pt) => {
      // Solve forward and backward
      const forward = eq.solve(pt.x, pt.y, xMax, 200);
      const backward = eq.solve(pt.x, pt.y, xMin, 200);
      backward.reverse();
      return [...backward.slice(0, -1), ...forward];
    });
  }, [eqKey, initialPoints]);

  const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;
    const x = invSx(px);
    const y = invSy(py);
    if (x >= xMin && x <= xMax && y >= yMin && y <= yMax) {
      setInitialPoints((prev) => [...prev, { x, y }]);
    }
  }, [width, height]);

  const gridLines = useMemo(() => {
    const lines: JSX.Element[] = [];
    for (let x = Math.ceil(xMin); x <= xMax; x++) {
      lines.push(<line key={`v${x}`} x1={sx(x)} y1={sy(yMin)} x2={sx(x)} y2={sy(yMax)} stroke={x === 0 ? 'var(--color-ink-faint)' : 'var(--color-rule)'} strokeWidth={x === 0 ? 1 : 0.5} />);
    }
    for (let y = Math.ceil(yMin); y <= yMax; y++) {
      lines.push(<line key={`h${y}`} x1={sx(xMin)} y1={sy(y)} x2={sx(xMax)} y2={sy(y)} stroke={y === 0 ? 'var(--color-ink-faint)' : 'var(--color-rule)'} strokeWidth={y === 0 ? 1 : 0.5} />);
    }
    return lines;
  }, [width]);

  return (
    <div className="flex h-full w-full flex-col">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ background: 'var(--color-paper)' }} onClick={handleSvgClick}>
        {gridLines}

        {/* Slope field ticks */}
        {slopeTicks.map((t, i) => (
          <line key={i}
            x1={sx(t.x - t.dx)} y1={sy(t.y - t.dy)}
            x2={sx(t.x + t.dx)} y2={sy(t.y + t.dy)}
            stroke="var(--color-ink-muted)" strokeWidth={1} opacity={0.5}
          />
        ))}

        {/* Solution curves */}
        {solutionCurves.map((curve, ci) => {
          const pts = curve.filter(p => p.x >= xMin && p.x <= xMax && p.y >= yMin - 1 && p.y <= yMax + 1);
          if (pts.length < 2) return null;
          const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.x).toFixed(1)},${sy(p.y).toFixed(1)}`).join(' ');
          return <path key={ci} d={d} fill="none" stroke="var(--color-accent)" strokeWidth={2} />;
        })}

        {/* Initial point markers */}
        {initialPoints.map((pt, i) => (
          <circle key={i} cx={sx(pt.x)} cy={sy(pt.y)} r={4} fill="var(--color-accent)" />
        ))}

        {/* Instructions */}
        {initialPoints.length === 0 && (
          <text x={width / 2} y={height / 2} textAnchor="middle" className="text-[14px]" fill="var(--color-ink-muted)" style={{ fontFamily: 'var(--font-sans)' }}>
            Click anywhere to draw a solution curve
          </text>
        )}
      </svg>

      <div className="flex flex-wrap items-center gap-4 border-t border-rule bg-paper-elevated px-4 py-3">
        <div className="flex gap-1">
          {Object.keys(EQUATIONS).map((k) => (
            <button key={k} type="button" onClick={() => { setEqKey(k); setInitialPoints([]); }}
              className={`rounded-sm border px-2 py-0.5 font-mono text-[11px] transition-colors duration-fast ${k === eqKey ? 'border-accent bg-accent-soft text-accent' : 'border-rule bg-paper-elevated text-ink-muted hover:bg-surface-1'}`}>
              {k}
            </button>
          ))}
        </div>

        <button type="button" onClick={() => setInitialPoints([])}
          className="rounded-sm border border-rule px-2 py-0.5 font-sans text-[11px] text-ink-muted hover:bg-surface-1 transition-colors duration-fast">
          Clear curves
        </button>

        <div className="ml-auto font-mono text-[11px] text-ink-muted">
          {initialPoints.length} curve{initialPoints.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  );
}
