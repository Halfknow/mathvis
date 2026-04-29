import { clsx } from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

type BadgeVariant = 'neutral' | 'accent' | 'success' | 'warning';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: ReactNode;
}

/**
 * Badge — small pill label. Used for course difficulty, lesson tags,
 * topic categories. Keep copy short (1–2 words).
 */
export function Badge({
  variant = 'neutral',
  className,
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-pill font-sans font-medium',
        'px-2.5 py-0.5 text-xs',
        variant === 'neutral' && 'bg-surface-1 text-ink-muted',
        variant === 'accent' && 'bg-accent-soft text-accent',
        variant === 'success' && 'bg-[color-mix(in_srgb,var(--color-vector-green)_15%,transparent)] text-vector-green',
        variant === 'warning' && 'bg-[color-mix(in_srgb,var(--color-vector-yellow)_15%,transparent)] text-[color-mix(in_srgb,var(--color-vector-yellow)_80%,var(--color-ink))]',
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}
