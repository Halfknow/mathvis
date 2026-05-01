// MathViz UI Kit — Course Landing Page (Linear Algebra)

function CoursePage({ onNav }) {
  const course = {
    title: 'Linear Algebra', symbol: 'λ', difficulty: 'Beginner',
    lessons: 24, hours: 18, progress: 35,
    description: 'Twenty-four lessons spanning vectors and vector spaces, linear transformations, eigentheory, and applications. Built around the conviction that geometry is primary and coordinates are derivative.',
  };
  const modules = [
    { title: 'Vector Spaces', blurb: 'Arrows, addition, scaling — the foundation.', lessons: [
      { title: 'Vectors as arrows', duration: 14, completed: true, page: 'lesson' },
      { title: 'Vector addition, geometrically', duration: 12, completed: true, page: 'lesson' },
      { title: 'Scalar multiplication', duration: 9, completed: true, page: 'lesson' },
      { title: 'Linear combinations', duration: 16, completed: false, page: 'lesson' },
      { title: 'Spans', duration: 18, completed: false, page: 'lesson' },
      { title: 'Basis and dimension', duration: 22, completed: false, page: 'lesson' },
    ]},
    { title: 'Linear Transformations', blurb: 'Matrices as a way to write down transformations.', lessons: [
      { title: 'Functions on vectors', duration: 11, completed: false, page: 'lesson' },
      { title: 'What linearity means', duration: 14, completed: false, page: 'lesson' },
      { title: 'Matrices as transformations', duration: 19, completed: false, page: 'lesson' },
      { title: 'Matrix multiplication, composed', duration: 17, completed: false, page: 'lesson' },
    ]},
    { title: 'Eigentheory', blurb: 'The directions a transformation leaves alone.', lessons: [
      { title: 'Eigenvectors as fixed directions', duration: 18, completed: false, page: 'lesson' },
      { title: 'Eigenvalues', duration: 14, completed: false, page: 'lesson' },
      { title: 'Diagonalization', duration: 21, completed: false, page: 'lesson' },
    ]},
  ];

  return (
    <main style={{ maxWidth: 960, margin: '0 auto', padding: '64px 24px' }}>
      {/* Breadcrumb */}
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-faint)', margin: '0 0 32px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <a href="#" onClick={e => { e.preventDefault(); onNav('home'); }} style={{ color: 'var(--color-ink-faint)', textDecoration: 'none' }}>Courses</a>
        <IconChevronRight />
        <span style={{ color: 'var(--color-ink-muted)' }}>Linear Algebra</span>
      </p>

      {/* Course header */}
      <header style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 40, alignItems: 'flex-start', marginBottom: 48 }}>
        <div style={{ width: 160, height: 160, borderRadius: 'var(--radius-md)', border: '1px solid var(--color-rule)', background: 'var(--color-surface-1)', display: 'grid', placeItems: 'center' }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 100, lineHeight: 1, color: 'var(--color-ink)' }}>{course.symbol}</span>
        </div>
        <div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-ink-faint)', margin: '0 0 8px' }}>Course</p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-h1)', color: 'var(--color-ink)', margin: '0 0 16px', lineHeight: 1.15 }}>{course.title}</h1>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-body-lg)', color: 'var(--color-ink-muted)', lineHeight: 1.7, margin: '0 0 24px', maxWidth: 560 }}>{course.description}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Badge variant="neutral">{course.difficulty}</Badge>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-ink-faint)' }}>{course.lessons} lessons · ~{course.hours}h</span>
          </div>
        </div>
      </header>

      {/* Progress */}
      <section style={{ marginBottom: 64, padding: '20px 24px', background: 'var(--color-paper-elevated)', border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 500, color: 'var(--color-ink)' }}>Your progress</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-ink-muted)' }}>3 of {course.lessons} complete</span>
        </div>
        <ProgressBar value={course.progress} />
      </section>

      {/* Modules */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        {modules.map((mod, mIdx) => (
          <div key={mod.title}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '1px solid var(--color-rule)', paddingBottom: 12, marginBottom: 4 }}>
              <div>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-ink-faint)', margin: '0 0 4px' }}>Module {mIdx + 1}</p>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-h2)', color: 'var(--color-ink)', margin: 0 }}>{mod.title}</h2>
              </div>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontStyle: 'italic', color: 'var(--color-ink-muted)', margin: 0 }}>{mod.blurb}</p>
            </div>
            <ol style={{ margin: 0, padding: 0, listStyle: 'none', borderLeft: 'none' }}>
              {mod.lessons.map((lesson, lIdx) => (
                <LessonRow key={lesson.title} lesson={lesson} index={lIdx} onNav={onNav} />
              ))}
            </ol>
          </div>
        ))}
      </section>
    </main>
  );
}

function LessonRow({ lesson, index, onNav }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <li>
      <a href="#" onClick={e => { e.preventDefault(); onNav(lesson.page); }}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '14px 8px', textDecoration: 'none', borderBottom: '1px solid var(--color-rule)', background: hovered ? 'var(--color-surface-1)' : 'transparent', borderRadius: 'var(--radius-md)', transition: 'background 150ms', margin: '0 -8px' }}>
        <span style={{ width: 28, height: 28, flexShrink: 0, borderRadius: 999, display: 'grid', placeItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 11,
          background: lesson.completed ? 'var(--color-vector-green)' : 'transparent',
          border: lesson.completed ? 'none' : '1px solid var(--color-rule)',
          color: lesson.completed ? '#fff' : 'var(--color-ink-faint)' }}>
          {lesson.completed ? <IconCheck /> : index + 1}
        </span>
        <span style={{ flex: 1, fontFamily: 'var(--font-serif)', fontSize: 'var(--text-body-lg)', color: hovered ? 'var(--color-accent)' : 'var(--color-ink)', transition: 'color 150ms' }}>{lesson.title}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--color-ink-faint)', flexShrink: 0 }}>{lesson.duration} min</span>
      </a>
    </li>
  );
}

Object.assign(window, { CoursePage });
