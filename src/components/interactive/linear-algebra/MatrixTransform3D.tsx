import { useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Text } from '@react-three/drei';
import * as THREE from 'three';

interface MatrixTransform3DProps {
  initialM?: number[][];
}

function GridLines({ matrix, color, opacity }: { matrix: THREE.Matrix3; color: string; opacity: number }) {
  const lines = useMemo(() => {
    const result: { start: THREE.Vector3; end: THREE.Vector3 }[] = [];
    const range = 3;

    for (let i = -range; i <= range; i++) {
      for (let j = -range; j <= range; j++) {
        const p1 = new THREE.Vector3(i, j, -range).applyMatrix3(matrix);
        const p2 = new THREE.Vector3(i, j, range).applyMatrix3(matrix);
        result.push({ start: p1, end: p2 });

        const p3 = new THREE.Vector3(i, -range, j).applyMatrix3(matrix);
        const p4 = new THREE.Vector3(i, range, j).applyMatrix3(matrix);
        result.push({ start: p3, end: p4 });

        const p5 = new THREE.Vector3(-range, i, j).applyMatrix3(matrix);
        const p6 = new THREE.Vector3(range, i, j).applyMatrix3(matrix);
        result.push({ start: p5, end: p6 });
      }
    }
    return result;
  }, [matrix]);

  return (
    <group>
      {lines.map((l, i) => (
        <Line
          key={i}
          points={[l.start.toArray(), l.end.toArray()]}
          color={color}
          lineWidth={0.5}
          transparent
          opacity={opacity}
        />
      ))}
    </group>
  );
}

function BasisArrows({ matrix }: { matrix: THREE.Matrix3 }) {
  const e1 = new THREE.Vector3(1, 0, 0).applyMatrix3(matrix);
  const e2 = new THREE.Vector3(0, 1, 0).applyMatrix3(matrix);
  const e3 = new THREE.Vector3(0, 0, 1).applyMatrix3(matrix);

  const arrowLen = 1.2;

  return (
    <group>
      <Arrow start={[0, 0, 0]} end={e1.toArray()} color="#e74c3c" label="e₁" />
      <Arrow start={[0, 0, 0]} end={e2.toArray()} color="#2ecc71" label="e₂" />
      <Arrow start={[0, 0, 0]} end={e3.toArray()} color="#3498db" label="e₃" />
    </group>
  );
}

function Arrow({ start, end, color, label }: { start: number[]; end: number[]; color: string; label: string }) {
  const dir = new THREE.Vector3(end[0] - start[0], end[1] - start[1], end[2] - start[2]);
  const len = dir.length();
  const coneLength = 0.25;
  const coneRadius = 0.08;

  const quaternion = new THREE.Quaternion();
  const defaultDir = new THREE.Vector3(0, 1, 0);
  if (len > 0.001) {
    quaternion.setFromUnitVectors(defaultDir, dir.clone().normalize());
  }

  const tipOffset = len > 0.001 ? dir.clone().normalize().multiplyScalar(coneLength * 0.5) : new THREE.Vector3();
  const conePos: [number, number, number] = [
    end[0] - tipOffset.x,
    end[1] - tipOffset.y,
    end[2] - tipOffset.z,
  ];

  const labelOffset = len > 0.001 ? dir.clone().normalize().multiplyScalar(0.35) : new THREE.Vector3(0, 0.3, 0);
  const labelPos: [number, number, number] = [
    end[0] + labelOffset.x,
    end[1] + labelOffset.y + 0.1,
    end[2] + labelOffset.z,
  ];

  return (
    <group>
      <Line points={[start, end]} color={color} lineWidth={3} />
      <mesh position={conePos} quaternion={quaternion}>
        <coneGeometry args={[coneRadius, coneLength, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {label && (
        <Text
          position={labelPos}
          fontSize={0.25}
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

function Axes() {
  const len = 4;
  return (
    <group>
      <Line points={[[-len, 0, 0], [len, 0, 0]]} color="#444" lineWidth={1} transparent opacity={0.3} />
      <Line points={[[0, -len, 0], [0, len, 0]]} color="#444" lineWidth={1} transparent opacity={0.3} />
      <Line points={[[0, 0, -len], [0, 0, len]]} color="#444" lineWidth={1} transparent opacity={0.3} />
    </group>
  );
}

function UnitCube({ matrix, color }: { matrix: THREE.Matrix3; color: string }) {
  const corners = [
    [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
    [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1],
  ].map(c => new THREE.Vector3(...c).applyMatrix3(matrix).toArray());

  const edges = [
    [0,1],[1,2],[2,3],[3,0],
    [4,5],[5,6],[6,7],[7,4],
    [0,4],[1,5],[2,6],[3,7],
  ];

  return (
    <group>
      {edges.map(([a, b], i) => (
        <Line key={i} points={[corners[a], corners[b]]} color={color} lineWidth={2.5} />
      ))}
      {/* Semi-transparent faces */}
      <mesh>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array([
              ...corners[0], ...corners[1], ...corners[2],
              ...corners[0], ...corners[2], ...corners[3],
              ...corners[4], ...corners[5], ...corners[6],
              ...corners[4], ...corners[6], ...corners[7],
              ...corners[0], ...corners[1], ...corners[5],
              ...corners[0], ...corners[5], ...corners[4],
              ...corners[2], ...corners[3], ...corners[7],
              ...corners[2], ...corners[7], ...corners[6],
              ...corners[0], ...corners[3], ...corners[7],
              ...corners[0], ...corners[7], ...corners[4],
              ...corners[1], ...corners[2], ...corners[6],
              ...corners[1], ...corners[6], ...corners[5],
            ]), 3]}
            count={36}
            itemSize={3}
          />
        </bufferGeometry>
        <meshBasicMaterial color={color} transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function Scene({ m }: { m: number[][] }) {
  const matrix = useMemo(() => {
    return new THREE.Matrix3(
      m[0][0], m[0][1], m[0][2],
      m[1][0], m[1][1], m[1][2],
      m[2][0], m[2][1], m[2][2],
    );
  }, [m]);

  const identity = useMemo(() => new THREE.Matrix3(), []);

  return (
    <>
      <ambientLight intensity={0.8} />
      <Axes />
      <GridLines matrix={identity} color="#666" opacity={0.15} />
      <UnitCube matrix={identity} color="#888" />
      <GridLines matrix={matrix} color="#c0756b" opacity={0.4} />
      <UnitCube matrix={matrix} color="#c0756b" />
      <BasisArrows matrix={matrix} />
      <OrbitControls makeDefault enableDamping dampingFactor={0.1} />
    </>
  );
}

export function MatrixTransform3D({ initialM }: MatrixTransform3DProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [m, setM] = useState(initialM || [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ]);
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const animRef = useRef<{ from: number[][]; to: number[][]; start: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  const det = m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
    - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
    + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);

  const lerpMatrix = (a: number[][], b: number[][], t: number): number[][] =>
    a.map((row, i) => row.map((val, j) => val + (b[i][j] - val) * t));

  const animateToPreset = useCallback((target: number[][], name: string) => {
    setActivePreset(name);
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const from = m.map(row => [...row]);
    const start = performance.now();
    const duration = 800;

    const tick = () => {
      const elapsed = performance.now() - start;
      const rawT = Math.min(elapsed / duration, 1);
      const t = rawT < 0.5
        ? 4 * rawT * rawT * rawT
        : 1 - Math.pow(-2 * rawT + 2, 3) / 2;
      setM(lerpMatrix(from, target, t));
      if (rawT < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [m]);

  const update = (i: number, j: number, val: string) => {
    const n = parseFloat(val);
    if (isNaN(n)) return;
    setM(prev => {
      const copy = prev.map(row => [...row]);
      copy[i][j] = n;
      return copy;
    });
    setActivePreset(null);
  };

  const presets = {
    identity: [[1,0,0],[0,1,0],[0,0,1]],
    scale: [[2,0,0],[0,2,0],[0,0,2]],
    shear: [[1,1,0],[0,1,0],[0,0,1]],
    rotateZ: [
      [Math.cos(Math.PI/4).toFixed(3), (-Math.sin(Math.PI/4)).toFixed(3), 0],
      [Math.sin(Math.PI/4).toFixed(3), Math.cos(Math.PI/4).toFixed(3), 0],
      [0, 0, 1],
    ].map(r => r.map(Number)),
    flatten: [[1,0,0],[0,1,0],[0,0,0]],
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
      }}>
        <div style={{ height: '400px' }}>
          {mounted && (
            <Canvas camera={{ position: [4, 3, 5], fov: 50 }} style={{ background: '#1a1a2e' }}>
              <Scene m={m} />
            </Canvas>
          )}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '1rem',
        marginTop: '0.75rem',
        alignItems: 'start',
      }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: '0.25rem' }}>
            Matrix entries
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.25rem',
            maxWidth: '280px',
          }}>
            {m.map((row, i) =>
              row.map((val, j) => (
                <input
                  key={`${i}-${j}`}
                  type="number"
                  step="0.1"
                  value={val}
                  onChange={e => update(i, j, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.3rem',
                    background: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '4px',
                    color: 'var(--color-text)',
                    fontSize: '0.85rem',
                    textAlign: 'center',
                    fontFamily: 'monospace',
                  }}
                />
              ))
            )}
          </div>
          <div style={{
            marginTop: '0.5rem',
            fontSize: '0.85rem',
            color: Math.abs(det) < 0.01 ? 'var(--color-error)' : 'var(--color-muted)',
          }}>
            det = {det.toFixed(3)}
            {Math.abs(det) < 0.01 && ' (collapsed)'}
            {det < -0.01 && ' (orientation flipped)'}
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: '0.25rem' }}>
            Presets
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {Object.entries(presets).map(([name, val]) => (
              <button
                key={name}
                onClick={() => animateToPreset(val as number[][], name)}
                style={{
                  padding: '0.25rem 0.5rem',
                  background: activePreset === name ? 'var(--color-accent)' : 'var(--color-surface)',
                  border: `1px solid ${activePreset === name ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  borderRadius: '4px',
                  color: activePreset === name ? 'white' : 'var(--color-text)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s',
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
