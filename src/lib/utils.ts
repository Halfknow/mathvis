import { clsx, type ClassValue } from 'clsx';

/**
 * Merge class names. Used by all components that accept className.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/**
 * Format a duration in minutes as "1h 23m" or "23m".
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/**
 * Course color hint used in subtle accent decorations.
 * Each course has a "chalk" color associated with it.
 */
export const courseColors: Record<string, string> = {
  'linear-algebra': 'var(--color-vector-blue)',
  calculus: 'var(--color-vector-yellow)',
  probability: 'var(--color-vector-green)',
};
