import { Card } from '../ui/Card';

interface ConceptCardProps {
  title: string;
  description: string;
  glyph: string;       // small symbol, e.g. → or 𝛁
  lessonCount: number;
  href: string;
}

/**
 * ConceptCard — smaller, denser card for featuring concepts within
 * a course (e.g. "Eigenvectors", "Riemann sums"). Three or four of
 * these typically appear in a row.
 */
export function ConceptCard({
  title,
  description,
  glyph,
  lessonCount,
  href,
}: ConceptCardProps) {
  return (
    <a href={href} className="group block no-underline">
      <Card interactive padding="md">
        <div className="flex items-start gap-4">
          <span
            aria-hidden="true"
            className="font-serif text-3xl leading-none text-ink-muted transition-colors duration-base ease-smooth group-hover:text-accent shrink-0"
          >
            {glyph}
          </span>
          <div className="min-w-0">
            <h4 className="font-serif text-base font-semibold text-ink m-0">
              {title}
            </h4>
            <p className="mt-1 font-sans text-sm text-ink-muted leading-relaxed">
              {description}
            </p>
            <p className="mt-3 font-mono text-xs text-ink-faint">
              {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'}
            </p>
          </div>
        </div>
      </Card>
    </a>
  );
}
