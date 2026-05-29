import { R3FCanvas, Arrow3D, Axes3D, GridPlane3D } from '../r3f';
import { Line } from '@react-three/drei';

interface DotProduct3DCompanionProps {
  /** 'dot' shows alignment, 'ortho' shows perpendicularity */
  mode?: 'dot' | 'ortho';
}

function DotProductScene() {
  const a: [number, number, number] = [2, 0.5, 0.5];
  const b: [number, number, number] = [1.5, 1, 0.8];
  // Projection point: proj = (a.b / a.a) * a
  const ab = a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  const aa = a[0]*a[0] + a[1]*a[1] + a[2]*a[2];
  const t = ab / aa;
  const proj: [number, number, number] = [t*a[0], t*a[1], t*a[2]];

  return (
    <>
      <Axes3D />
      <GridPlane3D />
      <Arrow3D end={a} color="#3498db" label="a" />
      <Arrow3D end={b} color="#2ecc71" label="b" />
      {/* Projection line */}
      <Line points={[b, proj]} color="#f39c12" lineWidth={1.5} dashed dashSize={0.1} dashOffset={0} gapSize={0.05} transparent opacity={0.6} />
      {/* Projection arrow on a */}
      <Arrow3D end={proj} color="#f39c12" label="proj" lineWidth={1.5} />
    </>
  );
}

function OrthoScene() {
  const a: [number, number, number] = [2, 0, 0];
  const b: [number, number, number] = [0, 1.5, 1];
  // Right angle marker
  const s = 0.3;
  const corner1: [number, number, number] = [s, 0, 0];
  const corner2: [number, number, number] = [s, s * 0.75, s * 0.5];
  const corner3: [number, number, number] = [0, s * 0.75, s * 0.5];

  return (
    <>
      <Axes3D />
      <GridPlane3D />
      <Arrow3D end={a} color="#3498db" label="a" />
      <Arrow3D end={b} color="#2ecc71" label="b" />
      {/* Right angle marker */}
      <Line points={[corner1, corner2, corner3]} color="#e74c3c" lineWidth={2} />
    </>
  );
}

export function DotProduct3DCompanion({ mode = 'dot' }: DotProduct3DCompanionProps) {
  return (
    <div>
      <R3FCanvas height={280} cameraPosition={[3.5, 2.5, 3.5]}>
        {mode === 'dot' && <DotProductScene />}
        {mode === 'ortho' && <OrthoScene />}
      </R3FCanvas>
      <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--color-muted)', fontStyle: 'italic', textAlign: 'center' }}>
        {mode === 'dot' && 'Yellow dashed line: projection of b onto a. The same alignment idea works in 3D.'}
        {mode === 'ortho' && 'a ⊥ b means a · b = 0. The right angle exists in 3D too.'}
      </div>
    </div>
  );
}
