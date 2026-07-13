import { useMemo, useState, useCallback, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useAnimatedPreset } from './useAnimatedPreset';

const presetList = [
  { label: 'Standard (x × y)', ax: 1, ay: 0, az: 0, bx: 0, by: 1, bz: 0 },
  { label: 'Parallel (zero)', ax: 1, ay: 0, az: 0, bx: 2, by: 0, bz: 0 },
  { label: 'Orthogonal max', ax: 1, ay: 0, az: 0, bx: 0, by: 2, bz: 0 },
  { label: '45° angle', ax: 1, ay: 0, az: 0, bx: 0.707, by: 0.707, bz: 0 },
  { label: 'Anti-parallel', ax: 1, ay: 0, az: 0, bx: -1, by: 0, bz: 0 },
];

interface CrossProductVisProps {}

function Arrow({ start, end, color, label, lineWidth = 3 }: {
  start: number[]; end: number[]; color: string; label?: string; lineWidth?: number;
}) {
  const dir = new THREE.Vector3(end[0] - start[0], end[1] - start[1], end[2] - start[2]);
  const len = dir.length();
  const coneLength = 0.2;
  const coneRadius = 0.07;

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
      <Line points={[start, end]} color={color} lineWidth={lineWidth} />
      <mesh position={conePos} quaternion={quaternion}>
        <coneGeometry args={[coneRadius, coneLength, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {label && (
        <Text
          position={labelPos}
          fontSize={0.22}
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

function Parallelogram({ a, b, color }: { a: number[]; b: number[]; color: string }) {
  const verts = useMemo(() => {
    const o = [0, 0, 0];
    const aEnd = a;
    const bEnd = b;
    const sum = [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
    return new Float32Array([
      ...o, ...aEnd, ...sum,
      ...o, ...sum, ...bEnd,
    ]);
  }, [a, b]);

  return (
    <group>
      <mesh>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[verts, 3]}
            count={6}
            itemSize={3}
          />
        </bufferGeometry>
        <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>
      <Line points={[[0,0,0], a, [a[0]+b[0], a[1]+b[1], a[2]+b[2]], b, [0,0,0]]} color={color} lineWidth={1.5} transparent opacity={0.5} />
    </group>
  );
}

function Scene({ a, b }: { a: number[]; b: number[] }) {
  const cross = useMemo(() => {
    const cx = a[1] * b[2] - a[2] * b[1];
    const cy = a[2] * b[0] - a[0] * b[2];
    const cz = a[0] * b[1] - a[1] * b[0];
    return [cx, cy, cz];
  }, [a, b]);

  const area = useMemo(() => Math.sqrt(cross[0] ** 2 + cross[1] ** 2 + cross[2] ** 2), [cross]);

  const dotAB = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const lenA = Math.sqrt(a[0] ** 2 + a[1] ** 2 + a[2] ** 2);
  const lenB = Math.sqrt(b[0] ** 2 + b[1] ** 2 + b[2] ** 2);
  const cosTheta = lenA > 0 && lenB > 0 ? dotAB / (lenA * lenB) : 0;

  return (
    <>
      <ambientLight intensity={0.8} />

      {/* Faint axes */}
      {[[1,0,0],[0,1,0],[0,0,1]].map((dir, i) => (
        <Line key={i} points={[[-3*dir[0],-3*dir[1],-3*dir[2]], [3*dir[0],3*dir[1],3*dir[2]]]}
          color="#555" lineWidth={0.5} transparent opacity={0.3} />
      ))}

      {/* Vector a */}
      <Arrow start={[0,0,0]} end={a} color="#3498db" label="a" />

      {/* Vector b */}
      <Arrow start={[0,0,0]} end={b} color="#2ecc71" label="b" />

      {/* Parallelogram */}
      <Parallelogram a={a} b={b} color="#f39c12" />

      {/* Cross product vector */}
      {area > 0.01 && (
        <Arrow start={[0,0,0]} end={cross} color="#e74c3c" label="a×b" lineWidth={4} />
      )}

      {/* Right angle marker between cross and a */}
      {area > 0.01 && (
        <>
          <Line
            points={[
              [cross[0] * 0.1, cross[1] * 0.1, cross[2] * 0.1],
              [cross[0] * 0.1 + a[0] * 0.1, cross[1] * 0.1 + a[1] * 0.1, cross[2] * 0.1 + a[2] * 0.1],
              [a[0] * 0.1, a[1] * 0.1, a[2] * 0.1],
            ]}
            color="#e74c3c" lineWidth={1} transparent opacity={0.6}
          />
        </>
      )}

      <OrbitControls makeDefault enableDamping dampingFactor={0.1} />
    </>
  );
}

export function CrossProductVis({}: CrossProductVisProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [a, setA] = useState([1, 0, 0]);
  const [b, setB] = useState([0, 1, 0]);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  const { applyPreset } = useAnimatedPreset(
    () => ({ ax: a[0], ay: a[1], az: a[2], bx: b[0], by: b[1], bz: b[2] }),
    useCallback((vals) => {
      setA([vals.ax, vals.ay, vals.az]);
      setB([vals.bx, vals.by, vals.bz]);
    }, []),
  );

  const cross = useMemo(() => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ], [a, b]);

  const area = Math.sqrt(cross[0] ** 2 + cross[1] ** 2 + cross[2] ** 2);
  const dotAB = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

  const updateA = (i: number, val: string) => {
    const n = parseFloat(val);
    if (isNaN(n)) return;
    setA(prev => { const copy = [...prev]; copy[i] = n; return copy; });
  };
  const updateB = (i: number, val: string) => {
    const n = parseFloat(val);
    if (isNaN(n)) return;
    setB(prev => { const copy = [...prev]; copy[i] = n; return copy; });
  };

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
        {presetList.map((p) => (
          <button
            key={p.label}
            onClick={() => {
              setActivePreset(p.label);
              applyPreset({ ax: p.ax, ay: p.ay, az: p.az, bx: p.bx, by: p.by, bz: p.bz });
            }}
            style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '4px',
              border: `1px solid ${activePreset === p.label ? 'var(--color-accent)' : 'var(--color-border)'}`,
              background: activePreset === p.label ? 'var(--color-accent)' : 'var(--color-surface)',
              color: activePreset === p.label ? 'white' : 'var(--color-muted)',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
      }}>
        <div style={{ height: '400px' }}>
          {mounted && (
            <Canvas camera={{ position: [3, 2, 3], fov: 50 }} style={{ background: '#1a1a2e' }}>
              <Scene a={a} b={b} />
            </Canvas>
          )}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        marginTop: '0.75rem',
      }}>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#3498db', marginBottom: '0.25rem' }}>
            Vector a
          </div>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {a.map((v, i) => (
              <input key={i} type="number" step="0.1" value={v}
                onChange={e => updateA(i, e.target.value)}
                style={{
                  width: '100%', padding: '0.3rem',
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  borderRadius: '4px', color: 'var(--color-text)', fontSize: '0.85rem',
                  textAlign: 'center', fontFamily: 'var(--font-mono)',
                }}
              />
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.8rem', color: '#2ecc71', marginBottom: '0.25rem' }}>
            Vector b
          </div>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {b.map((v, i) => (
              <input key={i} type="number" step="0.1" value={v}
                onChange={e => updateB(i, e.target.value)}
                style={{
                  width: '100%', padding: '0.3rem',
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  borderRadius: '4px', color: 'var(--color-text)', fontSize: '0.85rem',
                  textAlign: 'center', fontFamily: 'var(--font-mono)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div style={{
        marginTop: '0.5rem',
        fontSize: '0.85rem',
        color: 'var(--color-muted)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0.5rem',
      }}>
        <div>
          a × b = ({cross.map(v => v.toFixed(2)).join(', ')})
        </div>
        <div>
          Parallelogram area = {area.toFixed(3)}
          {area < 0.01 && ' (parallel)'}
          {dotAB < 0 && ' (anti-aligned)'}
        </div>
      </div>
    </div>
  );
}
