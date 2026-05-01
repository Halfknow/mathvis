import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import { clsx } from 'clsx';

interface InteractiveCanvasProps {
  title?: string;
  caption?: string;
  controls?: ReactNode;
  children: ReactNode;
  aspectRatio?: '16/9' | '4/3' | '1/1';
  height?: number;
  mobileFallback?: ReactNode;
}

export function InteractiveCanvas({
  title,
  caption,
  controls,
  children,
  aspectRatio,
  height,
  mobileFallback,
}: InteractiveCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = () => setIsFullscreen(!!document.fullscreenElement && document.fullscreenElement === el);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await el.requestFullscreen();
    }
  }, []);

  const content = isMobile && mobileFallback ? mobileFallback : children;

  return (
    <figure className="not-prose my-8">
      <div
        ref={containerRef}
        className={clsx(
          'overflow-hidden rounded-md border border-rule bg-paper-elevated shadow-sm',
          isFullscreen && 'rounded-none',
        )}
      >
        <header className="flex items-center justify-between gap-3 border-b border-rule px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="grid h-5 w-5 place-items-center rounded-sm bg-accent-soft">
              <span className="h-1.5 w-1.5 rounded-pill bg-accent" />
            </span>
            <span className="font-sans text-sm font-medium text-ink">
              {title ?? 'Interactive'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Reset"
              className="grid h-7 w-7 place-items-center rounded-sm text-ink-muted hover:bg-surface-1 hover:text-ink transition-colors duration-fast"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 3-6.7" />
                <polyline points="3 4 3 10 9 10" />
              </svg>
            </button>
            <button
              type="button"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              onClick={toggleFullscreen}
              className="grid h-7 w-7 place-items-center rounded-sm text-ink-muted hover:bg-surface-1 hover:text-ink transition-colors duration-fast"
            >
              {isFullscreen ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                </svg>
              )}
            </button>
          </div>
        </header>

        <div
          className={clsx(
            'relative bg-surface-1',
            !isFullscreen && aspectRatio === '16/9' && 'aspect-video',
            !isFullscreen && aspectRatio === '4/3' && 'aspect-[4/3]',
            !isFullscreen && aspectRatio === '1/1' && 'aspect-square',
            isFullscreen && 'h-screen',
          )}
          style={!aspectRatio && !isFullscreen && height ? { height: `${height}px` } : undefined}
        >
          {content}
        </div>

        {controls && (
          <div className="border-t border-rule bg-paper-elevated px-4 py-3">
            {controls}
          </div>
        )}
      </div>

      {caption && (
        <figcaption className="mt-3 font-serif text-sm italic leading-relaxed text-ink-muted">
          <span className="font-sans not-italic font-semibold text-ink-faint mr-2 uppercase tracking-wider text-xs">
            Try it
          </span>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
