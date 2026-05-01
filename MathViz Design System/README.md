# MathViz Design System

> Ground truth for AI design tools, developers, and contributors building on MathViz.

## Product Overview

**MathViz** (brand name also used as **Halfmath** in some contexts) is a structured web learning platform for building mathematical intuition through animation and interaction. The three courses are:

- **Linear Algebra** — vectors as arrows, matrices as transformations, eigentheory
- **Calculus** — limits, derivatives, integrals as moving pictures
- **Probability** — from coin flips to continuous distributions

**Tagline:** *Mathematics, made visible.*

**Vibe in three phrases:**
- *Quiet rigor* — a well-typeset mathematics textbook, not a SaaS dashboard
- *Chalkboard meets paper* — warm off-white by day, deep navy "blackboard" by night
- *Animation as primary citizen* — visuals carry the explanation, not decoration

**Inspirations:** 3Blue1Brown, Brilliant.org, Edward Tufte's book design, Brown University's *Seeing Theory*

## Sources

| Source | Path/URL | Notes |
|---|---|---|
| Codebase | `mathviz/` (local mount) | Astro 5 + React 19 + Tailwind + KaTeX |
| GitHub repo | https://github.com/Halfknow/mathvis | Same codebase, public |
| Design system doc | `mathviz/DESIGN_SYSTEM.md` | Claude-readable spec |
| Token source | `mathviz/src/styles/tokens.css` | Canonical CSS vars |
| Global CSS | `mathviz/src/styles/global.css` | Base element styles |

---

## Content Fundamentals

### Tone & Voice
- **First person is avoided** in instructional prose — the text speaks to the reader directly in second person or passive constructions. "Notice how…", "Try dragging…", not "I will explain…".
- **Humble and precise.** Never oversells. Never hypes. Explanations are complete and careful.
- **Geometry first, formalism second.** Every definition is preceded by the intuition it encodes. The symbol is introduced *after* the picture, never before.
- **Sentence rhythm** is unhurried — long enough to be complete, short enough to stay sharp. No bullet-point-ification of ideas that need a sentence.

### Casing
- **UI labels:** Title Case for course/module names (*Vector Spaces*, *Linear Transformations*), Sentence case for buttons and nav items (*Browse all courses*, *Start with Linear Algebra*).
- **Monospace eyebrow labels** (section labels above headings) are ALL CAPS with wide letter-spacing: `PROBABILITY · LINEAR ALGEBRA · CALCULUS`.
- **Math notation** uses $\LaTeX$ conventions everywhere — upright roman for operators, italic for variables.

### Copy Examples
- Hero subhead: *"A structured course system where every concept is paired with an animation you can scrub, pause, and play with — so the intuition lands before the formalism does."*
- CTA: *"Start with Linear Algebra"* / *"Browse all courses →"*
- Closing quote: *"What we cannot see, we cannot really know. Mathematics is no exception."*
- Course description: *"Vectors as arrows, matrices as transformations. Build geometric intuition before symbol manipulation."*

### What's Absent
- No emoji anywhere in the UI or copy
- No exclamation marks in product copy
- No testimonials, pricing tables, "Pro tier" language
- No aggressive conversion-funnel copy

---

## Visual Foundations

### Color
Two surfaces: **paper** (light, warm off-white `#faf7f2`) and **blackboard** (dark, deep navy `#0e1117`). One accent: **terracotta** (`#c8693d` light / `#e8a87c` dark). The accent is used sparingly — one per view — for CTAs, links, and focus rings.

Four **chalk colors** live inside diagrams only, inspired by 3Blue1Brown's palette:
- Blue `#3b6cb7` — primary vector / direction
- Green `#4f8a5b` — secondary vector / gradient
- Red `#b54a4a` — counterexample, warning
- Yellow `#d4a02a` — highlight, "watch this"

**Forbidden:** indigo/purple gradients, glassmorphism, pure-white backgrounds, animated gradient backgrounds, neumorphism.

### Typography
| Role | Font | Notes |
|---|---|---|
| Body prose (lessons) | Source Serif 4 | Italic weight used for pull-quotes and emphasis |
| UI chrome | Inter | Buttons, nav, labels, metadata |
| Code / equations source | JetBrains Mono | Also used for eyebrow labels (uppercased) |
| Math (KaTeX) | STIX Two Math | Only inside rendered math |

Body text in lessons is **18px / 1.7 line-height**, generous like a Tufte book page. UI body is 16px / 1.6.

### Spacing
4px base grid. Named tokens `--space-1` through `--space-32`. Lesson body column max-width: 680px. Right sidenote gutter: 220px. Left sidebar: 260px.

### Radii
`4px` (sm) · `8px` (md) · `16px` (lg) · `999px` (pill). Cards use `8px`. Badges/chips use pill. No radii larger than 16px — *"we want crispness, not rounded-app cuteness."*

### Elevation
Three paper-like shadows, deliberately soft. Only the ink/navy hue is used (never pure black). Modals/lightboxes are the only use of `--shadow-lg`.

### Backgrounds
No images, no patterns, no textures in UI surfaces. Math figures and Manim video clips are the only "imagery." The `bg-surface-1` inset (slightly warm gray) is used for the "How it works" strip and sidebar. Full-bleed colored sections use `--color-surface-1`.

### Animation
Transitions are **150–250ms** with `cubic-bezier(0.4, 0, 0.2, 1)`. No bounces, no overshoots, no stagger animations. *"Mathematics is calm."* Interactive canvas animations (D3, Three.js, Manim clips) are framed as deliberate events.

### Hover / Press States
- Links: underline color transitions from 30% to 100% opacity
- Buttons: `primary` darkens to `--color-accent-hover`; `secondary` fills with `--color-surface-1`; `ghost` fills with `--color-surface-1`
- Interactive cards: shadow steps up from `sm` to `md`
- Nav items: `text-ink-muted` → `text-ink` + `bg-surface-1` fill
- Math symbol in CourseCard transitions from ink to accent color on hover

### Cards
`bg-paper-elevated` + `border border-rule` + `shadow-sm` + `radius-md`. Interactive cards add `hover:shadow-md`. No accent left-border. No colored card headers. Symbol panel inside CourseCard uses `bg-surface-1`.

### Borders
Only `--color-rule` (`#e8e3d8` warm, not cold gray). `1px solid`. Used for card borders, dividers, sidebar separators, exercise blocks.

### Focus
`2px solid var(--color-accent)` with `outline-offset: 3px`. Consistently terracotta on both surfaces.

### Corner of "wrong"
Pure-white backgrounds · indigo/purple gradients · 3D blobs/AI illustrations · glassmorphism · neumorphism · heavy drop shadows · animated gradient backgrounds · sans-serif body in lessons · pricing tables · aggressive CTAs.

---

## Iconography

The project uses **no icon library**. Icons are **inline SVG** drawn directly in component files. They are minimal, stroke-based (weight 2, `stroke-linecap="round" stroke-linejoin="round"`), following a Lucide-like convention. Sizes are 18×18 in nav and 12×12 in small contexts.

**Current inline icons found in the codebase:**
- Search: circle + diagonal line (in Header)
- Moon: crescent path (theme toggle in Header)
- Checkmark: polyline `20 6 9 17 4 12` (lesson completion in SidebarNav, CourseCard)

**Mathematical symbols are used as brand icons** — not drawn SVGs. The integral `∫` is the logo mark (also the favicon). Course icons are `λ` (linear algebra), `∫` (calculus), `P` (probability). These are rendered as serif text at large sizes.

**No emoji** anywhere in the UI.

**Logo / Wordmark:**
- Logo mark: 32×32 `rx-6` square, `#1a1f36` fill, `∫` glyph in `#faf7f2` Georgia serif
- Wordmark: "MathViz" in `font-serif` semibold 18px tracking-tight
- Combined: 7×28 mark + wordmark, 8px gap, group-hover transitions mark bg to accent

Assets: `assets/favicon.svg`

---

## File Index

```
/
├── README.md                  — this file
├── SKILL.md                   — agent skill descriptor
├── colors_and_type.css        — canonical CSS variables + base styles
├── assets/
│   └── favicon.svg            — logo mark (∫ glyph)
├── preview/
│   ├── colors-surfaces.html   — paper surface palette
│   ├── colors-ink.html        — ink/text scale
│   ├── colors-accent.html     — terracotta accent
│   ├── colors-vector.html     — chalk / diagram colors
│   ├── colors-dark.html       — dark mode palette
│   ├── type-scale.html        — full type scale
│   ├── type-families.html     — font family specimens
│   ├── spacing-tokens.html    — spacing scale
│   ├── spacing-radii.html     — border radii
│   ├── spacing-shadows.html   — elevation system
│   ├── comp-buttons.html      — Button variants × sizes
│   ├── comp-badges.html       — Badge variants
│   ├── comp-card.html         — Card component
│   ├── comp-progressbar.html  — ProgressBar
│   ├── comp-keyinsight.html   — KeyInsight callout
│   ├── comp-exerciseblock.html — ExerciseBlock
│   └── comp-coursecards.html  — CourseCard + ConceptCard
└── ui_kits/
    └── mathviz/
        ├── README.md          — UI kit notes
        └── index.html         — interactive prototype (homepage → course → lesson)
```
