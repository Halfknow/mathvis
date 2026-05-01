# MathViz UI Kit

High-fidelity recreation of the MathViz web product. Three core surfaces:

1. **Homepage** — hero + 3-up CourseCard grid + "How it works" strip
2. **Course landing** — header, progress, module/lesson list
3. **Lesson page** — sidebar nav + prose column + right gutter

## Usage
Open `index.html` for an interactive click-through prototype.
All JSX components are defined inline in the HTML file using React + Babel.

## Notes
- Fonts loaded from Google Fonts (Source Serif 4, Inter, JetBrains Mono)
- Math rendering uses KaTeX CDN
- No icon library — inline SVG only, matching the codebase
- Dark mode toggle in header persists via localStorage
