/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--color-paper)',
        'paper-elevated': 'var(--color-paper-elevated)',
        ink: 'var(--color-ink)',
        'ink-muted': 'var(--color-ink-muted)',
        'ink-faint': 'var(--color-ink-faint)',
        rule: 'var(--color-rule)',
        'surface-1': 'var(--color-surface-1)',
        'surface-2': 'var(--color-surface-2)',
        accent: 'var(--color-accent)',
        'accent-soft': 'var(--color-accent-soft)',
        'vector-blue': 'var(--color-vector-blue)',
        'vector-green': 'var(--color-vector-green)',
        'vector-red': 'var(--color-vector-red)',
        'vector-yellow': 'var(--color-vector-yellow)',
      },
      fontFamily: {
        serif: 'var(--font-serif)',
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
        math: 'var(--font-math)',
      },
      fontSize: {
        display: ['var(--text-display)', { lineHeight: '1.05' }],
        h1: ['var(--text-h1)', { lineHeight: '1.15' }],
        h2: ['var(--text-h2)', { lineHeight: '1.25' }],
        h3: ['var(--text-h3)', { lineHeight: '1.3' }],
        'body-lg': ['var(--text-body-lg)', { lineHeight: '1.7' }],
        body: ['var(--text-body)', { lineHeight: '1.6' }],
        sm: ['var(--text-sm)', { lineHeight: '1.5' }],
        xs: ['var(--text-xs)', { lineHeight: '1.4' }],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        pill: 'var(--radius-pill)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      transitionTimingFunction: {
        smooth: 'var(--ease-smooth)',
      },
      transitionDuration: {
        fast: 'var(--duration-fast)',
        base: 'var(--duration-base)',
      },
      maxWidth: {
        prose: '680px',
      },
    },
  },
};
