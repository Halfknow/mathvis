import { useState, useMemo, useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import { R3FCanvas, Axes3D, GridPlane3D } from '../r3f';
import * as THREE from 'three';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ShellMethod3DProps {
  width?: number;
  height?: number;
}

type Method = 'disk' | 'shell';

interface Preset {
  id: string;
  label: string;
  /** The profile function. In disk mode the radius is f(x); in shell mode the height is f(r). */
  fn: (t: number) => number;
  /** Lower bound of integration. */
  a: number;
  /** Upper bound of integration. */
  b: number;
  /** Axis of rotation: 'x' means rotate around x-axis, 'y' means around y-axis. */
  axis: 'x' | 'y';
  /** Description for the readout. */
  description: string;
  /** Formula template for disk method. */
  diskFormula: string;
  /** Formula template for shell method. */
  shellFormula: string;
}

/* ------------------------------------------------------------------ */
/*  Presets                                                            */
/* ------------------------------------------------------------------ */

const PRESETS: Preset[] = [
  {
    id: 'x2-xaxis',
    label: 'y = x\u00B2 around x-axis',
    fn: (x) => x * x,
    a: 0,
    b: 1,
    axis: 'x',
    description: 'y = x\u00B2 revolved around the x-axis',
    diskFormula: 'V = \u03C0\u222B[R(x)]\u00B2 dx',
    shellFormula: 'V = 2\u03C0\u222Br\u00B7h(r) dr',
  },
  {
    id: 'x2-yaxis',
    label: 'y = x\u00B2 around y-axis',
    fn: (x) => x * x,
    a: 0,
    b: 1,
    axis: 'y',
    description: 'y = x\u00B2 revolved around the y-axis',
    diskFormula: 'V = \u03C0\u222B[R(y)]\u00B2 dy',
    shellFormula: 'V = 2\u03C0\u222Br\u00B7h(r) dr',
  },
  {
    id: 'sqrt-x-xaxis',
    label: 'y = \u221Ax around x-axis',
    fn: (x) => Math.sqrt(x),
    a: 0,
    b: 1,
    axis: 'x',
    description: 'y = \u221Ax revolved around the x-axis',
    diskFormula: 'V = \u03C0\u222B[R(x)]\u00B2 dx',
    shellFormula: 'V = 2\u03C0\u222Br\u00B7h(r) dr',
  },
];

/* ------------------------------------------------------------------ */
/*  Numerical integration (Simpson's rule)                             */
/* ------------------------------------------------------------------ */

function integrate(fn: (t: number) => number, a: number, b: number, n = 200): number {
  if (n % 2 !== 0) n++;
  const h = (b - a) / n;
  let sum = fn(a) + fn(b);
  for (let i = 1; i < n; i++) {
    const coeff = i % 2 === 0 ? 2 : 4;
    sum += coeff * fn(a + i * h);
  }
  return (h / 3) * sum;
}

/* ------------------------------------------------------------------ */
/*  Geometry helpers                                                   */
/* ------------------------------------------------------------------ */

/** Build a solid-of-revolution mesh (parametric surface). */
function buildSolidOfRevolution(
  fn: (t: number) => number,
  a: number,
  b: number,
  axis: 'x' | 'y',
  thetaSegments: number,
  tSegments: number,
  sweepAngle: number,
): Float32Array {
  const positions: number[] = [];

  for (let i = 0; i <= tSegments; i++) {
    const t = a + (i / tSegments) * (b - a);
    const r = Math.max(0, fn(t));
    for (let j = 0; j <= thetaSegments; j++) {
      const theta = (j / thetaSegments) * sweepAngle;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      if (axis === 'x') {
        // Revolve around x-axis: x stays, y and z form the circle
        positions.push(t, r * cosT, r * sinT);
      } else {
        // Revolve around y-axis: y stays, x and z form the circle
        positions.push(r * cosT, t, r * sinT);
      }
    }
  }

  return new Float32Array(positions);
}

/** Build indices for the parametric surface. */
function buildSolidIndices(tSegments: number, thetaSegments: number): Uint32Array {
  const indices: number[] = [];
  for (let i = 0; i < tSegments; i++) {
    for (let j = 0; j < thetaSegments; j++) {
      const a = i * (thetaSegments + 1) + j;
      const b = a + 1;
      const c = a + thetaSegments + 1;
      const d = c + 1;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }
  return new Uint32Array(indices);
}

/** Build a disk (annular cross-section) at a given position. */
function buildDiskGeometry(
  radius: number,
  axis: 'x' | 'y',
  position: number,
  segments: number,
  innerRadius: number = 0,
): { positions: Float32Array; indices: Uint32Array } {
  const pos: number[] = [];
  const idx: number[] = [];
  // Center vertex
  const centerIdx = 0;

  if (axis === 'x') {
    pos.push(position, 0, 0);
  } else {
    pos.push(0, position, 0);
  }

  // Ring vertices
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    if (axis === 'x') {
      pos.push(position, radius * cosA, radius * sinA);
    } else {
      pos.push(radius * cosA, position, radius * sinA);
    }
  }

  // Triangle fan from center
  for (let i = 1; i <= segments; i++) {
    idx.push(centerIdx, i, i + 1);
  }

  return {
    positions: new Float32Array(pos),
    indices: new Uint32Array(idx),
  };
}

/** Build a cylindrical shell surface (thin-walled cylinder). */
function buildCylinderShellGeometry(
  radius: number,
  height: number,
  axis: 'x' | 'y',
  basePos: number,
  thetaSegments: number,
  ySegments: number,
  sweepAngle: number = Math.PI * 2,
): { positions: Float32Array; indices: Uint32Array } {
  const pos: number[] = [];
  const idx: number[] = [];

  for (let i = 0; i <= ySegments; i++) {
    const yFrac = i / ySegments;
    const h = yFrac * height;
    for (let j = 0; j <= thetaSegments; j++) {
      const theta = (j / thetaSegments) * sweepAngle;
      const cosT = Math.cos(theta);
      const sinT = Math.sin(theta);

      if (axis === 'x') {
        // Cylinder along the x-axis direction at this x-position
        // The cylinder extends from x=basePos to x=basePos+height
        // rotating around the x-axis at distance=radius
        pos.push(basePos + h, radius * cosT, radius * sinT);
      } else {
        // Cylinder along the y-axis at this y-position
        pos.push(radius * cosT, basePos + h, radius * sinT);
      }
    }
  }

  for (let i = 0; i < ySegments; i++) {
    for (let j = 0; j < thetaSegments; j++) {
      const a = i * (thetaSegments + 1) + j;
      const b = a + 1;
      const c = a + thetaSegments + 1;
      const d = c + 1;
      idx.push(a, c, b);
      idx.push(b, c, d);
    }
  }

  return {
    positions: new Float32Array(pos),
    indices: new Uint32Array(idx),
  };
}

/* ------------------------------------------------------------------ */
/*  Profile Curve (2D line in the xy-plane)                            */
/* ------------------------------------------------------------------ */

function ProfileCurve({
  fn,
  a,
  b,
  axis,
  segments = 80,
}: {
  fn: (t: number) => number;
  a: number;
  b: number;
  axis: 'x' | 'y';
  segments?: number;
}) {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= segments; i++) {
      const t = a + (i / segments) * (b - a);
      const val = fn(t);
      if (axis === 'x') {
        pts.push([t, val, 0]);
      } else {
        pts.push([val, t, 0]);
      }
    }
    return pts;
  }, [fn, a, b, axis, segments]);

  return (
    <Line
      points={points}
      color="#3b6cb7"
      lineWidth={3}
      transparent
      opacity={0.9}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Rotation Axis Line                                                 */
/* ------------------------------------------------------------------ */

function RotationAxisLine({ axis, length }: { axis: 'x' | 'y'; length: number }) {
  const points = useMemo(() => {
    if (axis === 'x') {
      return [[-0.3, 0, 0] as [number, number, number], [length + 0.3, 0, 0] as [number, number, number]];
    }
    return [[0, -0.3, 0] as [number, number, number], [0, length + 0.3, 0] as [number, number, number]];
  }, [axis, length]);

  return (
    <Line
      points={points}
      color="#e74c3c"
      lineWidth={2}
      transparent
      opacity={0.7}
      dashed
      dashSize={0.1}
      gapSize={0.05}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Solid of Revolution Mesh                                           */
/* ------------------------------------------------------------------ */

function SolidMesh({
  fn,
  a,
  b,
  axis,
  sweepAngle,
}: {
  fn: (t: number) => number;
  a: number;
  b: number;
  axis: 'x' | 'y';
  sweepAngle: number;
}) {
  const tSeg = 60;
  const thetaSeg = 48;

  const geometry = useMemo(() => {
    const positions = buildSolidOfRevolution(fn, a, b, axis, thetaSeg, tSeg, sweepAngle);
    const indices = buildSolidIndices(tSeg, thetaSeg);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.computeVertexNormals();
    return geo;
  }, [fn, a, b, axis, sweepAngle]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color="#3b6cb7"
        transparent
        opacity={0.25}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Highlighted Disk                                                   */
/* ------------------------------------------------------------------ */

function HighlightedDisk({
  radius,
  position,
  axis,
}: {
  radius: number;
  position: number;
  axis: 'x' | 'y';
}) {
  const segments = 48;
  const { positions, indices } = useMemo(
    () => buildDiskGeometry(Math.max(0, radius), axis, position, segments),
    [radius, position, axis],
  );

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.computeVertexNormals();
    return geo;
  }, [positions, indices]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color="#d4a02a"
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Highlighted Cylindrical Shell                                      */
/* ------------------------------------------------------------------ */

function HighlightedShell({
  radius,
  height,
  basePos,
  axis,
}: {
  radius: number;
  height: number;
  basePos: number;
  axis: 'x' | 'y';
}) {
  const thetaSeg = 48;
  const ySeg = 1;

  const { positions, indices } = useMemo(
    () => buildCylinderShellGeometry(Math.max(0.001, radius), Math.max(0, height), axis, basePos, thetaSeg, ySeg),
    [radius, height, basePos, axis],
  );

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.computeVertexNormals();
    return geo;
  }, [positions, indices]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color="#d4a02a"
        transparent
        opacity={0.5}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/*  Multiple Shell Outlines (shell method visualization)               */
/* ------------------------------------------------------------------ */

function ShellOutlines({
  fn,
  a,
  b,
  axis,
  count,
}: {
  fn: (t: number) => number;
  a: number;
  b: number;
  axis: 'x' | 'y';
  count: number;
}) {
  const rings = useMemo(() => {
    const result: { radius: number; height: number; basePos: number }[] = [];
    for (let i = 1; i <= count; i++) {
      const t = a + (i / (count + 1)) * (b - a);
      const r = fn(t);
      if (r > 0.01) {
        result.push({ radius: r, height: b - a, basePos: a });
      }
    }
    return result;
  }, [fn, a, b, count]);

  return (
    <group>
      {rings.map((ring, i) => {
        const thetaSeg = 48;
        const ySeg = 1;
        const { positions, indices } = buildCylinderShellGeometry(
          ring.radius, ring.height, axis, ring.basePos, thetaSeg, ySeg,
        );
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setIndex(new THREE.BufferAttribute(indices, 1));
        geo.computeVertexNormals();

        return (
          <mesh key={i} geometry={geo}>
            <meshStandardMaterial
              color="#3b6cb7"
              transparent
              opacity={0.12}
              side={THREE.DoubleSide}
              depthWrite={false}
              wireframe
            />
          </mesh>
        );
      })}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Disk Outlines (disk method visualization)                          */
/* ------------------------------------------------------------------ */

function DiskOutlines({
  fn,
  a,
  b,
  axis,
  count,
}: {
  fn: (t: number) => number;
  a: number;
  b: number;
  axis: 'x' | 'y';
  count: number;
}) {
  const disks = useMemo(() => {
    const result: { radius: number; position: number }[] = [];
    for (let i = 0; i <= count; i++) {
      const t = a + (i / count) * (b - a);
      const r = fn(t);
      if (r > 0.01) {
        result.push({ radius: r, position: t });
      }
    }
    return result;
  }, [fn, a, b, count]);

  return (
    <group>
      {disks.map((disk, i) => {
        const { positions, indices } = buildDiskGeometry(disk.radius, axis, disk.position, 32);
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setIndex(new THREE.BufferAttribute(indices, 1));
        geo.computeVertexNormals();
        return (
          <mesh key={i} geometry={geo}>
            <meshStandardMaterial
              color="#3b6cb7"
              transparent
              opacity={0.08}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        );
      })}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/*  Sweeping Profile Curve Animation                                   */
/* ------------------------------------------------------------------ */

function SweepingProfile({
  fn,
  a,
  b,
  axis,
  sweepAngle,
  segments = 80,
}: {
  fn: (t: number) => number;
  a: number;
  b: number;
  axis: 'x' | 'y';
  sweepAngle: number;
  segments?: number;
}) {
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= segments; i++) {
      const t = a + (i / segments) * (b - a);
      const val = fn(t);
      const cosA = Math.cos(sweepAngle);
      const sinA = Math.sin(sweepAngle);

      if (axis === 'x') {
        pts.push([t, val * cosA, val * sinA]);
      } else {
        pts.push([val * cosA, t, val * sinA]);
      }
    }
    return pts;
  }, [fn, a, b, axis, sweepAngle, segments]);

  if (sweepAngle < 0.01) return null;

  return (
    <Line
      points={points}
      color="#d4a02a"
      lineWidth={2.5}
      transparent
      opacity={0.8}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  3D Scene (inner Canvas component)                                  */
/* ------------------------------------------------------------------ */

function Scene({
  preset,
  method,
  paramValue,
  sweepAngle,
}: {
  preset: Preset;
  method: Method;
  paramValue: number;
  sweepAngle: number;
}) {
  const { fn, a, b, axis } = preset;

  // The paramValue slider selects a position along [a, b]
  const selectedT = a + paramValue * (b - a);
  const selectedR = fn(selectedT);

  // For shell method, the cylindrical shell at radius r extends from base to base+height.

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 5, 5]} intensity={0.5} />

      <Axes3D length={1.5} />
      <GridPlane3D size={4} divisions={8} y={0} />

      <RotationAxisLine axis={axis} length={b} />

      {/* Profile curve in the xy-plane (z=0) */}
      <ProfileCurve fn={fn} a={a} b={b} axis={axis} />

      {/* Semi-transparent solid of revolution */}
      <SolidMesh fn={fn} a={a} b={b} axis={axis} sweepAngle={sweepAngle} />

      {/* Sweeping profile curve (animated edge) */}
      <SweepingProfile fn={fn} a={a} b={b} axis={axis} sweepAngle={sweepAngle} />

      {/* Method-specific visualizations */}
      {method === 'disk' && (
        <>
          <DiskOutlines fn={fn} a={a} b={b} axis={axis} count={20} />
          {/* Highlighted disk */}
          <HighlightedDisk radius={selectedR} position={selectedT} axis={axis} />
        </>
      )}

      {method === 'shell' && (
        <>
          <ShellOutlines fn={fn} a={a} b={b} axis={axis} count={8} />
          {/* Highlighted shell */}
          {axis === 'x' ? (
            // Shell around x-axis at radius r: the shell at radius r has height
            // that depends on how we decompose. For x-axis rotation, shells are
            // at different y-values. For f(x)=x^2 rotated around x-axis,
            // at radius y, the shell height is x_right(y) - x_left(y) where
            // y = x^2 => x = sqrt(y).
            // Shell at radius = selectedR, height = sqrt(selectedR) - a, basePos = a
            <HighlightedShell
              radius={selectedR}
              height={Math.sqrt(Math.max(0, selectedR)) - a}
              basePos={a}
              axis={axis}
            />
          ) : (
            // Shell around y-axis at radius x: height = f(x) = x^2, basePos = a
            <HighlightedShell
              radius={selectedR}
              height={selectedR - a}
              basePos={a}
              axis={axis}
            />
          )}
        </>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Animation Controller                                               */
/* ------------------------------------------------------------------ */

function AnimationController({
  isPlaying,
  onSweepChange,
}: {
  isPlaying: boolean;
  onSweepChange: (angle: number) => void;
}) {
  const sweepRef = useRef(0);
  const directionRef = useRef(1);

  useFrame((_, delta) => {
    if (!isPlaying) return;
    sweepRef.current += directionRef.current * delta * 1.2;

    if (sweepRef.current >= Math.PI * 2) {
      sweepRef.current = Math.PI * 2;
      directionRef.current = -1;
    } else if (sweepRef.current <= 0) {
      sweepRef.current = 0;
      directionRef.current = 1;
    }

    onSweepChange(sweepRef.current);
  });

  return null;
}

/* ------------------------------------------------------------------ */
/*  Canvas wrapper that handles animation state                        */
/* ------------------------------------------------------------------ */

function SceneWrapper({
  preset,
  method,
  paramValue,
  height,
  isPlaying,
  sweepAngle,
  onSweepChange,
}: {
  preset: Preset;
  method: Method;
  paramValue: number;
  height: number;
  isPlaying: boolean;
  sweepAngle: number;
  onSweepChange: (angle: number) => void;
}) {
  const cameraPos: [number, number, number] = preset.axis === 'x'
    ? [1.8, 1.5, 2.0]
    : [2.0, 1.2, 2.0];

  return (
    <R3FCanvas height={height} cameraPosition={cameraPos} cameraFov={50}>
      <AnimationController isPlaying={isPlaying} onSweepChange={onSweepChange} />
      <Scene preset={preset} method={method} paramValue={paramValue} sweepAngle={sweepAngle} />
    </R3FCanvas>
  );
}

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */

export function ShellMethod3D({ width = 640, height = 480 }: ShellMethod3DProps) {
  const [method, setMethod] = useState<Method>('disk');
  const [presetIdx, setPresetIdx] = useState(0);
  const [paramValue, setParamValue] = useState(0.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sweepAngle, setSweepAngle] = useState(Math.PI * 2);

  const preset = PRESETS[presetIdx];

  const handlePresetChange = useCallback((idx: number) => {
    setPresetIdx(idx);
    setParamValue(0.5);
    setIsPlaying(false);
    setSweepAngle(Math.PI * 2);
  }, []);

  const handleMethodChange = useCallback((m: Method) => {
    setMethod(m);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  // Compute volume numerically
  const volume = useMemo(() => {
    const { fn, a, b, axis } = preset;
    if (method === 'disk') {
      if (axis === 'x') {
        return Math.PI * integrate((x) => fn(x) ** 2, a, b);
      }
      // axis === 'y': disk method means integrating with respect to y
      // y = f(x) => x = f_inverse(y). For f(x) = x^2, x = sqrt(y)
      return Math.PI * integrate((y) => {
        const x = Math.sqrt(Math.max(0, y));
        return x ** 2;
      }, fn(a), fn(b));
    }
    // Shell method
    if (preset.axis === 'x') {
      // Shells at radius y: V = 2*pi * integral y * h(y) dy
      // h(y) = width of region at height y
      // For y = x^2 around x-axis: h(y) = sqrt(y) - 0
      return 2 * Math.PI * integrate((y) => y * Math.sqrt(Math.max(0, y)), preset.fn(preset.a), preset.fn(preset.b));
    }
    // axis === 'y': shells at radius x, height = f(x)
    return 2 * Math.PI * integrate((x) => x * fn(x), a, b);
  }, [preset, method]);

  // Readout values
  const selectedT = preset.a + paramValue * (preset.b - preset.a);
  const selectedR = preset.fn(selectedT);

  const methodLabel = method === 'disk' ? 'Disk / Washer Method' : 'Shell Method';
  const formulaText = method === 'disk' ? preset.diskFormula : preset.shellFormula;

  return (
    <div className="flex h-full w-full flex-col">
      {/* 3D Canvas */}
      <SceneWrapper
        preset={preset}
        method={method}
        paramValue={paramValue}
        height={height - 140}
        isPlaying={isPlaying}
        sweepAngle={sweepAngle}
        onSweepChange={setSweepAngle}
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 border-t border-rule bg-paper-elevated px-4 py-3">
        {/* Method toggle */}
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => handleMethodChange('disk')}
            className={`rounded-sm border px-3 py-0.5 font-sans text-[11px] transition-colors duration-fast ${
              method === 'disk'
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-rule bg-paper-elevated text-ink-muted hover:bg-surface-1'
            }`}
          >
            Disk
          </button>
          <button
            type="button"
            onClick={() => handleMethodChange('shell')}
            className={`rounded-sm border px-3 py-0.5 font-sans text-[11px] transition-colors duration-fast ${
              method === 'shell'
                ? 'border-accent bg-accent-soft text-accent'
                : 'border-rule bg-paper-elevated text-ink-muted hover:bg-surface-1'
            }`}
          >
            Shell
          </button>
        </div>

        {/* Preset selector */}
        <div className="flex gap-1">
          {PRESETS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handlePresetChange(i)}
              className={`rounded-sm border px-2 py-0.5 font-mono text-[10px] transition-colors duration-fast ${
                i === presetIdx
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-rule bg-paper-elevated text-ink-muted hover:bg-surface-1'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* r-slider */}
        <label className="flex items-center gap-2 font-sans text-xs text-ink-muted">
          {method === 'disk' ? 'x' : 'r'} =
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={paramValue}
            onChange={(e) => setParamValue(+e.target.value)}
            className="h-1 w-28 cursor-pointer accent-[var(--color-accent)]"
          />
          <span className="font-mono text-xs text-ink w-12">
            {selectedT.toFixed(2)}
          </span>
        </label>

        {/* Play / Pause */}
        <button
          type="button"
          onClick={togglePlay}
          className="flex items-center gap-1 rounded-sm border border-rule px-2 py-0.5 font-sans text-[11px] text-ink-muted transition-colors duration-fast hover:bg-surface-1"
        >
          {isPlaying ? '\u23F8 Pause' : '\u25B6 Play'}
        </button>
      </div>

      {/* Readout */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule bg-surface-1 px-4 py-2">
        <div className="font-sans text-[11px] text-ink-muted">
          <span className="font-medium text-ink">{methodLabel}</span>
          <span className="mx-2 text-ink-faint">\u2014</span>
          <span className="font-mono text-vector-blue">{formulaText}</span>
        </div>
        <div className="flex gap-4 font-mono text-[11px]">
          <span className="text-vector-green">
            V = {volume.toFixed(4)}
          </span>
          <span className="text-ink-faint">
            {method === 'disk'
              ? `R(${selectedT.toFixed(2)}) = ${selectedR.toFixed(3)}`
              : `r=${selectedT.toFixed(2)}, h=${selectedR.toFixed(3)}`}
          </span>
        </div>
      </div>
    </div>
  );
}
