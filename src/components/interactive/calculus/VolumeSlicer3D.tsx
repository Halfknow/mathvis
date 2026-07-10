import { useState, useMemo } from 'react';
import * as THREE from 'three';
import { R3FCanvas, Axes3D, GridPlane3D } from '../r3f';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface VolumeSlicer3DProps {
  width?: number;
  height?: number;
}

type PresetKey = 'disk-sqrt' | 'disk-sin' | 'washer-quad' | 'cone';

interface SolidPreset {
  label: string;
  /** Domain [xMin, xMax] */
  domain: [number, number];
  /** Outer radius as a function of x */
  outerR: (x: number) => number;
  /** Inner radius as a function of x (0 for solid disks) */
  innerR: (x: number) => number;
  /** Human-readable formula for A(x) */
  areaFormula: string;
  /** LaTeX-formatted area formula */
  areaLatex: string;
  /** Profile curve label for the tooltip */
  profileLabel: string;
}

/* ------------------------------------------------------------------ */
/*  Preset definitions                                                 */
/* ------------------------------------------------------------------ */

const PRESETS: Record<PresetKey, SolidPreset> = {
  'disk-sqrt': {
    label: 'Disk: x\u00B2',
    domain: [0, 2],
    outerR: (x) => Math.sqrt(Math.max(0, x)),
    innerR: () => 0,
    areaFormula: 'A(x) = \u03C0(\u221Ax)\u00B2 = \u03C0x',
    areaLatex: 'A(x) = \\pi x',
    profileLabel: 'y = \u221Ax rotated around x-axis',
  },
  'disk-sin': {
    label: 'Disk: sin',
    domain: [0, Math.PI],
    outerR: (x) => Math.sin(x),
    innerR: () => 0,
    areaFormula: 'A(x) = \u03C0sin\u00B2(x)',
    areaLatex: 'A(x) = \\pi \\sin^2(x)',
    profileLabel: 'y = sin(x) rotated around x-axis',
  },
  'washer-quad': {
    label: 'Washer: x\u00B2',
    domain: [0, 2],
    outerR: (x) => x * x,
    innerR: (x) => x / 2,
    areaFormula: 'A(x) = \u03C0(x\u2074 \u2212 x\u00B2/4)',
    areaLatex: 'A(x) = \\pi\\left(x^4 - \\frac{x^2}{4}\\right)',
    profileLabel: 'outer y=x\u00B2, inner y=x/2',
  },
  'cone': {
    label: 'Cone',
    domain: [0, 1],
    outerR: (x) => 1 - x,
    innerR: () => 0,
    areaFormula: 'A(x) = \u03C0(1\u2212x)\u00B2',
    areaLatex: 'A(x) = \\pi(1-x)^2',
    profileLabel: 'y = 1\u2212x rotated around x-axis',
  },
};

const PRESET_KEYS: PresetKey[] = ['disk-sqrt', 'disk-sin', 'washer-quad', 'cone'];

/* ------------------------------------------------------------------ */
/*  Numerical integration (Simpson's rule)                             */
/* ------------------------------------------------------------------ */

function simpsonIntegrate(
  f: (x: number) => number,
  a: number,
  b: number,
  n: number = 200,
): number {
  if (n % 2 !== 0) n += 1;
  const h = (b - a) / n;
  let sum = f(a) + f(b);
  for (let i = 1; i < n; i++) {
    const coeff = i % 2 === 0 ? 2 : 4;
    sum += coeff * f(a + i * h);
  }
  return (h / 3) * sum;
}

/* ------------------------------------------------------------------ */
/*  Geometry helpers                                                   */
/* ------------------------------------------------------------------ */

const RADIAL_SEGMENTS = 48;
const AXIAL_SEGMENTS = 64;

/**
 * Build a BufferGeometry for a solid of revolution.
 * The solid runs along the x-axis from xMin to xMax, with the given
 * outer and inner radii.  Uses a LatheGeometry-like approach: for each
 * axial slice we emit a ring (or disk) of triangles.
 */
function buildSolidGeometry(
  outerR: (x: number) => number,
  innerR: (x: number) => number,
  xMin: number,
  xMax: number,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];

  const dx = (xMax - xMin) / AXIAL_SEGMENTS;
  const dTheta = (2 * Math.PI) / RADIAL_SEGMENTS;

  const isWasher = innerR(xMin + (xMax - xMin) * 0.5) > 0.001;

  for (let i = 0; i < AXIAL_SEGMENTS; i++) {
    const x0 = xMin + i * dx;
    const x1 = xMin + (i + 1) * dx;
    const or0 = outerR(x0);
    const or1 = outerR(x1);
    const ir0 = isWasher ? innerR(x0) : 0;
    const ir1 = isWasher ? innerR(x1) : 0;

    // Outer surface ring
    for (let j = 0; j < RADIAL_SEGMENTS; j++) {
      const theta0 = j * dTheta;
      const theta1 = (j + 1) * dTheta;

      const cos0 = Math.cos(theta0);
      const sin0 = Math.sin(theta0);
      const cos1 = Math.cos(theta1);
      const sin1 = Math.sin(theta1);

      // Two triangles per quad on the outer surface
      // Normal points outward (away from x-axis)
      const n0x = 0;
      const n0y = cos0;
      const n0z = sin0;
      const n1x = 0;
      const n1y = cos1;
      const n1z = sin1;

      // Triangle 1: (x0, or0, theta0), (x1, or1, theta0), (x1, or1, theta1)
      positions.push(
        x0, or0 * cos0, or0 * sin0,
        x1, or1 * cos0, or1 * sin0,
        x1, or1 * cos1, or1 * sin1,
      );
      normals.push(
        n0x, n0y, n0z,
        n0x, n0y, n0z,
        n1x, n1y, n1z,
      );

      // Triangle 2: (x0, or0, theta0), (x1, or1, theta1), (x0, or0, theta1)
      positions.push(
        x0, or0 * cos0, or0 * sin0,
        x1, or1 * cos1, or1 * sin1,
        x0, or0 * cos1, or0 * sin1,
      );
      normals.push(
        n0x, n0y, n0z,
        n1x, n1y, n1z,
        n1x, n1y, n1z,
      );

      // Inner surface ring (washers only) — normals point inward
      if (isWasher && ir0 > 0.001 && ir1 > 0.001) {
        positions.push(
          x0, ir0 * cos0, ir0 * sin0,
          x1, ir1 * cos1, ir1 * sin1,
          x1, ir1 * cos0, ir1 * sin0,
        );
        normals.push(
          0, -cos0, -sin0,
          0, -cos1, -sin1,
          0, -cos0, -sin0,
        );

        positions.push(
          x0, ir0 * cos0, ir0 * sin0,
          x0, ir0 * cos1, ir0 * sin1,
          x1, ir1 * cos1, ir1 * sin1,
        );
        normals.push(
          0, -cos0, -sin0,
          0, -cos1, -sin1,
          0, -cos1, -sin1,
        );
      }
    }

    // End caps at xMin (first slice) and xMax (last slice)
    if (i === 0) {
      const orv = or0;
      const irv = ir0;
      for (let j = 0; j < RADIAL_SEGMENTS; j++) {
        const theta0 = j * dTheta;
        const theta1 = (j + 1) * dTheta;
        const cos0 = Math.cos(theta0);
        const sin0 = Math.sin(theta0);
        const cos1 = Math.cos(theta1);
        const sin1 = Math.sin(theta1);

        if (isWasher && irv > 0.001) {
          // Washer end cap: ring between inner and outer
          positions.push(
            x0, irv * cos0, irv * sin0,
            x0, orv * cos0, orv * sin0,
            x0, orv * cos1, orv * sin1,
          );
          normals.push(-1, 0, 0, -1, 0, 0, -1, 0, 0);

          positions.push(
            x0, irv * cos0, irv * sin0,
            x0, orv * cos1, orv * sin1,
            x0, irv * cos1, irv * sin1,
          );
          normals.push(-1, 0, 0, -1, 0, 0, -1, 0, 0);
        } else {
          // Solid disk end cap
          positions.push(
            x0, 0, 0,
            x0, orv * cos0, orv * sin0,
            x0, orv * cos1, orv * sin1,
          );
          normals.push(-1, 0, 0, -1, 0, 0, -1, 0, 0);
        }
      }
    }

    if (i === AXIAL_SEGMENTS - 1) {
      const orv = or1;
      const irv = ir1;
      for (let j = 0; j < RADIAL_SEGMENTS; j++) {
        const theta0 = j * dTheta;
        const theta1 = (j + 1) * dTheta;
        const cos0 = Math.cos(theta0);
        const sin0 = Math.sin(theta0);
        const cos1 = Math.cos(theta1);
        const sin1 = Math.sin(theta1);

        if (isWasher && irv > 0.001) {
          positions.push(
            x1, irv * cos0, irv * sin0,
            x1, orv * cos1, orv * sin1,
            x1, orv * cos0, orv * sin0,
          );
          normals.push(1, 0, 0, 1, 0, 0, 1, 0, 0);

          positions.push(
            x1, irv * cos0, irv * sin0,
            x1, irv * cos1, irv * sin1,
            x1, orv * cos1, orv * sin1,
          );
          normals.push(1, 0, 0, 1, 0, 0, 1, 0, 0);
        } else {
          positions.push(
            x1, 0, 0,
            x1, orv * cos1, orv * sin1,
            x1, orv * cos0, orv * sin0,
          );
          normals.push(1, 0, 0, 1, 0, 0, 1, 0, 0);
        }
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));

  return geo;
}

/**
 * Build a disk (or washer) shape at a given x position.
 * Returns a BufferGeometry.
 */
function buildCrossSectionGeometry(
  outerR: number,
  innerR: number,
): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const SEGMENTS = 48;

  const isWasher = innerR > 0.001;

  for (let j = 0; j < SEGMENTS; j++) {
    const theta0 = (2 * Math.PI * j) / SEGMENTS;
    const theta1 = (2 * Math.PI * (j + 1)) / SEGMENTS;
    const cos0 = Math.cos(theta0);
    const sin0 = Math.sin(theta0);
    const cos1 = Math.cos(theta1);
    const sin1 = Math.sin(theta1);

    if (isWasher) {
      // Outer ring triangle
      positions.push(
        0, outerR * cos0, outerR * sin0,
        0, outerR * cos1, outerR * sin1,
        0, innerR * cos1, innerR * sin1,
      );
      normals.push(1, 0, 0, 1, 0, 0, 1, 0, 0);

      positions.push(
        0, outerR * cos0, outerR * sin0,
        0, innerR * cos1, innerR * sin1,
        0, innerR * cos0, innerR * sin0,
      );
      normals.push(1, 0, 0, 1, 0, 0, 1, 0, 0);
    } else {
      // Solid disk: center to edge
      positions.push(
        0, 0, 0,
        0, outerR * cos0, outerR * sin0,
        0, outerR * cos1, outerR * sin1,
      );
      normals.push(1, 0, 0, 1, 0, 0, 1, 0, 0);
    }
  }

  // Back face (normal pointing -x)
  for (let j = 0; j < SEGMENTS; j++) {
    const theta0 = (2 * Math.PI * j) / SEGMENTS;
    const theta1 = (2 * Math.PI * (j + 1)) / SEGMENTS;
    const cos0 = Math.cos(theta0);
    const sin0 = Math.sin(theta0);
    const cos1 = Math.cos(theta1);
    const sin1 = Math.sin(theta1);

    if (isWasher) {
      positions.push(
        0, outerR * cos0, outerR * sin0,
        0, innerR * cos1, innerR * sin1,
        0, outerR * cos1, outerR * sin1,
      );
      normals.push(-1, 0, 0, -1, 0, 0, -1, 0, 0);

      positions.push(
        0, outerR * cos0, outerR * sin0,
        0, innerR * cos0, innerR * sin0,
        0, innerR * cos1, innerR * sin1,
      );
      normals.push(-1, 0, 0, -1, 0, 0, -1, 0, 0);
    } else {
      positions.push(
        0, 0, 0,
        0, outerR * cos1, outerR * sin1,
        0, outerR * cos0, outerR * sin0,
      );
      normals.push(-1, 0, 0, -1, 0, 0, -1, 0, 0);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  return geo;
}

/* ------------------------------------------------------------------ */
/*  3D scene sub-components                                            */
/* ------------------------------------------------------------------ */

function SolidMesh({ preset }: { preset: SolidPreset }) {
  const geometry = useMemo(
    () => buildSolidGeometry(preset.outerR, preset.innerR, preset.domain[0], preset.domain[1]),
    [preset],
  );

  return (
    <mesh geometry={geometry}>
      <meshPhongMaterial
        color="#3b6cb7"
        transparent
        opacity={0.35}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function CrossSection({
  x,
  preset,
}: {
  x: number;
  preset: SolidPreset;
}) {
  const oR = preset.outerR(x);
  const iR = preset.innerR(x);
  const geometry = useMemo(() => buildCrossSectionGeometry(oR, iR), [oR, iR]);

  return (
    <group position={[x, 0, 0]}>
      <mesh geometry={geometry}>
        <meshPhongMaterial
          color="#d4a02a"
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function SlicePlane({
  x,
  preset,
}: {
  x: number;
  preset: SolidPreset;
}) {
  // Size the plane to encompass the max possible radius
  const maxR = Math.max(preset.outerR(preset.domain[0]), preset.outerR(preset.domain[1]));
  // Check a few intermediate points for a better max
  const mid = (preset.domain[0] + preset.domain[1]) / 2;
  const planeSize = Math.max(maxR, preset.outerR(mid)) * 2.5;
  const clampedSize = Math.max(planeSize, 1);

  return (
    <group position={[x, 0, 0]}>
      <mesh rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[clampedSize, clampedSize]} />
        <meshPhongMaterial
          color="#c8693d"
          transparent
          opacity={0.12}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function AxisLabels({ preset }: { preset: SolidPreset }) {
  const maxR = Math.max(
    preset.outerR(preset.domain[0]),
    preset.outerR(preset.domain[1]),
    preset.outerR((preset.domain[0] + preset.domain[1]) / 2),
  );
  const labelOffset = Math.max(maxR, 0.5) + 0.3;

  return (
    <group>
      {/* x-axis label */}
      <group position={[preset.domain[1] + 0.4, 0, 0]}>
        <mesh>
          <sphereGeometry args={[0.01, 4, 4]} />
          <meshBasicMaterial color="#e74c3c" />
        </mesh>
      </group>
      {/* y-axis label */}
      <group position={[0, labelOffset, 0]}>
        <mesh>
          <sphereGeometry args={[0.01, 4, 4]} />
          <meshBasicMaterial color="#2ecc71" />
        </mesh>
      </group>
      {/* z-axis label */}
      <group position={[0, 0, labelOffset]}>
        <mesh>
          <sphereGeometry args={[0.01, 4, 4]} />
          <meshBasicMaterial color="#3498db" />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function VolumeSlicer3D({
  width: _width = 640,
  height = 480,
}: VolumeSlicer3DProps) {
  const [presetKey, setPresetKey] = useState<PresetKey>('disk-sqrt');
  const [sliceX, setSliceX] = useState(1);

  const preset = PRESETS[presetKey];
  const [xMin, xMax] = preset.domain;

  // Clamp sliceX into the current domain
  const clampedX = Math.max(xMin, Math.min(xMax, sliceX));

  // Cross-sectional area at current slice
  const oR = preset.outerR(clampedX);
  const iR = preset.innerR(clampedX);
  const area = Math.PI * (oR * oR - iR * iR);

  // Total volume via Simpson's rule
  const volume = useMemo(
    () => simpsonIntegrate(
      (x) => {
        const outer = preset.outerR(x);
        const inner = preset.innerR(x);
        return Math.PI * (outer * outer - inner * inner);
      },
      xMin,
      xMax,
    ),
    [preset, xMin, xMax],
  );

  // Compute camera position based on domain extent
  const domainLen = xMax - xMin;
  const maxRadius = Math.max(
    preset.outerR(xMin),
    preset.outerR(xMax),
    preset.outerR((xMin + xMax) / 2),
  );
  const camDist = Math.max(domainLen * 1.5, maxRadius * 3, 4);
  const cameraPosition: [number, number, number] = [
    (xMin + xMax) / 2 + camDist * 0.6,
    camDist * 0.5,
    camDist * 0.7,
  ];

  return (
    <div className="flex h-full w-full flex-col">
      <R3FCanvas
        height={height}
        cameraPosition={cameraPosition}
        cameraFov={50}
      >
        <Axes3D length={Math.max(domainLen * 0.7, 1.5)} />
        <GridPlane3D
          size={Math.max(domainLen * 2, 4)}
          divisions={12}
          y={-0.01}
        />
        <SolidMesh preset={preset} />
        <CrossSection x={clampedX} preset={preset} />
        <SlicePlane x={clampedX} preset={preset} />
        <AxisLabels preset={preset} />
      </R3FCanvas>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 border-t border-rule bg-paper-elevated px-4 py-3">
        <label className="flex items-center gap-2 font-sans text-xs text-ink-muted">
          x =
          <input
            type="range"
            min={xMin}
            max={xMax}
            step={(xMax - xMin) / 200}
            value={clampedX}
            onChange={(e) => setSliceX(+e.target.value)}
            className="h-1 w-32 cursor-pointer accent-[var(--color-accent)]"
          />
          <span className="font-mono text-xs text-ink w-12">{clampedX.toFixed(2)}</span>
        </label>

        <div className="flex gap-1">
          {PRESET_KEYS.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => {
                setPresetKey(k);
                // Set slice to midpoint of new domain
                setSliceX((PRESETS[k].domain[0] + PRESETS[k].domain[1]) / 2);
              }}
              className={`rounded-sm border px-2 py-0.5 font-mono text-[11px] transition-colors duration-fast ${
                k === presetKey
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-rule bg-paper-elevated text-ink-muted hover:bg-surface-1'
              }`}
            >
              {PRESETS[k].label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex flex-col items-end gap-0.5 font-mono text-[11px]">
          <span className="text-vector-yellow">
            A({clampedX.toFixed(2)}) = {area.toFixed(3)}
          </span>
          <span className="text-vector-blue">
            V = {volume.toFixed(3)}
          </span>
        </div>
      </div>

      {/* Formula readout */}
      <div className="border-t border-rule bg-surface-1 px-4 py-2 text-center">
        <span className="font-mono text-xs text-ink-muted">
          {preset.areaFormula}
        </span>
        <span className="mx-3 text-ink-faint">|</span>
        <span className="font-sans text-[11px] text-ink-faint">
          {preset.profileLabel}
        </span>
      </div>
    </div>
  );
}
