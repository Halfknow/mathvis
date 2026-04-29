interface LessonProgressProps {
  current: number;
  total: number;
  moduleTitle: string;
}

/**
 * LessonProgress — small, inline indicator showing position within a
 * module. Sits at the top of every lesson page, above the title.
 */
export function LessonProgress({ current, total, moduleTitle }: LessonProgressProps) {
  return (
    <p className="not-prose mb-4 flex items-center gap-3 font-mono text-xs uppercase tracking-wider text-ink-faint">
      <span>{moduleTitle}</span>
      <span className="text-rule">·</span>
      <span>
        Lesson <span className="text-ink-muted">{current}</span> of {total}
      </span>
    </p>
  );
}
