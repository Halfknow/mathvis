import { R3FCanvas, Arrow3D, Axes3D, GridPlane3D, Point3D } from '../r3f';
import { Line } from '@react-three/drei';

interface ProjectionBasis3DCompanionProps {
  mode?: 'projection' | 'basis';
}

function ProjectionScene() {
  const a: [number, number, number] = [2, 0.5, 0];
  const b: [number, number, number] = [0.5, 1.5, 1.5];
  const ab = a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
  const aa = a[0]*a[0] + a[1]*a[1] + a[2]*a[2];
  const t = ab / aa;
  const proj: [number, number, number] = [t*a[0], t*a[1], t*a[2]];
  // Right angle marker
  const s = 0.25;
  const d: [number, number, number] = [b[0]-proj[0], b[1]-proj[1], b[2]-proj[2]];
  const dLen = Math.sqrt(d[0]*d[0]+d[1]*d[1]+d[2]*d[2]);
  const dn = dLen > 0 ? [d[0]/dLen, d[1]/dLen, d[2]/dLen] : [0,0,1];
  const aLen = Math.sqrt(a[0]*a[0]+a[1]*a[1]+a[2]*a[2]);
  const an = aLen > 0 ? [a[0]/aLen, a[1]/aLen, a[2]/aLen] : [1,0,0];
  const c1: [number, number, number] = [proj[0]+s*an[0], proj[1]+s*an[1], proj[2]+s*an[2]];
  const c2: [number, number, number] = [c1[0]+s*dn[0], c1[1]+s*dn[1], c1[2]+s*dn[2]];
  const c3: [number, number, number] = [proj[0]+s*dn[0], proj[1]+s*dn[1], proj[2]+s*dn[2]];

  return (
    <>
      <Axes3D />
      <GridPlane3D />
      <Arrow3D end={a} color="#3498db" label="a" />
      <Arrow3D end={b} color="#2ecc71" label="b" />
      <Arrow3D end={proj} color="#f39c12" label="proj" lineWidth={2} />
      <Line points={[b, proj]} color="#f39c12" lineWidth={1.5} dashed dashSize={0.1} dashOffset={0} gapSize={0.05} />
      <Line points={[c1, c2, c3]} color="#e74c3c" lineWidth={2} />
    </>
  );
}

function BasisChangeScene() {
  // Standard basis vectors
  const e1: [number, number, number] = [1, 0, 0];
  const e2: [number, number, number] = [0, 1, 0];
  // New basis
  const b1: [number, number, number] = [1, 0.5, 0.3];
  const b2: [number, number, number] = [-0.3, 1, 0.5];
  // Target
  const target: [number, number, number] = [1.5, 1.2, 0.8];

  return (
    <>
      <Axes3D />
      <GridPlane3D />
      {/* Standard basis (faded) */}
      <Arrow3D end={e1} color="#3498db" lineWidth={1} />
      <Arrow3D end={e2} color="#2ecc71" lineWidth={1} />
      {/* New basis (bold) */}
      <Arrow3D end={b1} color="#9b59b6" label="b₁" lineWidth={2.5} />
      <Arrow3D end={b2} color="#d4a02a" label="b₂" lineWidth={2.5} />
      {/* Target point */}
      <Point3D position={target} color="#e74c3c" size={0.08} />
    </>
  );
}

export function ProjectionBasis3DCompanion({ mode = 'projection' }: ProjectionBasis3DCompanionProps) {
  return (
    <div>
      <R3FCanvas height={280} cameraPosition={[3.5, 2.5, 3.5]}>
        {mode === 'projection' && <ProjectionScene />}
        {mode === 'basis' && <BasisChangeScene />}
      </R3FCanvas>
      <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--color-muted)', fontStyle: 'italic', textAlign: 'center' }}>
        {mode === 'projection' && 'b drops perpendicularly onto a\'s line. The right angle marker confirms orthogonality.'}
        {mode === 'basis' && 'Same point (red), different basis vectors. Coordinates change, but the point stays.'}
      </div>
    </div>
  );
}
