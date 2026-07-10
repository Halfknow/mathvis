import { Line } from '@react-three/drei';

interface Axes3DProps {
  length?: number;
  labels?: boolean;
}

export function Axes3D({ length = 4, labels: _labels = false }: Axes3DProps) {
  const axes: { dir: [number, number, number]; color: string }[] = [
    { dir: [length, 0, 0], color: '#e74c3c' },
    { dir: [0, length, 0], color: '#2ecc71' },
    { dir: [0, 0, length], color: '#3498db' },
  ];

  return (
    <group>
      {axes.map(({ dir, color }, i) => (
        <group key={i}>
          <Line
            points={[[-dir[0], -dir[1], -dir[2]], dir]}
            color={color}
            lineWidth={1}
            transparent
            opacity={0.35}
          />
        </group>
      ))}
    </group>
  );
}
