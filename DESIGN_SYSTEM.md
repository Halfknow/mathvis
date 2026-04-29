# Design System Reference

> This document is written specifically for **Claude Design** (and any other AI design tool) to use as ground truth when generating prototypes for MathViz. It mirrors the canonical source in `src/styles/tokens.css`.

## Design Principles

1. **Math is the protagonist.** Every UI decision should make notation, diagrams, and animations more legible — not compete with them.
2. **Two surfaces: paper and blackboard.** Light mode is warm off-white paper. Dark mode is the deep navy of a chalkboard. Both should feel "studied," not glossy.
3. **One accent at a time.** A page should have exactly one color drawing the eye (usually our terracotta accent). Multiple colors are reserved for *meaningful distinctions* in math content (vectors, gradients, counterexamples).
4. **Generous whitespace.** Lessons read like Tufte-style book pages — wide margins, optional sidenotes, no edge-to-edge filling.
5. **Type the math seriously.** Serif body for prose, math typeset with KaTeX, monospace only for code. No display fonts, no decorative weights.
6. **Motion has meaning.** Hover states are quiet. Transitions are 150–250ms with a smooth ease. Big animations (Manim videos, canvases) are deliberate, framed events.

## Color Tokens

### Light mode ("paper")

| Token | Value | Use |
|---|---|---|
| `--color-paper` | `#faf7f2` | Page background — warm off-white, never pure white |
| `--color-paper-elevated` | `#ffffff` | Cards on the paper surface |
| `--color-ink` | `#1a1f36` | Body text, headings — deep ink navy |
| `--color-ink-muted` | `#4a5170` | Secondary text, captions |
| `--color-ink-faint` | `#8b91a7` | Tertiary text, metadata |
| `--color-rule` | `#e8e3d8` | Dividers, borders — warm, not cold gray |
| `--color-surface-1` | `#f4f0e8` | Subtle inset surfaces (sidebars) |
| `--color-surface-2` | `#ebe6dc` | More pronounced inset (code blocks) |

### Dark mode ("blackboard")

| Token | Value | Use |
|---|---|---|
| `--color-paper` | `#0e1117` | Background — deep blackboard navy |
| `--color-paper-elevated` | `#161b25` | Cards |
| `--color-ink` | `#e6e9f0` | Body text — soft chalk white |
| `--color-ink-muted` | `#a4abc0` | Secondary |
| `--color-ink-faint` | `#6a708a` | Tertiary |
| `--color-rule` | `#252b3a` | Dividers |

### Accent + semantic colors (both modes)

| Token | Light | Dark | Use |
|---|---|---|---|
| `--color-accent` | `#c8693d` | `#e8a87c` | Primary CTA, focus rings, links — terracotta |
| `--color-accent-soft` | `#f4e4d3` | `#2a1f18` | Accent backgrounds, soft highlights |
| `--color-vector-blue` | `#3b6cb7` | `#6c9ae8` | "Vector x" in linear algebra diagrams |
| `--color-vector-green` | `#4f8a5b` | `#7fc090` | "Vector y" / gradient direction |
| `--color-vector-red` | `#b54a4a` | `#e08585` | Counterexample, warning, "this fails" |
| `--color-vector-yellow` | `#d4a02a` | `#f0c855` | Highlight, "watch this" emphasis |

> The vector colors are inspired by the chalk palette 3Blue1Brown uses — they are pedagogical, not decorative. Use them only inside diagrams and the few UI elements that label diagram content.

## Typography

| Token | Stack | Use |
|---|---|---|
| `--font-serif` | Source Serif 4, Georgia, serif | **Body prose** in lessons, large display |
| `--font-sans` | Inter, system-ui, sans-serif | UI chrome (buttons, nav, labels) |
| `--font-mono` | JetBrains Mono, Menlo, monospace | Code, equation source |
| `--font-math` | STIX Two Math, Latin Modern Math, serif | KaTeX fallback |

### Type scale

| Token | Size | Line-height | Use |
|---|---|---|---|
| `--text-display` | 3.5rem (56px) | 1.05 | Homepage hero only |
| `--text-h1` | 2.5rem (40px) | 1.15 | Lesson title |
| `--text-h2` | 1.875rem (30px) | 1.25 | Section heading |
| `--text-h3` | 1.375rem (22px) | 1.3 | Subsection |
| `--text-body-lg` | 1.125rem (18px) | 1.7 | **Default body in lessons** — generous leading |
| `--text-body` | 1rem (16px) | 1.6 | UI body |
| `--text-sm` | 0.875rem (14px) | 1.5 | Captions, metadata |
| `--text-xs` | 0.75rem (12px) | 1.4 | Badges, fine print |

## Spacing scale

4px base. Use the named tokens (`--space-2`, `--space-4`, etc.), not arbitrary pixel values.

`--space-1` 4px · `--space-2` 8px · `--space-3` 12px · `--space-4` 16px · `--space-6` 24px · `--space-8` 32px · `--space-12` 48px · `--space-16` 64px · `--space-24` 96px

**Lesson layout:** body column max-width `680px`, with a `220px` right gutter for sidenotes/figures on desktop.

## Radii

`--radius-sm` 4px · `--radius-md` 8px · `--radius-lg` 16px · `--radius-pill` 999px

Cards default to `--radius-md`. Pills (badges, chips) use `--radius-pill`. Avoid radii larger than 16px — we want crispness, not rounded-app cuteness.

## Elevation

Three soft, paper-like shadows. Avoid heavy drop-shadows.

- `--shadow-sm`: hairline lift (cards in a list)
- `--shadow-md`: hovered/elevated card
- `--shadow-lg`: modals, video lightboxes only

## Motion

- `--duration-fast` 150ms — hovers, focus
- `--duration-base` 250ms — collapsing/expanding panels
- `--ease-smooth` `cubic-bezier(0.4, 0, 0.2, 1)` — default for everything

Avoid bounces, overshoots, and stagger animations. Mathematics is calm.

## Component Inventory

This is what already exists in `src/components/`. When designing a new screen, prefer composing these over inventing new primitives.

### UI primitives (`ui/`)

- **Button** — variants: `primary` (filled accent), `secondary` (outlined ink), `ghost` (text only). Sizes: `sm`, `md`, `lg`.
- **Card** — paper-elevated container with optional `interactive` variant for hover.
- **Badge** — pill-shaped label. Variants: `neutral`, `accent`, `success`, `warning`.
- **Tabs** — horizontal tabbed switcher with underline indicator.
- **ProgressBar** — slim horizontal progress, used for lesson completion.

### Layout (`layout/`)

- **Header** — site nav with logo, courses dropdown, theme toggle, search.
- **Footer** — minimal: project name, repo link, license.
- **SidebarNav** — sticky left rail listing modules and lessons inside a course.
- **BaseLayout** — page shell.
- **LessonLayout** — three-column layout: left sidebar (lesson nav), center body (max-width 680px), right gutter (figures/sidenotes).

### Learning components (`learning/`)

These are **domain-specific** — built for math instruction, not generic content.

- **ConceptCard** — featured concept on the homepage or course landing. Has icon, title, blurb, "lessons" count.
- **CourseCard** — large, spans-3-columns card for the course catalog. Shows progress, lesson count, estimated hours.
- **PrerequisiteList** — checklist of concepts the lesson assumes. Each item links out.
- **KeyInsight** — pull-quote-style callout. Used to mark "the moment the idea clicks."
- **ExerciseBlock** — collapsible exercise with prompt, optional hint, and answer-reveal.
- **LessonProgress** — small inline indicator showing position within a module (e.g. "3 of 8").

### Animation components (`animation/`)

- **ManimVideo** — wrapper for pre-rendered Manim clips. Accepts `src` (CDN URL), `poster`, `caption`. Auto-pauses off-screen.
- **InteractiveCanvas** — slot for Three.js / D3 widgets. Provides controls bar, fullscreen toggle, reset button.
- **AnimationCaption** — figure caption typeset to match academic conventions.

### Math (`math/`)

- **MathBlock** — KaTeX block-level equation, optionally numbered.
- **MathInline** — KaTeX inline.

## Layout patterns

### Homepage

Hero (display heading + 1-line subhead) → 3-up CourseCard grid → "How it works" section with iconography → footer. **No carousels, no testimonials, no email capture.**

### Course landing

Course name + meta → progress bar → vertical list of modules, each expandable into its lessons.

### Lesson page

`LessonLayout`: left sidebar shows current module's lessons with a "you are here" indicator. Center is MDX prose with embedded math, videos, and interactive widgets. Right gutter holds figure captions, sidenotes, and a sticky "next/prev" pager.

## What "wrong" looks like

If Claude Design produces any of these, it's drifted off-brand:

- Pure-white backgrounds (we use warm `#faf7f2`)
- Indigo/purple gradients (we have a single terracotta accent)
- Hero sections with abstract 3D blobs or AI-generated illustrations
- Pricing tables with checkmark-laden "Pro" tiers
- Glassmorphism or neumorphism
- Sans-serif body text in lessons (must be serif)
- Heavy drop shadows
- Animated gradient backgrounds
