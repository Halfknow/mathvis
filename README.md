# MathViz · 用动画学数学

A web platform for systematically learning **probability, linear algebra, and calculus** through code-driven animations. Inspired by 3Blue1Brown's pedagogical philosophy, but interactive and structured as a course system.

## Brand Identity

**The vibe in three phrases:**

- *Quiet rigor* — feels like a well-typeset mathematics textbook, not a SaaS dashboard
- *Chalkboard meets paper* — warm off-white surfaces by day, deep navy "blackboard" by night
- *Animation as primary citizen* — visuals are not decoration; they carry the explanation

**Visual references we admire:**

- 3Blue1Brown video aesthetic (deep navy backgrounds, warm chalk colors)
- Brilliant.org's clean lesson layouts
- *Edward Tufte's* book design (generous margins, sidenotes, restrained color)
- *Seeing Theory* (browntfeller / Brown University) — the gold standard for in-browser probability visualization

**What we deliberately avoid:**

- Generic SaaS gradients, glassmorphism, "AI startup" purple
- Cluttered UI — the math should be the loudest thing on the page
- Cute illustrations — we use mathematical figures instead
- Aggressive CTAs and conversion-funnel patterns

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Astro 5** + Islands | Static-first, only hydrates interactive components |
| Content | **MDX** | Markdown + embedded React components for interactive lessons |
| Math typography | **KaTeX** | Server-rendered, no flash, fastest |
| Interactive components | **React 19** | For canvas/3D widgets |
| 2D animation (calc/prob) | **D3.js** + **Observable Plot** | Curves, distributions, sampling |
| 3D animation (linear alg.) | **Three.js** via **React Three Fiber** | Vectors, transformations, eigenvectors |
| Pre-rendered narrative | **Manim** (CI pipeline) | High-quality "explainer" videos, served via CDN |
| Styling | **Tailwind CSS** + CSS variables | Tokens in CSS, utility classes for layout |

## Content Model

```
Course (e.g. Linear Algebra)
└── Module (e.g. Vector Spaces)
    └── Lesson (e.g. Vectors as Arrows)
        ├── Prose (MDX)
        ├── Math (KaTeX)
        ├── Manim video clips (CDN-hosted)
        ├── Interactive widgets (React)
        └── Exercises
```

Each lesson is a single `.mdx` file. The course tree is generated automatically from frontmatter — no hand-maintained navigation.

## Project Structure

See `DESIGN_SYSTEM.md` for the design system reference. This README captures the *spirit*; that file captures the *specs*.

```
src/
├── styles/          # tokens.css (the design system source of truth) + global.css
├── components/
│   ├── ui/          # Generic primitives: Button, Card, Badge, Tabs, ProgressBar
│   ├── layout/      # Header, Footer, Sidebar, page-level layouts
│   ├── learning/    # Domain-specific: ConceptCard, ExerciseBlock, KeyInsight, etc.
│   ├── animation/   # Wrappers for Manim videos and interactive canvases
│   └── math/        # KaTeX wrappers
├── content/         # MDX lessons organized by course
├── pages/           # Astro routes
└── lib/             # Utilities
```

## Status

This is the **skeleton** — design tokens, component shells, and one polished example each of the homepage and a lesson page. It is intentionally minimal so Claude Design has clear, uncluttered material to extract a design system from.
