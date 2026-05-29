import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { R3FCanvas, Arrow3D, Axes3D, Point3D } from '../r3f';
import { Line } from '@react-three/drei';

interface MatrixTransform3DCompanionProps {
  mode?: 'identity' | 'shear' | 'scale' | 'rotate' | 'flatten' | 'inverse' | 'column-space' | 'null-space' | 'composition';
}

const presets: Record<string, number[][]> = {
  identity: [[1,0,0],[0,1,0],[0,0,1]],
  shear: [[1,0.8,0],[0,1,0],[0,0,1]],
  scale: [[2,0,0],[0,1.5,0],[0,0,0.8]],
  rotate: [
    [0.707, -0.707, 0],
    [0.707, 0.707, 0],
    [0, 0, 1],
  ],
  flatten: [[1,0,0],[0,1,0],[0,0,0]],
  inverse: [[0.5,0,0],[0,0.8,0.3],[0,0,1]],
  'column-space': [[1,0,2],[0,1,1],[0,0,0]],
  'null-space': [[1,2,0],[2,4,0],[0,0,1]],
  composition: [[1.5,0,0],[0,1.5,0],[0,0,1.5]],
};

const identity = presets.identity;

function applyMatrix(m: number[][], v: [number, number, number]): [number, number, number] {
  return [
    m[0][0]*v[0] + m[0][1]*v[1] + m[0][2]*v[2],
    m[1][0]*v[0] + m[1][1]*v[1] + m[1][2]*v[2],
    m[2][0]*v[0] + m[2][1]*v[1] + m[2][2]*v[2],
  ];
}

function lerpMatrix(a: number[][], b: number[][], t: number): number[][] {
  return a.map((row, i) => row.map((val, j) => val + (b[i][j] - val) * t));
}

function matrixDet(m: number[][]): number {
  return m[0][0]*(m[1][1]*m[2][2]-m[1][2]*m[2][1])
    - m[0][1]*(m[1][0]*m[2][2]-m[1][2]*m[2][0])
    + m[0][2]*(m[1][0]*m[2][1]-m[1][1]*m[2][0]);
}

function AnimatedUnitCube({ matrix, color, opacity = 0.6 }: { matrix: number[][]; color: string; opacity?: number }) {
  const corners = useMemo(() => {
    const raw = [
      [0,0,0],[1,0,0],[1,1,0],[0,1,0],
      [0,0,1],[1,0,1],[1,1,1],[0,1,1],
    ] as [number,number,number][];
    return raw.map(c => applyMatrix(matrix, c));
  }, [matrix]);

  const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];

  return (
    <group>
      {edges.map(([a, b], i) => (
        <Line key={i} points={[corners[a], corners[b]]} color={color} lineWidth={2} transparent opacity={opacity} />
      ))}
    </group>
  );
}

function AnimatedBasisArrows({ matrix }: { matrix: number[][] }) {
  const e1 = applyMatrix(matrix, [1, 0, 0]);
  const e2 = applyMatrix(matrix, [0, 1, 0]);
  const e3 = applyMatrix(matrix, [0, 0, 1]);

  return (
    <group>
      <Arrow3D end={e1} color="#e74c3c" label="Ae₁" lineWidth={2.5} />
      <Arrow3D end={e2} color="#2ecc71" label="Ae₂" lineWidth={2.5} />
      <Arrow3D end={e3} color="#3498db" label="Ae₃" lineWidth={2.5} />
    </group>
  );
}

function AnimatedTransformScene({ currentMatrix }: { currentMatrix: number[][] }) {
  const det = matrixDet(currentMatrix);
  const detColor = Math.abs(det) < 0.01 ? '#e74c3c' : det < 0 ? '#e74c3c' : '#2ecc71';

  return (
    <>
      <Axes3D />
      <AnimatedUnitCube matrix={identity} color="#888" opacity={0.2} />
      <AnimatedUnitCube matrix={currentMatrix} color="#c0756b" />
      <AnimatedBasisArrows matrix={currentMatrix} />
      {/* Det label in 3D space */}
      <group position={[0, 2.5, 0]}>
        <mesh>
          <sphereGeometry args={[0.001]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>
    </>
  );
}

function ColumnSpaceScene() {
  const m = presets['column-space'];
  const points = useMemo(() => {
    const pts: [number,number,number][] = [];
    for (let i = -3; i <= 3; i++) {
      for (let j = -3; j <= 3; j++) {
        for (let k = -3; k <= 3; k++) {
          if (Math.abs(i) + Math.abs(j) + Math.abs(k) > 5) continue;
          const v: [number,number,number] = [i*0.4, j*0.4, k*0.4];
          pts.push(applyMatrix(m, v));
        }
      }
    }
    return pts;
  }, []);

  return (
    <>
      <Axes3D />
      <Arrow3D end={applyMatrix(m, [1,0,0])} color="#e74c3c" label="col₁" lineWidth={2.5} />
      <Arrow3D end={applyMatrix(m, [0,1,0])} color="#2ecc71" label="col₂" lineWidth={2.5} />
      <Arrow3D end={applyMatrix(m, [0,0,1])} color="#3498db" label="col₃" lineWidth={2.5} />
      {points.map((p, i) => (
        <Point3D key={i} position={p} color="#c0756b" size={0.03} />
      ))}
    </>
  );
}

function NullSpaceScene() {
  const m = presets['null-space'];
  const nullVecs = useMemo(() => {
    const pts: [number,number,number][] = [];
    for (let t = -2; t <= 2; t += 0.3) {
      pts.push([t*(-2), t*1, 0]);
    }
    return pts;
  }, []);

  return (
    <>
      <Axes3D />
      <Arrow3D end={applyMatrix(m, [1,0,0])} color="#e74c3c" label="col₁" lineWidth={2.5} />
      <Arrow3D end={applyMatrix(m, [0,1,0])} color="#2ecc71" label="col₂" lineWidth={2.5} />
      <Arrow3D end={applyMatrix(m, [0,0,1])} color="#3498db" label="col₃" lineWidth={2.5} />
      {nullVecs.map((p, i) => (
        <Point3D key={i} position={p} color="#f39c12" size={0.05} />
      ))}
      <Arrow3D end={[-2, 1, 0]} color="#f39c12" label="null" lineWidth={2} />
    </>
  );
}

function CompositionScene() {
  const a = [[1,0.5,0],[0,1,0],[0,0,1]];
  const b = [[1,0,0],[0.5,1,0],[0,0,1]];
  const ba = [
    [a[0][0]*b[0][0]+a[0][1]*b[1][0], a[0][0]*b[0][1]+a[0][1]*b[1][1], 0],
    [a[1][0]*b[0][0]+a[1][1]*b[1][0], a[1][0]*b[0][1]+a[1][1]*b[1][1], 0],
    [0, 0, 1],
  ];

  return (
    <>
      <Axes3D />
      <AnimatedUnitCube matrix={identity} color="#888" opacity={0.2} />
      <AnimatedUnitCube matrix={ba} color="#c0756b" />
      <Arrow3D end={applyMatrix(ba, [1,0,0])} color="#e74c3c" label="(BA)e₁" lineWidth={2.5} />
      <Arrow3D end={applyMatrix(ba, [0,1,0])} color="#2ecc71" label="(BA)e₂" lineWidth={2.5} />
      <Arrow3D end={applyMatrix(ba, [0,0,1])} color="#3498db" lineWidth={2.5} />
    </>
  );
}

function InverseScene() {
  const m2 = presets.inverse;
  const det = matrixDet(m2);
  const inv = useMemo(() => {
    if (Math.abs(det) < 0.001) return null;
    return [
      [(m2[1][1]*m2[2][2]-m2[1][2]*m2[2][1])/det, (m2[0][2]*m2[2][1]-m2[0][1]*m2[2][2])/det, (m2[0][1]*m2[1][2]-m2[0][2]*m2[1][1])/det],
      [(m2[1][2]*m2[2][0]-m2[1][0]*m2[2][2])/det, (m2[0][0]*m2[2][2]-m2[0][2]*m2[2][0])/det, (m2[0][2]*m2[1][0]-m2[0][0]*m2[1][2])/det],
      [(m2[1][0]*m2[2][1]-m2[1][1]*m2[2][0])/det, (m2[0][1]*m2[2][0]-m2[0][0]*m2[2][1])/det, (m2[0][0]*m2[1][1]-m2[0][1]*m2[1][0])/det],
    ];
  }, [m2, det]);

  return (
    <>
      <Axes3D />
      <AnimatedUnitCube matrix={identity} color="#888" opacity={0.2} />
      <AnimatedUnitCube matrix={m2} color="#c0756b" />
      <AnimatedBasisArrows matrix={m2} />
      {inv && (
        <>
          <Arrow3D end={applyMatrix(inv, [1,0,0])} color="#f39c12" label="A⁻¹e₁" lineWidth={1.5} />
          <Arrow3D end={applyMatrix(inv, [0,1,0])} color="#9b59b6" label="A⁻¹e₂" lineWidth={1.5} />
        </>
      )}
    </>
  );
}

const modeButtons = [
  { mode: 'identity', label: 'Identity' },
  { mode: 'shear', label: 'Shear' },
  { mode: 'scale', label: 'Scale' },
  { mode: 'rotate', label: 'Rotate' },
  { mode: 'flatten', label: 'Flatten (det=0)' },
  { mode: 'inverse', label: 'Inverse' },
  { mode: 'column-space', label: 'Column space' },
  { mode: 'null-space', label: 'Null space' },
  { mode: 'composition', label: 'Composition' },
];

const captions: Record<string, string> = {
  identity: 'Identity: the unit cube sits untouched at the origin.',
  shear: 'Shear: the cube tilts sideways — grid lines stay parallel but angles change.',
  scale: 'Scale: the cube stretches to different sizes along each axis.',
  rotate: 'Rotation around z-axis: the cube spins while keeping its shape.',
  flatten: 'Flatten (det=0): the cube collapses into a flat plane — information is lost.',
  inverse: 'Orange/purple arrows show A⁻¹, the inverse transformation that undoes A.',
  'column-space': 'Terracotta dots fill the column space — all reachable outputs of A.',
  'null-space': 'Yellow dots along the null space direction — inputs that map to zero.',
  composition: 'Applying A then B is the same as applying the single matrix BA.',
};

const animatedModes = new Set(['identity', 'shear', 'scale', 'rotate', 'flatten']);

export function MatrixTransform3DCompanion({ mode: initialMode = 'shear' }: MatrixTransform3DCompanionProps) {
  const [activeMode, setActiveMode] = useState(initialMode);
  const [animT, setAnimT] = useState(1);
  const [currentMatrix, setCurrentMatrix] = useState(presets[initialMode]);
  const animRef = useRef<number | null>(null);

  const handleModeChange = useCallback((newMode: string) => {
    setActiveMode(newMode);
    const target = presets[newMode] || presets.identity;

    if (animatedModes.has(newMode)) {
      setAnimT(0);
      const from = currentMatrix;
      const start = performance.now();
      const duration = 800;

      const tick = () => {
        const elapsed = performance.now() - start;
        const rawT = Math.min(elapsed / duration, 1);
        // easeCubicInOut
        const t = rawT < 0.5
          ? 4 * rawT * rawT * rawT
          : 1 - Math.pow(-2 * rawT + 2, 3) / 2;

        const interp = lerpMatrix(from, target, t);
        setCurrentMatrix(interp);
        setAnimT(t);

        if (rawT < 1) {
          animRef.current = requestAnimationFrame(tick);
        }
      };
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = requestAnimationFrame(tick);
    } else {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      setCurrentMatrix(target);
      setAnimT(1);
    }
  }, [currentMatrix]);

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  const det = matrixDet(currentMatrix);
  const detStr = det.toFixed(2);
  const detColor = Math.abs(det) < 0.01 ? 'var(--color-vector-red)' : det < 0 ? 'var(--color-vector-red)' : 'var(--color-vector-green)';

  const scene = useMemo(() => {
    switch (activeMode) {
      case 'column-space': return <ColumnSpaceScene />;
      case 'null-space': return <NullSpaceScene />;
      case 'composition': return <CompositionScene />;
      case 'inverse': return <InverseScene />;
      default: return <AnimatedTransformScene currentMatrix={currentMatrix} />;
    }
  }, [activeMode, currentMatrix]);

  return (
    <div className="not-prose">
      <R3FCanvas height={320} cameraPosition={[4, 3, 4]}>
        {scene}
      </R3FCanvas>

      {/* Determinant display */}
      {animatedModes.has(activeMode) && (
        <div style={{ textAlign: 'center', marginTop: '0.3rem' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: detColor, fontWeight: 'bold' }}>
            det = {detStr}
          </span>
          {Math.abs(det) < 0.01 && (
            <span style={{ fontSize: '0.7rem', color: 'var(--color-vector-red)', marginLeft: '0.5rem' }}>
              dimension collapsed!
            </span>
          )}
        </div>
      )}

      {/* Mode buttons */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem', justifyContent: 'center' }}>
        {modeButtons.map((btn) => (
          <button
            key={btn.mode}
            onClick={() => handleModeChange(btn.mode)}
            style={{
              padding: '0.25rem 0.6rem',
              borderRadius: '4px',
              border: `1px solid ${activeMode === btn.mode ? 'var(--color-accent)' : 'var(--color-border)'}`,
              background: activeMode === btn.mode ? 'var(--color-accent)' : 'var(--color-surface)',
              color: activeMode === btn.mode ? 'white' : 'var(--color-muted)',
              fontSize: '0.7rem',
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: '0.3rem', fontSize: '0.75rem', color: 'var(--color-muted)', fontStyle: 'italic', textAlign: 'center' }}>
        {captions[activeMode]}
      </div>
    </div>
  );
}
