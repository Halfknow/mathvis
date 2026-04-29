import type { ReactNode } from 'react';

interface KeyInsightProps {
  children: ReactNode;
  label?: string;  // defaults to "Key insight"
}

/**
 * KeyInsight — a deliberately framed pull-quote-style callout for the
 * single sentence that captures the heart of a lesson. Use SPARINGLY:
 * one per lesson, ideally placed right after the moment of clarity.
 *
 * Visually styled like an academic pull-quote: serif italic, accent
 * left rule, generous padding.
 */
export function KeyInsight({ children, label = 'Key insight' }: KeyInsightProps) {
  return (
    <aside className="not-prose my-10 border-l-2 border-accent pl-6 py-2">
      <p className="font-sans text-xs font-semibold uppercase tracking-wider text-accent">
        {label}
      </p>
      <p className="mt-2 font-serif italic text-h3 leading-snug text-ink m-0">
        {children}
      </p>
    </aside>
  );
}
