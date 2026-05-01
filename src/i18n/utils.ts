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
