interface Prerequisite {
  title: string;
  href: string;
  met?: boolean;
}

interface PrerequisiteListProps {
  items: Prerequisite[];
}

/**
 * PrerequisiteList — appears at the top of a lesson, listing concepts
 * the lesson assumes. Each item links to the corresponding lesson for
 * a quick refresher.
 */
export function PrerequisiteList({ items }: PrerequisiteListProps) {
  return (
    <div className="not-prose my-8 rounded-md border border-rule bg-surface-1 p-5">
      <p className="font-sans text-xs font-semibold uppercase tracking-wider text-ink-faint">
        Before you start
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li key={item.href} className="flex items-center gap-2.5">
            <span
              className={
                item.met
                  ? 'grid h-4 w-4 place-items-center rounded-pill bg-vector-green text-paper-elevated shrink-0'
                  : 'h-4 w-4 rounded-pill border border-rule shrink-0'
              }
              aria-hidden="true"
            >
              {item.met && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </span>
            <a
              href={item.href}
              className="font-sans text-sm text-ink-muted no-underline hover:text-accent"
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
