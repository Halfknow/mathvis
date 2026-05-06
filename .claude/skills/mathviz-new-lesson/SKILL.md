---
name: mathviz-new-lesson
description: |
  Add a new math lesson to MathViz. Use this skill whenever the user wants to create a new lesson,
  add course content, write a new MDX file for linear algebra / calculus / probability, or says
  things like "new lesson on X", "add lesson", "写新课", "新增一课", "我要写一课关于", etc.
  This skill handles all technical setup (file creation, frontmatter, i18n fields, slug routing)
  so the user can focus entirely on the math content and intuition building.
---

# MathViz New Lesson Creator

This skill adds a new lesson to the MathViz learning platform. It handles all technical details so the user can focus on what matters: building spatial intuition for a mathematical concept.

## Philosophy

Every lesson in MathViz exists to build one thing: **spatial intuition**. Before the formal definition, before the formula — the learner should be able to *see* what the concept looks like. If the content doesn't help the reader "see" the math, it's not serving its purpose.

Write like you're explaining to yourself — someone who can follow the math but needs the geometric picture. Use concrete spatial language: "the arrow points northeast", "the curve flattens out", "the bell widens".

## Workflow

### Step 1: Gather lesson info

Ask the user (or extract from their message):

1. **Course** — `linear-algebra`, `calculus`, or `probability`
2. **Topic** — what concept is this lesson about? (e.g., "vector addition")
3. **Intuition goal** — what spatial picture should the learner walk away with?
4. **Module** — which module does this belong to? (look at existing lessons in the course for module names, or create a new one)
5. **Chinese title** — the Chinese translation of the title (ask if not provided)

### Step 2: Determine lesson number

Read the existing lessons in `src/content/lessons/{course}/` to determine:
- The next available lesson number (e.g., if `01-*` and `02-*` exist, the next is `03-*`)
- The `moduleOrder` and `lessonOrder` values (look at existing frontmatter)
- Whether this lesson starts a new module or continues an existing one

### Step 3: Create the MDX file

Create the file at `src/content/lessons/{course}/{NN}-{slug}.mdx` with:

**Frontmatter template:**

```yaml
---
title: "{English Title}"
titleZh: "{Chinese Title}"
description: "{English description — one sentence about the intuition goal}"
descriptionZh: "{Chinese description}"
course: "{course}"
module: "{Module Name}"
moduleZh: "{Chinese Module Name}"
moduleOrder: {N}
lessonOrder: {N}
duration: {estimated minutes, default 15}
difficulty: "Beginner" | "Intermediate" | "Advanced"
---
```

**Body template:**

```mdx
---
(frontmatter)
---

(Orienting prose — 1-2 paragraphs. What are we trying to "see"? What spatial picture matters?)

## (Section with animation or interactive)

(Explain the concept with visual/spatial language)

(Interactive component or ManimVideo if applicable)

## (Deeper explanation)

(Connect the visual intuition to formal definition)

## Key Insight

> (One sentence that captures the spatial intuition — the thing you'd remember even if you forgot all the formulas)

## Practice

(2-3 exercises that test whether the intuition stuck, not just calculation ability)
```

### Step 4: Handle interactive components

Check if an existing interactive component in `src/components/interactive/` fits this lesson. If so, add the appropriate import and usage to the MDX.

Available components:
- `VectorCanvas` — 2D vector dragging (linear-algebra)
- `DerivativeSlope` — tangent line explorer (calculus)
- `NormalDistribution` — bell curve with μ/σ sliders (probability)

If a new component is needed, **propose it** to the user with a brief description of what it would do, but do NOT create it unless asked. Focus on the content first — the component can come later.

### Step 5: Verify

1. Run `npm run build` to verify the new lesson compiles correctly
2. Confirm the lesson appears at the correct URL path
3. Report the file path and URL to the user

## Content writing guidelines

### DO:
- Start with the visual/spatial picture, not the definition
- Use concrete language: "the arrow", "the curve", "the bell"
- Keep paragraphs short (2-4 sentences)
- Use `$...$` for simple inline math, `$$...$$` for display math
- Include one `KeyInsight` per lesson — the one sentence that captures the intuition
- Write 2-3 practice exercises that test understanding, not just calculation

### DO NOT:
- Start with formal definitions before establishing the visual picture
- Use abstract metaphor instead of concrete spatial description
- Write long paragraphs of text without visual breaks
- Use LaTeX with `{curly braces}` in `$...$` inline math (MDX will break) — use `<MathBlock expression={'...'} />` instead
- Import new UI libraries or create new components without proposing first

### MDX + LaTeX safety:
- Simple math like `$f(x)$`, `$x^2$`, `$\vec{v}$` is fine in inline
- For anything with `{}` (like `\begin{bmatrix}`, `\frac{}{}`, `\vec{w}`) use the `MathBlock` component:
  ```
  import { MathBlock } from '../../../components/math/Math';
  <MathBlock expression={'\\frac{dy}{dx} = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}'} />
  ```
- Display math `$$...$$` is generally safe as long as it doesn't have JSX-reactive content

## Slug naming convention

File name: `{NN}-{kebab-case-title}.mdx`
- NN: zero-padded lesson number (01, 02, ..., 15)
- Slug: lowercase, hyphenated, descriptive
- Examples: `01-vectors-as-arrows.mdx`, `02-vector-addition.mdx`, `03-what-is-a-derivative.mdx`
