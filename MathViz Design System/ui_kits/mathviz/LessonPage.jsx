// MathViz UI Kit — Lesson Page

function LessonPage({ onNav }) {
  const [showHint, setShowHint] = React.useState(false);
  const [showAnswer, setShowAnswer] = React.useState(false);
  const [showHint2, setShowHint2] = React.useState(false);
  const [showAnswer2, setShowAnswer2] = React.useState(false);
  const proseRef = React.useRef(null);

  // KaTeX auto-render after mount/state changes
  React.useEffect(() => {
    const tryRender = () => {
      if (window.renderMathInElement && window.katex && proseRef.current) {
        try {
          window.renderMathInElement(proseRef.current, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$',  right: '$',  display: false },
              { left: '\\(', right: '\\)', display: false },
              { left: '\\[', right: '\\]', display: true },
            ],
            throwOnError: false,
          });
        } catch (e) { /* ignore */ }
        return true;
      }
      return false;
    };
    if (!tryRender()) {
      // Retry once KaTeX finishes loading
      const t = setInterval(() => { if (tryRender()) clearInterval(t); }, 100);
      const stop = setTimeout(() => clearInterval(t), 5000);
      return () => { clearInterval(t); clearTimeout(stop); };
    }
  }, [showHint, showAnswer, showHint2, showAnswer2]);

  const sidebarModules = [
    { title: 'Vector Spaces', lessons: [
      { title: 'Vectors as arrows', duration: 14, completed: true, active: true },
      { title: 'Vector addition, geometrically', duration: 12, completed: true, active: false },
      { title: 'Scalar multiplication', duration: 9, completed: true, active: false },
      { title: 'Linear combinations', duration: 16, completed: false, active: false },
      { title: 'Spans', duration: 18, completed: false, active: false },
    ]},
    { title: 'Linear Transformations', lessons: [
      { title: 'Functions on vectors', duration: 11, completed: false, active: false },
      { title: 'Matrices as transformations', duration: 19, completed: false, active: false },
    ]},
  ];

  return (
    <div style={{ display: 'flex', maxWidth: 1280, margin: '0 auto' }}>
      {/* Sidebar */}
      <aside style={{ width: 260, flexShrink: 0, borderRight: '1px solid var(--color-rule)', background: 'var(--color-surface-1)', minHeight: 'calc(100vh - 56px)', padding: '0 0 64px', position: 'sticky', top: 56, height: 'calc(100vh - 56px)', overflowY: 'auto' }}>
        <div style={{ padding: '32px 24px 16px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-ink-faint)', margin: '0 0 6px' }}>Course</p>
          <a href="#" onClick={e => { e.preventDefault(); onNav('course'); }} style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-h3)', fontWeight: 600, color: 'var(--color-ink)', textDecoration: 'none' }}>Linear Algebra</a>
        </div>
        <nav style={{ padding: '0 12px' }}>
          {sidebarModules.map((mod, mIdx) => (
            <div key={mod.title} style={{ marginBottom: 20 }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-ink-faint)', margin: '0 0 4px', padding: '0 12px' }}>{mIdx + 1}. {mod.title}</p>
              <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
                {mod.lessons.map(lesson => (
                  <li key={lesson.title}>
                    <a href="#" onClick={e => e.preventDefault()} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                      padding: '6px 12px', borderRadius: 'var(--radius-md)',
                      fontFamily: 'var(--font-sans)', fontSize: 13, textDecoration: 'none',
                      background: lesson.active ? 'var(--color-accent-soft)' : 'transparent',
                      color: lesson.active ? 'var(--color-ink)' : 'var(--color-ink-muted)',
                      fontWeight: lesson.active ? 500 : 400,
                      transition: 'background 150ms',
                    }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                        {lesson.completed && !lesson.active && (
                          <span style={{ color: 'var(--color-vector-green)', flexShrink: 0 }}><IconCheck /></span>
                        )}
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lesson.title}</span>
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-faint)', flexShrink: 0 }}>{lesson.duration}m</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, padding: '48px 48px 96px', minWidth: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '680px 1fr', gap: 48, maxWidth: 960 }}>
          {/* Prose column */}
          <article ref={proseRef}>
            {/* Lesson progress */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
              {[1,2,3,4,5,6].map(n => (
                <div key={n} style={{ width: n === 1 ? 24 : 8, height: 6, borderRadius: 999, background: n <= 3 ? 'var(--color-accent)' : 'var(--color-surface-2)', transition: 'width 250ms, background 250ms' }} />
              ))}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--color-ink-faint)', marginLeft: 4 }}>1 of 6 · Vector Spaces</span>
            </div>

            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-h1)', lineHeight: 1.15, fontWeight: 600, color: 'var(--color-ink)', margin: '0 0 32px' }}>Vectors as Arrows</h1>

            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-body-lg)', lineHeight: 1.7, color: 'var(--color-ink)', margin: '0 0 24px' }}>
              Before a vector is a list of numbers, it is an <strong>arrow</strong> — pointing from somewhere, in some direction, with some length. Almost every theorem you'll meet later has a geometric shadow you can see, if you train yourself to look for it.
            </p>

            {/* Prereqs */}
            <div style={{ background: 'var(--color-surface-1)', border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-md)', padding: '14px 18px', marginBottom: 32 }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-ink-faint)', margin: '0 0 10px' }}>Prerequisites</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--color-vector-green)' }}><IconCheck /></span>
                <a href="#" style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-accent)' }}>Coordinate plane basics</a>
              </div>
            </div>

            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-h2)', fontWeight: 600, color: 'var(--color-ink)', margin: '0 0 16px' }}>What an arrow knows</h2>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-body-lg)', lineHeight: 1.7, color: 'var(--color-ink)', margin: '0 0 24px' }}>
              An arrow on the page captures two pieces of information at once: a <strong>direction</strong> and a <strong>magnitude</strong>. That's it. It does not remember where its tail starts — and this freedom is what gives vectors their power.
            </p>

            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-body-lg)', lineHeight: 1.7, color: 'var(--color-ink)', margin: '0 0 24px' }}>
              {`Once we choose a coordinate system, an arrow in the plane can be written as an ordered pair $\\vec{v} = (v_x, v_y)$. Its length — the magnitude — follows from the Pythagorean theorem:`}
            </p>

            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-body-lg)', lineHeight: 1.7, color: 'var(--color-ink)', margin: '0 0 24px', textAlign: 'center' }}>
              {`$$ \\| \\vec{v} \\| = \\sqrt{v_x^2 + v_y^2} $$`}
            </p>

            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-body-lg)', lineHeight: 1.7, color: 'var(--color-ink)', margin: '0 0 24px' }}>
              {`Two vectors $\\vec{u}$ and $\\vec{v}$ are equal precisely when their components agree: $u_x = v_x$ and $u_y = v_y$. The starting point of the arrow does not enter the comparison.`}
            </p>

            {/* Video placeholder */}
            <div style={{ border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 32 }}>
              <div style={{ background: 'var(--color-ink)', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
                <span style={{ position: 'absolute', bottom: 12, left: 16, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Manim · 2:14</span>
              </div>
              <div style={{ padding: '12px 16px', background: 'var(--color-surface-2)' }}>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-ink-muted)', margin: 0, fontStyle: 'italic' }}>Three arrows of the same vector, drawn from different starting points. They are equal — vectors don't remember their tails.</p>
              </div>
            </div>

            {/* Interactive canvas placeholder */}
            <div style={{ border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 32 }}>
              <div style={{ background: 'var(--color-surface-1)', padding: '8px 16px', borderBottom: '1px solid var(--color-rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 500, color: 'var(--color-ink-muted)' }}>Free vectors</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['Reset', 'Fullscreen'].map(l => (
                    <button key={l} style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-ink-faint)', background: 'none', border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-sm)', padding: '3px 10px', cursor: 'pointer' }}>{l}</button>
                  ))}
                </div>
              </div>
              <div style={{ background: 'var(--color-paper)', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                {/* Simple SVG arrow demo */}
                <svg width="340" height="160" viewBox="0 0 340 160">
                  <defs>
                    <marker id="arrowB" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#3b6cb7"/></marker>
                    <marker id="arrowG" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#4f8a5b"/></marker>
                    <marker id="arrowA" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#c8693d"/></marker>
                  </defs>
                  {/* Grid */}
                  {[40,80,120,160,200,240,280,320].map(x => <line key={x} x1={x} y1="0" x2={x} y2="160" stroke="#e8e3d8" strokeWidth="1"/>)}
                  {[40,80,120].map(y => <line key={y} x1="0" y1={y} x2="340" y2={y} stroke="#e8e3d8" strokeWidth="1"/>)}
                  {/* Three same vectors from different start points */}
                  <line x1="40" y1="120" x2="96" y2="68" stroke="#3b6cb7" strokeWidth="2.5" markerEnd="url(#arrowB)"/>
                  <line x1="140" y1="100" x2="196" y2="48" stroke="#4f8a5b" strokeWidth="2.5" markerEnd="url(#arrowG)"/>
                  <line x1="220" y1="140" x2="276" y2="88" stroke="#c8693d" strokeWidth="2.5" markerEnd="url(#arrowA)"/>
                  <text x="100" y="145" fontFamily="var(--font-mono)" fontSize="10" fill="#8b91a7">same vector, three origins</text>
                </svg>
              </div>
              <div style={{ padding: '10px 16px', background: 'var(--color-surface-2)', borderTop: '1px solid var(--color-rule)' }}>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-ink-muted)', margin: 0, fontStyle: 'italic' }}>All three arrows represent the same vector. Translation does not change a vector.</p>
              </div>
            </div>

            {/* Key Insight */}
            <aside style={{ borderLeft: '2px solid var(--color-accent)', paddingLeft: 24, paddingTop: 4, paddingBottom: 4, margin: '32px 0' }}>
              <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-accent)', margin: '0 0 8px' }}>Key insight</p>
              <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'var(--text-h3)', lineHeight: 1.35, color: 'var(--color-ink)', margin: 0 }}>
                A vector is the <strong>equivalence class</strong> of all arrows with the same direction and length. The coordinates we will introduce later are one specific representative — convenient, but never the whole story.
              </p>
            </aside>

            {/* Exercises */}
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-h2)', fontWeight: 600, color: 'var(--color-ink)', margin: '48px 0 24px' }}>Practice</h2>

            <ExerciseCard
              number={1}
              prompt={<>Two arrows are drawn on the plane. The first goes from <code style={{fontFamily:'var(--font-mono)',fontSize:'0.9em',background:'var(--color-surface-2)',padding:'0.1em 0.35em',borderRadius:4}}>(0, 0)</code> to <code style={{fontFamily:'var(--font-mono)',fontSize:'0.9em',background:'var(--color-surface-2)',padding:'0.1em 0.35em',borderRadius:4}}>(3, 1)</code>. The second goes from <code style={{fontFamily:'var(--font-mono)',fontSize:'0.9em',background:'var(--color-surface-2)',padding:'0.1em 0.35em',borderRadius:4}}>(2, 4)</code> to <code style={{fontFamily:'var(--font-mono)',fontSize:'0.9em',background:'var(--color-surface-2)',padding:'0.1em 0.35em',borderRadius:4}}>(5, 5)</code>. Do they represent the same vector?</>}
              hint={<>A vector is determined by how far it travels in <em>x</em> and <em>y</em>, regardless of where it starts. Compute Δx and Δy for each arrow.</>}
              answer={<>{`Yes. Both arrows have $\\Delta x = 3$ and $\\Delta y = 1$, so each represents the vector $\\vec{v} = (3, 1)$. Different tails, same vector.`}</>}
              showHint={showHint} setShowHint={setShowHint}
              showAnswer={showAnswer} setShowAnswer={setShowAnswer}
            />
            <ExerciseCard
              number={2}
              prompt={<>{`Sketch three different arrows that all represent the vector $\\vec{w} = (-1, 2)$. What is the same about them? What is different?`}</>}
              answer={<>Each arrow moves left 1 and up 2 from its tail to its head. The direction and length are identical; only the location of the tail differs.</>}
              showHint={showHint2} setShowHint={setShowHint2}
              showAnswer={showAnswer2} setShowAnswer={setShowAnswer2}
            />

            {/* Next lesson */}
            <div style={{ marginTop: 64, paddingTop: 24, borderTop: '1px solid var(--color-rule)', display: 'flex', justifyContent: 'flex-end' }}>
              <a href="#" onClick={e => e.preventDefault()} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--color-accent)', textDecoration: 'none' }}>
                Vector addition, geometrically <IconChevronRight />
              </a>
            </div>
          </article>

          {/* Right gutter */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ position: 'sticky', top: 80, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'var(--color-paper-elevated)', border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-md)', padding: '14px 16px', boxShadow: 'var(--shadow-sm)' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-ink-faint)', margin: '0 0 8px' }}>In this lesson</p>
                {['What an arrow knows', 'Drag it yourself', 'When coordinates enter'].map(s => (
                  <a key={s} href="#" onClick={e => e.preventDefault()} style={{ display: 'block', fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--color-ink-muted)', textDecoration: 'none', padding: '3px 0', lineHeight: 1.5 }}>{s}</a>
                ))}
              </div>
              <div style={{ background: 'var(--color-paper-elevated)', border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-md)', padding: '14px 16px', boxShadow: 'var(--shadow-sm)' }}>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-ink-faint)', margin: '0 0 6px' }}>Lesson 1 of 6</p>
                <ProgressBar value={16} />
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--color-ink-faint)', margin: '6px 0 0' }}>14 min read</p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function ExerciseCard({ number, prompt, hint, answer, showHint, setShowHint, showAnswer, setShowAnswer }) {
  return (
    <div style={{ border: '1px solid var(--color-rule)', borderRadius: 'var(--radius-md)', background: 'var(--color-paper-elevated)', padding: '20px 24px', marginBottom: 16 }}>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-accent)', margin: '0 0 12px' }}>Exercise {number}</p>
      <p style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--text-body-lg)', lineHeight: 1.7, color: 'var(--color-ink)', margin: '0 0 16px' }}>{prompt}</p>
      <div style={{ display: 'flex', gap: 20 }}>
        {hint && (
          <button onClick={() => setShowHint(!showHint)} style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-ink-muted)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline', textDecorationColor: 'var(--color-rule)', textUnderlineOffset: 3 }}>
            {showHint ? 'Hide hint' : 'Show hint'}
          </button>
        )}
        <button onClick={() => setShowAnswer(!showAnswer)} style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--color-accent)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: 3 }}>
          {showAnswer ? 'Hide answer' : 'Show answer'}
        </button>
      </div>
      {showHint && hint && (
        <div style={{ marginTop: 14, background: 'var(--color-surface-1)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-ink-faint)', margin: '0 0 6px' }}>Hint</p>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, lineHeight: 1.6, color: 'var(--color-ink-muted)', margin: 0 }}>{hint}</p>
        </div>
      )}
      {showAnswer && (
        <div style={{ marginTop: 14, background: 'var(--color-accent-soft)', borderRadius: 'var(--radius-md)', padding: '12px 16px' }}>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-accent)', margin: '0 0 6px' }}>Answer</p>
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, lineHeight: 1.6, color: 'var(--color-ink)', margin: 0 }}>{answer}</p>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { LessonPage });
