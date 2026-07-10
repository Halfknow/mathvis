import { useState, useRef, useEffect, useCallback, useMemo } from 'react';

interface RelatedRatesVisProps {
  width?: number;
  height?: number;
}

type SceneType = 'ladder' | 'balloon';

/* ------------------------------------------------------------------ */
/*  Ladder constants                                                   */
/* ------------------------------------------------------------------ */
const LADDER_LENGTH = 10; // L
const LADDER_X_MIN = 2; // x range: bottom of ladder slides from here
const LADDER_X_MAX = 9.5; // to here (keep y positive)

/* ------------------------------------------------------------------ */
/*  Balloon constants                                                  */
/* ------------------------------------------------------------------ */
const BALLOON_R_MIN = 0.5;
const BALLOON_R_MAX = 5;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
const fmt = (v: number, d = 2) => v.toFixed(d);

/** Arrow marker id — must be unique per SVG to avoid collisions */
const ARROW_ID_GREEN = 'rr-arrow-green';
const ARROW_ID_ACCENT = 'rr-arrow-accent';

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */
export function RelatedRatesVis({
  width = 640,
  height = 400,
}: RelatedRatesVisProps) {
  const [scene, setScene] = useState<SceneType>('ladder');
  const [t, setT] = useState(0.3); // animation parameter [0, 1]
  const [playing, setPlaying] = useState(false);
  const [rateInput, setRateInput] = useState(2); // dx/dt for ladder, dV/dt for balloon

  const animRef = useRef<number | null>(null);
  const tRef = useRef(t);

  // Keep ref in sync so the animation loop reads the latest value
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  /* -------------------------------------------------------------- */
  /*  Play / Pause animation                                         */
  /* -------------------------------------------------------------- */
  const tick = useCallback(() => {
    const next = tRef.current + 0.002;
    if (next >= 1) {
      tRef.current = 1;
      setT(1);
      setPlaying(false);
      animRef.current = null;
      return;
    }
    tRef.current = next;
    setT(next);
    animRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (playing) {
      animRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    };
  }, [playing, tick]);

  const handlePlayPause = useCallback(() => {
    if (playing) {
      setPlaying(false);
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
    } else {
      if (t >= 1) {
        // restart from beginning
        tRef.current = 0;
        setT(0);
      }
      setPlaying(true);
    }
  }, [playing, t]);

  const handleSceneChange = useCallback((s: SceneType) => {
    setPlaying(false);
    if (animRef.current !== null) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    setScene(s);
    setT(0.3);
    setRateInput(s === 'ladder' ? 2 : 50);
  }, []);

  /* -------------------------------------------------------------- */
  /*  Ladder computations                                            */
  /* -------------------------------------------------------------- */
  const ladderState = useMemo(() => {
    const x = LADDER_X_MIN + t * (LADDER_X_MAX - LADDER_X_MIN);
    const y = Math.sqrt(Math.max(0.01, LADDER_LENGTH * LADDER_LENGTH - x * x));
    const dxdt = rateInput; // known rate
    // From x² + y² = L² → 2x dx/dt + 2y dy/dt = 0 → dy/dt = -x/y · dx/dt
    const dydt = y > 0.01 ? -(x / y) * dxdt : 0;
    return { x, y, dxdt, dydt };
  }, [t, rateInput]);

  /* -------------------------------------------------------------- */
  /*  Balloon computations                                           */
  /* -------------------------------------------------------------- */
  const balloonState = useMemo(() => {
    const r = BALLOON_R_MIN + t * (BALLOON_R_MAX - BALLOON_R_MIN);
    const V = (4 / 3) * Math.PI * r * r * r;
    const dVdt = rateInput; // known rate (inflation)
    // V = 4/3 π r³ → dV/dt = 4πr² dr/dt → dr/dt = dV/dt / (4πr²)
    const drdt = r > 0.01 ? dVdt / (4 * Math.PI * r * r) : 0;
    return { r, V, dVdt, drdt };
  }, [t, rateInput]);

  /* -------------------------------------------------------------- */
  /*  SVG scene dimensions                                           */
  /* -------------------------------------------------------------- */
  const pad = { top: 48, right: 24, bottom: 24, left: 24 };
  const sceneW = width - pad.left - pad.right;
  const sceneH = height - pad.top - pad.bottom;

  /* -------------------------------------------------------------- */
  /*  Ladder SVG                                                     */
  /* -------------------------------------------------------------- */
  const ladderSvg = useMemo(() => {
    const s = ladderState;
    // Map physical coords to SVG coords
    // physical: x in [0, LADDER_LENGTH], y in [0, LADDER_LENGTH]
    const scale = Math.min(sceneW, sceneH) / (LADDER_LENGTH * 1.1);
    const originX = pad.left + 40; // wall offset
    const originY = pad.top + sceneH - 20; // ground offset

    const px = (x: number) => originX + x * scale;
    const py = (y: number) => originY - y * scale;

    // Ladder endpoints
    const bx = px(s.x); // bottom of ladder (on ground)
    const by = py(0);
    const tx = px(0); // top of ladder (on wall)
    const ty = py(s.y);

    // Wall
    const wallTop = py(LADDER_LENGTH * 1.05);
    const wallBot = py(0);
    // Ground
    const groundLeft = px(0);
    const groundRight = px(LADDER_LENGTH * 1.05);

    // Velocity arrows — scale factor for visual
    const arrowScale = 12;
    // dx/dt arrow: horizontal at bottom of ladder, pointing right
    const dxArrowLen = s.dxdt * arrowScale;
    // dy/dt arrow: vertical at top of ladder, pointing down (negative dy/dt)
    const dyArrowLen = s.dydt * arrowScale;

    // Right-angle marker at corner
    const cornerSize = 8;

    return (
      <>
        {/* Defs for arrow markers */}
        <defs>
          <marker id={ARROW_ID_GREEN} markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="var(--color-vector-green)" />
          </marker>
          <marker id={ARROW_ID_ACCENT} markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="var(--color-accent)" />
          </marker>
        </defs>

        {/* Wall */}
        <line x1={originX} y1={wallTop} x2={originX} y2={wallBot} stroke="var(--color-ink-muted)" strokeWidth={3} />
        {/* Wall hatching */}
        {Array.from({ length: 12 }, (_, i) => {
          const yy = wallBot - i * (wallBot - wallTop) / 12;
          return <line key={`h${i}`} x1={originX - 8} y1={yy} x2={originX} y2={yy + 8} stroke="var(--color-ink-faint)" strokeWidth={0.8} />;
        })}

        {/* Ground */}
        <line x1={groundLeft} y1={originY} x2={groundRight} y2={originY} stroke="var(--color-ink-muted)" strokeWidth={3} />

        {/* Right-angle marker */}
        <polyline
          points={`${originX + cornerSize},${originY} ${originX + cornerSize},${originY - cornerSize} ${originX},${originY - cornerSize}`}
          fill="none"
          stroke="var(--color-ink-faint)"
          strokeWidth={1}
        />

        {/* Ladder */}
        <line x1={bx} y1={by} x2={tx} y2={ty} stroke="var(--color-vector-blue)" strokeWidth={4} strokeLinecap="round" />

        {/* Dashed lines showing x and y distances */}
        <line x1={originX} y1={originY} x2={bx} y2={by} stroke="var(--color-vector-blue)" strokeWidth={1} strokeDasharray="4,3" opacity={0.5} />
        <line x1={originX} y1={originY} x2={tx} y2={ty} stroke="var(--color-vector-blue)" strokeWidth={1} strokeDasharray="4,3" opacity={0.5} />

        {/* x label */}
        <text x={(originX + bx) / 2} y={originY + 18} textAnchor="middle" fill="var(--color-vector-blue)" style={{ fontFamily: 'var(--font-sans)', fontSize: 13 }}>
          x = {fmt(s.x)}
        </text>

        {/* y label */}
        <text x={originX - 28} y={(originY + ty) / 2} textAnchor="middle" fill="var(--color-vector-blue)" style={{ fontFamily: 'var(--font-sans)', fontSize: 13 }} transform={`rotate(-90, ${originX - 28}, ${(originY + ty) / 2})`}>
          y = {fmt(s.y)}
        </text>

        {/* L label on the ladder itself */}
        {
          (() => {
            const mx = (bx + tx) / 2 + 10;
            const my = (by + ty) / 2 - 6;
            const angle = Math.atan2(ty - by, tx - bx) * 180 / Math.PI;
            return (
              <text x={mx} y={my} textAnchor="middle" fill="var(--color-ink-muted)" style={{ fontFamily: 'var(--font-sans)', fontSize: 11 }} transform={`rotate(${angle}, ${mx}, ${my})`}>
                L = {LADDER_LENGTH}
              </text>
            );
          })()
        }

        {/* dx/dt arrow (green — known) */}
        {Math.abs(dxArrowLen) > 2 && (
          <line
            x1={bx} y1={by - 6}
            x2={bx + dxArrowLen} y2={by - 6}
            stroke="var(--color-vector-green)" strokeWidth={2.5}
            markerEnd={`url(#${ARROW_ID_GREEN})`}
          />
        )}
        <text x={bx + dxArrowLen / 2} y={by - 14} textAnchor="middle" fill="var(--color-vector-green)" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          dx/dt = {fmt(s.dxdt)}
        </text>

        {/* dy/dt arrow (accent — unknown / computed) */}
        {Math.abs(dyArrowLen) > 2 && (
          <line
            x1={tx + 6} y1={ty}
            x2={tx + 6} y2={ty - dyArrowLen}
            stroke="var(--color-accent)" strokeWidth={2.5}
            markerEnd={`url(#${ARROW_ID_ACCENT})`}
          />
        )}
        <text x={tx + 20} y={ty - dyArrowLen / 2} textAnchor="start" fill="var(--color-accent)" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          dy/dt = {fmt(s.dydt)}
        </text>

        {/* Ladder endpoints — dots */}
        <circle cx={bx} cy={by} r={4} fill="var(--color-vector-blue)" />
        <circle cx={tx} cy={ty} r={4} fill="var(--color-vector-blue)" />
      </>
    );
  }, [ladderState, sceneW, sceneH, pad, width, height]);

  /* -------------------------------------------------------------- */
  /*  Balloon SVG                                                    */
  /* -------------------------------------------------------------- */
  const balloonSvg = useMemo(() => {
    const s = balloonState;
    const cx = pad.left + sceneW / 2;
    const cy = pad.top + sceneH / 2;
    const maxPixelR = Math.min(sceneW, sceneH) / 2 - 30;
    const pixelR = BALLOON_R_MIN + t * (BALLOON_R_MAX - BALLOON_R_MIN);
    const pr = (pixelR / BALLOON_R_MAX) * maxPixelR;

    // dr/dt visual arrow — along radius
    const drArrowScale = 40;
    const drArrowLen = s.drdt * drArrowScale;

    return (
      <>
        {/* Defs for arrow markers */}
        <defs>
          <marker id={ARROW_ID_GREEN} markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="var(--color-vector-green)" />
          </marker>
          <marker id={ARROW_ID_ACCENT} markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <path d="M0,0 L8,3 L0,6 Z" fill="var(--color-accent)" />
          </marker>
        </defs>

        {/* Balloon circle */}
        <circle
          cx={cx} cy={cy} r={pr}
          fill="var(--color-accent-soft)" fillOpacity={0.35}
          stroke="var(--color-accent)" strokeWidth={2}
        />

        {/* Radius line */}
        <line
          x1={cx} y1={cy}
          x2={cx + pr} y2={cy}
          stroke="var(--color-vector-blue)" strokeWidth={2}
        />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={3} fill="var(--color-vector-blue)" />

        {/* r label */}
        <text x={cx + pr / 2} y={cy - 10} textAnchor="middle" fill="var(--color-vector-blue)" style={{ fontFamily: 'var(--font-sans)', fontSize: 13 }}>
          r = {fmt(s.r)}
        </text>

        {/* dr/dt arrow — extends from edge of balloon outward */}
        {Math.abs(drArrowLen) > 2 && (
          <line
            x1={cx + pr} y1={cy}
            x2={cx + pr + drArrowLen} y2={cy}
            stroke="var(--color-accent)" strokeWidth={2.5}
            markerEnd={`url(#${ARROW_ID_ACCENT})`}
          />
        )}
        <text x={cx + pr + drArrowLen / 2} y={cy + 18} textAnchor="middle" fill="var(--color-accent)" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          dr/dt = {fmt(s.drdt, 3)}
        </text>

        {/* dV/dt label — inflation rate (known, green) */}
        <text x={cx} y={cy + pr + 24} textAnchor="middle" fill="var(--color-vector-green)" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
          dV/dt = {fmt(s.dVdt, 1)} (inflation)
        </text>

        {/* Volume readout */}
        <text x={cx} y={cy + 6} textAnchor="middle" fill="var(--color-ink-muted)" style={{ fontFamily: 'var(--font-sans)', fontSize: 11 }}>
          V = {fmt(s.V, 1)}
        </text>

        {/* Concentric ring hint for 3D sphere */}
        <ellipse
          cx={cx} cy={cy} rx={pr * 0.85} ry={pr * 0.3}
          fill="none" stroke="var(--color-accent)" strokeWidth={0.6} strokeDasharray="3,3" opacity={0.4}
        />
      </>
    );
  }, [balloonState, t, sceneW, sceneH, pad]);

  /* -------------------------------------------------------------- */
  /*  Equation readout                                               */
  /* -------------------------------------------------------------- */
  const equationBlock = useMemo(() => {
    if (scene === 'ladder') {
      const s = ladderState;
      return (
        <div className="space-y-1 font-mono text-[11px] leading-relaxed">
          <div>
            <span className="text-ink-muted">Governing:</span>{' '}
            <span className="text-vector-blue">x{'\u00B2'} + y{'\u00B2'} = L{'\u00B2'}</span>
            <span className="text-ink-faint"> ({fmt(s.x)}{'\u00B2'} + {fmt(s.y)}{'\u00B2'} = {LADDER_LENGTH}{'\u00B2'})</span>
          </div>
          <div>
            <span className="text-ink-muted">Differentiate w.r.t. t:</span>{' '}
            <span>2x</span>
            <span className="text-vector-green"> dx/dt</span>
            {' + 2y '}
            <span className="text-accent"> dy/dt</span>
            {' = 0'}
          </div>
          <div>
            <span className="text-ink-muted">Solve:</span>{' '}
            <span className="text-accent">dy/dt</span>
            {' = -(x/y) \u00B7 '}
            <span className="text-vector-green">dx/dt</span>
            {' = -('}{fmt(s.x)}{'/'}{fmt(s.y)}){' \u00B7 '}{fmt(s.dxdt)}{' = '}
            <span className="text-accent font-bold">{fmt(s.dydt)}</span>
          </div>
        </div>
      );
    }

    const s = balloonState;
    return (
      <div className="space-y-1 font-mono text-[11px] leading-relaxed">
        <div>
          <span className="text-ink-muted">Governing:</span>{' '}
          <span className="text-vector-blue">V = 4/3 {'\u03C0'}r{'\u00B3'}</span>
          <span className="text-ink-faint"> (V = {fmt(s.V, 1)})</span>
        </div>
        <div>
          <span className="text-ink-muted">Differentiate w.r.t. t:</span>{' '}
          <span className="text-vector-green">dV/dt</span>
          {' = 4'}{'\u03C0'}{'r'}{'\u00B2'}{' \u00B7 '}
          <span className="text-accent">dr/dt</span>
        </div>
        <div>
          <span className="text-ink-muted">Solve:</span>{' '}
          <span className="text-accent">dr/dt</span>
          {' = '}
          <span className="text-vector-green">dV/dt</span>
          {' / (4'}{'\u03C0'}{'r'}{'\u00B2'}{') = '}{fmt(s.dVdt, 1)}{' / (4'}{'\u03C0'}{' \u00B7 '}{fmt(s.r)}{'\u00B2'}{') = '}
          <span className="text-accent font-bold">{fmt(s.drdt, 3)}</span>
        </div>
      </div>
    );
  }, [scene, ladderState, balloonState]);

  /* -------------------------------------------------------------- */
  /*  Readout values bar                                             */
  /* -------------------------------------------------------------- */
  const valuesBar = useMemo(() => {
    if (scene === 'ladder') {
      const s = ladderState;
      return (
        <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px]">
          <span className="text-vector-blue">x = {fmt(s.x)}</span>
          <span className="text-vector-blue">y = {fmt(s.y)}</span>
          <span className="text-vector-green">dx/dt = {fmt(s.dxdt)}</span>
          <span className="text-accent">dy/dt = {fmt(s.dydt)}</span>
        </div>
      );
    }
    const s = balloonState;
    return (
      <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[11px]">
        <span className="text-vector-blue">r = {fmt(s.r)}</span>
        <span className="text-vector-blue">V = {fmt(s.V, 1)}</span>
        <span className="text-vector-green">dV/dt = {fmt(s.dVdt, 1)}</span>
        <span className="text-accent">dr/dt = {fmt(s.drdt, 3)}</span>
      </div>
    );
  }, [scene, ladderState, balloonState]);

  /* -------------------------------------------------------------- */
  /*  Rate input label                                               */
  /* -------------------------------------------------------------- */
  const rateInputLabel = scene === 'ladder' ? 'dx/dt' : 'dV/dt';
  const rateMin = scene === 'ladder' ? 0.5 : 5;
  const rateMax = scene === 'ladder' ? 5 : 200;
  const rateStep = scene === 'ladder' ? 0.1 : 1;

  /* -------------------------------------------------------------- */
  /*  Render                                                         */
  /* -------------------------------------------------------------- */
  return (
    <div className="flex h-full w-full flex-col">
      {/* Title bar with governing equation */}
      <div className="flex items-center justify-between border-b border-rule bg-surface-1 px-4 py-2">
        <span className="font-sans text-[11px] text-ink-muted">
          {scene === 'ladder' ? 'x\u00B2 + y\u00B2 = L\u00B2  (Ladder sliding)' : 'V = (4/3)\u03C0r\u00B3  (Inflating balloon)'}
        </span>
        <span className="font-mono text-[10px] text-ink-faint">
          t = {fmt(t, 3)}
        </span>
      </div>

      {/* Main SVG scene */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ background: 'var(--color-paper)' }}
      >
        {scene === 'ladder' ? ladderSvg : balloonSvg}
      </svg>

      {/* Equation readout */}
      <div className="border-t border-rule bg-paper-elevated px-4 py-2">
        {equationBlock}
      </div>

      {/* Control bar */}
      <div className="flex flex-wrap items-center gap-4 border-t border-rule bg-paper-elevated px-4 py-3">
        {/* Scene toggle */}
        <div className="flex gap-1">
          {(['ladder', 'balloon'] as SceneType[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSceneChange(s)}
              className={`rounded-sm border px-2 py-0.5 font-sans text-[11px] capitalize transition-colors duration-fast ${
                s === scene
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-rule bg-paper-elevated text-ink-muted hover:bg-surface-1'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Play / Pause */}
        <button
          type="button"
          onClick={handlePlayPause}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-accent bg-accent-soft text-accent transition-colors duration-fast hover:bg-accent hover:text-paper-elevated"
          aria-label={playing ? 'Pause' : 'Play'}
        >
          {playing ? (
            <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor"><rect x="0" y="0" width="3.5" height="12" rx="1" /><rect x="6.5" y="0" width="3.5" height="12" rx="1" /></svg>
          ) : (
            <svg width="10" height="12" viewBox="0 0 10 12" fill="currentColor"><polygon points="0,0 10,6 0,12" /></svg>
          )}
        </button>

        {/* Time slider */}
        <label className="flex items-center gap-2 font-sans text-xs text-ink-muted">
          t
          <input
            type="range"
            min={0}
            max={1}
            step={0.002}
            value={t}
            onChange={(e) => {
              setT(+e.target.value);
              tRef.current = +e.target.value;
            }}
            className="h-1 w-28 cursor-pointer accent-[var(--color-accent)]"
          />
        </label>

        {/* Rate input */}
        <label className="flex items-center gap-2 font-sans text-xs text-ink-muted">
          {rateInputLabel}
          <input
            type="range"
            min={rateMin}
            max={rateMax}
            step={rateStep}
            value={rateInput}
            onChange={(e) => setRateInput(+e.target.value)}
            className="h-1 w-24 cursor-pointer accent-[var(--color-vector-green)]"
          />
          <span className="font-mono text-xs text-vector-green w-10">{fmt(rateInput, scene === 'ladder' ? 1 : 0)}</span>
        </label>

        {/* Live values */}
        <div className="ml-auto">{valuesBar}</div>
      </div>

      {/* Legend strip */}
      <div className="flex items-center gap-4 border-t border-rule bg-surface-1 px-4 py-1 font-sans text-[10px] text-ink-faint">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded-sm" style={{ background: 'var(--color-vector-green)' }} />
          known rate
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded-sm" style={{ background: 'var(--color-accent)' }} />
          computed rate (chain rule)
        </span>
      </div>
    </div>
  );
}
