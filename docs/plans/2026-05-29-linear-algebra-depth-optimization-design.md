# Linear Algebra Depth Optimization Design

**Date:** 2026-05-29
**Status:** Approved
**Approach:** Progressive Deepening (Plan A)
**Reference Textbook:** 《线性代数不难》(Visualize-ML, 66 topics, 2k stars)

## Context

MathViz has 30 linear algebra lessons (00-30) across 8 modules, averaging ~100 lines/lesson.
While the geometric intuition narrative is strong, depth is shallow compared to the Iris textbook's
66-topic treatment. Key gaps: no QR decomposition, no regression/least squares, no PCA as standalone
topic, no norms/distances unit, matrix multiplication only gets 1 lesson (Iris gives 5).

## Strategy

Keep the existing 30-lesson structure + insert 5 new lessons. Deepen every existing lesson from
~100 lines to 180-250 lines. Add 6 new visualization components.

## Part 1: Existing Lesson Deepening Template

Every lesson gets these new sections:

1. **Multi-perspective paragraph** — geometry → algebra → computational intuition
2. **Connections paragraph** — how this concept grows from the previous lesson, what it enables next
3. **Deep understanding paragraph** — common misconceptions, counter-intuitive facts
4. **Exercises expanded** — from 3 to 4-5 (add 1 calculation + 1 open-ended)

### Priority Lessons for Major Expansion

| Lesson | Current Lines | Target | Key Additions |
|--------|--------------|--------|---------------|
| 01 Vectors as Arrows | 139 | 220 | Norms (L1/L2/Linf), unit vectors, why free translation |
| 02 Vector Addition | 102 | 190 | Triangle inequality proof intuition, subtraction as addition |
| 04 Dot Product | 84 | 200 | Cauchy-Schwarz, algebraic vs geometric equivalence, projection link |
| 14 Determinant | 97 | 200 | 3x3 computation, six properties, row operations effect |
| 15 Matrix Multiplication | 89 | 220 | Four perspectives (row-col, column combo, row combo, outer product sum), associativity geometry |
| 18 Column Space & Null Space | 104 | 190 | Rank-nullity deeper examples, four subspaces preview |
| 21 Gram-Schmidt | 79 | 200 | QR decomposition as matrix form, numerical stability, why orthogonal simplifies |
| 22 Eigenvectors | 133 | 200 | Spectral decomposition, complex eigenvalues, Gram matrix connection |
| 24 SVD | 121 | 200 | Four SVD forms, Eckart-Young theorem, truncated SVD, ellipse perspective |
| 30 Applications | 117 | 200 | Least squares detail, SVD image compression example, PageRank |

### Standard Deepening (all other lessons)

Target: 150-180 lines each with multi-perspective + connections + 4 exercises.

## Part 2: Five New Lessons

### 2.1 Norms and Distances (insert after lesson 05, module 1)

- **Slug:** `06-norms-and-distances` (renumber subsequent lessons)
- **Difficulty:** Beginner, 16min
- **Content:** L2 norm (Euclidean distance), L1 norm (Manhattan), L∞ norm (Chebyshev), unit ball shapes,
  triangle inequality, distance metrics, why L2 is "default"
- **Component:** `NormBallVis` (D3) — toggle between L1/L2/L∞ unit ball shapes
- **Module:** Vectors and Their Language

### 2.2 Matrix Multiplication: Four Perspectives (insert in module 3)

- **Slug:** `16-matrix-multiplication-perspectives` (after current lesson 15)
- **Difficulty:** Intermediate, 20min
- **Content:** Row-column dot product, column combination, row combination, outer product sum,
  block matrix multiplication, when each perspective is useful
- **Component:** `MatrixMultPerspectives` (D3) — animated view switching for same multiplication
- **Module:** Matrices as Space Transformations

### 2.3 Least Squares and Regression (insert after module 4)

- **Slug:** `21-least-squares-and-regression`
- **Difficulty:** Intermediate, 18min
- **Content:** Projection = best approximation, normal equations AᵀAx = Aᵀb, residual orthogonality,
  data fitting, polynomial regression preview
- **Component:** `LeastSquaresVis` (D3) — data points + fit line + residual vectors + column space projection
- **Module:** Linear Systems and Invertibility

### 2.4 QR Decomposition (insert in module 5)

- **Slug:** `25-qr-decomposition`
- **Difficulty:** Advanced, 18min
- **Content:** Gram-Schmidt → Q (orthonormal columns) + R (upper triangular), solving Ax=b via QR,
  numerical stability vs LU, modified Gram-Schmidt
- **Component:** `QRDecompositionVis` (D3) — GS steps → Q matrix + R matrix visualization
- **Module:** Orthogonality and Decomposition

### 2.5 Principal Component Analysis (insert at end of module 5)

- **Slug:** `26-principal-component-analysis`
- **Difficulty:** Advanced, 20min
- **Content:** Covariance matrix, eigenvalues = variance captured, dimensionality reduction,
  ellipse perspective (from Iris textbook), data whitening, scree plot
- **Component:** `PCAViz` (D3) — 2D data cloud → covariance ellipse → PC arrows → dimension reduction
- **Module:** Orthogonality and Decomposition

## Part 3: Six New Visualization Components

| Component | Tech | Purpose | Lessons |
|-----------|------|---------|---------|
| `NormBallVis` | D3.js | L1/L2/L∞ unit ball comparison, interactive toggle | 2.1 |
| `MatrixMultPerspectives` | D3.js | Four animated views of one matrix multiplication | 2.2 |
| `LeastSquaresVis` | D3.js | Data points + fit line + residuals + column space projection | 2.3 |
| `QRDecompositionVis` | D3.js | GS steps → Q (orthonormal) + R (upper triangular) | 2.4 |
| `PCAViz` | D3.js | Data cloud → covariance ellipse → PC arrows → reduce | 2.5 |
| `QuadraticFormVis` | D3 + R3F | Quadratic form contour plot (2D) + paraboloid (3D) | 22, 24 |

All D3 components follow the existing pattern: `useEffect` + `useRef`, import only needed D3 modules.
All use `client:visible` for lazy loading. All follow existing token-based styling.

## Part 4: Lesson Order Renumbering

After inserting 5 new lessons, all lessonOrder values shift. New ordering:

- Module 1 (Vectors and Their Language): 01-06 (was 01-05, add 06 Norms)
- Module 2 (Span, Basis, Coordinates): 07-11 (was 06-10)
- Module 3 (Matrices as Transformations): 12-17 (was 11-15, add 17 Four Perspectives)
- Module 4 (Linear Systems): 18-23 (was 16-20, add 23 Least Squares)
- Module 5 (Orthogonality and Decomposition): 24-29 (was 21-24, add 28 QR, 29 PCA)
- Module 6 (Beyond 2D): 30-32 (was 25-27)
- Module 7 (Abstract Spaces): 33-34 (was 28-29)
- Module 8 (Coda): 35 (was 30)

Total: 35 lessons (30 existing + 5 new)

## Part 5: i18n

- All new lessons: titleZh, descriptionZh, moduleZh in frontmatter
- No changes to src/i18n/ui.ts (course-level metadata unchanged)
- Update ROADMAP.md and CHANGELOG.md

## Part 6: What We're NOT Doing

- Not adding new modules (keeping 8)
- Not changing existing file names
- Not introducing new UI libraries
- Not adding graph theory / Laplacian (out of scope for "deepening")
- Not adding Python/Jupyter (MathViz is browser-native; describe computation intuitively in prose)

## Reference

- Iris textbook: https://github.com/Visualize-ML/Linear-Algebra-Made-Easy---Learn-with-Python-and-Visualization
- 66 topics across 15 chapters, organized by: Vectors → Matrices → Matrix Mult Perspectives → Determinants → Inverse → Vector Spaces → Linear Systems → Geometric Transformations → Orthogonality → Regression → EVD → PCA → Quadratic Forms → SVD → Graphs
