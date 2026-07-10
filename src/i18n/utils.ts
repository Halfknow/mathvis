import { ui, defaultLang, type Lang, type UIKey } from './ui';

export function getLangFromUrl(url: URL): Lang {
  const [, lang] = url.pathname.split('/');
  if (lang in ui) return lang as Lang;
  return defaultLang;
}

export function useTranslations(lang: Lang) {
  return function t(key: UIKey): string {
    return ui[lang][key] || ui[defaultLang][key];
  };
}

export function getLocalizedPath(path: string, lang: Lang): string {
  // Strip existing locale prefix
  const cleanPath = path.replace(/^\/(en|zh)/, '') || '/';
  if (lang === defaultLang) return cleanPath;
  return `/${lang}${cleanPath}`;
}

export function getAlternateLocaleUrl(url: URL): { lang: Lang; path: string } {
  const currentLang = getLangFromUrl(url);
  const altLang: Lang = currentLang === 'en' ? 'zh' : 'en';
  return {
    lang: altLang,
    path: getLocalizedPath(url.pathname, altLang),
  };
}

export const courseMeta: Record<string, Record<Lang, { title: string; symbol: string; description: string }>> = {
  'linear-algebra': {
    en: { title: 'Linear Algebra', symbol: 'V', description: 'Vectors, matrices, and transformations — the language of data and space.' },
    zh: { title: '线性代数', symbol: 'V', description: '向量、矩阵与变换——数据与空间的语言。' },
  },
  calculus: {
    en: { title: 'Calculus', symbol: '∫', description: 'Derivatives, integrals, and the mathematics of change.' },
    zh: { title: '微积分', symbol: '∫', description: '导数、积分与变化的数学。' },
  },
  probability: {
    en: { title: 'Probability', symbol: 'P', description: 'Random variables, distributions, and reasoning under uncertainty.' },
    zh: { title: '概率论', symbol: 'P', description: '随机变量、分布与不确定性推理。' },
  },
};

// Per-course difficulty. Lives here next to courseMeta so there is one place
// to edit when a course's pedagogical level changes.
export const courseDifficulty: Record<string, 'Beginner' | 'Intermediate' | 'Advanced'> = {
  'linear-algebra': 'Beginner',
  calculus: 'Beginner',
  probability: 'Intermediate',
};

// Canonical display order of courses on landing/index pages.
export const courseOrder = ['linear-algebra', 'calculus', 'probability'] as const;

export interface CourseSummary {
  slug: string;
  href: string;
  title: string;
  description: string;
  symbol: string;
  lessonCount: number;
  estimatedHours: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
}

/**
 * Derive course card data from the lessons collection + i18n metadata.
 * Single source of truth for lesson counts and estimated hours — previously
 * three index pages hard-coded these and they drifted badly out of sync.
 *
 * Pass the raw collection entries (with `.data` carrying moduleOrder,
 * lessonOrder, duration, course) and a locale. The optional `progress` map
 * keys course slug → 0..100 if you want progress bars.
 */
export function getCourses(
  lessons: Array<{ data: { course: string; duration: number; moduleOrder: number; lessonOrder: number } }>,
  lang: Lang,
  progress?: Record<string, number>,
): CourseSummary[] {
  return courseOrder
    .filter((slug) => courseMeta[slug])
    .map((slug) => {
      const courseLessons = lessons.filter((l) => l.data.course === slug);
      const totalDuration = courseLessons.reduce((sum, l) => sum + l.data.duration, 0);
      const meta = courseMeta[slug][lang];
      const prefix = lang === 'zh' ? '/zh/courses' : '/courses';
      return {
        slug,
        href: `${prefix}/${slug}`,
        title: meta.title,
        description: meta.description,
        symbol: meta.symbol,
        lessonCount: courseLessons.length,
        estimatedHours: Math.round(totalDuration / 60),
        difficulty: courseDifficulty[slug] ?? 'Beginner',
      };
    });
}
