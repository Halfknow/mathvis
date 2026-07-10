import { useMemo } from 'react';
import { Line, Text } from '@react-three/drei';
import * as THREE from 'three';

interface Arrow3DProps {
  start?: [number, number, number];
  end: [number, number, number];
  color: string;
  label?: string;
  lineWidth?: number;
}

export function Arrow3D({
  start = [0, 0, 0],
  end,
  color,
  label,
  lineWidth = 2.5,
}: Arrow3DProps) {
  const { conePos, coneRotation, labelPos } = useMemo(() => {
    const dir = new THREE.Vector3(end[0] - start[0], end[1] - start[1], end[2] - start[2]);
    const len = dir.length();
    const coneLength = 0.18;

    const quaternion = new THREE.Quaternion();
    const defaultDir = new THREE.Vector3(0, 1, 0);
    if (len > 0.001) {
      quaternion.setFromUnitVectors(defaultDir, dir.clone().normalize());
    }
    const euler = new THREE.Euler().setFromQuaternion(quaternion);

    const tipOffset = len > 0.001 ? dir.clone().normalize().multiplyScalar(coneLength * 0.5) : new THREE.Vector3();
    const cp: [number, number, number] = [
      end[0] - tipOffset.x,
      end[1] - tipOffset.y,
      end[2] - tipOffset.z,
    ];

    const labelOffset = len > 0.001 ? dir.clone().normalize().multiplyScalar(0.3) : new THREE.Vector3(0, 0.3, 0);
    const lp: [number, number, number] = [
      end[0] + labelOffset.x,
      end[1] + labelOffset.y + 0.1,
      end[2] + labelOffset.z,
    ];

    return { conePos: cp, coneRotation: [euler.x, euler.y, euler.z] as [number, number, number], labelPos: lp };
  }, [start[0], start[1], start[2], end[0], end[1], end[2]]);

  return (
    <group>
      <Line points={[start, end]} color={color} lineWidth={lineWidth} />
      <mesh position={conePos} rotation={coneRotation}>
        <coneGeometry args={[0.06, 0.18, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {label && (
        <Text
          position={labelPos}
          fontSize={0.2}
          color={color}
          anchorX="center"
          anchorY="middle"
        >
          {label}
        </Text>
      )}
    </group>
  );
}
