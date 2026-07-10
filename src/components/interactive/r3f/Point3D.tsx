interface Point3DProps {
  position: [number, number, number];
  color: string;
  size?: number;
}

export function Point3D({ position, color, size = 0.06 }: Point3DProps) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[size, 10, 10]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}
