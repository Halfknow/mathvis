import { useRef, useEffect } from 'react';

interface MathBlockProps {
  expression: string;
  label?: string;
}

export function MathBlock({ expression, label }: MathBlockProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && typeof window !== 'undefined' && (window as any).katex) {
      (window as any).katex.render(expression, ref.current, {
        displayMode: true,
        throwOnError: false,
      });
    }
  }, [expression]);

  return (
    <div className="my-6 flex items-center justify-center gap-3">
      <div ref={ref} className="text-center" />
      {label && (
        <span className="font-mono text-sm text-ink-faint">{label}</span>
      )}
    </div>
  );
}

interface MathInlineProps {
  expression: string;
}

export function MathInline({ expression }: MathInlineProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current && typeof window !== 'undefined' && (window as any).katex) {
      (window as any).katex.render(expression, ref.current, {
        displayMode: false,
        throwOnError: false,
      });
    }
  }, [expression]);

  return <span ref={ref} />;
}
