import { useState, useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { R3FCanvas, Axes3D, GridPlane3D, Point3D } from '../r3f';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SurfaceExplorer3DProps {
  width?: number;
  height?: number;
}

type SurfacePreset = {
  fn: (x: number, y: number) => number;
  label: string;
  /** Numerical partial derivative wrt x */
  dfdx: (x: number, y: number) => number;
  /** Numerical partial derivative wrt y */
  dfdy: (x: number, y: number) => number;
  /** Suggested contour levels */
  contourLevels: number[];
  /** Floor value for the contour projection plane (in 3-D y-axis) */
  contourFloor: number;
};

/* ------------------------------------------------------------------ */
/*  Surface presets                                                    */
/* ------------------------------------------------------------------ */

const PRESETS: Record<string, SurfacePreset> = {
  Paraboloid: {
    fn: (x, y) => x * x + y * y,
    dfdx: (x, _y) => 2 * x,
    dfdy: (_x, y) => 2 * y,
    label: 'z = x\u00B2 + y\u00B2',
    contourLevels: [0.5, 1, 2, 3, 4, 5, 6],
    contourFloor: -0.5,
  },
  Saddle: {
    fn: (x, y) => x * x - y * y,
    dfdx: (x, _y) => 2 * x,
    dfdy: (_x, y) => -2 * y,
    label: 'z = x\u00B2 \u2212 y\u00B2',
    contourLevels: [-3, -2, -1, 0, 1, 2, 3],
    contourFloor: -5,
  },
  Wave: {
    fn: (x, y) => Math.sin(x) * Math.cos(y),
    dfdx: (x, y) => Math.cos(x) * Math.cos(y),
    dfdy: (x, y) => -Math.sin(x) * Math.sin(y),
    label: 'z = sin(x)\u00B7cos(y)',
    contourLevels: [-0.8, -0.4, 0, 0.4, 0.8],
    contourFloor: -1.8,
  },
  Gaussian: {
    fn: (x, y) => Math.exp(-(x * x + y * y)),
    dfdx: (x, y) => -2 * x * Math.exp(-(x * x + y * y)),
    dfdy: (x, y) => -2 * y * Math.exp(-(x * x + y * y)),
    label: 'z = e^(\u2212(x\u00B2+y\u00B2))',
    contourLevels: [0.1, 0.3, 0.5, 0.7, 0.9],
    contourFloor: -0.3,
  },
};

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const GRID_RES = 40;
const RANGE = 2; // x,y from -RANGE to +RANGE
const X_MIN = -RANGE;
const X_MAX = RANGE;
const Y_MIN = -RANGE;
const Y_MAX = RANGE;

/* ------------------------------------------------------------------ */
/*  Surface mesh sub-component                                         */
/* ------------------------------------------------------------------ */

function SurfaceMesh({
  fn,
}: {
  fn: (x: number, y: number) => number;
}) {
  const geometry = useMemo(() => {
    const xStep = (X_MAX - X_MIN) / GRID_RES;
    const yStep = (Y_MAX - Y_MIN) / GRID_RES;
    const resPlus = GRID_RES + 1;

    const positions: number[] = [];
    const colorAttr: number[] = [];
    const indices: number[] = [];

    // First pass: compute all z-values to find range for coloring
    const zValues: number[][] = [];
    let zMin = Infinity;
    let zMax = -Infinity;
    for (let iy = 0; iy <= GRID_RES; iy++) {
      zValues[iy] = [];
      for (let ix = 0; ix <= GRID_RES; ix++) {
        const x = X_MIN + ix * xStep;
        const y = Y_MIN + iy * yStep;
        const z = fn(x, y);
        zValues[iy][ix] = z;
        if (z < zMin) zMin = z;
        if (z > zMax) zMax = z;
      }
    }
    const zRange = zMax - zMin || 1;

    // Helper: map a normalized t (0-1) through blue -> green -> red
    const heightColor = (t: number): [number, number, number] => {
      const clamped = Math.max(0, Math.min(1, t));
      if (clamped < 0.5) {
        const s = clamped * 2; // 0..1 over the first half
        // blue(0.23,0.42,0.72) -> green(0.31,0.54,0.36)
        return [
          0.23 + s * (0.31 - 0.23),
          0.42 + s * (0.54 - 0.42),
          0.72 + s * (0.36 - 0.72),
        ];
      }
      const s = (clamped - 0.5) * 2; // 0..1 over the second half
      // green(0.31,0.54,0.36) -> red(0.71,0.29,0.29)
      return [
        0.31 + s * (0.71 - 0.31),
        0.54 + s * (0.29 - 0.54),
        0.36 + s * (0.29 - 0.36),
      ];
    };

    // Second pass: build positions and colors
    for (let iy = 0; iy <= GRID_RES; iy++) {
      for (let ix = 0; ix <= GRID_RES; ix++) {
        const x = X_MIN + ix * xStep;
        const y = Y_MIN + iy * yStep;
        const z = zValues[iy][ix];
        positions.push(x, z, y); // R3F: y is up

        const t = (z - zMin) / zRange;
        const [r, g, b] = heightColor(t);
        colorAttr.push(r, g, b);
      }
    }

    // Triangle indices
    for (let iy = 0; iy < GRID_RES; iy++) {
      for (let ix = 0; ix < GRID_RES; ix++) {
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
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colorAttr, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return geo;
  }, [fn]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        vertexColors
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Contour lines sub-component                                        */
/* ------------------------------------------------------------------ */

function ContourLines({
  fn,
  levels,
  floor,
}: {
  fn: (x: number, y: number) => number;
  levels: number[];
  floor: number;
}) {
  const contourSegments = useMemo(() => {
    const xStep = (X_MAX - X_MIN) / GRID_RES;
    const yStep = (Y_MAX - Y_MIN) / GRID_RES;

    // Build the sample grid
    const grid: number[][] = [];
    for (let iy = 0; iy <= GRID_RES; iy++) {
      grid[iy] = [];
      for (let ix = 0; ix <= GRID_RES; ix++) {
        grid[iy][ix] = fn(X_MIN + ix * xStep, Y_MIN + iy * yStep);
      }
    }

    const result: { points: [number, number, number][]; level: number }[] = [];

    for (const level of levels) {
      for (let iy = 0; iy < GRID_RES; iy++) {
        for (let ix = 0; ix < GRID_RES; ix++) {
          const v00 = grid[iy][ix];
          const v10 = grid[iy][ix + 1];
          const v01 = grid[iy + 1][ix];
          const v11 = grid[iy + 1][ix + 1];

          const crossings: [number, number, number][] = [];

          // Bottom edge
          if ((v00 - level) * (v10 - level) < 0) {
            const t = (level - v00) / (v10 - v00);
            crossings.push([X_MIN + (ix + t) * xStep, floor, Y_MIN + iy * yStep]);
          }
          // Top edge
          if ((v01 - level) * (v11 - level) < 0) {
            const t = (level - v01) / (v11 - v01);
            crossings.push([X_MIN + (ix + t) * xStep, floor, Y_MIN + (iy + 1) * yStep]);
          }
          // Left edge
          if ((v00 - level) * (v01 - level) < 0) {
            const t = (level - v00) / (v01 - v00);
            crossings.push([X_MIN + ix * xStep, floor, Y_MIN + (iy + t) * yStep]);
          }
          // Right edge
          if ((v10 - level) * (v11 - level) < 0) {
            const t = (level - v10) / (v11 - v10);
            crossings.push([X_MIN + (ix + 1) * xStep, floor, Y_MIN + (iy + t) * yStep]);
          }

          if (crossings.length >= 2) {
            result.push({ points: [crossings[0], crossings[1]], level });
          }
        }
      }
    }

    return result;
  }, [fn, levels, floor]);

  return (
    <group>
      {contourSegments.map((seg, i) => (
        <Line
          key={i}
          points={seg.points}
          color="#a0a8c0"
          lineWidth={1}
        />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Slice curve sub-component                                          */
/* ------------------------------------------------------------------ */

function SliceCurve({
  fn,
  fixedAxis,
  fixedValue,
  color,
}: {
  fn: (x: number, y: number) => number;
  fixedAxis: 'x' | 'y';
  fixedValue: number;
  color: string;
}) {
  const points = useMemo(() => {
    const N = 80;
    const pts: [number, number, number][] = [];
    const min = fixedAxis === 'y' ? X_MIN : Y_MIN;
    const max = fixedAxis === 'y' ? X_MAX : Y_MAX;
    for (let i = 0; i <= N; i++) {
      const t = min + (i / N) * (max - min);
      if (fixedAxis === 'y') {
        // Slice y = fixedValue, curve along x -> shows df/dx
        pts.push([t, fn(t, fixedValue), fixedValue]);
      } else {
        // Slice x = fixedValue, curve along y -> shows df/dy
        pts.push([fixedValue, fn(fixedValue, t), t]);
      }
    }
    return pts;
  }, [fn, fixedAxis, fixedValue]);

  return <Line points={points} color={color} lineWidth={3} />;
}

/* ------------------------------------------------------------------ */
/*  Slice plane sub-component                                          */
/* ------------------------------------------------------------------ */

function SlicePlane({
  fixedAxis,
  fixedValue,
  color,
  zHeight,
}: {
  fixedAxis: 'x' | 'y';
  fixedValue: number;
  color: string;
  zHeight: number;
}) {
  // Render a semi-transparent rectangle as the slicing plane.
  // Coordinate mapping: math (x, y, z) -> R3F (x, z, y) where R3F y is up.
  //
  // Default PlaneGeometry lies in the XY plane (extends along x and R3F-y, at z=0).
  //
  // Slice y = fixedValue (math): in R3F this is z = fixedValue.
  //   We want a plane extending along x (width) and R3F-y (height = z range), at z = fixedValue.
  //   Default plane already lies in XY. We just need to position it at z = fixedValue
  //   and size it to cover x range and z-height range.
  //
  // Slice x = fixedValue (math): same x in R3F.
  //   We want a plane extending along R3F-z (math y) and R3F-y (height = z range), at x = fixedValue.
  //   Rotate default plane 90 degrees around R3F-y so it faces along x.
  const planeWidth = X_MAX - X_MIN;
  const planeHeight = zHeight;

  const position: [number, number, number] =
    fixedAxis === 'y'
      ? [0, zHeight / 2, fixedValue]
      : [fixedValue, zHeight / 2, 0];

  const rotation: [number, number, number] =
    fixedAxis === 'y'
      ? [0, 0, 0] // default XY plane, positioned at z=fixedValue
      : [0, Math.PI / 2, 0]; // rotated to YZ plane at x=fixedValue

  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[planeWidth, planeHeight]} />
      <meshBasicMaterial color={color} opacity={0.1} transparent side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/*  3-D Scene                                                          */
/* ------------------------------------------------------------------ */

function Scene({
  preset,
  x0,
  y0,
  showGradient,
  showDxSlice,
  showDySlice,
}: {
  preset: SurfacePreset;
  x0: number;
  y0: number;
  showGradient: boolean;
  showDxSlice: boolean;
  showDySlice: boolean;
}) {
  const z0 = preset.fn(x0, y0);
  const dfdx = preset.dfdx(x0, y0);
  const dfdy = preset.dfdy(x0, y0);
  const gradMag = Math.sqrt(dfdx * dfdx + dfdy * dfdy);

  // Gradient arrow end point. We show the gradient on the tangent plane
  // at the surface point. Direction is (dfdx, 0, dfdy) in R3F space,
  // but to show "steepest ascent on surface" we project the gradient
  // onto the surface tangent plane. The tangent vector in x direction
  // is (1, dfdx, 0), in y direction (0, dfdy, 1). The steepest ascent
  // direction on the surface is dfdx*(1, dfdx, 0) + dfdy*(0, dfdy, 1).
  // For visual clarity we scale the arrow to a reasonable length.
  const arrowScale = 0.5;
  const gradientEnd3D: [number, number, number] = useMemo(() => {
    // The tangent-plane projected gradient direction
    const tx: [number, number, number] = [1, dfdx, 0];
    const ty: [number, number, number] = [0, dfdy, 1];
    const dir: [number, number, number] = [
      dfdx * tx[0] + dfdy * ty[0],
      dfdx * tx[1] + dfdy * ty[1],
      dfdx * tx[2] + dfdy * ty[2],
    ];
    const len = Math.sqrt(dir[0] * dir[0] + dir[1] * dir[1] + dir[2] * dir[2]);
    if (len < 1e-8) return [x0, z0, y0];
    const s = arrowScale / len;
    return [
      x0 + dir[0] * s,
      z0 + dir[1] * s,
      y0 + dir[2] * s,
    ];
  }, [x0, y0, dfdx, dfdy]);

  // Determine z-height for slice planes (a bit above the max z)
  const slicePlaneZ = useMemo(() => {
    let zMax = -Infinity;
    for (let iy = 0; iy <= 20; iy++) {
      for (let ix = 0; ix <= 20; ix++) {
        const x = X_MIN + (ix / 20) * (X_MAX - X_MIN);
        const y = Y_MIN + (iy / 20) * (Y_MAX - Y_MIN);
        const z = preset.fn(x, y);
        if (z > zMax) zMax = z;
      }
    }
    return Math.max(zMax + 0.5, 2);
  }, [preset.fn]);

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 8, 5]} intensity={0.6} />

      <Axes3D length={3} />
      <GridPlane3D size={6} divisions={12} y={preset.contourFloor} />

      {/* Surface */}
      <SurfaceMesh fn={preset.fn} />

      {/* Contour lines on the floor */}
      <ContourLines
        fn={preset.fn}
        levels={preset.contourLevels}
        floor={preset.contourFloor}
      />

      {/* Selected point on surface */}
      <Point3D position={[x0, z0, y0]} color="#c8693d" size={0.08} />

      {/* Vertical drop line from point to floor */}
      <Line
        points={[[x0, preset.contourFloor, y0], [x0, z0, y0]]}
        color="#c8693d"
        lineWidth={1}
      />

      {/* Gradient arrow — simple line + cone, no Text to avoid font loading issues */}
      {showGradient && gradMag > 1e-6 && (
        <group>
          <Line
            points={[[x0, z0, y0], gradientEnd3D]}
            color="#d4a02a"
            lineWidth={3}
          />
          <mesh position={gradientEnd3D}>
            <coneGeometry args={[0.06, 0.18, 8]} />
            <meshBasicMaterial color="#d4a02a" />
          </mesh>
        </group>
      )}

      {/* Partial-derivative-x slice: plane y = y0 */}
      {showDxSlice && (
        <>
          <SlicePlane
            fixedAxis="y"
            fixedValue={y0}
            color="#3b6cb7"
            zHeight={slicePlaneZ}
          />
          <SliceCurve
            fn={preset.fn}
            fixedAxis="y"
            fixedValue={y0}
            color="#3b6cb7"
          />
        </>
      )}

      {/* Partial-derivative-y slice: plane x = x0 */}
      {showDySlice && (
        <>
          <SlicePlane
            fixedAxis="x"
            fixedValue={x0}
            color="#4f8a5b"
            zHeight={slicePlaneZ}
          />
          <SliceCurve
            fn={preset.fn}
            fixedAxis="x"
            fixedValue={x0}
            color="#4f8a5b"
          />
        </>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function SurfaceExplorer3D({
  width,
  height = 400,
}: SurfaceExplorer3DProps) {
  const [presetKey, setPresetKey] = useState<keyof typeof PRESETS>('Paraboloid');
  const [x0, setX0] = useState(0.5);
  const [y0, setY0] = useState(0.5);
  const [showGradient, setShowGradient] = useState(true);
  const [showDxSlice, setShowDxSlice] = useState(false);
  const [showDySlice, setShowDySlice] = useState(false);

  const preset = PRESETS[presetKey];
  const z0 = preset.fn(x0, y0);
  const dfdx = preset.dfdx(x0, y0);
  const dfdy = preset.dfdy(x0, y0);
  const gradMag = Math.sqrt(dfdx * dfdx + dfdy * dfdy);

  const handlePresetChange = (key: keyof typeof PRESETS) => {
    setPresetKey(key);
    setX0(0.5);
    setY0(0.5);
  };

  return (
    <div className="flex w-full flex-col" style={width ? { maxWidth: width } : undefined}>
      {/* 3D Canvas */}
      <R3FCanvas height={height} cameraPosition={[5, 5, 5]} cameraFov={50}>
        <Scene
          preset={preset}
          x0={x0}
          y0={y0}
          showGradient={showGradient}
          showDxSlice={showDxSlice}
          showDySlice={showDySlice}
        />
      </R3FCanvas>

      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-4 border-t border-rule bg-paper-elevated px-4 py-3">
        {/* x0 slider */}
        <label className="flex items-center gap-2 font-sans text-xs text-ink-muted">
          x&#x2080; =
          <input
            type="range"
            min={-2}
            max={2}
            step={0.05}
            value={x0}
            onChange={(e) => setX0(+e.target.value)}
            className="h-1 w-28 cursor-pointer accent-[var(--color-accent)]"
          />
          <span className="w-10 font-mono text-xs text-ink">{x0.toFixed(2)}</span>
        </label>

        {/* y0 slider */}
        <label className="flex items-center gap-2 font-sans text-xs text-ink-muted">
          y&#x2080; =
          <input
            type="range"
            min={-2}
            max={2}
            step={0.05}
            value={y0}
            onChange={(e) => setY0(+e.target.value)}
            className="h-1 w-28 cursor-pointer accent-[var(--color-accent)]"
          />
          <span className="w-10 font-mono text-xs text-ink">{y0.toFixed(2)}</span>
        </label>

        {/* Divider */}
        <span className="hidden h-5 w-px bg-rule sm:block" />

        {/* Toggle: gradient */}
        <label className="flex cursor-pointer items-center gap-1.5 font-sans text-xs text-ink-muted">
          <input
            type="checkbox"
            checked={showGradient}
            onChange={(e) => setShowGradient(e.target.checked)}
            className="accent-[var(--color-vector-yellow)]"
          />
          <span style={{ color: 'var(--color-vector-yellow)' }}>&#x2207;f</span>
        </label>

        {/* Toggle: dx slice */}
        <label className="flex cursor-pointer items-center gap-1.5 font-sans text-xs text-ink-muted">
          <input
            type="checkbox"
            checked={showDxSlice}
            onChange={(e) => setShowDxSlice(e.target.checked)}
            className="accent-[var(--color-vector-blue)]"
          />
          <span style={{ color: 'var(--color-vector-blue)' }}>&#x2202;x slice</span>
        </label>

        {/* Toggle: dy slice */}
        <label className="flex cursor-pointer items-center gap-1.5 font-sans text-xs text-ink-muted">
          <input
            type="checkbox"
            checked={showDySlice}
            onChange={(e) => setShowDySlice(e.target.checked)}
            className="accent-[var(--color-vector-green)]"
          />
          <span style={{ color: 'var(--color-vector-green)' }}>&#x2202;y slice</span>
        </label>

        {/* Preset selector */}
        <div className="flex gap-1">
          {(Object.keys(PRESETS) as (keyof typeof PRESETS)[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => handlePresetChange(k)}
              className={`rounded-sm border px-2 py-0.5 font-mono text-[11px] transition-colors duration-fast ${
                k === presetKey
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-rule bg-paper-elevated text-ink-muted hover:bg-surface-1'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* Readout bar */}
      <div className="flex flex-wrap items-center gap-4 border-t border-rule bg-surface-1 px-4 py-2">
        <span className="font-mono text-[11px]" style={{ color: 'var(--color-accent)' }}>
          ({x0.toFixed(2)}, {y0.toFixed(2)}, {z0.toFixed(3)})
        </span>
        <span className="font-mono text-[11px]" style={{ color: 'var(--color-vector-blue)' }}>
          &#x2202;f/&#x2202;x = {dfdx.toFixed(3)}
        </span>
        <span className="font-mono text-[11px]" style={{ color: 'var(--color-vector-green)' }}>
          &#x2202;f/&#x2202;y = {dfdy.toFixed(3)}
        </span>
        <span className="font-mono text-[11px]" style={{ color: 'var(--color-vector-yellow)' }}>
          |&#x2207;f| = {gradMag.toFixed(3)}
        </span>
        <span className="ml-auto font-sans text-[10px] text-ink-muted">
          {preset.label}
        </span>
      </div>
    </div>
  );
}
