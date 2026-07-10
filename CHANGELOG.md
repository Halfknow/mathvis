# Changelog

All notable changes to MathViz will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [0.4.0] — 2026-07-10

### Added — Calculus & Probability Depth Optimization (56 lessons deepened)

Comprehensive deepening of the entire calculus (29 lessons) and probability (27 lessons) curricula, aligning content depth with authoritative textbooks:

- **Calculus**: Stewart (standard) + Spivak/Apostol (rigorous theorems) + 3Blue1Brown (intuition) + modern applications (gradient descent, backpropagation, Fourier analysis)
- **Probability**: Chan "Intro to Probability for Data Science" + Casella-Berger (mathematical statistics) + Pishro-Nik (stochastic processes) + modern applications (cross-entropy loss, MCMC, diffusion models)

All 56 lessons now follow the gold-standard template established by the linear algebra course (v0.3.1).

**Structural upgrades (applied to all 56 lessons):**

- `<FormulaReadout>` component — 2-4 key formula summary cards per lesson (Chinese labels)
- `## Connections` section — explicit backward/forward lesson linkage + cross-disciplinary applications
- Formal `## Theorem: NAME` blocks — hypotheses, conclusion, and intuition for 46 lessons
- `<ExerciseBlock>` expanded from 3 → 6-7 exercises — escalating difficulty: concept → compute → application → proof/explain
- `**Up next:**` navigation links restored across all lessons

**Major content additions — Calculus:**

- IVT (Intermediate Value Theorem), Squeeze Theorem, formal epsilon-delta proofs (lesson 02)
- Differentiability ⟹ continuity theorem, gradient descent as best linear approximation (lesson 01)
- Implicit differentiation, backpropagation = chain rule, multivariable chain rule preview (lessons 03-04)
- First/Second Derivative Tests, Extreme Value Theorem (lessons 05-06)
- L'Hôpital formal conditions, sin(x)/x circular reasoning resolved (lesson 08)
- Darboux integrals, improper integrals (Type I & II), p-test (lessons 10-11)
- FTC Part 1 & 2 as formal named theorems + MVT-based proof sketch (lesson 12)
- LIATE heuristic, cyclic integration by parts (lesson 15)
- Absolute vs conditional convergence, Alternating Series Test + Leibniz error bound (lesson 23)
- Taylor's Theorem with Lagrange remainder + worked error-bound example (lesson 25)
- Picard-Lindelöf existence/uniqueness theorem, stability analysis (lesson 27)
- Partial derivatives, gradient, directional derivatives, steepest ascent (lesson 28)

**Major content additions — Probability:**

- Measure-theoretic intuition (σ-algebra), Kolmogorov axioms formalized (lesson 01)
- Inclusion-exclusion principle, Pascal's identity, birthday problem (lesson 02)
- Law of Total Probability as formal theorem, prosecutor's fallacy (lesson 03)
- Naive Bayes classifier, odds form of Bayes, Beta-Binomial conjugate preview (lesson 04)
- Jensen's Inequality (convexity/concavity) — previously absent (lesson 06)
- Memoryless property of exponential, Poisson-as-limit-of-Binomial (lessons 07-08)
- Gaussian mixture models, covariance matrix geometry (lesson 10)
- Correlation = cosine similarity (linear algebra connection), Cauchy-Schwarz bound (lesson 12)
- Uncorrelated ≠ independent counterexample (lesson 13)
- Chernoff/Hoeffding bounds — exponential-strength concentration (lesson 14)
- Moment generating functions (MGFs) as CLT proof tool, Berry-Esseen bound (lesson 16)
- Method of moments, bias-variance decomposition (lesson 17)
- Fisher information, Cramér-Rao lower bound, cross-entropy = MLE (lesson 18)
- t-distribution for small samples (lesson 19)
- Multiple testing problem, Bonferroni correction (lesson 20)
- Exponential family, MCMC (Metropolis-Hastings), variational inference/ELBO (lesson 23)
- Detailed balance/reversibility, ergodic theorem, HMMs, PageRank (lesson 25)
- Information theory: entropy, KL divergence, mutual information (lesson 27)

**Build verification:** `bun run build` passes with 199 pages, 20,714 indexed words (up from 14,680).

---

## [0.3.1] — 2026-05-29

### Added — Linear Algebra Depth Optimization (30 → 35 lessons, 18 → 23 components)

Comprehensive deepening of the entire linear algebra curriculum, referencing the Iris Math (鸢尾花数学) open-source textbook series. All 35 lessons now include cross-topic Connections paragraphs and enriched exercises.

**New Lessons (5):**

- `06-norms-and-distances` — L1/L2/L∞ norms, unit balls, triangle inequality, norm equivalence
- `17-matrix-multiplication-perspectives` — four animated views: row×column, column combo, row combo, outer product sum
- `23-least-squares-and-regression` — normal equations, projection interpretation, residuals, R²
- `28-qr-decomposition` — Gram-Schmidt in matrix form, back-substitution, numerical stability
- `29-principal-component-analysis` — covariance matrix eigenvalues, ellipse perspective, PCA=SVD connection

**New Interactive Components (5):**

- `NormBallVis` (D3) — L1/L2/L∞ unit ball comparison with toggle and draggable point
- `MatrixMultPerspectives` (D3) — four animated views with selector slider and matrix display
- `LeastSquaresVis` (D3) — data points, best-fit line, residuals, normal equations, R² readout
- `QRDecompositionVis` (D3) — 3-step walkthrough (Original→Gram-Schmidt→QR), Q^TQ verification
- `PCAViz` (D3) — 2D data cloud with covariance ellipse, PC arrows, adjustable correlation

**Deepened Lessons (10 priority + 20 standard):**

Priority deepening (major content expansion):
- 01 (Vectors): unit vectors, L2 norm preview, ML connections
- 02 (Addition): vector subtraction, matrix-vector product preview
- 04 (Dot Product): three perspectives, Cauchy-Schwarz, orthogonality test, attention/PCA connections
- 14 (Determinant): 3×3 cofactor expansion, six determinant properties
- 15 (Matrix Mult): identity matrix, associativity, four perspectives preview
- 16 (Linear Systems): column space and least squares connections
- 21 (Gram-Schmidt): orthogonal basis simplification, QR preview, numerical stability
- 22 (Eigenvectors): spectral decomposition, complex eigenvalues, Gram matrix
- 24 (SVD): four SVD forms, Eckart-Young theorem, ellipse perspective
- 30 (Applications): SVD image compression, PageRank, grand connection table

Standard deepening (all remaining 20 lessons):
- Each lesson received a **Connections** paragraph linking to related topics across the curriculum
- Each lesson received **1 additional exercise** reinforcing cross-topic understanding

### Changed

- All lesson `lessonOrder` values renumbered to accommodate 5 new lessons
- Module structure updated: Module 1 now 6 lessons, Module 3 now 7 lessons, etc.
- ROADMAP.md updated with 35-lesson curriculum and 23-component inventory
- CLAUDE.md updated with current state

---

## [0.3.0] — 2026-05-06

### Added — Linear Algebra Curriculum Redesign (15 → 30 lessons, 6 → 18 components)

The linear algebra course was completely redesigned from 15 to 30 lessons across 8 modules, synthesizing four major teaching approaches: 3Blue1Brown (space transformation metaphor), Iris Math (multiple perspectives), Strang (four fundamental subspaces), and Axler (determinant-delayed, abstract spaces).

**New Lessons (15 new MDX files):**

- `05-length-angles-orthogonality` — length/angle/orthogonality from dot product
- `09-projections` — vector projection formula and decomposition
- `10-basis-change` — change-of-basis matrix P and P⁻¹
- `12-matrices-encode-transformations` — reading matrix columns as destinations
- `13-matrix-vector-product` — Ax as linear combination of columns
- `16-linear-systems-as-geometry` — row picture vs column picture
- `19-null-space` — null space as transformation blind spot
- `21-orthogonal-bases-gram-schmidt` — Gram-Schmidt orthogonalization
- `23-diagonalization` — A=PDP⁻¹ in eigenbasis
- `24-singular-value-decomposition` — A=UΣVᵀ decomposition
- `25-3d-transformations` — 3D matrix transformations (R3F)
- `26-cross-product` — 3D cross product with parallelogram (R3F)
- `27-non-square-matrices` — dimension-changing matrices (R3F)
- `28-functions-as-vectors` — polynomials and functions as vector spaces
- `29-inner-product-spaces` — generalized inner products and orthogonality

**New Interactive Components (12 new):**

- `ProjectionVis` (D3) — vector projection with perpendicular drop line
- `BasisChangeVis` (D3) — dual basis grid with coordinate comparison
- `LinearSystemVis` (D3) — row/column view toggle for linear systems
- `NullSpaceVis` (D3) — null space direction visualization
- `GramSchmidtVis` (D3) — step-by-step orthogonalization
- `DiagonalizationVis` (D3) — eigenbasis grid transformation
- `SVDExplorer` (D3) — unit circle to ellipse via SVD
- `FunctionSpaceVis` (D3) — polynomial add/scale/basis operations
- `InnerProductVis` (D3) — function inner product with integral shading
- `MatrixTransform3D` (R3F) — 3D grid cube transformation with sliders
- `CrossProductVis` (R3F) — 3D cross product with parallelogram
- `NonSquareVis` (R3F) — 3D↔2D projection/embedding toggle

### Changed

- Restructured linear algebra from 15 to 30 lessons across 8 modules
- Lesson 04: removed cross product content (now in lesson 26), rewritten as pure dot product
- Lesson numbering completely revised (old 04-15 → new positions)
- `00-notation.mdx`: expanded with orthogonality, SVD, basis change, abstract spaces sections
- All existing lessons renumbered and re-categorized into new module structure
- Module names unified: "Vectors and Their Language", "Span, Basis, and Coordinate Systems", etc.
- Build output increased from ~59 pages to 89 pages (EN + ZH)
- `DESIGN_SYSTEM.md` updated with interactive component inventory
- `ROADMAP.md` updated with complete curriculum overview and next milestones
- `CLAUDE.md` updated with current architecture state

### Technical

- **First usage of React Three Fiber** in the project (lessons 25-27)
- R3F + Drei (v9.6/v10.7) + Three.js (v0.169) for 3D visualizations
- All R3F components use `client:visible` for lazy loading
- Fixed MDX parsing issue: `{...}` in prose text triggers JSX parser, replaced with parentheses
- Fixed `|` in markdown tables conflicting with LaTeX `\|`, using `\lVert`/`\rVert`
- All 89 pages build with 0 errors, Pagefind indexes 4820 words

---

## [0.2.0] — 2026-05-01

### Added

- **i18n 多语言系统** — 完整的中英文切换功能
  - `src/i18n/ui.ts` — 70+ 中英文翻译键值
  - `src/i18n/utils.ts` — `getLangFromUrl()`, `t()`, `getLocalizedPath()`, `getAlternateLocaleUrl()`
  - Astro i18n 路由配置：英文无前缀 `/`，中文 `/zh/`
  - Header 右上角地球图标语言切换按钮
  - `hreflang` alternate 标签（SEO）
- **中文镜像页面** — 完整的 `/zh/` 页面树
  - `/zh/` 中文首页
  - `/zh/courses/[course]/` 中文课程列表页
  - `/zh/courses/[course]/[...slug]` 中文课程详情页
  - `/zh/search` 中文搜索页
- **内容 Schema 国际化** — frontmatter 新增 `titleZh`, `descriptionZh`, `moduleZh`
- **微积分课程** — 3 课新内容
  - `01-what-is-a-derivative.mdx` — 什么是导数？
  - `02-limits-and-continuity.mdx` — 极限与连续性
  - `03-differentiation-rules.mdx` — 求导法则
- **概率论课程** — 3 课新内容
  - `01-what-is-probability.mdx` — 什么是概率？
  - `02-random-variables.mdx` — 随机变量
  - `03-normal-distribution.mdx` — 正态分布
- **Pagefind 中英文搜索** — 自动检测 en + zh-cn 双语索引
- **Tailwind CSS v4 修复** — 安装 `@tailwindcss/vite` 插件，修复样式不加载的问题

### Changed

- `astro.config.mjs` — 添加 i18n 配置 + `@tailwindcss/vite` 插件
- `BaseLayout.astro` — 接受 `lang` prop，支持 `hreflang`，动态 `html lang`
- `Header.astro` — 完全重写，支持 i18n 翻译和语言切换按钮
- `Footer.astro` — 支持 i18n 翻译
- `global.css` — Tailwind v4 `@import "tailwindcss"` 替代 v3 `@tailwind` 指令
- 课程 slug 路径修复 — 去掉 `lesson.slug` 中重复的课程目录前缀

### Fixed

- Tailwind CSS v4 样式不加载 — 缺少 `@tailwindcss/vite` 插件
- 课程详情页 URL 重复路径 — `/courses/calculus/calculus/01-xxx` → `/courses/calculus/01-xxx`

---

## [0.1.0] — 2026-04-30

### Added

- **Astro 5 项目脚手架** — Astro 5 + React 19 + Tailwind CSS 4 + KaTeX + MDX
- **设计系统** — `src/styles/tokens.css` 完整设计令牌（light/dark 双主题）
- **自托管字体** — Source Serif 4, Inter, JetBrains Mono (woff2)，`@font-face` 声明
- **UI 组件库**
  - Button（primary/secondary/ghost, sm/md/lg）
  - Card, Badge, Tabs, ProgressBar
- **布局组件**
  - BaseLayout — 页面基础框架，避免 FOUC 的主题脚本
  - Header — 响应式导航，移动端汉堡菜单，搜索按钮，主题切换
  - Footer
- **学习组件**
  - CourseCard — 课程卡片（进度、难度、时长）
  - KeyInsight — 关键洞察高亮框
  - ExerciseBlock — 练习题（可折叠提示/答案）
  - PrerequisiteList, LessonProgress, ConceptCard
- **交互式 SVG 组件**
  - VectorCanvas — 2D 向量拖拽（坐标系 + 箭头 + magnitude 显示）
  - DerivativeSlope — 切线动态可视化（4 种函数，拖动切点）
  - NormalDistribution — 正态分布（μ/σ 滑块，采样模拟，直方图叠加）
- **动画组件**
  - ManimVideo — 视频播放器（WebM + MP4 fallback）
  - InteractiveCanvas — 全屏 API + 移动端降级 + `useReducedMotion`
- **KaTeX 数学排版**
  - 服务端：remark-math + rehype-katex
  - 客户端：MathBlock/MathInline React 组件（解决 MDX + LaTeX `{}` 冲突）
- **自定义 Hooks** — `useReducedMotion()`, `useMobileDetect()`
- **动态路由** — `[course]/index.astro` + `[course]/[...slug].astro`
  - 从 MDX frontmatter 自动生成课程/模块/课堂页面
  - 侧边栏导航（桌面端 sticky）
  - 移动端底栏导航（← 1/5 →）
  - 上一课/下一课链接
- **Pagefind 搜索** — `src/pages/search.astro`
  - 动态 script 加载（避免 Vite build 错误）
  - 自定义搜索 UI
- **Manim 渲染管线**
  - `animations/shared/mathviz_theme.py` — 品牌主题基类
  - `animations/manifest.json` — 动画元数据注册表
  - `animations/linear-algebra/01_vectors_intro.py` — 首支 Manim 脚本
  - `animations/render.py` — 本地批量/单个渲染脚本
- **自托管部署** — `deploy.sh`（Nginx / Caddy / `npx serve` 三种方案）
- **课程内容** — 线性代数第 1 课 `01-vectors-as-arrows.mdx`

### Dependencies

- @astrojs/mdx ^4.0.0
- @astrojs/react ^4.0.0
- @astrojs/sitemap ^3.2.0
- @react-three/fiber ^9.6.0
- @react-three/drei ^10.7.0
- @tailwindcss/vite (latest)
- react 19
- tailwindcss ^4.0.0
- katex (KaTeX CSS + remark-math + rehype-katex)
- three
- pagefind (devDependency)
