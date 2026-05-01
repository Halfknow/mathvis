# CLAUDE.md

> Persistent context for Claude (Design / Code) when working on this repo.

## What this is

**MathViz** — a static-first educational website for learning probability,
linear algebra, and calculus through animations. Astro 5 + MDX + React 19 +
KaTeX + Three.js + Tailwind CSS 4, with Manim used in a separate pipeline for
pre-rendered narrative video clips.

Supports English and Chinese via URL-based i18n routing (`/` = English, `/zh/` = Chinese).

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

### i18n for lessons

Every MDX lesson should include Chinese frontmatter fields:
- `titleZh` — Chinese title
- `descriptionZh` — Chinese description
- `moduleZh` — Chinese module name

The Chinese pages (`/zh/courses/...`) use these fields for display. If `titleZh` is missing, the English title is used as fallback.

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

- Tone of prose: like a thoughtful teacher, not a marketing copywriter.
  Use first-person plural ("we") sparingly. Prefer concrete imagery
  ("the arrow points northeast") over abstract metaphor.
- Sentence length: vary, but lean shorter. The math is already complex;
  the prose around it should not be.
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
