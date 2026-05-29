import { useMemo } from 'react';
import { R3FCanvas, Arrow3D, Axes3D, Point3D } from '../r3f';

interface SpanBasis3DCompanionProps {
  /** 'combo' = linear combination, 'span' = span fill, 'basis' = two bases */
  mode?: 'combo' | 'span' | 'basis';
}

function LinearComboScene() {
  const v1: [number, number, number] = [2, 0, 0];
  const v2: [number, number, number] = [0, 1.5, 1];
  const combo: [number, number, number] = [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]];

  return (
    <>
      <Axes3D />
      <Arrow3D end={v1} color="#3498db" label="v₁" />
      <Arrow3D start={v1} end={combo} color="#2ecc71" label="v₂" />
      <Arrow3D end={combo} color="#e74c3c" label="v₁+v₂" lineWidth={3} />
    </>
  );
}

function SpanScene() {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = -4; i <= 4; i++) {
      for (let j = -4; j <= 4; j++) {
        const c1 = i * 0.5;
        const c2 = j * 0.5;
        pts.push([c1 * 2 + c2 * 0, c1 * 0 + c2 * 1.5, c2 * 1]);
      }
    }
    return pts;
  }, []);

  return (
    <>
      <Axes3D />
      <Arrow3D end={[2, 0, 0]} color="#3498db" label="v₁" />
      <Arrow3D end={[0, 1.5, 1]} color="#2ecc71" label="v₂" />
      {points.map((p, i) => (
        <Point3D key={i} position={p} color="#c0756b" size={0.04} />
      ))}
    </>
  );
}

function BasisScene() {
  // Standard basis point (1,1,1)
  const target: [number, number, number] = [1, 1, 1];
  // Alternative basis: b1=(1,0,1), b2=(0,1,0), b3=(0,0,1)
  // target = 1*b1 + 1*b2 + 0*b3

  return (
    <>
      <Axes3D />
      {/* Standard basis */}
      <Arrow3D end={[1, 0, 0]} color="#3498db" lineWidth={1.5} />
      <Arrow3D end={[0, 1, 0]} color="#2ecc71" lineWidth={1.5} />
      <Arrow3D end={[0, 0, 1]} color="#9b59b6" lineWidth={1.5} />
      {/* Target point */}
      <Point3D position={target} color="#e74c3c" size={0.1} />
    </>
  );
}

export function SpanBasis3DCompanion({ mode = 'span' }: SpanBasis3DCompanionProps) {
  return (
    <div>
      <R3FCanvas height={280} cameraPosition={[4, 3, 4]}>
        {mode === 'combo' && <LinearComboScene />}
        {mode === 'span' && <SpanScene />}
        {mode === 'basis' && <BasisScene />}
      </R3FCanvas>
      <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--color-muted)', fontStyle: 'italic', textAlign: 'center' }}>
        {mode === 'combo' && 'In 3D, linear combinations reach any point in the span.'}
        {mode === 'span' && 'Terracotta dots: all points reachable by combining v₁ and v₂ — a tilted plane in 3D.'}
        {mode === 'basis' && 'Three independent directions span all of 3D. The red point has unique coordinates.'}
      </div>
    </div>
  );
}
