import { Card } from '../ui/Card';
import { ProgressBar } from '../ui/ProgressBar';
import { Badge } from '../ui/Badge';

interface CourseCardProps {
  href: string;
  title: string;
  description: string;
  symbol: string;          // e.g. ∫, λ, P
  lessonCount: number;
  estimatedHours: number;
  progressPct?: number;    // 0–100, omit if not started
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
}

/**
 * CourseCard — the large, expressive card used to advertise a course.
 * Used on the homepage 3-up grid and the courses index page.
 *
 * The big mathematical glyph is the visual hook; the rest is metadata.
 */
export function CourseCard({
  href,
  title,
  description,
  symbol,
  lessonCount,
  estimatedHours,
  progressPct,
  difficulty,
}: CourseCardProps) {
  const started = progressPct !== undefined && progressPct > 0;

  return (
    <a href={href} className="group block no-underline">
      <Card interactive padding="none" className="overflow-hidden">
        {/* Symbol panel */}
        <div className="relative flex h-40 items-center justify-center bg-surface-1 border-b border-rule">
          <span className="font-serif text-[120px] leading-none text-ink transition-colors duration-base ease-smooth group-hover:text-accent">
            {symbol}
          </span>
          {difficulty && (
            <span className="absolute right-4 top-4">
              <Badge variant="neutral">{difficulty}</Badge>
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          <h3 className="font-serif text-h3 text-ink m-0">{title}</h3>
          <p className="mt-2 font-sans text-sm text-ink-muted leading-relaxed">
            {description}
          </p>

          <dl className="mt-6 flex items-center gap-6 font-mono text-xs text-ink-faint">
            <div>
              <dt className="sr-only">Lessons</dt>
              <dd>
                <span className="text-ink-muted">{lessonCount}</span> lessons
              </dd>
            </div>
            <div>
              <dt className="sr-only">Estimated time</dt>
              <dd>
                <span className="text-ink-muted">~{estimatedHours}h</span>
              </dd>
            </div>
          </dl>

          {started && (
            <div className="mt-5">
              <ProgressBar value={progressPct!} showLabel />
            </div>
          )}
        </div>
      </Card>
    </a>
  );
}
