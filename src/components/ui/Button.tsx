import { clsx } from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconBefore?: ReactNode;
  iconAfter?: ReactNode;
}

/**
 * Button — primary action element.
 *
 * - `primary`   filled accent (terracotta). Use sparingly: one per view.
 * - `secondary` outlined ink. Default for most actions.
 * - `ghost`     text-only. For tertiary/nav actions.
 *
 * Sizes: sm (32px), md (40px, default), lg (48px).
 */
export function Button({
  variant = 'secondary',
  size = 'md',
  iconBefore,
  iconAfter,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={clsx(
        // base
        'inline-flex items-center justify-center gap-2 font-sans font-medium',
        'transition-colors duration-fast ease-smooth',
        'rounded-md disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
        // size
        size === 'sm' && 'h-8 px-3 text-sm',
        size === 'md' && 'h-10 px-4 text-body',
        size === 'lg' && 'h-12 px-6 text-body-lg',
        // variant
        variant === 'primary' && [
          'bg-accent text-paper-elevated',
          'hover:bg-[var(--color-accent-hover)]',
        ],
        variant === 'secondary' && [
          'bg-transparent text-ink border border-rule',
          'hover:bg-surface-1 hover:border-ink-faint',
        ],
        variant === 'ghost' && [
          'bg-transparent text-ink',
          'hover:bg-surface-1',
        ],
        className,
      )}
      {...rest}
    >
      {iconBefore && <span className="inline-flex shrink-0">{iconBefore}</span>}
      {children}
      {iconAfter && <span className="inline-flex shrink-0">{iconAfter}</span>}
    </button>
  );
}
