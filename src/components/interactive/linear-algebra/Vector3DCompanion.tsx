import { R3FCanvas, Arrow3D, Axes3D, GridPlane3D } from '../r3f';

interface Vector3DCompanionProps {
  /** Which lesson concept to show: 'single' | 'addition' | 'scalar' */
  mode?: 'single' | 'addition' | 'scalar';
}

function SingleVector() {
  return (
    <>
      <Axes3D />
      <GridPlane3D />
      <Arrow3D end={[2, 1, 1.5]} color="#3498db" label="v" />
      <Arrow3D start={[1, -1, 0.5]} end={[3, 0, 2]} color="#3498db" />
    </>
  );
}

function AdditionVectors() {
  return (
    <>
      <Axes3D />
      <GridPlane3D />
      <Arrow3D end={[2, 0, 0]} color="#3498db" label="a" />
      <Arrow3D start={[2, 0, 0]} end={[2, 1.5, 1]} color="#2ecc71" label="b" />
      <Arrow3D end={[2, 1.5, 1]} color="#e74c3c" label="a+b" lineWidth={3} />
    </>
  );
}

function ScalarVectors() {
  return (
    <>
      <Axes3D />
      <GridPlane3D />
      <Arrow3D end={[1, 0.5, 0.8]} color="var(--color-muted)" label="v" lineWidth={1.5} />
      <Arrow3D end={[2, 1, 1.6]} color="#e74c3c" label="2v" />
      <Arrow3D end={[-1, -0.5, -0.8]} color="#3498db" label="-v" />
    </>
  );
}

export function Vector3DCompanion({ mode = 'single' }: Vector3DCompanionProps) {
  return (
    <div>
      <R3FCanvas height={280} cameraPosition={[4, 3, 4]}>
        {mode === 'single' && <SingleVector />}
        {mode === 'addition' && <AdditionVectors />}
        {mode === 'scalar' && <ScalarVectors />}
      </R3FCanvas>
      <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--color-muted)', fontStyle: 'italic', textAlign: 'center' }}>
        {mode === 'single' && 'Same vector from different origins — drag to orbit.'}
        {mode === 'addition' && 'Head-to-tail: a then b. The red arrow is the sum.'}
        {mode === 'scalar' && '2v stretches, -v reverses. The direction line stays the same.'}
      </div>
    </div>
  );
}
