# Benchmark Lessons Deep Optimization — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade 6 benchmark lessons (01, 02, 11, 22, 24, 26) with preset animation buttons, formula-animation linkage, and deeper mathematical content.

**Architecture:** Each lesson gets (a) upgraded interactive component with narrative/snapshot presets using `d3.timer` animation, (b) enhanced MDX content with worked examples and master-level insights, (c) FormulaReadout connected to live state. Infrastructure first, then lessons in order of complexity.

**Tech Stack:** React 19 + D3.js (d3-timer, d3-ease) for 2D animations, React Three Fiber for 3D, KaTeX for formulas.

---

## Task 1: Infrastructure — Animated Preset Utility

**Files:**
- Create: `src/components/interactive/linear-algebra/useAnimatedPreset.ts`
- Modify: `src/components/interactive/FormulaReadout.tsx`

**Step 1: Create `useAnimatedPreset` hook**

A reusable hook that interpolates numeric state values with `d3.timer` + `d3.easeCubicInOut` over 600ms.

```typescript
// src/components/interactive/linear-algebra/useAnimatedPreset.ts
import { useRef, useCallback, useState } from 'react';
import { timer } from 'd3-timer';
import { easeCubicInOut } from 'd3-ease';

interface AnimatedPresetOptions {
  duration?: number;
  onTick?: (t: number) => void;
}

export function useAnimatedPreset<T extends Record<string, number>>(
  getCurrent: () => T,
  setValues: (values: T) => void,
  options: AnimatedPresetOptions = {},
) {
  const { duration = 600 } = options;
  const timerRef = useRef<ReturnType<typeof timer> | null>(null);
  const [animating, setAnimating] = useState(false);

  const applyPreset = useCallback((target: T) => {
    if (timerRef.current) timerRef.current.stop();

    const from = getCurrent();
    const keys = Object.keys(target) as (keyof T)[];
    setAnimating(true);

    timerRef.current = timer((elapsed) => {
      const rawT = Math.min(elapsed / duration, 1);
      const t = easeCubicInOut(rawT);

      const interpolated = {} as T;
      for (const key of keys) {
        const start = from[key] as number;
        const end = target[key] as number;
        (interpolated as any)[key] = start + (end - start) * t;
      }
      setValues(interpolated);

      if (rawT >= 1) {
        timerRef.current?.stop();
        setAnimating(false);
      }
    });
  }, [getCurrent, setValues, duration]);

  const snapPreset = useCallback((target: T) => {
    if (timerRef.current) timerRef.current.stop();
    setAnimating(false);
    setValues(target);
  }, [setValues]);

  return { applyPreset, snapPreset, animating };
}
```

**Step 2: Upgrade FormulaReadout to support dynamic highlighting**

Add an optional `highlight` prop that turns a formula's value text a different color when a condition is met (e.g., det=0 turns red).

```typescript
// Modified FormulaReadout.tsx — add highlight support
interface FormulaItem {
  label: string;
  expression: string;
  value?: string;
  highlight?: 'default' | 'accent' | 'warning' | 'critical';
}
```

The `highlight` field changes the value text color:
- `default` or unset: `var(--color-accent)` (current behavior)
- `accent`: `var(--color-accent)` with bold
- `warning`: `var(--color-vector-yellow)`
- `critical`: `var(--color-vector-red)` with bold

**Step 3: Build and verify**

Run: `npm run build`
Expected: Build succeeds with no errors.

**Step 4: Commit**

```bash
git add src/components/interactive/linear-algebra/useAnimatedPreset.ts src/components/interactive/FormulaReadout.tsx
git commit -m "feat: add useAnimatedPreset hook and FormulaReadout highlight support"
```

---

## Task 2: Lesson 01 — VectorCanvas Presets + Content Enrichment

**Files:**
- Modify: `src/components/interactive/linear-algebra/VectorCanvas.tsx`
- Modify: `src/content/lessons/linear-algebra/01-vectors-as-arrows.mdx`

**Step 1: Add preset system to VectorCanvas**

Add presets to VectorCanvas. The component currently has no presets — just draggable vectors. We add:
- Narrative presets: "Zero vector", "Unit vector", "Opposite direction"
- Snapshot presets: "Horizontal", "Vertical", "Diagonal", "Reset"

Changes to `VectorCanvas.tsx`:
- Add `onPresetApply` callback prop (optional) so parent MDX can react to preset changes
- Add internal preset state with `useAnimatedPreset`
- Add preset buttons row above the SVG
- During animation, interpolate vector x,y from current to target using `useAnimatedPreset`

Key implementation detail: VectorCanvas uses pure SVG+React (no D3), so we use `useAnimatedPreset` to interpolate the vector state values directly.

```typescript
// Add to VectorCanvas props:
interface VectorCanvasProps {
  // ... existing props
  presets?: boolean; // default false for backward compat
}

// Inside component, when presets=true:
const { applyPreset, animating } = useAnimatedPreset(
  () => ({ x: vectors[0].x, y: vectors[0].y }),
  ({ x, y }) => setVectors([{ ...vectors[0], x, y }]),
);

// Preset definitions (only the first vector animates):
const presetList = [
  { label: 'Zero vector', x: 0, y: 0 },
  { label: 'Unit vector', x: 0.707, y: 0.707 },
  { label: 'Opposite', x: -3, y: -2 },
  { label: 'Horizontal', x: 4, y: 0 },
  { label: 'Vertical', x: 0, y: 3 },
  { label: 'Reset', x: 3, y: 2 },
];
```

**Step 2: Enrich lesson 01 MDX content**

Expand from ~350 words to ~700 words. Add sections:

1. **After "What an arrow knows"** — add "The zero vector" subsection:
   - The zero vector has no direction and zero length. It's the only vector that can't be drawn as an arrow. Geometrically: the tip and tail are the same point.

2. **After "Drag it yourself"** — add "Opposite vectors" subsection:
   - For every arrow, there's an arrow pointing the exact opposite way with the same length. This is the **negative** of the vector: -v has the same magnitude but opposite direction.
   - "If v is 'walk 3 east and 2 north', then -v is 'walk 3 west and 2 south'."

3. **Expand "When coordinates enter"** — add worked example:
   - Show how (3,2) and (-1,3) differ geometrically. First points northeast, second points northwest. Same quadrant, different character.

4. **Add a third exercise** about the zero vector.

**Step 3: Build and verify**

Run: `npm run build`
Expected: Build succeeds.

**Step 4: Commit**

```bash
git add src/components/interactive/linear-algebra/VectorCanvas.tsx src/content/lessons/linear-algebra/01-vectors-as-arrows.mdx
git commit -m "feat(lesson-01): add preset animations and enrich content"
```

---

## Task 3: Lesson 02 — VectorAddition Presets + Content Enrichment

**Files:**
- Modify: `src/components/interactive/linear-algebra/VectorAddition.tsx`
- Modify: `src/content/lessons/linear-algebra/02-vector-addition.mdx`

**Step 1: Add preset system to VectorAddition**

VectorAddition uses D3. Add narrative presets that animate v1 and v2 to target values:

```typescript
const presetList = [
  { label: 'Head-to-tail', v1: { x: 3, y: 1 }, v2: { x: 1, y: 2 }, parallelogram: false },
  { label: 'Parallelogram', v1: { x: 3, y: 1 }, v2: { x: 1, y: 2 }, parallelogram: true },
  { label: 'Cancel out', v1: { x: 2, y: 1 }, v2: { x: -2, y: -1 }, parallelogram: false },
  { label: 'Orthogonal', v1: { x: 3, y: 0 }, v2: { x: 0, y: 2 }, parallelogram: true },
  { label: 'Same direction', v1: { x: 2, y: 1 }, v2: { x: 1, y: 0.5 }, parallelogram: false },
  { label: 'Opposite dirs', v1: { x: 3, y: 0 }, v2: { x: -1, y: 0 }, parallelogram: false },
];
```

Use `useAnimatedPreset` with the combined state `{ v1x, v1y, v2x, v2y }`. During animation, call `draw()` in the tick callback.

Also fix the bug: `handlePointerDown` is defined but never wired to the SVG — add `onPointerDown` handlers to the drag handle circles.

**Step 2: Enrich lesson 02 MDX content**

Expand from ~350 words to ~650 words. Add:

1. **After "Head-to-tail"** — add "Commutativity in action" callout:
   - "Try the 'Parallelogram' preset. Notice the two paths through the parallelogram: blue-then-green and green-then-blue. Both reach the same corner. This is a + b = b + a, visible as a geometric fact."

2. **Expand "The parallelogram rule"** — add "Why parallelograms?" insight:
   - "The parallelogram isn't just a trick — it reveals that vector addition is really about two independent displacements happening simultaneously. The diagonal is the 'shortcut' through the parallelogram."

3. **Add "Special cases" subsection** before KeyInsight:
   - Canceling: when b = -a, the sum is zero — "you walk there and walk back"
   - Same direction: sum is longer, both push the same way
   - Orthogonal: Pythagorean connection — |a+b|² = |a|² + |b|²

4. **Add a third exercise** about the triangle inequality.

**Step 3: Build and verify**

Run: `npm run build`

**Step 4: Commit**

```bash
git add src/components/interactive/linear-algebra/VectorAddition.tsx src/content/lessons/linear-algebra/02-vector-addition.mdx
git commit -m "feat(lesson-02): add preset animations, fix drag bug, enrich content"
```

---

## Task 4: Lesson 11 — MatrixTransform2D Preset Upgrade + Content Enrichment

**Files:**
- Modify: `src/components/interactive/linear-algebra/MatrixTransform2D.tsx`
- Modify: `src/content/lessons/linear-algebra/11-matrices-as-transformations.mdx`

**Step 1: Upgrade MatrixTransform2D presets**

MatrixTransform2D already has presets and animation. Upgrades:
- Add 2 new presets: "Rotation 45°" (cos45, -sin45, sin45, cos45), "Projection" (1,0,0,0)
- Add active-state highlighting to preset buttons (like ScalarMult does)
- Connect determinant value to FormulaReadout via `onStateChange` callback prop
- Add a "det = 0" red flash effect when determinant crosses zero during animation

```typescript
// New presets to add:
{ label: 'Rotation 45°', a: Math.cos(Math.PI/4), b: -Math.sin(Math.PI/4), c: Math.sin(Math.PI/4), d: Math.cos(Math.PI/4) },
{ label: 'Projection', a: 1, b: 0, c: 0, d: 0 },
```

For the active-state highlighting, track which preset was last applied:

```typescript
const [activePreset, setActivePreset] = useState<string | null>(null);

// In applyPreset:
const applyPreset = (p: typeof presets[0]) => {
  setActivePreset(p.label);
  setA(p.a); setB(p.b); setC(p.c); setD(p.d);
  setAnimating(true);
};

// In button className:
className={`... ${activePreset === p.label ? 'border-accent bg-accent/10 text-accent' : 'border-rule bg-paper-elevated text-ink-muted hover:border-accent'}`}
```

**Step 2: Enrich lesson 11 MDX content**

Expand from ~550 words to ~900 words. Add:

1. **Expand "Visual catalogue"** — link each type to its preset button:
   - "Click the 'Shear' preset above and watch the grid slide. The squares become parallelograms but the horizontal lines stay flat."
   - "Click 'Collapse' and see the plane flatten into a line. The determinant drops to zero — the unit square loses all its area."

2. **Add "Reading the determinant" subsection** after "Visual catalogue":
   - det > 0: orientation preserved (the "T" still reads correctly)
   - det < 0: orientation flipped (the "T" is mirror-imaged)
   - det = 0: dimension collapsed (information lost)
   - |det| = area scaling factor

3. **Expand "The key property: linearity"** — add "Why only two columns?" insight:
   - "Linearity means the transformation of any vector is completely determined by where the basis vectors go. If you know the fate of e₁ and e₂, you know the fate of everything. This is why a 2×2 matrix — just 4 numbers — can describe an infinite transformation."

4. **Add a third exercise** about composing transformations.

**Step 3: Build and verify**

Run: `npm run build`

**Step 4: Commit**

```bash
git add src/components/interactive/linear-algebra/MatrixTransform2D.tsx src/content/lessons/linear-algebra/11-matrices-as-transformations.mdx
git commit -m "feat(lesson-11): upgrade presets with active highlighting, add projection preset, enrich content"
```

---

## Task 5: Lesson 22 — EigenvectorVis Animation Upgrade + Content Enrichment

**Files:**
- Modify: `src/components/interactive/linear-algebra/EigenvectorVis.tsx`
- Modify: `src/content/lessons/linear-algebra/22-eigenvectors-and-eigenvalues.mdx`

**Step 1: Upgrade EigenvectorVis with animated presets**

Currently presets snap instantly (`setT(1)`). Upgrade to use `useAnimatedPreset`:
- Presets animate the matrix entries AND the transform slider t from 0→1
- Total animation: first 400ms for matrix interpolation, then 200ms for t ramp-up

```typescript
// Replace the current snap-based presets with:
const { applyPreset } = useAnimatedPreset(
  () => ({ a, b, c, d, t }),
  (vals) => { setA(vals.a); setB(vals.b); setC(vals.c); setD(vals.d); setT(vals.t); },
);
```

Add 2 new presets:
- "Symmetric": a=2, b=1, c=1, d=2 (guaranteed orthogonal eigenvectors)
- "Defective": a=2, b=1, c=0, d=2 (only one eigendirection — algebraic mult > geometric mult)

Add active-state highlighting to preset buttons.

**Step 2: Enrich lesson 22 MDX content**

Expand from ~600 words to ~1000 words. Add:

1. **After "Finding eigenvalues"** — add "Trace and determinant" insight box:
   - "The trace is the sum of eigenvalues. The determinant is their product. These two numbers — already visible in the matrix — encode everything about the stretching behavior."
   - trace = λ₁ + λ₂ → average stretching
   - det = λ₁ · λ₂ → total area scaling

2. **Expand "Visual examples"** — make each example link to a preset:
   - "Click 'Shear': notice only the x-axis stays on its line (eigenvalue 1). All other vectors tilt. The transformation has only one eigendirection."
   - "Click 'Rotation': the banner reads 'No real eigenvalues.' Rotation moves every vector off its line — the eigenvalues are imaginary numbers, reflecting the rotation's spiraling nature."
   - "Click 'Symmetric': both eigenvectors are perpendicular to each other. Symmetric matrices always have orthogonal eigenvectors."

3. **Add "Defective matrices" subsection** (advanced insight):
   - Some matrices have fewer eigendirections than eigenvalue algebra suggests
   - Example: [[2,1],[0,2]] has eigenvalue 2 (repeated) but only one eigendirection
   - The geometric multiplicity is less than the algebraic multiplicity

4. **Expand "Why eigenvectors matter"** — add one sentence per application connecting back to the visual

5. **Add a third exercise** about the trace-determinant relationship.

**Step 3: Build and verify**

Run: `npm run build`

**Step 4: Commit**

```bash
git add src/components/interactive/linear-algebra/EigenvectorVis.tsx src/content/lessons/linear-algebra/22-eigenvectors-and-eigenvalues.mdx
git commit -m "feat(lesson-22): animated presets, symmetric/defective presets, deeper eigenvalue content"
```

---

## Task 6: Lesson 24 — SVDExplorer Presets + Content Enrichment

**Files:**
- Modify: `src/components/interactive/linear-algebra/SVDExplorer.tsx`
- Modify: `src/content/lessons/linear-algebra/24-singular-value-decomposition.mdx`

**Step 1: Add presets to SVDExplorer**

Currently SVDExplorer has only an animation slider and matrix sliders. Add preset buttons:

```typescript
const presetList = [
  { label: 'Circle → Ellipse', a: 2, b: 1, c: 0, d: 1, t: 1 },
  { label: 'Pure scaling', a: 3, b: 0, c: 0, d: 2, t: 1 },
  { label: 'Rank deficient', a: 1, b: 2, c: 0.5, d: 1, t: 1 },
  { label: 'Rotation-like', a: 0, b: -2, c: 2, d: 0, t: 1 },
  { label: 'Reset', a: 2, b: 1, c: 0, d: 1, t: 0 },
];
```

Use `useAnimatedPreset` to animate both matrix entries and t simultaneously.

Add a "Play animation" button that auto-runs t from 0→1 with the current matrix (showing the circle→ellipse morph).

Add active-state highlighting to buttons.

Add the σ₁/σ₂ ratio (= condition number κ) display below the singular values, with color coding:
- κ < 3: green (well-conditioned)
- 3 ≤ κ < 10: yellow (moderate)
- κ ≥ 10: red (ill-conditioned)

**Step 2: Enrich lesson 24 MDX content**

Expand from ~400 words to ~750 words. Add:

1. **After "The geometric story"** — add step-by-step walk-through:
   - "Step 1: A unit circle of radius 1 sits in the input space."
   - "Step 2: The matrix stretches it into an ellipse. The longest semi-axis has length σ₁, the shortest has length σ₂."
   - "Step 3: The ellipse's axes align with the columns of U — the output basis."
   - "The input directions that become these axes are the columns of V."

2. **Expand "SVD vs. eigendecomposition"** — add geometric comparison:
   - Eigendecomposition: "Use the same coordinate system for input and output" (one basis)
   - SVD: "Use different coordinate systems for input and output" (two bases)
   - This is why SVD always works: you're allowed to use the most natural basis for each side

3. **Add "The condition number" subsection**:
   - σ₁/σ₂ tells you how "elongated" the ellipse is
   - A circle (σ₁ = σ₂) means the transformation preserves all directions equally
   - A very flat ellipse (σ₁ >> σ₂) means the transformation amplifies some directions enormously while crushing others — this is ill-conditioning
   - Connection: "A matrix is invertible iff all σ > 0"

4. **Add a third exercise** about rank and singular values.

**Step 3: Build and verify**

Run: `npm run build`

**Step 4: Commit**

```bash
git add src/components/interactive/linear-algebra/SVDExplorer.tsx src/content/lessons/linear-algebra/24-singular-value-decomposition.mdx
git commit -m "feat(lesson-24): add animated presets, condition number display, enrich SVD content"
```

---

## Task 7: Lesson 26 — CrossProductVis Presets + Content Enrichment

**Files:**
- Modify: `src/components/interactive/linear-algebra/CrossProductVis.tsx`
- Modify: `src/content/lessons/linear-algebra/26-cross-product.mdx`

**Step 1: Add presets to CrossProductVis**

Currently has number inputs only. Add preset buttons:

```typescript
const presetList = [
  { label: 'Standard (x × y)', a: [1,0,0], b: [0,1,0] },
  { label: 'Parallel (zero)', a: [1,0,0], b: [2,0,0] },
  { label: 'Orthogonal max', a: [1,0,0], b: [0,2,0] },
  { label: '45° angle', a: [1,0,0], b: [Math.cos(Math.PI/4), Math.sin(Math.PI/4), 0] },
  { label: 'Anti-parallel', a: [1,0,0], b: [-1,0,0] },
];
```

Use `useAnimatedPreset` to animate vector components from current to target.

**Step 2: Enrich lesson 26 MDX content**

Expand from ~350 words to ~700 words. Add:

1. **After "The geometric picture"** — add "Right-hand rule" visual description:
   - "Point your index finger along **a**, curl your fingers toward **b**, and your thumb points along **a** × **b**. This convention is what gives the cross product its direction — there are two perpendicular directions, and the right-hand rule picks one."

2. **Add "Why perpendicular?" subsection**:
   - The cross product must be perpendicular to both inputs because it encodes the *area* of the parallelogram, not the *shape*. Two inputs that span the same area (same parallelogram, different shapes) give the same cross product.
   - The length captures "how much area" and the direction captures "which plane."

3. **Add "The triple product" subsection** (advanced insight):
   - a · (b × c) = volume of the parallelepiped (determinant of three vectors)
   - This connects the cross product back to determinants: "The cross product gives you the 'area direction', and dotting with a third vector gives you the signed volume."

4. **Expand exercises** — add a third exercise about the triple product/determinant connection.

**Step 3: Build and verify**

Run: `npm run build`

**Step 4: Commit**

```bash
git add src/components/interactive/linear-algebra/CrossProductVis.tsx src/content/lessons/linear-algebra/26-cross-product.mdx
git commit -m "feat(lesson-26): add preset animations, right-hand rule insight, triple product content"
```

---

## Task 8: Final Build Verification

**Step 1: Full build**

Run: `npm run build`
Expected: 89 pages built successfully, no errors.

**Step 2: Spot-check dev server**

Run: `npm run dev`
Visit each of the 6 lesson pages and verify:
- Preset buttons render and highlight correctly
- Narrative presets animate smoothly (600ms cubic ease)
- Snapshot presets snap instantly
- Formula readouts display correctly
- Content reads well — no typos or broken formatting
- 3D companions still load correctly

**Step 3: Final commit**

```bash
git commit --allow-empty -m "chore: benchmark lessons optimization complete — lessons 01, 02, 11, 22, 24, 26"
```
