import { Line } from '@react-three/drei';

interface GridPlane3DProps {
  size?: number;
  divisions?: number;
  color?: string;
  opacity?: number;
  y?: number;
}

export function GridPlane3D({
  size = 6,
  divisions = 12,
  color = '#444',
  opacity = 0.2,
  y = 0,
}: GridPlane3DProps) {
  const lines: { start: [number, number, number]; end: [number, number, number] }[] = [];
  const step = size / divisions;
  const half = size / 2;

  for (let i = 0; i <= divisions; i++) {
    const pos = -half + i * step;
    lines.push(
      { start: [pos, y, -half], end: [pos, y, half] },
      { start: [-half, y, pos], end: [half, y, pos] },
    );
  }

  return (
    <group>
      {lines.map((l, i) => (
        <Line key={i} points={[l.start, l.end]} color={color} lineWidth={0.5} transparent opacity={opacity} />
      ))}
    </group>
  );
}
