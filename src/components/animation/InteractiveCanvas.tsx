import { useState, type ReactNode } from 'react';
import { clsx } from 'clsx';

interface InteractiveCanvasProps {
  title?: string;
  caption?: string;
  controls?: ReactNode;     // sliders, toggles, etc.
  children: ReactNode;       // the actual canvas (Three.js / D3 / SVG)
  aspectRatio?: '16/9' | '4/3' | '1/1';
  height?: number;            // optional fixed height in px
}

/**
 * InteractiveCanvas — a framed slot for any browser-rendered animation
 * (Three.js scene, D3 chart, SVG diagram). Provides a consistent frame,
 * caption styling, and a controls slot.
 *
 * The actual rendering technology (R3F, D3, custom canvas) lives inside
 * `children` — this component only provides the container.
 */
export function InteractiveCanvas({
  title,
  caption,
  controls,
  children,
  aspectRatio,
  height,
}: InteractiveCanvasProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <figure className="not-prose my-8">
      <div className="overflow-hidden rounded-md border border-rule bg-paper-elevated shadow-sm">
        {(title || true) && (
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
                className="grid h-7 w-7 place-items-center rounded-sm text-ink-muted hover:bg-surface-1 hover:text-ink"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 3-6.7" />
                  <polyline points="3 4 3 10 9 10" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Fullscreen"
                onClick={() => setIsFullscreen((s) => !s)}
                className="grid h-7 w-7 place-items-center rounded-sm text-ink-muted hover:bg-surface-1 hover:text-ink"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3h6v6M21 21h-6v-6M21 3l-7 7M3 21l7-7" />
                </svg>
              </button>
            </div>
          </header>
        )}

        <div
          className={clsx(
            'relative bg-surface-1',
            aspectRatio === '16/9' && 'aspect-video',
            aspectRatio === '4/3' && 'aspect-[4/3]',
            aspectRatio === '1/1' && 'aspect-square',
          )}
          style={!aspectRatio && height ? { height: `${height}px` } : undefined}
        >
          {children}
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
