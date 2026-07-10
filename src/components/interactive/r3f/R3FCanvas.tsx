import { Suspense, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

interface R3FCanvasProps {
  children: ReactNode;
  height?: number;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
}

export function R3FCanvas({
  children,
  height = 280,
  cameraPosition = [4, 3, 5],
  cameraFov = 50,
}: R3FCanvasProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '8px',
        overflow: 'hidden',
        border: '1px solid var(--color-border)',
      }}>
        <div style={{ height: `${height}px` }}>
          {mounted && (
            <Canvas camera={{ position: cameraPosition, fov: cameraFov }} style={{ background: '#1a1a2e' }}>
              <Suspense fallback={null}>
                <ambientLight intensity={0.8} />
                {children}
                <OrbitControls makeDefault enableDamping dampingFactor={0.1} />
              </Suspense>
            </Canvas>
          )}
        </div>
      </div>
    </div>
  );
}
