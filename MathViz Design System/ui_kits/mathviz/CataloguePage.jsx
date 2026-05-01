// MathViz UI Kit — Catalogue (browse all courses)

function CataloguePage({ onNav }) {
  const [filter, setFilter] = React.useState('All');

  const courses = [
    { title: 'Linear Algebra', symbol: 'λ', diff: 'Beginner', topic: 'Algebra',  lessons: 24, hours: 18, progress: 35, blurb: 'Vectors, matrices, eigentheory.', page: 'course' },
    { title: 'Calculus',       symbol: '∫', diff: 'Beginner', topic: 'Analysis', lessons: 32, hours: 26, blurb: 'Limits, derivatives, integrals as moving pictures.', page: 'home' },
    { title: 'Probability',    symbol: 'P', diff: 'Intermediate', topic: 'Statistics', lessons: 19, hours: 14, blurb: 'From coin flips to continuous distributions.', page: 'home' },
    { title: 'Multivariable Calculus', symbol: '∇', diff: 'Intermediate', topic: 'Analysis', lessons: 28, hours: 22, blurb: 'Gradients, divergence, Stokes — the geometry of higher dimensions.', soon: true, page: 'home' },
    { title: 'Differential Equations', symbol: 'd/dt', diff: 'Advanced', topic: 'Analysis', lessons: 22, hours: 20, blurb: 'Phase portraits and the long-term behavior of dynamical systems.', soon: true, page: 'home' },
    { title: 'Statistics',     symbol: 'σ', diff: 'Intermediate', topic: 'Statistics', lessons: 26, hours: 19, blurb: 'Estimation, hypothesis testing, the bootstrap — done visually.', soon: true, page: 'home' },
  ];

  const filters = ['All', 'Beginner', 'Intermediate', 'Advanced', 'Algebra', 'Analysis', 'Statistics'];
  const visible = courses.filter(c => filter === 'All' || c.diff === filter || c.topic === filter);

  return (
    <main style={{ maxWidth: 1280, margin: '0 auto', padding: '64px 24px 96px' }}>
      <header style={{ marginBottom: 48, maxWidth: 720 }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-ink-faint)', margin: '0 0 12px' }}>Catalogue</p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-h1)', color: 'var(--color-ink)', margin: '0 0 16px', lineHeight: 1.15 }}>Every course, in one place.</h1>
        <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-body-lg)', color: 'var(--color-ink-muted)', lineHeight: 1.7, margin: 0 }}>
          Three subjects available today, three more on the way. Each course is built to be taken in order, but every lesson stands on its own.
        </p>
      </header>

      {/* Filter chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid var(--color-rule)' }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 500,
            padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
            border: '1px solid ' + (filter === f ? 'var(--color-accent)' : 'var(--color-rule)'),
            background: filter === f ? 'var(--color-accent-soft)' : 'transparent',
            color: filter === f ? 'var(--color-accent)' : 'var(--color-ink-muted)',
            transition: 'all 150ms',
          }}>{f}</button>
        ))}
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-ink-faint)', alignSelf: 'center' }}>{visible.length} courses</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
        {visible.map(c => <CatalogueCard key={c.title} course={c} onNav={onNav} />)}
      </div>
    </main>
  );
}

function CatalogueCard({ course, onNav }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <a href="#" onClick={e => { e.preventDefault(); !course.soon && onNav(course.page); }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ textDecoration: 'none', display: 'block', cursor: course.soon ? 'default' : 'pointer', opacity: course.soon ? 0.75 : 1 }}>
      <div style={{ background: 'var(--color-paper-elevated)', border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-md)', boxShadow: hovered && !course.soon ? 'var(--shadow-md)' : 'var(--shadow-sm)', overflow: 'hidden', transition: 'box-shadow 250ms' }}>
        <div style={{ height: 132, background: 'var(--color-surface-1)', borderBottom: '1px solid var(--color-rule)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: course.symbol.length > 1 ? 38 : 88, lineHeight: 1, color: hovered && !course.soon ? 'var(--color-accent)' : 'var(--color-ink)', transition: 'color 250ms' }}>{course.symbol}</span>
          <span style={{ position: 'absolute', top: 12, right: 12 }}><Badge variant={course.soon ? 'neutral' : 'neutral'}>{course.soon ? 'Coming soon' : course.diff}</Badge></span>
        </div>
        <div style={{ padding: '18px 20px' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'var(--color-ink)', margin: '0 0 6px' }}>{course.title}</h3>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-ink-muted)', lineHeight: 1.5, margin: '0 0 14px' }}>{course.blurb}</p>
          <div style={{ display: 'flex', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-faint)' }}>
            <span>{course.lessons} lessons</span><span>~{course.hours}h</span><span>{course.topic}</span>
          </div>
          {course.progress != null && (
            <div style={{ marginTop: 12 }}><ProgressBar value={course.progress} showLabel /></div>
          )}
        </div>
      </div>
    </a>
  );
}

Object.assign(window, { CataloguePage });
