# Changelog

All notable changes to MathViz will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [0.2.0] — 2026-05-01

### Added

- **i18n 多语言系统** — 完整的中英文切换功能
  - `src/i18n/ui.ts` — 70+ 中英文翻译键值
  - `src/i18n/utils.ts` — `getLangFromUrl()`, `t()`, `getLocalizedPath()`, `getAlternateLocaleUrl()`
  - Astro i18n 路由配置：英文无前缀 `/`，中文 `/zh/`
  - Header 右上角地球图标语言切换按钮
  - `hreflang` alternate 标签（SEO）
- **中文镜像页面** — 完整的 `/zh/` 页面树
  - `/zh/` 中文首页
  - `/zh/courses/[course]/` 中文课程列表页
  - `/zh/courses/[course]/[...slug]` 中文课程详情页
  - `/zh/search` 中文搜索页
- **内容 Schema 国际化** — frontmatter 新增 `titleZh`, `descriptionZh`, `moduleZh`
- **微积分课程** — 3 课新内容
  - `01-what-is-a-derivative.mdx` — 什么是导数？
  - `02-limits-and-continuity.mdx` — 极限与连续性
  - `03-differentiation-rules.mdx` — 求导法则
- **概率论课程** — 3 课新内容
  - `01-what-is-probability.mdx` — 什么是概率？
  - `02-random-variables.mdx` — 随机变量
  - `03-normal-distribution.mdx` — 正态分布
- **Pagefind 中英文搜索** — 自动检测 en + zh-cn 双语索引
- **Tailwind CSS v4 修复** — 安装 `@tailwindcss/vite` 插件，修复样式不加载的问题

### Changed

- `astro.config.mjs` — 添加 i18n 配置 + `@tailwindcss/vite` 插件
- `BaseLayout.astro` — 接受 `lang` prop，支持 `hreflang`，动态 `html lang`
- `Header.astro` — 完全重写，支持 i18n 翻译和语言切换按钮
- `Footer.astro` — 支持 i18n 翻译
- `global.css` — Tailwind v4 `@import "tailwindcss"` 替代 v3 `@tailwind` 指令
- 课程 slug 路径修复 — 去掉 `lesson.slug` 中重复的课程目录前缀

### Fixed

- Tailwind CSS v4 样式不加载 — 缺少 `@tailwindcss/vite` 插件
- 课程详情页 URL 重复路径 — `/courses/calculus/calculus/01-xxx` → `/courses/calculus/01-xxx`

---

## [0.1.0] — 2026-04-30

### Added

- **Astro 5 项目脚手架** — Astro 5 + React 19 + Tailwind CSS 4 + KaTeX + MDX
- **设计系统** — `src/styles/tokens.css` 完整设计令牌（light/dark 双主题）
- **自托管字体** — Source Serif 4, Inter, JetBrains Mono (woff2)，`@font-face` 声明
- **UI 组件库**
  - Button（primary/secondary/ghost, sm/md/lg）
  - Card, Badge, Tabs, ProgressBar
- **布局组件**
  - BaseLayout — 页面基础框架，避免 FOUC 的主题脚本
  - Header — 响应式导航，移动端汉堡菜单，搜索按钮，主题切换
  - Footer
- **学习组件**
  - CourseCard — 课程卡片（进度、难度、时长）
  - KeyInsight — 关键洞察高亮框
  - ExerciseBlock — 练习题（可折叠提示/答案）
  - PrerequisiteList, LessonProgress, ConceptCard
- **交互式 SVG 组件**
  - VectorCanvas — 2D 向量拖拽（坐标系 + 箭头 + magnitude 显示）
  - DerivativeSlope — 切线动态可视化（4 种函数，拖动切点）
  - NormalDistribution — 正态分布（μ/σ 滑块，采样模拟，直方图叠加）
- **动画组件**
  - ManimVideo — 视频播放器（WebM + MP4 fallback）
  - InteractiveCanvas — 全屏 API + 移动端降级 + `useReducedMotion`
- **KaTeX 数学排版**
  - 服务端：remark-math + rehype-katex
  - 客户端：MathBlock/MathInline React 组件（解决 MDX + LaTeX `{}` 冲突）
- **自定义 Hooks** — `useReducedMotion()`, `useMobileDetect()`
- **动态路由** — `[course]/index.astro` + `[course]/[...slug].astro`
  - 从 MDX frontmatter 自动生成课程/模块/课堂页面
  - 侧边栏导航（桌面端 sticky）
  - 移动端底栏导航（← 1/5 →）
  - 上一课/下一课链接
- **Pagefind 搜索** — `src/pages/search.astro`
  - 动态 script 加载（避免 Vite build 错误）
  - 自定义搜索 UI
- **Manim 渲染管线**
  - `animations/shared/mathviz_theme.py` — 品牌主题基类
  - `animations/manifest.json` — 动画元数据注册表
  - `animations/linear-algebra/01_vectors_intro.py` — 首支 Manim 脚本
  - `animations/render.py` — 本地批量/单个渲染脚本
- **自托管部署** — `deploy.sh`（Nginx / Caddy / `npx serve` 三种方案）
- **课程内容** — 线性代数第 1 课 `01-vectors-as-arrows.mdx`

### Dependencies

- @astrojs/mdx ^4.0.0
- @astrojs/react ^4.0.0
- @astrojs/sitemap ^3.2.0
- @react-three/fiber ^9.6.0
- @react-three/drei ^10.7.0
- @tailwindcss/vite (latest)
- react 19
- tailwindcss ^4.0.0
- katex (KaTeX CSS + remark-math + rehype-katex)
- three
- pagefind (devDependency)
