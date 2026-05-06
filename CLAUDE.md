# CLAUDE.md

> Persistent context for Claude (Design / Code) when working on this repo.

## What this is

**MathViz** — 一个为重建数学空间直觉而造的交互式学习工具。不是产品，是一个人的学习旅程，恰好开源给了所有人。

技术栈：Astro 5 + MDX + React 19 + KaTeX + Tailwind CSS 4。
动画技术：**D3.js** 做 2D 数学动画，**React Three Fiber** 做 3D 可视化。
支持中英文（`/` English, `/zh/` 中文）。

## 核心理念

**先看见，再形式化。** 每课的目标是建立一个空间直觉——让学习者能"看见"符号背后的几何含义。如果一课的内容没有帮助建立直觉，那就是失败的内容。

## Interactive visualization technology

MathViz uses two core libraries for interactive math visualizations. Choose based on the dimensionality:

### D3.js — 2D mathematical animations

The de facto standard for 2D math visualization in the browser. Used by Seeing Theory (Brown University), 3Blue1Brown's interactive exercises, and Observable.

**When to use D3:**
- Function curves, tangent lines, derivatives
- Probability distributions, sampling animations, histograms
- Riemann sums, integral area visualization
- Slope fields, vector fields
- Any 2D geometric construction

**How to integrate with React:** Use `useEffect` + `useRef` pattern — D3 manages the SVG/Canvas, React manages state. Import only needed D3 modules (`d3-scale`, `d3-axis`, `d3-selection`, etc.), never the full `d3` bundle.

**References:** `src/components/interactive/calculus/DerivativeSlope.tsx` (current SVG implementation can be upgraded to D3), `src/components/interactive/probability/NormalDistribution.tsx`

### React Three Fiber + Drei — 3D mathematical visualization

The standard for 3D math in the browser. Used by math3d.org and various linear algebra visualization projects.

**When to use R3F:**
- Vector spaces, span visualization in 3D
- Matrix transformations of 3D objects
- Eigenvector / eigenvalue exploration
- Surface plots, parametric surfaces
- Any concept requiring depth perception

**Loading strategy:** Always use `client:visible` so Three.js (~200KB gzipped) only loads when the component enters the viewport. On mobile, consider falling back to a 2D D3 visualization or static image.

### SVG + React — lightweight 2D (current approach)

For simpler interactions (dragging vectors, basic plots), pure SVG + React pointer events is sufficient and lighter than D3. The current VectorCanvas uses this approach. Gradually upgrade to D3 when the animation complexity warrants it.

### Decision guide

```
Is it 3D? → React Three Fiber
Is it complex 2D animation? → D3.js + React
Is it simple 2D interaction? → SVG + React (keep it simple)
Is it a narrative video? → Manim (optional, for special cases only)
```

## When generating designs or new pages

1. **Read `DESIGN_SYSTEM.md` first.** It is the canonical reference.
2. **Use existing components from `src/components/` whenever possible.**
   The component library in `ui/`, `layout/`, `learning/`, and `animation/`
   covers the vast majority of layout and content needs. Inventing a new
   primitive should be a last resort — and if you do, propose it explicitly.
3. **Compose with the named tokens, not raw values.** All colors, type
   sizes, and spacing live in `src/styles/tokens.css`. Do not hardcode hex
   values, px, or rem outside of tokens.

## When generating new lessons (MDX)

Use the `/mathviz-new-lesson` skill. It handles all technical plumbing so you can focus on the math content and intuition building.

A lesson follows this rhythm — every element serves the goal of building spatial intuition:

1. **Orienting prose** (1-2 paragraphs) — what are we trying to "see" in this lesson?
2. **Animation or interactive** — the visual bridge that makes the concept click
3. **Prose explanation** — connect what you just saw to the formal definition
4. **Interactive widget** — let the learner explore and internalize
5. **KeyInsight** — one sentence that captures the spatial intuition
6. **Practice** — 2-3 exercises to verify the intuition stuck

### Writing style for lessons

Write like you're explaining to yourself — someone who can follow the math but needs the geometric picture. Use concrete spatial language:
- "the arrow points northeast" not "the vector has positive components"
- "the curve flattens out" not "the derivative approaches zero"
- "the bell widens" not "sigma increases"

### i18n for lessons

Every MDX lesson should include Chinese frontmatter fields:
- `titleZh` — Chinese title
- `descriptionZh` — Chinese description
- `moduleZh` — Chinese module name

If `titleZh` is missing, the English title is used as fallback.

### MDX + LaTeX

MDX parser interprets `{...}` as JSX before remark-math processes math blocks. For complex LaTeX with braces:
- Use the React `MathBlock` / `MathInline` components from `src/components/math/Math.tsx`
- Or avoid curly braces in inline math (`$...$`)

## Things to avoid

- Do not introduce new accent colors. We have one (terracotta).
- Do not switch to sans-serif body in lessons (must be serif).
- Do not pad pages with marketing fluff (no testimonials, pricing tables, email-capture sections).
- Do not import additional UI libraries without proposing it first.
- Do not embed Manim videos directly in the repo — they are CDN-hosted.
- Do not use Google Fonts CDN — fonts are self-hosted in `public/fonts/`.
- Do not use `@tailwind` directives — Tailwind v4 uses `@import "tailwindcss"`.
- Do not use Cloudflare or external hosting — this project is self-hosted only.

## Style commitments

- Tone: like a thoughtful teacher, not a marketing copywriter.
- Use concrete spatial imagery over abstract metaphor.
- Sentence length: vary, but lean shorter. The math is already complex; the prose around it should not be.
- Links: never "click here." Link the noun.

## i18n system

- Translations: `src/i18n/ui.ts` — all UI strings for en + zh
- Utilities: `src/i18n/utils.ts` — `getLangFromUrl()`, `t()`, `getLocalizedPath()`
- Course metadata: `courseMeta` in `src/i18n/utils.ts`
- Routing: English pages at root (`/`), Chinese pages under `/zh/`
- Language toggle: Header component, globe icon, links between en ↔ zh versions

## Tech-stack notes

- **Astro pages** for all routes (`src/pages/`)
- **React (TSX) components** for anything interactive
- **MDX** for lesson content
- **Tailwind CSS v4** via `@tailwindcss/vite` plugin (NOT v3 `@tailwind` directives)
- **KaTeX** at build time for math (no client-side rendering flicker)
- **Pagefind** for search (build-time index, dynamic script loading)
- **Self-hosted fonts** via `@font-face` in `global.css`

## File map

| Path | Purpose |
|---|---|
| `src/styles/tokens.css` | Design tokens — source of truth |
| `src/styles/global.css` | Base styles, KaTeX, type rhythm, Tailwind v4 import |
| `src/components/ui/` | Generic primitives (Button, Card, Badge, Tabs, ProgressBar) |
| `src/components/layout/` | BaseLayout, Header (with lang toggle), Footer |
| `src/components/learning/` | Domain components (CourseCard, KeyInsight, ExerciseBlock, etc.) |
| `src/components/animation/` | ManimVideo, InteractiveCanvas |
| `src/components/interactive/` | SVG/Canvas widgets (VectorCanvas, DerivativeSlope, NormalDistribution) |
| `src/components/math/` | MathBlock, MathInline (KaTeX client-side wrappers) |
| `src/content/lessons/` | MDX lesson files, organized by course subdirectory |
| `src/i18n/` | Translation strings and i18n utilities |
| `src/hooks/` | useReducedMotion, useMobileDetect |
| `src/pages/` | Astro routes (English at root, Chinese under `/zh/`) |
| `animations/` | Manim scripts, theme, manifest, render pipeline |
| `public/fonts/` | Self-hosted woff2 font files |
| `deploy.sh` | Self-hosted deployment script (Nginx/Caddy/serve) |
