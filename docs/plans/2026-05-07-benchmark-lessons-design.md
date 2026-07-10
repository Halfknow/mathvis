# Benchmark Lessons Deep Optimization Design

## Scope
6 lessons: 01, 02, 11, 22, 24, 26

## Strategy
- Mixed animation style: narrative presets for key concepts, snapshot presets for exploration
- Content depth: add worked examples, edge cases, formal intuition, master-level insights
- Formula-animation linkage: FormulaReadout upgrades with dynamic values
- Progressive: validate on 6 benchmarks before expanding to all 30

## Per-Lesson Plan

### Lesson 01 — Vectors as Arrows
- VectorCanvas: add presets (zero vector, unit vector, opposite, horizontal, vertical, diagonal)
- Content: free vs position vectors, zero vector special case, equivalence class intuition
- FormulaReadout: length formula with dynamic value

### Lesson 02 — Vector Addition
- VectorAddition: add narrative presets (head-to-tail, parallelogram, cancel, orthogonal, collinear)
- Content: parallelogram law physics intuition, commutativity visualization, coordinate-free argument
- FormulaReadout: component sum with dynamic values

### Lesson 11 — Matrix Transformations
- MatrixTransform2D: upgrade existing presets to animated, add det=0 and rotation 45 presets
- MatrixTransform3DCompanion: add inline preset buttons
- Content: two guarantees of linearity proof intuition, determinant sign meaning, irreversible = dimension collapse

### Lesson 22 — Eigenvalues & Eigenvectors
- EigenvectorVis: upgrade to narrative presets (shear single eigendirection, rotation no real eigenvalues, symmetric orthogonal eigendirections)
- EigenDecomposition3DCompanion: add sphere-to-ellipsoid animation with principal axes
- Content: trace = sum of eigenvalues intuition, algebraic vs geometric multiplicity, "eigen = backbone of transform"

### Lesson 24 — SVD
- SVDExplorer: add presets (circle-to-ellipse, rank-deficient, rotation+scale)
- EigenDecomposition3DCompanion mode=svd: add 3-stage decomposition animation
- Content: SVD vs EVD distinction, sigma ratio = condition number, "SVD = skeleton of linear algebra"

### Lesson 26 — Cross Product
- CrossProductVis: add presets (perpendicular, parallel, orthogonal, right-hand rule)
- Content: cross product = directed area's normal vector, why only 3D and 7D, determinant connection

## Implementation Order
1. Infrastructure: FormulaReadout dynamic values + animation preset utility
2. Lesson 01 (simplest, validate flow)
3. Lesson 02 (addition animation)
4. Lesson 11 (upgrade existing presets)
5. Lesson 22 (advanced concept)
6. Lesson 24 (SVD)
7. Lesson 26 (pure 3D)
