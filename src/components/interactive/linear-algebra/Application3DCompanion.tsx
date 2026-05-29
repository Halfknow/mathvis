import { useMemo } from 'react';
import { R3FCanvas, Arrow3D, Axes3D, Point3D } from '../r3f';
import { Line } from '@react-three/drei';

interface Application3DCompanionProps {
  mode?: 'pca' | 'graphics';
}

function PCAScene() {
  // Simulated 3D data cloud with a dominant direction
  const dataPoints = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < 60; i++) {
      const t = (i - 30) * 0.08;
      const spread = 0.2;
      pts.push([
        t * 2 + (Math.sin(i * 7.3) * spread),
        t * 1 + (Math.cos(i * 3.1) * spread),
        t * 0.5 + (Math.sin(i * 5.7) * spread * 0.5),
      ]);
    }
    return pts;
  }, []);

  // PCA eigenvectors (dominant direction)
  const pc1: [number, number, number] = [2, 1, 0.5];
  const pc2: [number, number, number] = [-0.3, 0.5, 0.2];

  return (
    <>
      <Axes3D />
      {/* Data cloud */}
      {dataPoints.map((p, i) => (
        <Point3D key={i} position={p} color="#3498db" size={0.04} />
      ))}
      {/* Principal components */}
      <Arrow3D end={pc1} color="#e74c3c" label="PC1" lineWidth={3} />
      <Arrow3D end={pc2} color="#2ecc71" label="PC2" lineWidth={2.5} />
      <Arrow3D end={[-pc1[0], -pc1[1], -pc1[2]]} color="#e74c3c" lineWidth={1.5} />
    </>
  );
}

function GraphicsScene() {
  // Show a 3D object (wireframe box) and its projection to a 2D plane
  const corners = [
    [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
    [-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1],
  ] as [number,number,number][];

  const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];

  // Projected corners (perspective-like: just drop z and scale)
  const projected = corners.map(([x, y, z]) => [x * 1.2, y * 1.2, -3] as [number,number,number]);

  return (
    <>
      <Axes3D />
      {/* Projection plane (faint) */}
      <Line points={[[-3,-3,-3],[3,-3,-3],[3,3,-3],[-3,3,-3],[-3,-3,-3]]} color="#666" lineWidth={0.5} transparent opacity={0.2} />
      {/* 3D object */}
      {edges.map(([a, b], i) => (
        <Line key={`3d${i}`} points={[corners[a], corners[b]]} color="#3498db" lineWidth={2} />
      ))}
      {/* Projected shadow */}
      {edges.map(([a, b], i) => (
        <Line key={`2d${i}`} points={[projected[a], projected[b]]} color="#c0756b" lineWidth={1.5} transparent opacity={0.6} />
      ))}
      {/* Projection lines */}
      {[0,1,2,3,4,5,6,7].map(i => (
        <Line key={`proj${i}`} points={[corners[i], projected[i]]} color="#888" lineWidth={0.5} dashed dashSize={0.1} dashOffset={0} gapSize={0.05} transparent opacity={0.3} />
      ))}
    </>
  );
}

export function Application3DCompanion({ mode = 'pca' }: Application3DCompanionProps) {
  const captions: Record<string, string> = {
    pca: 'Blue dots are data. Red PC1 captures the dominant direction — the eigenvector of the covariance matrix.',
    graphics: 'Blue wireframe in 3D projects to terracotta shadow on the back plane — this is how 3D rendering works.',
  };

  return (
    <div>
      <R3FCanvas height={280} cameraPosition={[4, 3, 4]}>
        {mode === 'pca' && <PCAScene />}
        {mode === 'graphics' && <GraphicsScene />}
      </R3FCanvas>
      <div style={{ marginTop: '0.4rem', fontSize: '0.75rem', color: 'var(--color-muted)', fontStyle: 'italic', textAlign: 'center' }}>
        {captions[mode]}
      </div>
    </div>
  );
}
