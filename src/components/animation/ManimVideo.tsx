import { useRef, useEffect, useState } from 'react';
import { clsx } from 'clsx';

interface ManimVideoProps {
  src: string;          // CDN URL (.webm preferred, .mp4 fallback)
  srcMp4?: string;
  poster?: string;
  caption?: string;
  aspectRatio?: '16/9' | '4/3' | '1/1';
  autoPlay?: boolean;
}

/**
 * ManimVideo — wrapper for a pre-rendered Manim animation.
 *
 * - Uses <video> with WebM (VP9) primary + MP4 fallback
 * - Auto-pauses when scrolled out of view (via IntersectionObserver)
 * - Provides a poster frame so the layout doesn't shift before play
 * - Caption is typeset as an academic figure caption beneath
 *
 * Manim renders are stored on the CDN, NOT in the git repo. This
 * component is just the player.
 */
export function ManimVideo({
  src,
  srcMp4,
  poster,
  caption,
  aspectRatio = '16/9',
  autoPlay = false,
}: ManimVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (autoPlay && entry.isIntersecting) {
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [autoPlay]);

  return (
    <figure className="not-prose my-8">
      <div
        className={clsx(
          'relative overflow-hidden rounded-md border border-rule bg-surface-2',
          aspectRatio === '16/9' && 'aspect-video',
          aspectRatio === '4/3' && 'aspect-[4/3]',
          aspectRatio === '1/1' && 'aspect-square',
        )}
      >
        <video
          ref={videoRef}
          poster={poster}
          controls
          playsInline
          preload="metadata"
          className="absolute inset-0 h-full w-full"
        >
          <source src={src} type="video/webm" />
          {srcMp4 && <source src={srcMp4} type="video/mp4" />}
        </video>
      </div>
      {caption && (
        <figcaption className="mt-3 font-serif text-sm italic leading-relaxed text-ink-muted">
          <span className="font-sans not-italic font-semibold text-ink-faint mr-2 uppercase tracking-wider text-xs">
            Figure
          </span>
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
