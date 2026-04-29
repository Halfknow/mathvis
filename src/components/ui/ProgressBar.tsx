import { clsx } from 'clsx';

interface ProgressBarProps {
  value: number;       // 0–100
  showLabel?: boolean;
  className?: string;
}

/**
 * ProgressBar — slim horizontal progress for course/module completion.
 * Always uses the accent color for the fill.
 */
export function ProgressBar({
  value,
  showLabel = false,
  className,
}: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));

  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <div
        className="relative h-1.5 flex-1 overflow-hidden rounded-pill bg-surface-2"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="absolute inset-y-0 left-0 rounded-pill bg-accent transition-[width] duration-base ease-smooth"
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="font-mono text-xs tabular-nums text-ink-muted shrink-0">
          {pct}%
        </span>
      )}
    </div>
  );
}
