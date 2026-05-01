// MathViz UI Kit — Homepage

function HomePage({ onNav }) {
  const courses = [
    { title: 'Linear Algebra', symbol: 'λ', description: 'Vectors as arrows, matrices as transformations. Build geometric intuition before symbol manipulation.', lessons: 24, hours: 18, progress: 35, difficulty: 'Beginner', page: 'course' },
    { title: 'Calculus', symbol: '∫', description: 'Limits, derivatives, integrals — every concept rendered as a moving picture you can pause and inspect.', lessons: 32, hours: 26, difficulty: 'Beginner', page: 'home' },
    { title: 'Probability', symbol: 'P', description: 'From coin flips to continuous distributions. Sampling animations make the abstract feel concrete.', lessons: 19, hours: 14, difficulty: 'Intermediate', page: 'home' },
  ];

  return (
    <main>
      {/* Hero */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '96px 24px 80px' }}>
        <div style={{ maxWidth: 720 }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-accent)', margin: '0 0 16px' }}>
            Probability · Linear algebra · Calculus
          </p>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-display)', lineHeight: 1.05, fontWeight: 600, color: 'var(--color-ink)', margin: '0 0 24px', letterSpacing: '-0.02em' }}>
            Mathematics, <em>made visible.</em>
          </h1>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-body-lg)', lineHeight: 1.7, color: 'var(--color-ink-muted)', margin: '0 0 40px', maxWidth: 560 }}>
            A structured course system where every concept is paired with an animation you can scrub, pause, and play with — so the intuition lands before the formalism does.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Button variant="primary" size="lg" onClick={() => onNav('course')}>Start with Linear Algebra</Button>
            <Button variant="ghost" size="lg" onClick={() => onNav('home')}>Browse all courses →</Button>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ height: 1, background: 'var(--color-rule)' }} />
      </div>

      {/* Course grid */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 48 }}>
          <div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-ink-faint)', margin: '0 0 8px' }}>Three courses</p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-h2)', color: 'var(--color-ink)', margin: 0 }}>Built like a textbook, paced like a series.</h2>
          </div>
          <a href="#" style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--color-ink-muted)', textDecoration: 'none' }}>View all →</a>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
          {courses.map(c => <CourseCardLarge key={c.title} course={c} onNav={onNav} />)}
        </div>
      </section>

      {/* How it works */}
      <section style={{ background: 'var(--color-surface-1)', borderTop: '1px solid var(--color-rule)', borderBottom: '1px solid var(--color-rule)', padding: '80px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-ink-faint)', margin: '0 0 8px' }}>How it works</p>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-h2)', color: 'var(--color-ink)', margin: '0 0 64px', maxWidth: 560 }}>Three layers of explanation, one continuous lesson.</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 48 }}>
            {[
              { n: '1', title: 'Watch', body: 'A short, narrated Manim animation introduces the concept geometrically — the way a great teacher would draw it on a chalkboard.' },
              { n: '2', title: 'Play', body: 'An interactive widget lets you change parameters and watch the behavior shift in real time. Drag the eigenvector. Stretch the distribution.' },
              { n: '3', title: 'Prove', body: 'Only after the geometry feels obvious do we introduce the formal definition — and a small set of exercises to verify the idea has stuck.' },
            ].map(step => (
              <div key={step.n}>
                <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-md)', background: 'var(--color-paper-elevated)', border: '1px solid var(--color-rule)', display: 'grid', placeItems: 'center', marginBottom: 24 }}>
                  <span style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-h3)', color: 'var(--color-accent)', fontWeight: 600 }}>{step.n}</span>
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-h3)', color: 'var(--color-ink)', margin: '0 0 12px' }}>{step.title}</h3>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 'var(--text-body)', color: 'var(--color-ink-muted)', lineHeight: 1.6, margin: 0 }}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section style={{ maxWidth: 720, margin: '0 auto', padding: '96px 24px', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'var(--text-h3)', color: 'var(--color-ink-muted)', lineHeight: 1.4, margin: '0 0 12px' }}>
          "What we cannot see, we cannot really know. Mathematics is no exception."
        </p>
        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-ink-faint)', margin: '0 0 40px' }}>— the entire premise of this site</p>
        <Button variant="primary" size="lg" onClick={() => onNav('course')}>Choose a course</Button>
      </section>
    </main>
  );
}

function CourseCardLarge({ course, onNav }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <a href="#" onClick={e => { e.preventDefault(); onNav(course.page); }} style={{ textDecoration: 'none', display: 'block' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div style={{ background: 'var(--color-paper-elevated)', border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-md)', boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-sm)', overflow: 'hidden', transition: 'box-shadow 250ms ease' }}>
        <div style={{ height: 160, background: 'var(--color-surface-1)', borderBottom: '1px solid var(--color-rule)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 100, lineHeight: 1, color: hovered ? 'var(--color-accent)' : 'var(--color-ink)', transition: 'color 250ms ease' }}>{course.symbol}</span>
          <span style={{ position: 'absolute', top: 12, right: 12 }}><Badge variant="neutral">{course.difficulty}</Badge></span>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-h3)', color: 'var(--color-ink)', margin: '0 0 8px' }}>{course.title}</h3>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-ink-muted)', lineHeight: 1.5, margin: '0 0 20px' }}>{course.description}</p>
          <div style={{ display: 'flex', gap: 24, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-ink-faint)', marginBottom: course.progress ? 16 : 0 }}>
            <span><span style={{ color: 'var(--color-ink-muted)' }}>{course.lessons}</span> lessons</span>
            <span><span style={{ color: 'var(--color-ink-muted)' }}>~{course.hours}h</span></span>
          </div>
          {course.progress && <ProgressBar value={course.progress} showLabel />}
        </div>
      </div>
    </a>
  );
}

Object.assign(window, { HomePage });
