# MathViz · 用动画学数学

A web platform for systematically learning **probability, linear algebra, and calculus** through code-driven animations. Inspired by 3Blue1Brown's pedagogical philosophy, but interactive and structured as a course system.

**支持中英文切换 / Available in English and Chinese.**

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Astro 5** + Islands | Static-first, only hydrates interactive components |
| Content | **MDX** | Markdown + embedded React components for interactive lessons |
| Math typography | **KaTeX** | Server-rendered via remark-math + rehype-katex, no flash |
| Interactive components | **React 19** | For SVG/Canvas/3D widgets |
| 2D animation | **SVG + React** | VectorCanvas, DerivativeSlope, NormalDistribution |
| 3D animation | **React Three Fiber + Drei** | For linear algebra 3D visualizations |
| Pre-rendered narrative | **Manim** | High-quality explainer videos, local render pipeline |
| Styling | **Tailwind CSS 4** + CSS variables | Tokens in `tokens.css`, Tailwind for layout utilities |
| i18n | **Astro i18n** | URL-based routing (`/` English, `/zh/` Chinese) |
| Search | **Pagefind** | Static search index, auto-detects en + zh-cn |
| Fonts | **Self-hosted** | Source Serif 4, Inter, JetBrains Mono (woff2) |
| Deployment | **Self-hosted** | Nginx / Caddy / `npx serve` — no external hosting |

## Project Structure

```
src/
├── styles/              # tokens.css (design system) + global.css
├── components/
│   ├── ui/              # Button, Card, Badge, Tabs, ProgressBar
│   ├── layout/          # BaseLayout, Header (with lang toggle), Footer
│   ├── learning/        # CourseCard, ConceptCard, KeyInsight, ExerciseBlock
│   ├── animation/       # ManimVideo, InteractiveCanvas (fullscreen + mobile)
│   ├── interactive/     # SVG/Canvas interactive widgets
│   │   ├── linear-algebra/   # VectorCanvas
│   │   ├── calculus/         # DerivativeSlope
│   │   └── probability/      # NormalDistribution
│   └── math/            # MathBlock, MathInline (KaTeX client-side wrapper)
├── content/lessons/     # MDX lesson files
│   ├── linear-algebra/  # 1 lesson
│   ├── calculus/        # 3 lessons
│   └── probability/     # 3 lessons
├── hooks/               # useReducedMotion, useMobileDetect
├── i18n/                # ui.ts (translations), utils.ts (helpers)
├── pages/               # Astro routes
│   ├── index.astro            # English homepage
│   ├── courses/[course]/      # Dynamic course + lesson pages
│   ├── search.astro           # Pagefind search (en)
│   └── zh/                    # Chinese mirror pages
│       ├── index.astro
│       ├── courses/[course]/
│       └── search.astro
└── public/
    └── fonts/           # Self-hosted woff2 files
animations/              # Manim render pipeline
├── shared/mathviz_theme.py
├── linear-algebra/
├── manifest.json
└── render.py
```

## Quick Start

```bash
npm install
npm run dev          # → http://localhost:4321
npm run build        # Astro build + Pagefind index
```

## Documentation

| File | Purpose |
|---|---|
| `CLAUDE.md` | AI coding assistant instructions |
| `DESIGN_SYSTEM.md` | Design token reference |
| `TECHNICAL_PLAN.md` | Full technical implementation plan |
| `CHANGELOG.md` | Version history and progress tracking |

## Status

**v0.2.0** — Core platform functional with i18n, 7 lessons across 3 courses, interactive widgets, and self-hosted deployment. See `CHANGELOG.md` for details.
