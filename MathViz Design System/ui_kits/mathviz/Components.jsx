// MathViz UI Kit — shared components
// Exported to window for use across scripts

const { useState, useEffect } = React;

// ── Icons ────────────────────────────────────────────────────────────
const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/>
  </svg>
);
const IconMoon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);
const IconSun = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
);

// ── Button ────────────────────────────────────────────────────────────
function Button({ variant = 'secondary', size = 'md', children, onClick, style }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    fontFamily: 'var(--font-sans)', fontWeight: 500, border: 'none', cursor: 'pointer',
    borderRadius: 'var(--radius-md)', transition: 'background 150ms ease, color 150ms ease, border-color 150ms ease',
    textDecoration: 'none',
  };
  const sizes = {
    sm: { height: 32, padding: '0 12px', fontSize: 'var(--text-sm)' },
    md: { height: 40, padding: '0 16px', fontSize: 'var(--text-body)' },
    lg: { height: 48, padding: '0 24px', fontSize: 'var(--text-body-lg)' },
  };
  const variants = {
    primary: { background: 'var(--color-accent)', color: 'var(--color-paper-elevated)' },
    secondary: { background: 'transparent', color: 'var(--color-ink)', border: '1.5px solid var(--color-rule)' },
    ghost: { background: 'transparent', color: 'var(--color-ink)' },
  };
  return (
    <button onClick={onClick} style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
      onMouseEnter={e => {
        if (variant === 'primary') e.currentTarget.style.background = 'var(--color-accent-hover)';
        else e.currentTarget.style.background = 'var(--color-surface-1)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = variants[variant].background || 'transparent';
      }}>
      {children}
    </button>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────
function Badge({ variant = 'neutral', children }) {
  const variants = {
    neutral: { background: 'var(--color-surface-1)', color: 'var(--color-ink-muted)' },
    accent:  { background: 'var(--color-accent-soft)', color: 'var(--color-accent)' },
    success: { background: 'color-mix(in srgb, #4f8a5b 15%, transparent)', color: '#4f8a5b' },
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      borderRadius: 'var(--radius-pill)', fontFamily: 'var(--font-sans)',
      fontWeight: 500, fontSize: 12, padding: '2px 10px', lineHeight: 1.6,
      ...variants[variant],
    }}>{children}</span>
  );
}

// ── ProgressBar ───────────────────────────────────────────────────────
function ProgressBar({ value, showLabel }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--color-surface-2)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 999, background: 'var(--color-accent)', transition: 'width 250ms ease' }} />
      </div>
      {showLabel && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-muted)', flexShrink: 0 }}>{pct}%</span>}
    </div>
  );
}

// ── Header ────────────────────────────────────────────────────────────
function Header({ currentPage, onNav, theme, onThemeToggle }) {
  const nav = [
    { label: 'Courses',     page: 'catalogue' },
    { label: 'Linear Algebra', page: 'course' },
    { label: 'Calculus',    page: 'home' },
    { label: 'Probability', page: 'home' },
  ];
  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 40,
      borderBottom: '1px solid var(--color-rule)',
      background: 'color-mix(in srgb, var(--color-paper) 85%, transparent)',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', height: 56, alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <a href="#" onClick={e => { e.preventDefault(); onNav('home'); }} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--color-ink)', display: 'grid', placeItems: 'center', transition: 'background 250ms ease' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-accent)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-ink)'}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 16, fontWeight: 600, color: 'var(--color-paper)', lineHeight: 1 }}>∫</span>
          </div>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--color-ink)' }}>MathViz</span>
        </a>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {nav.map(item => (
            <a key={item.label} href="#" onClick={e => { e.preventDefault(); onNav(item.page); }}
              style={{
                borderRadius: 'var(--radius-md)', padding: '6px 12px',
                fontFamily: 'var(--font-sans)', fontSize: 14,
                textDecoration: 'none', transition: 'background 150ms, color 150ms',
                color: currentPage === item.page && item.page === 'course' ? 'var(--color-ink)' : 'var(--color-ink-muted)',
                background: currentPage === item.page && item.page === 'course' ? 'var(--color-surface-1)' : 'transparent',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-1)'; e.currentTarget.style.color = 'var(--color-ink)'; }}
              onMouseLeave={e => {
                e.currentTarget.style.background = (currentPage === item.page && item.page === 'course') ? 'var(--color-surface-1)' : 'transparent';
                e.currentTarget.style.color = (currentPage === item.page && item.page === 'course') ? 'var(--color-ink)' : 'var(--color-ink-muted)';
              }}>
              {item.label}
            </a>
          ))}
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[
            { Icon: IconSearch, onClick: () => onNav('search'), label: 'Search' },
            { Icon: theme === 'dark' ? IconSun : IconMoon, onClick: onThemeToggle, label: 'Toggle theme' },
          ].map((b, i) => (
            <button key={i} onClick={b.onClick} aria-label={b.label}
              style={{ width: 36, height: 36, display: 'grid', placeItems: 'center', border: 'none', background: 'transparent', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-ink-muted)', transition: 'background 150ms' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-1)'; e.currentTarget.style.color = 'var(--color-ink)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-ink-muted)'; }}>
              <b.Icon />
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

// ── Footer ────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--color-rule)', padding: '24px 0', marginTop: 'auto' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--color-ink-muted)' }}>MathViz</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-faint)' }}>Open source · MIT</span>
      </div>
    </footer>
  );
}

Object.assign(window, { Button, Badge, ProgressBar, Header, Footer, IconCheck, IconChevronRight });
