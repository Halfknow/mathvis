import { clsx } from 'clsx';
import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: ReactNode;
}

/**
 * Card — the default container for grouped content on the paper surface.
 *
 * `interactive`: adds hover shadow + cursor. Use for clickable cards
 * (course tiles, lesson previews). Pair with a wrapping <a>.
 */
export function Card({
  interactive = false,
  padding = 'md',
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={clsx(
        'bg-paper-elevated border border-rule rounded-md shadow-sm',
        'transition-shadow duration-base ease-smooth',
        interactive && 'hover:shadow-md cursor-pointer',
        padding === 'none' && 'p-0',
        padding === 'sm' && 'p-4',
        padding === 'md' && 'p-6',
        padding === 'lg' && 'p-8',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
