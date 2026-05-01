export const languages = {
  en: 'English',
  zh: '中文',
};

export const defaultLang = 'en';

export type Lang = keyof typeof languages;

export const ui = {
  en: {
    // Site
    'site.title': 'MathViz',
    'site.description': 'Learn probability, linear algebra, and calculus through animation.',

    // Nav
    'nav.linearAlgebra': 'Linear Algebra',
    'nav.calculus': 'Calculus',
    'nav.probability': 'Probability',
    'nav.search': 'Search',
    'nav.menu': 'Menu',
    'nav.theme': 'Toggle theme',

    // Home
    'home.hero.title': 'Learn math through animation',
    'home.hero.subtitle': 'Interactive visualizations that make probability, linear algebra, and calculus intuitive.',
    'home.hero.cta': 'Start learning',
    'home.courses.title': 'Courses',

    // Course meta
    'course.linearAlgebra.title': 'Linear Algebra',
    'course.linearAlgebra.symbol': 'V',
    'course.linearAlgebra.description': 'Vectors, matrices, and transformations — the language of data and space.',
    'course.calculus.title': 'Calculus',
    'course.calculus.symbol': '∫',
    'course.calculus.description': 'Derivatives, integrals, and the mathematics of change.',
    'course.probability.title': 'Probability',
    'course.probability.symbol': 'P',
    'course.probability.description': 'Random variables, distributions, and reasoning under uncertainty.',

    // Course index page
    'course.lessons': 'lessons',
    'course.minutes': 'min',
    'course.start': 'Start learning',
    'course.module': 'Module',

    // Lesson page
    'lesson.prev': 'Previous',
    'lesson.next': 'Next',
    'lesson.practice': 'Practice',

    // Search
    'search.title': 'Search',
    'search.subtitle': 'Find lessons, concepts, and topics across all courses.',
    'search.placeholder': 'Search lessons...',
    'search.notAvailable': 'Search not available.',
    'search.notBuilt': 'Search index not yet generated. Run',
    'search.notBuilt2': 'first.',

    // Footer
    'footer.description': 'An open-source platform for learning math through interactive animation.',
    'footer.courses': 'Courses',
    'footer.resources': 'Resources',
    'footer.source': 'Source',

    // Interactive
    'interactive.fullscreen': 'Fullscreen',

    // Exercises
    'exercise.hint': 'Hint',
    'exercise.showHint': 'Show hint',
    'exercise.hideHint': 'Hide hint',

    // Common
    'common.back': 'Back',
    'common.loading': 'Loading...',
  },
  zh: {
    // Site
    'site.title': 'MathViz',
    'site.description': '通过动画学习概率论、线性代数和微积分。',

    // Nav
    'nav.linearAlgebra': '线性代数',
    'nav.calculus': '微积分',
    'nav.probability': '概率论',
    'nav.search': '搜索',
    'nav.menu': '菜单',
    'nav.theme': '切换主题',

    // Home
    'home.hero.title': '通过动画学习数学',
    'home.hero.subtitle': '交互式可视化让概率论、线性代数和微积分变得直观易懂。',
    'home.hero.cta': '开始学习',
    'home.courses.title': '课程',

    // Course meta
    'course.linearAlgebra.title': '线性代数',
    'course.linearAlgebra.symbol': 'V',
    'course.linearAlgebra.description': '向量、矩阵与变换——数据与空间的语言。',
    'course.calculus.title': '微积分',
    'course.calculus.symbol': '∫',
    'course.calculus.description': '导数、积分与变化的数学。',
    'course.probability.title': '概率论',
    'course.probability.symbol': 'P',
    'course.probability.description': '随机变量、分布与不确定性推理。',

    // Course index page
    'course.lessons': '节课',
    'course.minutes': '分钟',
    'course.start': '开始学习',
    'course.module': '模块',

    // Lesson page
    'lesson.prev': '上一课',
    'lesson.next': '下一课',
    'lesson.practice': '练习',

    // Search
    'search.title': '搜索',
    'search.subtitle': '在所有课程中查找课程、概念和主题。',
    'search.placeholder': '搜索课程...',
    'search.notAvailable': '搜索不可用。',
    'search.notBuilt': '搜索索引尚未生成，请先运行',
    'search.notBuilt2': '。',

    // Footer
    'footer.description': '一个通过交互式动画学习数学的开源平台。',
    'footer.courses': '课程',
    'footer.resources': '资源',
    'footer.source': '源码',

    // Interactive
    'interactive.fullscreen': '全屏',

    // Exercises
    'exercise.hint': '提示',
    'exercise.showHint': '显示提示',
    'exercise.hideHint': '隐藏提示',

    // Common
    'common.back': '返回',
    'common.loading': '加载中...',
  },
} as const;

export type UIKey = keyof (typeof ui)['en'];
