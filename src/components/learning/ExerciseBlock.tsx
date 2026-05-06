import { useState } from 'react';
import type { ReactNode } from 'react';

interface ExerciseBlockProps {
  number?: number;
  prompt: ReactNode;
  hint?: ReactNode;
  answer: ReactNode;
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={key++}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={key++}>{match[3]}</em>);
    } else if (match[4]) {
      parts.push(<code key={key++} className="font-mono text-sm bg-surface-1 px-1 rounded">{match[4]}</code>);
    }
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

function renderContent(content: ReactNode): ReactNode {
  if (typeof content === 'string') {
    return renderInlineMarkdown(content);
  }
  return content;
}

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
        {renderContent(prompt)}
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
          {renderContent(hint)}
        </div>
      )}

      {showAnswer && (
        <div className="mt-4 rounded-md bg-accent-soft p-4 font-serif text-body leading-relaxed text-ink">
          <p className="font-sans text-xs font-semibold uppercase tracking-wider text-accent mb-2">
            Answer
          </p>
          {renderContent(answer)}
        </div>
      )}
    </section>
  );
}
