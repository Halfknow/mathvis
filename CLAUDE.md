# CLAUDE.md

> Persistent context for Claude (Design / Code) when working on this repo.

## What this is

**MathViz** — a static-first educational website for learning probability,
linear algebra, and calculus through animations. Astro 5 + MDX + React +
KaTeX + Three.js + D3, with Manim used in a separate CI pipeline for
pre-rendered narrative video clips.

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

A lesson follows this rough rhythm:

1. `LessonProgress` at the top
2. `# Title`
3. Short prose orienting the reader (1–2 paragraphs)
4. `PrerequisiteList` if the lesson assumes prior concepts
5. The animation/explanation arc:
   - `ManimVideo` — narrative clip
   - Prose explanation
   - `InteractiveCanvas` — hands-on widget
   - `KeyInsight` — the single sentence that captures the idea (max one per lesson)
6. `## Practice` section with two or three `ExerciseBlock`s
7. Inline link to the next lesson

## Things to avoid

- Do not introduce new accent colors. We have one (terracotta).
- Do not switch to sans-serif body in lessons (must be serif).
- Do not pad pages with marketing fluff (no testimonials, pricing tables, email-capture sections).
- Do not import additional UI libraries without proposing it first.
- Do not embed Manim videos directly in the repo — they are CDN-hosted.

## Style commitments

- Tone of prose: like a thoughtful teacher, not a marketing copywriter.
  Use first-person plural ("we") sparingly. Prefer concrete imagery
  ("the arrow points northeast") over abstract metaphor.
- Sentence length: vary, but lean shorter. The math is already complex;
  the prose around it should not be.
- Links: never "click here." Link the noun.

## Tech-stack notes

- **Astro pages** for all routes (`src/pages/`)
- **React (TSX) components** for anything interactive
- **MDX** for lesson content
- **CSS variables** for design tokens; **Tailwind** for layout utilities
- **KaTeX** at build time for math (no client-side rendering flicker)

## File map

| Path | Purpose |
|---|---|
| `src/styles/tokens.css` | Design tokens — source of truth |
| `src/styles/global.css` | Base styles, KaTeX, type rhythm |
| `src/components/ui/` | Generic primitives (Button, Card, Badge, Tabs, ProgressBar) |
| `src/components/layout/` | Page layouts (Base, Lesson) and chrome (Header, Footer, Sidebar) |
| `src/components/learning/` | Domain components (CourseCard, ConceptCard, KeyInsight, ExerciseBlock, etc.) |
| `src/components/animation/` | ManimVideo, InteractiveCanvas |
| `src/components/math/` | KaTeX wrappers |
| `src/content/lessons/` | MDX lesson files, organized by course |
| `src/pages/` | Astro routes |
