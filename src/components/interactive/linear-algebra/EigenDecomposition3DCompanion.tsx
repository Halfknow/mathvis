import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { R3FCanvas, Arrow3D, Axes3D, Point3D } from '../r3f';
import { Line } from '@react-three/drei';

interface EigenDecomposition3DCompanionProps {
  mode?: 'eigen' | 'diagonalize' | 'svd' | 'gram-schmidt';
}

function AnimatedEigenScene({ t }: { t: number }) {
  // Animate circle → ellipse as t goes 0→1
  const eigenvals = [2, 0.5, 1.5];
  const s = t; // stretch factor

  const circlePoints = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < 48; i++) {
      const angle = (i / 48) * 2 * Math.PI;
      pts.push([Math.cos(angle), Math.sin(angle), 0]);
    }
    return pts;
  }, []);

  const ellipsePoints = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < 48; i++) {
      const angle = (i / 48) * 2 * Math.PI;
      const cx = Math.cos(angle);
      const cy = Math.sin(angle);
      pts.push([
        (1 + (eigenvals[0] - 1) * s) * cx,
        (1 + (eigenvals[1] - 1) * s) * cy,
        0,
      ]);
    }
    return pts;
  }, [s]);

  // Eigenvector arrow endpoints scale with t
  const e1Len = 1 + (eigenvals[0] - 1) * s;
  const e2Len = 1 + (eigenvals[1] - 1) * s;
  const e3Len = 1 + (eigenvals[2] - 1) * s;

  return (
    <>
      <Axes3D />
      {circlePoints.map((p, i) => (
        <Point3D key={`c${i}`} position={p} color="#888" size={0.02} />
      ))}
      {ellipsePoints.map((p, i) => (
        <Point3D key={`e${i}`} position={p} color="#c0756b" size={0.03} />
      ))}
      <Arrow3D end={[e1Len, 0, 0]} color="#e74c3c" label={`λ₁=${eigenvals[0]}`} lineWidth={3} />
      <Arrow3D end={[0, e2Len, 0]} color="#2ecc71" label={`λ₂=${eigenvals[1]}`} lineWidth={3} />
      <Arrow3D end={[0, 0, e3Len]} color="#3498db" label={`λ₃=${eigenvals[2]}`} lineWidth={3} />
      <Arrow3D end={[-e1Len, 0, 0]} color="#e74c3c" lineWidth={1.5} />
      <Arrow3D end={[0, -e2Len, 0]} color="#2ecc71" lineWidth={1.5} />
      <Arrow3D end={[0, 0, -e3Len]} color="#3498db" lineWidth={1.5} />
    </>
  );
}

function DiagonalizeScene() {
  const corners = [
    [0,0,0],[2,0,0],[2,0.5,0],[0,0.5,0],
    [0,0,1.5],[2,0,1.5],[2,0.5,1.5],[0,0.5,1.5],
  ] as [number,number,number][];

  const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];

  return (
    <>
      <Axes3D />
      {edges.map(([a, b], i) => (
        <Line key={i} points={[corners[a], corners[b]]} color="#c0756b" lineWidth={2} />
      ))}
      <Arrow3D end={[2, 0, 0]} color="#e74c3c" label="×2" lineWidth={2.5} />
      <Arrow3D end={[0, 0.5, 0]} color="#2ecc71" label="×0.5" lineWidth={2.5} />
      <Arrow3D end={[0, 0, 1.5]} color="#3498db" label="×1.5" lineWidth={2.5} />
    </>
  );
}

function SVDScene() {
  const sv = [2, 0.8];
  const angle = Math.PI / 6;

  const circlePoints = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < 48; i++) {
      const t = (i / 48) * 2 * Math.PI;
      pts.push([Math.cos(t), Math.sin(t), 0]);
    }
    return pts;
  }, []);

  const stretchedPoints = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < 48; i++) {
      const t = (i / 48) * 2 * Math.PI;
      pts.push([sv[0] * Math.cos(t), sv[1] * Math.sin(t), 0]);
    }
    return pts;
  }, []);

  const rotatedPoints = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < 48; i++) {
      const t = (i / 48) * 2 * Math.PI;
      const x = sv[0] * Math.cos(t);
      const y = sv[1] * Math.sin(t);
      pts.push([x*Math.cos(angle) - y*Math.sin(angle), x*Math.sin(angle) + y*Math.cos(angle), 0.5]);
    }
    return pts;
  }, []);

  return (
    <>
      <Axes3D />
      {circlePoints.map((p, i) => (
        <Point3D key={`c${i}`} position={p} color="#888" size={0.02} />
      ))}
      {stretchedPoints.map((p, i) => (
        <Point3D key={`s${i}`} position={p} color="#f39c12" size={0.025} />
      ))}
      {rotatedPoints.map((p, i) => (
        <Point3D key={`r${i}`} position={p} color="#c0756b" size={0.03} />
      ))}
      <Arrow3D end={[sv[0]*Math.cos(angle), sv[0]*Math.sin(angle), 0.5]} color="#e74c3c" label="σ₁=2" lineWidth={2.5} />
      <Arrow3D end={[-sv[1]*Math.sin(angle), sv[1]*Math.cos(angle), 0.5]} color="#2ecc71" label="σ₂=0.8" lineWidth={2.5} />
    </>
  );
}

function GramSchmidtScene() {
  const v1: [number, number, number] = [2, 0.5, 0];
  const v2: [number, number, number] = [1, 1.5, 1];

  const u1 = v1;
  const u1Len = Math.sqrt(u1[0]**2 + u1[1]**2 + u1[2]**2);
  const dot = v2[0]*u1[0] + v2[1]*u1[1] + v2[2]*u1[2];
  const t = dot / (u1Len * u1Len);
  const proj: [number, number, number] = [t*u1[0], t*u1[1], t*u1[2]];
  const u2: [number, number, number] = [v2[0]-proj[0], v2[1]-proj[1], v2[2]-proj[2]];

  const s = 0.25;
  const dLen = Math.sqrt(u2[0]**2 + u2[1]**2 + u2[2]**2);
  const dn = dLen > 0 ? [u2[0]/dLen, u2[1]/dLen, u2[2]/dLen] : [0,0,1];
  const an = [u1[0]/u1Len, u1[1]/u1Len, u1[2]/u1Len];
  const c1: [number, number, number] = [s*an[0], s*an[1], s*an[2]];
  const c2: [number, number, number] = [c1[0]+s*dn[0], c1[1]+s*dn[1], c1[2]+s*dn[2]];
  const c3: [number, number, number] = [s*dn[0], s*dn[1], s*dn[2]];

  return (
    <>
      <Axes3D />
      <Arrow3D end={v1} color="#3498db" label="v₁" lineWidth={1.5} />
      <Arrow3D end={v2} color="#2ecc71" label="v₂" lineWidth={1.5} />
      <Line points={[v2, proj]} color="#f39c12" lineWidth={1} dashed dashSize={0.1} dashOffset={0} gapSize={0.05} />
      <Arrow3D end={u1} color="#e74c3c" label="u₁" lineWidth={2.5} />
      <Arrow3D end={u2} color="#9b59b6" label="u₂" lineWidth={2.5} />
      <Line points={[c1, c2, c3]} color="#e74c3c" lineWidth={2} />
    </>
  );
}

const modeButtons = [
  { mode: 'eigen', label: 'Eigenvalues' },
  { mode: 'diagonalize', label: 'Diagonalize' },
  { mode: 'svd', label: 'SVD' },
  { mode: 'gram-schmidt', label: 'Gram-Schmidt' },
];

const captions: Record<string, string> = {
  eigen: 'Circle → ellipse. Eigenvectors (colored arrows) stay on their line — only stretched by λ.',
  diagonalize: 'In eigen-coordinates, the matrix is just axis-aligned stretching. The box deforms without rotating.',
  svd: 'Gray circle → orange stretch → terracotta rotation. SVD decomposes any matrix into U·Σ·Vᵀ.',
  'gram-schmidt': 'Green v₂ sheds its component along blue v₁, becoming purple u₂ — orthogonal to red u₁.',
};

export function EigenDecomposition3DCompanion({ mode: initialMode = 'eigen' }: EigenDecomposition3DCompanionProps) {
  const [activeMode, setActiveMode] = useState(initialMode);
  const [animT, setAnimT] = useState(1);
  const animRef = useRef<number | null>(null);

  const handleModeChange = useCallback((newMode: string) => {
    setActiveMode(newMode);
    if (newMode === 'eigen') {
      setAnimT(0);
      const start = performance.now();
      const duration = 1000;
      const tick = () => {
        const elapsed = performance.now() - start;
        const rawT = Math.min(elapsed / duration, 1);
        const t = rawT < 0.5
          ? 4 * rawT * rawT * rawT
          : 1 - Math.pow(-2 * rawT + 2, 3) / 2;
        setAnimT(t);
        if (rawT < 1) {
          animRef.current = requestAnimationFrame(tick);
        }
      };
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = requestAnimationFrame(tick);
    } else {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      setAnimT(1);
    }
  }, []);

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  const scene = useMemo(() => {
    switch (activeMode) {
      case 'eigen': return <AnimatedEigenScene t={animT} />;
      case 'diagonalize': return <DiagonalizeScene />;
      case 'svd': return <SVDScene />;
      case 'gram-schmidt': return <GramSchmidtScene />;
      default: return <AnimatedEigenScene t={animT} />;
    }
  }, [activeMode, animT]);

  return (
    <div className="not-prose">
      <R3FCanvas height={320} cameraPosition={[3.5, 2.5, 3.5]}>
        {scene}
      </R3FCanvas>

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
