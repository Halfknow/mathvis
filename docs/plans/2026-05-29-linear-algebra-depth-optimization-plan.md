# Linear Algebra Depth Optimization — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deepen all 30 existing linear algebra lessons, add 5 new lessons, and build 6 new visualization components, referencing the Iris textbook (Visualize-ML) for depth.

**Architecture:** Keep existing 8-module structure and file names. Renumber `lessonOrder` in frontmatter to insert 5 new lessons. Build 6 new D3.js components following the established `useEffect + useRef` pattern. Deepen each lesson with multi-perspective, connections, and deep-understanding paragraphs.

**Tech Stack:** Astro 5 + MDX + React 19 + D3.js 7 + KaTeX + Tailwind CSS 4

**Design doc:** `docs/plans/2026-05-29-linear-algebra-depth-optimization-design.md`

---

## Phase 1: Renumber Existing Lessons

All existing lessons need their `lessonOrder` updated to make room for 5 new insertions. File names stay the same — only the frontmatter `lessonOrder` value changes.

### Task 1: Renumber lessonOrder for all existing lessons

**Files to modify (30 files):**
- `src/content/lessons/linear-algebra/01-vectors-as-arrows.mdx` — lessonOrder stays 1
- `src/content/lessons/linear-algebra/02-vector-addition.mdx` — lessonOrder stays 2
- `src/content/lessons/linear-algebra/03-scalar-multiplication.mdx` — lessonOrder stays 3
- `src/content/lessons/linear-algebra/04-the-dot-product.mdx` — lessonOrder stays 4
- `src/content/lessons/linear-algebra/05-length-angles-orthogonality.mdx` — lessonOrder stays 5
- `src/content/lessons/linear-algebra/06-linear-combinations.mdx` — lessonOrder: 6 → 7
- `src/content/lessons/linear-algebra/07-span-and-linear-independence.mdx` — lessonOrder: 7 → 8
- `src/content/lessons/linear-algebra/08-basis-and-dimension.mdx` — lessonOrder: 8 → 9
- `src/content/lessons/linear-algebra/09-projections.mdx` — lessonOrder: 9 → 10
- `src/content/lessons/linear-algebra/10-basis-change.mdx` — lessonOrder: 10 → 11
- `src/content/lessons/linear-algebra/11-matrices-as-transformations.mdx` — lessonOrder: 11 → 12
- `src/content/lessons/linear-algebra/12-matrices-encode-transformations.mdx` — lessonOrder: 12 → 13
- `src/content/lessons/linear-algebra/13-matrix-vector-product.mdx` — lessonOrder: 13 → 14
- `src/content/lessons/linear-algebra/14-the-determinant.mdx` — lessonOrder: 14 → 15
- `src/content/lessons/linear-algebra/15-matrix-multiplication.mdx` — lessonOrder: 15 → 16
- `src/content/lessons/linear-algebra/16-linear-systems-as-geometry.mdx` — lessonOrder: 16 → 18
- `src/content/lessons/linear-algebra/17-inverse-matrices.mdx` — lessonOrder: 17 → 19
- `src/content/lessons/linear-algebra/18-column-space-and-null-space.mdx` — lessonOrder: 18 → 20
- `src/content/lessons/linear-algebra/19-null-space.mdx` — lessonOrder: 19 → 21
- `src/content/lessons/linear-algebra/20-subspaces.mdx` — lessonOrder: 20 → 22
- `src/content/lessons/linear-algebra/21-orthogonal-bases-gram-schmidt.mdx` — lessonOrder: 21 → 24
- `src/content/lessons/linear-algebra/22-eigenvectors-and-eigenvalues.mdx` — lessonOrder: 22 → 25
- `src/content/lessons/linear-algebra/23-diagonalization.mdx` — lessonOrder: 23 → 26
- `src/content/lessons/linear-algebra/24-singular-value-decomposition.mdx` — lessonOrder: 24 → 27
- `src/content/lessons/linear-algebra/25-3d-transformations.mdx` — lessonOrder: 25 → 30
- `src/content/lessons/linear-algebra/26-cross-product.mdx` — lessonOrder: 26 → 31
- `src/content/lessons/linear-algebra/27-non-square-matrices.mdx` — lessonOrder: 27 → 32
- `src/content/lessons/linear-algebra/28-functions-as-vectors.mdx` — lessonOrder: 28 → 33
- `src/content/lessons/linear-algebra/29-inner-product-spaces.mdx` — lessonOrder: 29 → 34
- `src/content/lessons/linear-algebra/30-where-linear-algebra-lives.mdx` — lessonOrder: 30 → 35

**New lesson slots (created in Phase 3):**
- Slot 6: Norms and Distances (module 1)
- Slot 17: Matrix Multiplication Perspectives (module 3)
- Slot 23: Least Squares and Regression (module 4)
- Slot 28: QR Decomposition (module 5)
- Slot 29: Principal Component Analysis (module 5)

**Step 1:** Edit each file's frontmatter `lessonOrder` value. Use the Edit tool for each file.

**Step 2:** Verify build succeeds.

Run: `npx astro build`
Expected: Build completes with no errors.

**Step 3:** Commit.

```bash
git add -A src/content/lessons/linear-algebra/
git commit -m "chore: renumber lessonOrder for all 30 LA lessons to make room for 5 new insertions"
```

---

## Phase 2: Build 6 New Visualization Components

Follow the established pattern from `DotProductVis.tsx`, `SVDExplorer.tsx`, `GramSchmidtVis.tsx`:
- `useEffect` + `useRef` for D3 SVG manipulation
- `useCallback` for the `draw` function
- CSS custom properties for all colors (`var(--color-*)`)
- `not-prose space-y-3` wrapper div
- Range sliders with `accent-[var(--color-*)]`

### Task 2.1: NormBallVis — L1/L2/L∞ unit ball comparison

**Files:**
- Create: `src/components/interactive/linear-algebra/NormBallVis.tsx`

**Behavior:**
- SVG canvas showing coordinate grid
- Three overlaid unit balls: L2 (circle, blue), L1 (diamond, green), L∞ (square, accent)
- Toggle buttons to show/hide each norm type
- Readout showing norm value for a draggable point
- The user drags a point and sees ||p||₁, ||p||₂, ||p||∞ change

**Key math:**
- L2: √(x²+y²) — circle of radius 1
- L1: |x|+|y| — diamond (rotated square)
- L∞: max(|x|,|y|) — axis-aligned square

**Component structure:**
```tsx
import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

export function NormBallVis({ width = 640, height = 400 }: { width?: number; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [px, setPx] = useState(0.6);
  const [py, setPy] = useState(0.4);
  const [showL1, setShowL1] = useState(true);
  const [showL2, setShowL2] = useState(true);
  const [showLinf, setShowLinf] = useState(true);

  const l1 = Math.abs(px) + Math.abs(py);
  const l2 = Math.sqrt(px * px + py * py);
  const linf = Math.max(Math.abs(px), Math.abs(py));

  // draw function: grid + three unit balls (polygon paths) + draggable point
  // L2 unit ball: circle of 64 points at cos(θ),sin(θ)
  // L1 unit ball: diamond at (1,0),(0,1),(-1,0),(0,-1)
  // L∞ unit ball: square at (1,1),(-1,1),(-1,-1),(1,-1)

  // ... (full D3 implementation following DotProductVis pattern)
}
```

**Step 1:** Create `NormBallVis.tsx` with full D3 implementation.

**Step 2:** Verify it compiles.

Run: `npx astro check`
Expected: No TypeScript errors.

**Step 3:** Commit.

```bash
git add src/components/interactive/linear-algebra/NormBallVis.tsx
git commit -m "feat: add NormBallVis component for L1/L2/Linf unit ball comparison"
```

---

### Task 2.2: MatrixMultPerspectives — four views of matrix multiplication

**Files:**
- Create: `src/components/interactive/linear-algebra/MatrixMultPerspectives.tsx`

**Behavior:**
- Two 2×2 matrices A and B (adjustable via sliders)
- Product AB computed
- Four tab/view buttons:
  1. **Row × Column** (dot product): highlight row i of A and column j of B, show their dot product filling entry (i,j)
  2. **Column combination**: show each column of AB as A times the corresponding column of B
  3. **Row combination**: show each row of AB as the corresponding row of A times B
  4. **Outer product sum**: show AB = Σᵢ colᵢ(A) × rowᵢ(B) as sum of rank-1 matrices
- Visual: colored matrix entries with highlighting

**Component structure:**
```tsx
import { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

export function MatrixMultPerspectives({ width = 640, height = 400 }: { width?: number; height?: number }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [perspective, setPerspective] = useState<0|1|2|3>(0);
  // Matrix A entries
  const [a11, setA11] = useState(2); const [a12, setA12] = useState(1);
  const [a21, setA21] = useState(0); const [a22, setA22] = useState(1);
  // Matrix B entries
  const [b11, setB11] = useState(1); const [b12, setB12] = useState(0);
  const [b21, setB21] = useState(0); const [b22] = useState(1);

  // AB product
  const ab11 = a11*b11+a12*b21; const ab12 = a11*b12+a12*b22;
  const ab21 = a21*b11+a22*b21; const ab22 = a21*b12+a22*b22;

  // Draw: render A, B, AB matrices as grids with colored highlighting
  // based on current perspective
  // ... (full D3 implementation)
}
```

**Step 1:** Create `MatrixMultPerspectives.tsx`.

**Step 2:** Verify compilation.

**Step 3:** Commit.

```bash
git add src/components/interactive/linear-algebra/MatrixMultPerspectives.tsx
git commit -m "feat: add MatrixMultPerspectives component with four views"
```

---

### Task 2.3: LeastSquaresVis — data fitting + residuals + projection

**Files:**
- Create: `src/components/interactive/linear-algebra/LeastSquaresVis.tsx`

**Behavior:**
- Scatter plot of ~8 data points (draggable)
- Best-fit line computed via normal equations: x̂ = (AᵀA)⁻¹Aᵀb
- Residual lines drawn from each point to the fit line (thin, semi-transparent)
- Toggle to show "column space projection" view: data vector b projected onto Col(A)
- Readout: slope, intercept, R², sum of squared residuals

**Key math:**
- Design matrix A = [[1,x₁],[1,x₂],...], response vector b = [y₁,y₂,...]
- x̂ = (AᵀA)⁻¹Aᵀb gives [intercept, slope]
- Residual r = b - Ax̂, orthogonal to Col(A)

**Component structure:** Follow DotProductVis pattern with draggable data points.

**Step 1:** Create `LeastSquaresVis.tsx`.

**Step 2:** Verify compilation.

**Step 3:** Commit.

```bash
git add src/components/interactive/linear-algebra/LeastSquaresVis.tsx
git commit -m "feat: add LeastSquaresVis component for regression visualization"
```

---

### Task 2.4: QRDecompositionVis — Gram-Schmidt → Q + R

**Files:**
- Create: `src/components/interactive/linear-algebra/QRDecompositionVis.tsx`

**Behavior:**
- Two column vectors v₁, v₂ (adjustable sliders)
- Step-through animation (3 steps):
  1. Original vectors
  2. Gram-Schmidt: u₁ = v₁/‖v₁‖, u₂ = (v₂ - proj) normalized → these are Q's columns
  3. Show R matrix: R = QᵀA (upper triangular), display entries
- Verification readout: QᵀQ = I (identity), QR = A (original)
- Builds on GramSchmidtVis pattern but adds matrix display

**Step 1:** Create `QRDecompositionVis.tsx`.

**Step 2:** Verify compilation.

**Step 3:** Commit.

```bash
git add src/components/interactive/linear-algebra/QRDecompositionVis.tsx
git commit -m "feat: add QRDecompositionVis component"
```

---

### Task 2.5: PCAViz — data cloud → principal components

**Files:**
- Create: `src/components/interactive/linear-algebra/PCAViz.tsx`

**Behavior:**
- Generate random 2D data cloud (~50 points) with adjustable correlation (slider)
- Show covariance ellipse (eigenvectors of covariance matrix as axes)
- Toggle: show/hide PC1, PC2 arrows (colored by eigenvalue magnitude)
- Toggle: "project onto PC1" — flatten all points onto first principal component
- Readout: eigenvalues, % variance explained, PC directions

**Key math:**
- Center data: X̄ = X - mean
- Covariance matrix: C = (1/(n-1)) X̄ᵀX̄
- Eigendecompose: C = VΛVᵀ
- Project: X_pca = X̄V

**Step 1:** Create `PCAViz.tsx`.

**Step 2:** Verify compilation.

**Step 3:** Commit.

```bash
git add src/components/interactive/linear-algebra/PCAViz.tsx
git commit -m "feat: add PCAViz component for principal component analysis"
```

---

### Task 2.6: QuadraticFormVis — contour plot + 3D paraboloid

**Files:**
- Create: `src/components/interactive/linear-algebra/QuadraticFormVis.tsx` (2D D3)
- Create: `src/components/interactive/linear-algebra/QuadraticForm3DCompanion.tsx` (R3F)

**2D behavior (D3):**
- Contour plot of f(x) = xᵀAx for 2×2 symmetric matrix A
- Draggable sliders for A entries
- Eigenvectors shown as arrows through origin
- Contour lines colored by value (positive blue, negative red)
- Toggle between ellipse (positive definite), saddle (indefinite), parabola (positive semi-definite)

**3D behavior (R3F):**
- 3D surface plot of z = xᵀAx
- Follows existing R3F companion pattern from `EigenDecomposition3DCompanion.tsx`

**Step 1:** Create `QuadraticFormVis.tsx` (D3).

**Step 2:** Create `QuadraticForm3DCompanion.tsx` (R3F).

**Step 3:** Verify compilation.

**Step 4:** Commit.

```bash
git add src/components/interactive/linear-algebra/QuadraticFormVis.tsx src/components/interactive/linear-algebra/QuadraticForm3DCompanion.tsx
git commit -m "feat: add QuadraticFormVis 2D+3D components"
```

---

## Phase 3: Write 5 New Lessons

Each lesson follows the MDX pattern from existing lessons:
- Frontmatter with all required + i18n fields
- Imports from `../../../components/`
- Sections: orienting prose → interactive → explanation → practice
- KeyInsight block, ExerciseBlock (4-5 exercises)

### Task 3.1: Norms and Distances (lessonOrder: 6)

**Files:**
- Create: `src/content/lessons/linear-algebra/06-norms-and-distances.mdx`

**Frontmatter:**
```yaml
title: 'Norms and Distances'
titleZh: '范数与距离'
description: 'How we measure length and distance — the many geometries hiding inside vector space.'
descriptionZh: '如何衡量长度和距离——向量空间中隐藏的多种几何。'
course: 'linear-algebra'
module: 'Vectors and Their Language'
moduleZh: '向量与它的语言'
moduleOrder: 1
lessonOrder: 6
duration: 16
difficulty: 'Beginner'
```

**Content outline (~180 lines):**
1. Orienting prose: "What does 'length' really mean?" — connect to lesson 05's L2 norm
2. NormBallVis interactive — toggle L1/L2/L∞
3. The L2 norm (Euclidean) — our default, comes from dot product
4. The L1 norm (Manhattan/taxicab) — sum of absolute values, sparse solutions
5. The L∞ norm (Chebyshev) — max coordinate, worst-case bound
6. Unit balls: why different norms give different shapes
7. Triangle inequality for all norms
8. Connections: "In ML, L1 regularization (lasso) prefers sparse vectors because the L1 ball has corners on axes"
9. KeyInsight: "A norm is any function that satisfies positivity, homogeneity, and triangle inequality. The choice of norm changes what 'close' means."
10. 4 exercises

**Step 1:** Create the MDX file with full content.

**Step 2:** Build check.

Run: `npx astro build`
Expected: Build succeeds, new page generated.

**Step 3:** Commit.

```bash
git add src/content/lessons/linear-algebra/06-norms-and-distances.mdx
git commit -m "feat: add lesson 06 Norms and Distances"
```

---

### Task 3.2: Matrix Multiplication Perspectives (lessonOrder: 17)

**Files:**
- Create: `src/content/lessons/linear-algebra/17-matrix-multiplication-perspectives.mdx`

**Frontmatter:**
```yaml
title: 'Matrix Multiplication: Four Perspectives'
titleZh: '矩阵乘法的四个视角'
description: 'The same product, seen four different ways — each one illuminates a different facet of what multiplication means.'
descriptionZh: '同一次乘法，四种不同的看法——每一种都照亮了乘法含义的不同侧面。'
course: 'linear-algebra'
module: 'Matrices as Space Transformations'
moduleZh: '矩阵即空间变换'
moduleOrder: 3
lessonOrder: 17
duration: 20
difficulty: 'Intermediate'
prerequisites:
  - title: 'Matrix Multiplication'
    slug: 'linear-algebra/15-matrix-multiplication'
```

**Content outline (~220 lines):**
1. Orienting prose: "You know matrix multiplication as composition. Now see it from four angles."
2. MatrixMultPerspectives interactive
3. Perspective 1: Row × Column (dot product) — the standard formula
4. Perspective 2: Column combination — each column of AB = A × (column of B). "The columns of the product are transformed versions of B's columns"
5. Perspective 3: Row combination — each row of AB = (row of A) × B
6. Perspective 4: Outer product sum — AB = Σ colᵢ(A) rowᵢ(B), sum of rank-1 matrices
7. Block matrix multiplication — when to use which perspective
8. Connections: "Perspective 2 is why Ax = linear combination of columns. Perspective 4 is the basis of SVD (A = Σ σᵢuᵢvᵢᵀ)."
9. KeyInsight + 4 exercises

**Step 1-3:** Same as Task 3.1.

---

### Task 3.3: Least Squares and Regression (lessonOrder: 23)

**Files:**
- Create: `src/content/lessons/linear-algebra/23-least-squares-and-regression.mdx`

**Frontmatter:**
```yaml
title: 'Least Squares and Regression'
titleZh: '最小二乘与回归'
description: 'When Ax=b has no solution, project b onto the column space — the best approximation you can reach.'
descriptionZh: '当 Ax=b 无解时，将 b 投影到列空间——你能到达的最佳逼近。'
course: 'linear-algebra'
module: 'Linear Systems and Invertibility'
moduleZh: '线性方程组与可逆性'
moduleOrder: 4
lessonOrder: 23
duration: 18
difficulty: 'Intermediate'
```

**Content outline (~200 lines):**
1. Orienting prose: "Real data never exactly satisfies a linear equation. Least squares finds the best *approximation*."
2. LeastSquaresVis interactive
3. The geometry: projection onto column space = closest reachable point
4. The algebra: normal equations AᵀAx̂ = Aᵀb
5. Why AᵀA? "Left-multiply by Aᵀ forces the residual to be orthogonal to Col(A)"
6. Residual analysis: residuals are perpendicular to the fit line
7. Connections: "This is why projection (lesson 10) matters. This is also the foundation of machine learning — every linear model is least squares."
8. KeyInsight + 5 exercises

---

### Task 3.4: QR Decomposition (lessonOrder: 28)

**Files:**
- Create: `src/content/lessons/linear-algebra/28-qr-decomposition.mdx`

**Frontmatter:**
```yaml
title: 'QR Decomposition'
titleZh: 'QR 分解'
description: 'Gram-Schmidt written as a matrix factorization — the numerically stable way to solve linear systems.'
descriptionZh: 'Gram-Schmidt 写成矩阵分解——数值稳定地求解线性方程组的方法。'
course: 'linear-algebra'
module: 'Orthogonality and Decomposition'
moduleZh: '正交与分解'
moduleOrder: 5
lessonOrder: 28
duration: 18
difficulty: 'Advanced'
```

**Content outline (~190 lines):**
1. Orienting prose: "Gram-Schmidt straightened a basis. Now capture that process as a matrix equation."
2. QRDecompositionVis interactive
3. The factorization: A = QR where Q has orthonormal columns, R is upper triangular
4. Why it works: each column of A = linear combination of Q's columns (the Gram-Schmidt coefficients go into R)
5. Solving Ax=b via QR: QRx = b → Rx = Qᵀb (no matrix inversion needed!)
6. Numerical stability: modified Gram-Schmidt, why QR is better than solving normal equations directly
7. Connections: "QR is how computers actually solve least squares (numpy.linalg.lstsq uses QR internally). It's also the first step in computing eigenvalues (QR algorithm)."
8. KeyInsight + 4 exercises

---

### Task 3.5: Principal Component Analysis (lessonOrder: 29)

**Files:**
- Create: `src/content/lessons/linear-algebra/29-principal-component-analysis.mdx`

**Frontmatter:**
```yaml
title: 'Principal Component Analysis'
titleZh: '主成分分析'
description: 'Find the natural axes of your data — the directions where variation is largest — using eigenvectors of the covariance matrix.'
descriptionZh: '用协方差矩阵的特征向量找出数据的自然坐标轴——变异最大的方向。'
course: 'linear-algebra'
module: 'Orthogonality and Decomposition'
moduleZh: '正交与分解'
moduleOrder: 5
lessonOrder: 29
duration: 20
difficulty: 'Advanced'
```

**Content outline (~200 lines):**
1. Orienting prose: "High-dimensional data has too many variables. PCA finds the few that matter most."
2. PCAViz interactive
3. The covariance matrix: how variables co-vary
4. The eigenvalue connection: eigenvectors of covariance = directions of maximum variance
5. The ellipse perspective (from Iris textbook): data cloud → covariance ellipse → PC arrows
6. Dimensionality reduction: project onto top k principal components
7. How much variance is captured: scree plot, % variance explained
8. Connections: "PCA = SVD of the centered data matrix. The right singular vectors are the principal components. This is where eigendecomposition (lesson 25) and SVD (lesson 27) finally meet real data."
9. KeyInsight + 4 exercises

---

## Phase 4: Deepen 10 Priority Lessons

Each lesson gets:
- **Multi-perspective paragraph** (geometry → algebra → computation) inserted before the interactive widget
- **Connections paragraph** (prev/next links) inserted after KeyInsight
- **Deep understanding paragraph** (misconceptions, counter-intuitive facts) inserted after connections
- **Exercises expanded** from 3 to 4-5 (add 1 calculation + 1 open-ended)
- **QuadraticFormVis** integration into lessons 25, 27 (eigenvectors, SVD)

### Task 4.1: Deepen lesson 01 — Vectors as Arrows

**File:** `src/content/lessons/linear-algebra/01-vectors-as-arrows.mdx`

**Additions:**
1. After "What an arrow knows" section — add paragraph on **why vectors are equivalence classes** (deeper explanation of free translation)
2. After "The zero vector" — add **unit vectors** paragraph: dividing by length extracts direction, u = v/‖v‖, why this matters for projection later
3. After KeyInsight — add **Connections** paragraph: "The length ‖v‖ you just met becomes the L2 norm in lesson 6, where we'll see there are other ways to measure length entirely."
4. Add exercise 4 (calculation): "Compute the unit vector in the direction of (3, 4). What is its length?"
5. Add exercise 5 (open): "Can two different vectors have the same unit vector? Why or why not?"

**Target:** 139 → ~220 lines

**Step 1:** Edit the file with all additions.
**Step 2:** Build check.
**Step 3:** Commit.

```bash
git add src/content/lessons/linear-algebra/01-vectors-as-arrows.mdx
git commit -m "feat: deepen lesson 01 Vectors as Arrows with norms preview, unit vectors, connections"
```

---

### Task 4.2: Deepen lesson 02 — Vector Addition

**File:** `src/content/lessons/linear-algebra/02-vector-addition.mdx`

**Additions:**
1. After "Special cases" — add **vector subtraction** paragraph: a - b = a + (-b), the arrow from b's tip to a's tip
2. Add **triangle inequality** deeper treatment with geometric proof intuition
3. After KeyInsight — add **Connections**: "Head-to-tail addition is exactly what happens when a matrix transforms a point: Ax = x₁c₁ + x₂c₂ is a weighted sum of walks."
4. Add exercise 4 (calculation): "Compute a + b and a - b for a = (2, -1) and b = (-3, 4). Draw both results."
5. Add exercise 5 (open): "If ‖a + b‖ = ‖a‖ + ‖b‖, what does that tell you about the directions of a and b?"

**Target:** 102 → ~190 lines

---

### Task 4.3: Deepen lesson 04 — The Dot Product

**File:** `src/content/lessons/linear-algebra/04-the-dot-product.mdx`

**Additions (this is one of the thinnest lessons at 84 lines — major expansion):**
1. After existing content — add **Multi-perspective** section: "Three ways to read the dot product: geometric (‖a‖‖b‖cosθ), algebraic (a₁b₁+a₂b₂), and as a projection (‖a‖ × component of b along a)"
2. Add **Cauchy-Schwarz inequality** paragraph: |a·b| ≤ ‖a‖‖b‖, equality iff parallel, geometric meaning
3. Add **orthogonality detection** paragraph: a·b = 0 ⟹ perpendicular, why this is the algebraic test for geometric perpendicularity
4. After KeyInsight — add **Connections**: "The dot product is the foundation for everything in module 5: projections (lesson 10), Gram-Schmidt (lesson 24), and PCA (lesson 29) are all built from dot products."
5. Expand exercises to 5

**Target:** 84 → ~200 lines

---

### Task 4.4: Deepen lesson 15 — The Determinant

**File:** `src/content/lessons/linear-algebra/14-the-determinant.mdx`

**Additions:**
1. After "The formula" — add **3×3 determinant** computation paragraph: cofactor expansion along first row, with worked example
2. Add **six properties of determinants** section:
   - det(I) = 1
   - Swapping two rows multiplies det by -1
   - Scaling a row by k multiplies det by k
   - Adding a multiple of one row to another leaves det unchanged
   - det(Aᵀ) = det(A)
   - det(AB) = det(A)·det(B) (already covered but grouped here)
3. Add **row operations and determinants** — why Gaussian elimination tracks determinant
4. Add QuadraticFormVis integration mention (determinant determines definiteness)
5. Expand exercises to 5

**Target:** 97 → ~200 lines

---

### Task 4.5: Deepen lesson 16 — Matrix Multiplication

**File:** `src/content/lessons/linear-algebra/15-matrix-multiplication.mdx`

**Additions (this lesson gets the most expansion since the Perspectives lesson is a sibling):**
1. After "How to compute it" — add **associativity** paragraph: (AB)C = A(BC), geometric proof: both mean "apply C, then B, then A"
2. Add **identity matrix** paragraph: AI = IA = A, the "do nothing" transformation
3. Add **preview of four perspectives** paragraph: "The next lesson will show you four ways to read the same product. For now, notice that column j of AB = A(column j of B) — this one fact will unlock everything."
4. After KeyInsight — add **Connections**: "Matrix multiplication is the engine of composition. Lesson 17 will show you four perspectives on this same operation, each revealing a different structure."
5. Expand exercises to 5

**Target:** 89 → ~220 lines

---

### Task 4.6: Deepen lesson 18 — Column Space and Null Space

**File:** `src/content/lessons/linear-algebra/18-column-space-and-null-space.mdx`

**Additions:**
1. After Rank-Nullity — add **four subspaces preview** paragraph: "Column space, null space, row space, left null space — together they form the 'anatomy' of a matrix. Lesson 22 will formalize this."
2. Add **worked example** paragraph: step-by-step computation of Col(A) and Null(A) for a specific 2×3 matrix
3. Add **connections to solvability**: "Ax=b solvable ⟺ b ∈ Col(A). Unique solution ⟺ Null(A) = {0}. The two subspaces partition the question of solvability."
4. Expand exercises to 5

**Target:** 104 → ~190 lines

---

### Task 4.7: Deepen lesson 21 — Orthogonal Bases and Gram-Schmidt

**File:** `src/content/lessons/linear-algebra/21-orthogonal-bases-gram-schmidt.mdx`

**Additions (currently the shortest lesson at 79 lines — major expansion):**
1. After existing content — add **why orthogonal bases simplify everything** paragraph:
   - Projection: proj_u(v) = (v·u)u (no matrix inversion needed)
   - Coordinates in orthogonal basis: cᵢ = v·uᵢ (just dot products)
   - Parseval's identity: ‖v‖² = Σ|cᵢ|² (energy conservation)
2. Add **QR decomposition preview**: "Gram-Schmidt is a matrix factorization in disguise. Lesson 28 will show you how to write it as A = QR."
3. Add **numerical stability note**: classical vs. modified Gram-Schmidt, why computers use Householder reflections instead
4. After KeyInsight — add **Connections**: "Gram-Schmidt connects projection (lesson 10) to factorization (lesson 28). It's also the algorithmic heart of QR, which underlies numerical linear algebra."
5. Expand exercises to 4

**Target:** 79 → ~200 lines

---

### Task 4.8: Deepen lesson 22 — Eigenvectors and Eigenvalues

**File:** `src/content/lessons/linear-algebra/22-eigenvectors-and-eigenvalues.mdx`

**Additions:**
1. After "Trace and determinant" — add **spectral decomposition** paragraph: A = λ₁v₁v₁ᵀ + λ₂v₂v₂ᵀ for symmetric matrices, "the matrix is a sum of projection operators onto its eigen-directions"
2. Add **complex eigenvalues** paragraph: rotation matrices have imaginary eigenvalues, geometric meaning (spiraling)
3. Add **Gram matrix** paragraph: G = AᵀA has real non-negative eigenvalues, connection to SVD (singular values = √eigenvalues of G)
4. Add QuadraticFormVis integration: "The quadratic form xᵀAx has contours aligned with eigenvectors"
5. Expand exercises to 5

**Target:** 133 → ~200 lines

---

### Task 4.9: Deepen lesson 24 — SVD

**File:** `src/content/lessons/linear-algebra/24-singular-value-decomposition.mdx`

**Additions:**
1. After "SVD vs. eigendecomposition" — add **four forms of SVD** paragraph:
   - Full SVD: U (m×m), Σ (m×n), Vᵀ (n×n)
   - Thin SVD: only r non-zero singular values
   - Truncated SVD: keep top k singular values (low-rank approximation)
   - Outer product form: A = Σᵢ σᵢuᵢvᵢᵀ
2. Add **Eckart-Young theorem**: best rank-k approximation is truncated SVD
3. Add **from Iris textbook**: ellipse perspective in detail — unit sphere → ellipsoid with semi-axes = singular values
4. After KeyInsight — add **Connections**: "SVD is the grand finale of decomposition: it uses everything — orthonormal bases (lesson 24), eigenvectors (lesson 25), and projection (lesson 10). PCA (lesson 29) is SVD applied to data."
5. Expand exercises to 5

**Target:** 121 → ~200 lines

---

### Task 4.10: Deepen lesson 30 — Applications and Connections

**File:** `src/content/lessons/linear-algebra/30-where-linear-algebra-lives.mdx`

**Additions:**
1. After PCA section — expand with **least squares regression** detail (reference new lesson 23): "Fitting a line to data is solving AᵀAx = Aᵀb — the normal equations you learned in lesson 23"
2. Add **SVD image compression** numerical example: "A 1000×1000 grayscale image is a matrix. Its SVD has 1000 singular values. Keeping the top 50 captures 90%+ of the visual information — a 20× compression"
3. Add **PageRank** detailed explanation: web graph → stochastic matrix → eigenvector with eigenvalue 1 = steady-state distribution
4. After KeyInsight — add **meta-connections**: table mapping each module to its real-world application
5. Expand exercises to 5

**Target:** 117 → ~200 lines

---

## Phase 5: Standard Deepening for Remaining 20 Lessons

Each lesson gets the same template additions but with less expansion (target: 150-180 lines).

### Task 5: Deepen lessons 03, 05, 06-13, 17, 19-20, 23, 25-29

For each of the 20 remaining lessons:

1. Add **multi-perspective paragraph** (2-3 sentences after the main explanation)
2. Add **connections paragraph** (2-3 sentences after KeyInsight)
3. Add **1 additional exercise** (calculation or open-ended)
4. Minor prose enhancements where needed

**Files to modify (20 files):**
- `03-scalar-multiplication.mdx` — add: negative scalars and direction flip, norm scaling ‖cv‖ = |c|·‖v‖, connections to eigenvectors
- `05-length-angles-orthogonality.mdx` — add: why cos θ = (a·b)/(‖a‖‖b‖) is the right definition, connection to lesson 6 norms
- `07-span-and-linear-independence.mdx` — add: geometric vs algebraic independence, connection to null space (lesson 21)
- `08-basis-and-dimension.mdx` — add: why dimension is well-defined, connection to rank (lesson 20)
- `09-projections.mdx` — add: projection as best approximation, connection to least squares (lesson 23)
- `10-basis-change.mdx` — add: change of basis matrix, connection to diagonalization (lesson 26)
- `11-matrices-as-transformations.mdx` — add: linearity properties deeper, affine vs linear, connection to composition (lesson 16)
- `12-matrices-encode-transformations.mdx` — add: column vectors as images of basis, reading a matrix at a glance
- `13-matrix-vector-product.mdx` — add: Ax as linear combination of columns, connection to column space (lesson 20)
- `17-inverse-matrices.mdx` — add: Gauss-Jordan method, why det=0 means no inverse (geometric review)
- `19-null-space.mdx` — add: finding null space by row reduction, connection to linear independence
- `20-subspaces.mdx` — add: four fundamental subspaces theorem, Strang's framework, connection to SVD
- `23-diagonalization.mdx` — add: why diagonal form is simplest, application to computing Aⁿ, connection to differential equations
- `25-3d-transformations.mdx` — add: 3D rotation matrices, Euler angles, connection to graphics pipeline
- `26-cross-product.mdx` — add: connection to determinant, triple product = volume, right-hand rule deeper
- `27-non-square-matrices.mdx` — add: dimension-changing maps, connection to rank and SVD
- `28-functions-as-vectors.mdx` — add: polynomial vector space example, why functions are vectors, connection to Fourier
- `29-inner-product-spaces.mdx` — add: L² inner product, orthogonality of functions, connection to Fourier series

**Step:** Edit each file. After every 5 lessons, build-check and commit.

**Commits:**
```bash
git commit -m "feat: deepen lessons 03-05, 07-08 with multi-perspective and connections"
git commit -m "feat: deepen lessons 09-13 with multi-perspective and connections"
git commit -m "feat: deepen lessons 17, 19-20, 23 with multi-perspective and connections"
git commit -m "feat: deepen lessons 25-29 with multi-perspective and connections"
```

---

## Phase 6: Update Metadata

### Task 6.1: Update ROADMAP.md

**File:** `src/ROADMAP.md`

**Changes:**
- Update linear algebra section to reflect 35 lessons (was 30)
- Add 5 new lessons to curriculum outline
- Note component count: 24 (was 18) — 17 existing 2D + 6 new 2D + 1 new 2D+3D pair

### Task 6.2: Update CHANGELOG.md

**File:** `CHANGELOG.md`

**Changes:**
- Add new version entry documenting the depth optimization
- List: 5 new lessons, 6 new components, 30 deepened lessons
- Reference Iris textbook

### Task 6.3: Final build verification

Run: `npx astro build`
Expected: All 70+ pages build successfully (35 EN + 35 ZH).

```bash
git add ROADMAP.md CHANGELOG.md
git commit -m "docs: update ROADMAP and CHANGELOG for LA depth optimization"
```

---

## Summary

| Phase | Tasks | Est. Time |
|-------|-------|-----------|
| 1. Renumber lessons | 1 task (30 files) | 30 min |
| 2. New components | 6 tasks | 6-8 hours |
| 3. New lessons | 5 tasks | 5-6 hours |
| 4. Priority deepening | 10 tasks | 5-6 hours |
| 5. Standard deepening | 4 batches (20 files) | 4-5 hours |
| 6. Metadata | 3 tasks | 30 min |
| **Total** | **29 tasks** | **~22-26 hours** |

**Recommended execution order:** Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

Each phase should end with a build check. Each task should end with a commit.
