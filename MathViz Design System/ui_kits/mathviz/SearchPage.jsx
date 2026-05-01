// MathViz UI Kit — Search

function SearchPage({ onNav }) {
  const [query, setQuery] = React.useState('eigen');
  const inputRef = React.useRef(null);
  React.useEffect(() => { inputRef.current && inputRef.current.focus(); }, []);

  const allResults = [
    { kind: 'Lesson',  title: 'Eigenvectors as fixed directions', course: 'Linear Algebra', module: 'Eigentheory', duration: 18, snippet: 'A vector is an eigenvector of a transformation if the transformation merely stretches it…', page: 'lesson' },
    { kind: 'Lesson',  title: 'Eigenvalues',                       course: 'Linear Algebra', module: 'Eigentheory', duration: 14, snippet: 'The scalar by which the eigenvector is stretched. Sometimes complex, sometimes negative…', page: 'lesson' },
    { kind: 'Lesson',  title: 'Diagonalization',                   course: 'Linear Algebra', module: 'Eigentheory', duration: 21, snippet: 'When a transformation has enough independent eigenvectors, it becomes simple in the right basis.', page: 'lesson' },
    { kind: 'Concept', title: 'Eigentheory',  course: 'Linear Algebra', snippet: 'The branch of linear algebra that asks: which directions does a transformation leave alone?', page: 'course' },
    { kind: 'Course',  title: 'Linear Algebra', snippet: 'Vectors as arrows, matrices as transformations, eigentheory.', page: 'course' },
  ];
  const q = query.trim().toLowerCase();
  const results = q
    ? allResults.filter(r => (r.title + ' ' + (r.snippet || '') + ' ' + (r.course || '')).toLowerCase().includes(q))
    : [];

  const hi = (text) => {
    if (!q || !text) return text;
    const i = text.toLowerCase().indexOf(q);
    if (i < 0) return text;
    return <>{text.slice(0, i)}<mark style={{ background: 'var(--color-accent-soft)', color: 'var(--color-accent)', padding: '0 2px', borderRadius: 2 }}>{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
  };

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 24px 96px' }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-ink-faint)', margin: '0 0 12px' }}>Search</p>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-h1)', color: 'var(--color-ink)', margin: '0 0 24px', lineHeight: 1.15 }}>Find a concept.</h1>

      {/* Search field */}
      <div style={{ position: 'relative', marginBottom: 32 }}>
        <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-ink-faint)', display: 'grid', placeItems: 'center' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.35-4.35"/></svg>
        </span>
        <input ref={inputRef} type="text" value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Try “eigenvectors”, “limit”, “bayes”…"
          style={{
            width: '100%', height: 56, padding: '0 16px 0 48px',
            fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--color-ink)',
            background: 'var(--color-paper-elevated)',
            border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-md)',
            outline: 'none', boxShadow: 'var(--shadow-sm)',
          }}
          onFocus={e => e.currentTarget.style.borderColor = 'var(--color-accent)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--color-rule)'} />
        <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-faint)', border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-sm)', padding: '2px 6px', background: 'var(--color-surface-1)' }}>⌘ K</span>
      </div>

      {/* Recents / quick links when empty */}
      {!q && (
        <section>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-ink-faint)', margin: '0 0 12px' }}>Try one of these</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Vectors', 'Eigenvectors', 'Limits', 'Bayes\u2019 theorem', 'Gradient', 'Determinant'].map(t => (
              <button key={t} onClick={() => setQuery(t.toLowerCase())} style={{ fontFamily: 'var(--font-sans)', fontSize: 13, padding: '6px 14px', borderRadius: 999, border: '1px solid var(--color-rule)', background: 'transparent', color: 'var(--color-ink-muted)', cursor: 'pointer' }}>{t}</button>
            ))}
          </div>
        </section>
      )}

      {/* Results */}
      {q && (
        <section>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-faint)', margin: '0 0 16px' }}>
            {results.length} result{results.length === 1 ? '' : 's'} for <span style={{ color: 'var(--color-ink-muted)' }}>"{query}"</span>
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {results.map((r, i) => (
              <li key={i} style={{ borderTop: i === 0 ? '1px solid var(--color-rule)' : 'none', borderBottom: '1px solid var(--color-rule)' }}>
                <a href="#" onClick={e => { e.preventDefault(); onNav(r.page); }} style={{ display: 'block', padding: '20px 8px', textDecoration: 'none', margin: '0 -8px', borderRadius: 'var(--radius-md)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-1)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <Badge variant={r.kind === 'Course' ? 'accent' : 'neutral'}>{r.kind}</Badge>
                    {r.course && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-faint)' }}>{r.course}{r.module ? ' · ' + r.module : ''}</span>}
                    {r.duration && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-faint)', marginLeft: 'auto' }}>{r.duration} min</span>}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--color-ink)', margin: '0 0 4px' }}>{hi(r.title)}</h3>
                  {r.snippet && <p style={{ fontFamily: 'var(--font-serif)', fontSize: 14, color: 'var(--color-ink-muted)', lineHeight: 1.55, margin: 0 }}>{hi(r.snippet)}</p>}
                </a>
              </li>
            ))}
            {results.length === 0 && (
              <li style={{ padding: '40px 0', textAlign: 'center', fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--color-ink-faint)' }}>No results. Try a different term.</li>
            )}
          </ul>
        </section>
      )}
    </main>
  );
}

Object.assign(window, { SearchPage });
