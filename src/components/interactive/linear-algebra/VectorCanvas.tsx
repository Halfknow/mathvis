import { useState, useRef, useCallback, useEffect } from 'react';

interface VectorCanvasProps {
  initialVectors?: Array<{
    x: number;
    y: number;
    color: string;
    label?: string;
    originX?: number;
    originY?: number;
  }>;
  showGrid?: boolean;
  gridSize?: number;
  width?: number;
  height?: number;
  onVectorsChange?: (vectors: Array<{ x: number; y: number }>) => void;
}

const COLORS = [
  'var(--color-vector-blue)',
  'var(--color-vector-green)',
  'var(--color-accent)',
  'var(--color-vector-yellow)',
  'var(--color-vector-red)',
];

export function VectorCanvas({
  initialVectors,
  showGrid = true,
  gridSize = 8,
  width = 640,
  height = 400,
  onVectorsChange,
}: VectorCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  const defaultVectors = [
    { x: 3, y: 2, color: COLORS[0], label: 'v⃗' },
    { x: -1, y: 3, color: COLORS[1], label: 'u⃗' },
  ];

  const [vectors, setVectors] = useState(
    initialVectors?.map((v, i) => ({
      ...v,
      color: v.color ?? COLORS[i % COLORS.length],
      label: v.label ?? String.fromCharCode(105 + i) + '⃗',
      originX: v.originX ?? 0,
      originY: v.originY ?? 0,
    })) ?? defaultVectors,
  );

  const [dragging, setDragging] = useState<number | null>(null);

  const padding = 40;
  const plotW = width - padding * 2;
  const plotH = height - padding * 2;
  const cx = width / 2;
  const cy = height / 2;
  const scale = Math.min(plotW, plotH) / (gridSize * 2);

  const toSvgX = (v: number) => cx + v * scale;
  const toSvgY = (v: number) => cy - v * scale;
  const fromSvgX = (px: number) => Math.round(((px - cx) / scale) * 4) / 4;
  const fromSvgY = (py: number) => Math.round(((cy - py) / scale) * 4) / 4;

  const handlePointerDown = useCallback((idx: number) => {
    setDragging(idx);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (dragging === null || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const scaleX = width / rect.width;
      const scaleY = height / rect.height;
      const px = (e.clientX - rect.left) * scaleX;
      const py = (e.clientY - rect.top) * scaleY;

      setVectors((prev) => {
        const next = [...prev];
        next[dragging] = {
          ...next[dragging],
          x: fromSvgX(px),
          y: fromSvgY(py),
        };
        return next;
      });
    },
    [dragging, width, height, scale, cx, cy],
  );

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    onVectorsChange?.(vectors.map((v) => ({ x: v.x, y: v.y })));
  }, [vectors, onVectorsChange]);

  const gridLines = [];
  if (showGrid) {
    for (let i = -gridSize; i <= gridSize; i++) {
      const isAxis = i === 0;
      gridLines.push(
        <line
          key={`v${i}`}
          x1={toSvgX(i)} y1={toSvgY(-gridSize)}
          x2={toSvgX(i)} y2={toSvgY(gridSize)}
          stroke={isAxis ? 'var(--color-ink-faint)' : 'var(--color-rule)'}
          strokeWidth={isAxis ? 1.2 : 0.5}
        />,
        <line
          key={`h${i}`}
          x1={toSvgX(-gridSize)} y1={toSvgY(i)}
          x2={toSvgX(gridSize)} y2={toSvgY(i)}
          stroke={isAxis ? 'var(--color-ink-faint)' : 'var(--color-rule)'}
          strokeWidth={isAxis ? 1.2 : 0.5}
        />,
      );
    }
    for (let i = -gridSize; i <= gridSize; i += 2) {
      gridLines.push(
        <text key={`lx${i}`} x={toSvgX(i)} y={toSvgY(0) + 16} textAnchor="middle" className="text-[10px] fill-[var(--color-ink-faint)]" style={{ fontFamily: 'var(--font-mono)' }}>{i}</text>,
        <text key={`ly${i}`} x={toSvgX(0) - 8} y={toSvgY(i) + 4} textAnchor="end" className="text-[10px] fill-[var(--color-ink-faint)]" style={{ fontFamily: 'var(--font-mono)' }}>{i}</text>,
      );
    }
  }

  const arrowHead = (color: string, id: string) => (
    <marker id={id} markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
      <path d="M0,0 L0,6 L8,3 z" fill={color} />
    </marker>
  );

  return (
    <div className="relative h-full w-full" style={{ touchAction: 'none' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
        style={{ background: 'var(--color-paper)' }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <defs>
          {vectors.map((v, i) => arrowHead(v.color, `ah-${i}`))}
        </defs>

        {gridLines}

        {vectors.map((v, i) => {
          const ox = toSvgX(v.originX ?? 0);
          const oy = toSvgY(v.originY ?? 0);
          const tx = toSvgX((v.originX ?? 0) + v.x);
          const ty = toSvgY((v.originY ?? 0) + v.y);

          return (
            <g key={i}>
              <line
                x1={ox} y1={oy} x2={tx} y2={ty}
                stroke={v.color}
                strokeWidth={2.5}
                markerEnd={`url(#ah-${i})`}
              />
              <circle
                cx={tx}
                cy={ty}
                r={8}
                fill={v.color}
                opacity={0.2}
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={() => handlePointerDown(i)}
              />
              <circle
                cx={tx}
                cy={ty}
                r={5}
                fill={v.color}
                className="cursor-grab active:cursor-grabbing"
                onPointerDown={() => handlePointerDown(i)}
              />
              <text
                x={tx + 10}
                y={ty - 8}
                className="text-xs font-semibold"
                fill={v.color}
                style={{ fontFamily: 'var(--font-serif)', pointerEvents: 'none' }}
              >
                {v.label} ({v.x.toFixed(1)}, {v.y.toFixed(1)})
              </text>
            </g>
          );
        })}
      </svg>

      {/* Vector info panel */}
      <div className="absolute bottom-3 right-3 flex gap-2">
        {vectors.map((v, i) => (
          <span
            key={i}
            className="rounded-sm bg-paper-elevated border border-rule px-2 py-1 font-mono text-xs"
            style={{ color: v.color }}
          >
            |{v.label}| = {Math.sqrt(v.x * v.x + v.y * v.y).toFixed(2)}
          </span>
        ))}
      </div>
    </div>
  );
}
