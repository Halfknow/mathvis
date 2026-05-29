import { useMemo, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Line, Text } from '@react-three/drei';
import * as THREE from 'three';

interface NonSquareVisProps {}

type Mode = 'project3to2' | 'embed2to3';

function Point3D({ pos, color }: { pos: number[]; color: string }) {
  return (
    <mesh position={pos}>
      <sphereGeometry args={[0.05, 12, 12]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function Arrow({ start, end, color, label }: { start: number[]; end: number[]; color: string; label?: string }) {
  return (
    <group>
      <Line points={[start, end]} color={color} lineWidth={3} />
      <mesh position={end}>
        <coneGeometry args={[0.06, 0.18, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {label && (
        <Text
          position={[end[0] * 1.12, end[1] * 1.12, end[2] * 1.12]}
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

function ProjectScene({ matrix }: { matrix: number[][] }) {
  const inputs = useMemo(() => {
    const pts: number[][] = [];
    for (let x = -2; x <= 2; x++) {
      for (let y = -2; y <= 2; y++) {
        for (let z = -2; z <= 2; z++) {
          pts.push([x, y, z]);
        }
      }
    }
    return pts;
  }, []);

  const outputs = useMemo(() => {
    return inputs.map(([x, y, z]) => [
      matrix[0][0] * x + matrix[0][1] * y + matrix[0][2] * z,
      matrix[1][0] * x + matrix[1][1] * y + matrix[1][2] * z,
      0,
    ]);
  }, [inputs, matrix]);

  const col1 = [matrix[0][0], matrix[1][0], 0];
  const col2 = [matrix[0][1], matrix[1][1], 0];
  const col3 = [matrix[0][2], matrix[1][2], 0];

  return (
    <>
      <ambientLight intensity={0.8} />
      {/* Faint 3D grid */}
      {[-2,-1,0,1,2].map(v => (
        <group key={`gx${v}`}>
          <Line points={[[v,-2,-2],[v,2,-2]]} color="#333" lineWidth={0.5} transparent opacity={0.2} />
          <Line points={[[-2,v,-2],[2,v,-2]]} color="#333" lineWidth={0.5} transparent opacity={0.2} />
        </group>
      ))}

      {/* Input points (faded) */}
      {inputs.map((p, i) => (
        <Point3D key={`in${i}`} pos={p} color="#666" />
      ))}

      {/* Output points on z=0 plane */}
      {outputs.map((p, i) => (
        <Point3D key={`out${i}`} pos={p} color="#e74c3c" />
      ))}

      {/* z=0 plane indicator */}
      <Line points={[[-3,0,-0.01],[3,0,-0.01]]} color="#f39c12" lineWidth={1} transparent opacity={0.4} />
      <Line points={[[0,-3,-0.01],[0,3,-0.01]]} color="#f39c12" lineWidth={1} transparent opacity={0.4} />

      {/* Column vectors */}
      <Arrow start={[0,0,0]} end={col1} color="#3498db" label="col1" />
      <Arrow start={[0,0,0]} end={col2} color="#2ecc71" label="col2" />
      <Arrow start={[0,0,0]} end={col3} color="#9b59b6" label="col3" />

      <OrbitControls makeDefault enableDamping dampingFactor={0.1} />
    </>
  );
}

function EmbedScene({ matrix }: { matrix: number[][] }) {
  const inputs2D = useMemo(() => {
    const pts: number[][] = [];
    for (let x = -2; x <= 2; x++) {
      for (let y = -2; y <= 2; y++) {
        pts.push([x, y]);
      }
    }
    return pts;
  }, []);

  const outputs3D = useMemo(() => {
    return inputs2D.map(([x, y]) => [
      matrix[0][0] * x + matrix[0][1] * y,
      matrix[1][0] * x + matrix[1][1] * y,
      matrix[2][0] * x + matrix[2][1] * y,
    ]);
  }, [inputs2D, matrix]);

  const col1 = [matrix[0][0], matrix[1][0], matrix[2][0]];
  const col2 = [matrix[0][1], matrix[1][1], matrix[2][1]];

  return (
    <>
      <ambientLight intensity={0.8} />

      {/* z=0 plane grid */}
      {[-2,-1,0,1,2].map(v => (
        <group key={`p${v}`}>
          <Line points={[[v,-2,0],[v,2,0]]} color="#333" lineWidth={0.5} transparent opacity={0.15} />
          <Line points={[[-2,v,0],[2,v,0]]} color="#333" lineWidth={0.5} transparent opacity={0.15} />
        </group>
      ))}

      {/* 2D input points on z=0 plane (faded) */}
      {inputs2D.map((p, i) => (
        <Point3D key={`in${i}`} pos={[p[0], p[1], 0]} color="#666" />
      ))}

      {/* 3D output points */}
      {outputs3D.map((p, i) => (
        <Point3D key={`out${i}`} pos={p} color="#2ecc71" />
      ))}

      {/* Column vectors */}
      <Arrow start={[0,0,0]} end={col1} color="#3498db" label="col1" />
      <Arrow start={[0,0,0]} end={col2} color="#e74c3c" label="col2" />

      <OrbitControls makeDefault enableDamping dampingFactor={0.1} />
    </>
  );
}

export function NonSquareVis({}: NonSquareVisProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const [mode, setMode] = useState<Mode>('project3to2');

  const [projMatrix, setProjMatrix] = useState([
    [1, 0, 0],
    [0, 1, 0],
  ]);

  const [embedMatrix, setEmbedMatrix] = useState([
    [1, 0],
    [0, 1],
    [0, 0],
  ]);

  const updateProj = (i: number, j: number, val: string) => {
    const n = parseFloat(val);
    if (isNaN(n)) return;
    setProjMatrix(prev => {
      const copy = prev.map(row => [...row]);
      copy[i][j] = n;
      return copy;
    });
  };

  const updateEmbed = (i: number, j: number, val: string) => {
    const n = parseFloat(val);
    if (isNaN(n)) return;
    setEmbedMatrix(prev => {
      const copy = prev.map(row => [...row]);
      copy[i][j] = n;
      return copy;
    });
  };

  const isProject = mode === 'project3to2';
  const matrix = isProject ? projMatrix : embedMatrix;
  const rows = matrix.length;
  const cols = matrix[0].length;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <button onClick={() => setMode('project3to2')}
          style={{
            padding: '0.4rem 0.8rem',
            background: isProject ? 'var(--color-accent)' : 'var(--color-surface)',
            color: isProject ? '#fff' : 'var(--color-text)',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.8rem',
          }}>
          3D → 2D (Project)
        </button>
        <button onClick={() => setMode('embed2to3')}
          style={{
            padding: '0.4rem 0.8rem',
            background: !isProject ? 'var(--color-accent)' : 'var(--color-surface)',
            color: !isProject ? '#fff' : 'var(--color-text)',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '0.8rem',
          }}>
          2D → 3D (Embed)
        </button>
      </div>

      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
      }}>
        <div style={{ height: '400px' }}>
          {mounted && (
            <Canvas camera={{ position: [3, 3, 4], fov: 50 }} style={{ background: '#1a1a2e' }}>
              {isProject ? (
                <ProjectScene matrix={projMatrix} />
              ) : (
                <EmbedScene matrix={embedMatrix} />
              )}
            </Canvas>
          )}
        </div>
      </div>

      <div style={{ marginTop: '0.75rem' }}>
        <div style={{ fontSize: '0.8rem', color: 'var(--color-muted)', marginBottom: '0.25rem' }}>
          {rows}×{cols} Matrix
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: '0.25rem',
          maxWidth: `${cols * 90}px`,
        }}>
          {matrix.map((row, i) =>
            row.map((val, j) => (
              <input key={`${i}-${j}`} type="number" step="0.1" value={val}
                onChange={e => isProject ? updateProj(i, j, e.target.value) : updateEmbed(i, j, e.target.value)}
                style={{
                  width: '100%', padding: '0.3rem',
                  background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                  borderRadius: '4px', color: 'var(--color-text)', fontSize: '0.85rem',
                  textAlign: 'center', fontFamily: 'monospace',
                }}
              />
            ))
          )}
        </div>
      </div>

      <div style={{
        marginTop: '0.5rem',
        fontSize: '0.8rem',
        color: 'var(--color-muted)',
        fontStyle: 'italic',
      }}>
        {isProject
          ? 'Gray dots: 3D input points. Red dots: 2D outputs projected onto the z=0 plane. Drag to rotate.'
          : 'Gray dots: 2D input points on z=0 plane. Green dots: 3D outputs after embedding. Drag to rotate.'}
      </div>
    </div>
  );
}
