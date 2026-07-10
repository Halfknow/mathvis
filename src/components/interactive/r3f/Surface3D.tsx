import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

interface Surface3DProps {
  /** Surface function z = f(x, y) */
  fn: (x: number, y: number) => number;
  /** x-axis range [min, max] */
  xRange?: [number, number];
  /** y-axis range [min, max] */
  yRange?: [number, number];
  /** Grid points per axis */
  resolution?: number;
  /** Surface color */
  color?: string;
  /** Surface opacity (0–1) */
  opacity?: number;
  /** Show wireframe overlay */
  wireframe?: boolean;
  /** Show contour lines projected onto the xy-plane */
  showContours?: boolean;
  /** z-values at which to draw contour lines */
  contourLevels?: number[];
  /** y-offset for contour plane (slightly below surface) */
  contourPlaneY?: number;
}

export function Surface3D({
  fn,
  xRange = [-3, 3],
  yRange = [-3, 3],
  resolution = 40,
  color = '#4a90d9',
  opacity = 0.85,
  wireframe = false,
  showContours = false,
  contourLevels = [-2, -1, 0, 1, 2],
  contourPlaneY = -3.5,
}: Surface3DProps) {
  // Build surface geometry
  const geometry = useMemo(() => {
    const [xMin, xMax] = xRange;
    const [yMin, yMax] = yRange;
    const xStep = (xMax - xMin) / resolution;
    const yStep = (yMax - yMin) / resolution;
    const resPlus = resolution + 1;

    const positions: number[] = [];
    const indices: number[] = [];

    // Compute vertices — grid maps (x, y) to 3D as (x, z=f(x,y), y)
    // so the "up" direction in 3D is the y-axis (R3F convention)
    for (let iy = 0; iy <= resolution; iy++) {
      for (let ix = 0; ix <= resolution; ix++) {
        const x = xMin + ix * xStep;
        const y = yMin + iy * yStep;
        const z = fn(x, y);
        positions.push(x, z, y);
      }
    }

    // Build triangle indices
    for (let iy = 0; iy < resolution; iy++) {
      for (let ix = 0; ix < resolution; ix++) {
        const a = iy * resPlus + ix;
        const b = a + 1;
        const c = a + resPlus;
        const d = c + 1;
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
  }, [fn, xRange[0], xRange[1], yRange[0], yRange[1], resolution]);

  // Compute contour polylines via marching squares
  const contourLines = useMemo(() => {
    if (!showContours) return [];

    const [xMin, xMax] = xRange;
    const [yMin, yMax] = yRange;
    const xStep = (xMax - xMin) / resolution;
    const yStep = (yMax - yMin) / resolution;

    // Sample the function onto a grid
    const grid: number[][] = [];
    for (let iy = 0; iy <= resolution; iy++) {
      grid[iy] = [];
      for (let ix = 0; ix <= resolution; ix++) {
        const x = xMin + ix * xStep;
        const y = yMin + iy * yStep;
        grid[iy][ix] = fn(x, y);
      }
    }

    const allContours: { points: [number, number, number][]; level: number }[] = [];

    for (const level of contourLevels) {
      const segments: [number, number, number][] = [];

      // Walk through each cell and find crossing segments
      for (let iy = 0; iy < resolution; iy++) {
        for (let ix = 0; ix < resolution; ix++) {
          const v00 = grid[iy][ix];
          const v10 = grid[iy][ix + 1];
          const v01 = grid[iy + 1][ix];
          const v11 = grid[iy + 1][ix + 1];

          // Find edge crossings using linear interpolation
          const crossings: [number, number, number][] = [];

          // Bottom edge (iy, ix) -> (iy, ix+1)
          if ((v00 - level) * (v10 - level) < 0) {
            const t = (level - v00) / (v10 - v00);
            crossings.push([xMin + (ix + t) * xStep, contourPlaneY, yMin + iy * yStep]);
          }
          // Top edge (iy+1, ix) -> (iy+1, ix+1)
          if ((v01 - level) * (v11 - level) < 0) {
            const t = (level - v01) / (v11 - v01);
            crossings.push([xMin + (ix + t) * xStep, contourPlaneY, yMin + (iy + 1) * yStep]);
          }
          // Left edge (iy, ix) -> (iy+1, ix)
          if ((v00 - level) * (v01 - level) < 0) {
            const t = (level - v00) / (v01 - v00);
            crossings.push([xMin + ix * xStep, contourPlaneY, yMin + (iy + t) * yStep]);
          }
          // Right edge (iy, ix+1) -> (iy+1, ix+1)
          if ((v10 - level) * (v11 - level) < 0) {
            const t = (level - v10) / (v11 - v10);
            crossings.push([xMin + (ix + 1) * xStep, contourPlaneY, yMin + (iy + t) * yStep]);
          }

          // Each cell produces 0 or 2 crossings (or 4 in degenerate cases, pair them)
          if (crossings.length >= 2) {
            segments.push(crossings[0], crossings[1]);
          }
        }
      }

      // Collect segments as individual line pairs
      // (a full contour tracer would connect them into polylines, but for
      // visualization the segment pairs render correctly with drei Line)
      for (let i = 0; i < segments.length; i += 2) {
        if (i + 1 < segments.length) {
          allContours.push({
            points: [segments[i], segments[i + 1]],
            level,
          });
        }
      }
    }

    return allContours;
  }, [fn, xRange[0], xRange[1], yRange[0], yRange[1], resolution, showContours, contourLevels, contourPlaneY]);

  return (
    <group>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          color={color}
          opacity={opacity}
          transparent
          side={THREE.DoubleSide}
          wireframe={wireframe}
        />
      </mesh>
      {showContours && contourLines.map((contour, i) => (
        <Line
          key={i}
          points={contour.points}
          color="#ffffff"
          lineWidth={1}
          transparent
          opacity={0.5}
        />
      ))}
    </group>
  );
}
