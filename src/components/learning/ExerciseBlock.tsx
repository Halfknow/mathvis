import { useState } from 'react';
import type { ReactNode } from 'react';

interface ExerciseBlockProps {
  number?: number;
  prompt: ReactNode;
  hint?: ReactNode;
  answer: ReactNode;
}

/**
 * ExerciseBlock — collapsible exercise. Prompt is always visible.
 * Hint and answer reveal on click, separately.
 *
 * Design intent: exercises shouldn't dominate the page. The prompt
 * is plain prose; the affordances (hint / show answer) are quiet
 * underlined buttons.
 */
export function ExerciseBlock({ number, prompt, hint, answer }: ExerciseBlockProps) {
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  return (
    <section className="not-prose my-8 rounded-md border border-rule bg-paper-elevated p-6">
      <header className="flex items-baseline gap-3">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-accent">
          Exercise{number !== undefined ? ` ${number}` : ''}
        </span>
      </header>

      <div className="mt-3 font-serif text-body-lg leading-relaxed text-ink">
        {prompt}
      </div>

      <div className="mt-5 flex items-center gap-5">
        {hint && (
          <button
            type="button"
            onClick={() => setShowHint((s) => !s)}
            className="font-sans text-sm text-ink-muted underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-ink-muted"
          >
            {showHint ? 'Hide hint' : 'Show hint'}
          </button>
        )}
        <button
          type="button"
          onClick={() => setShowAnswer((s) => !s)}
          className="font-sans text-sm text-accent underline decoration-accent/40 underline-offset-4 hover:decoration-accent"
        >
          {showAnswer ? 'Hide answer' : 'Show answer'}
        </button>
      </div>

      {showHint && hint && (
        <div className="mt-4 rounded-md bg-surface-1 p-4 font-serif text-body leading-relaxed text-ink-muted">
          <p className="font-sans text-xs font-semibold uppercase tracking-wider text-ink-faint mb-2">
            Hint
          </p>
          {hint}
        </div>
      )}

      {showAnswer && (
        <div className="mt-4 rounded-md bg-accent-soft p-4 font-serif text-body leading-relaxed text-ink">
          <p className="font-sans text-xs font-semibold uppercase tracking-wider text-accent mb-2">
            Answer
          </p>
          {answer}
        </div>
      )}
    </section>
  );
}
