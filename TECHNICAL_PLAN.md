# MathViz 技术落地方案

> 基于 DESIGN_SYSTEM.md、UI Kit 原型、现有源代码的完整技术实施方案。
> 覆盖从项目搭建、开发实现到部署运行的全流程。

---

## 一、现有状态评估

### 已完成

| 层面 | 状态 | 说明 |
|------|------|------|
| 项目脚手架 | ✅ 完成 | Astro 5 + React 19 + Tailwind CSS 4 + KaTeX + Three.js |
| 设计系统 | ✅ 完成 | tokens.css 完整，包含 light/dark 双主题 |
| UI 组件库 | ✅ 完成 | Button, Card, Badge, Tabs, ProgressBar |
| 布局组件 | ✅ 完成 | BaseLayout, Header（含语言切换）, Footer — 支持中英文 |
| 学习组件 | ✅ 完成 | CourseCard, KeyInsight, ExerciseBlock, PrerequisiteList, LessonProgress |
| 交互动画 | ✅ 完成 | VectorCanvas (SVG), DerivativeSlope (SVG), NormalDistribution (SVG) |
| ManimVideo | ✅ 完成 | 视频播放器组件 |
| InteractiveCanvas | ✅ 完成 | Fullscreen API + 移动端降级 |
| KaTeX 排版 | ✅ 完成 | 服务端 (remark-math + rehype-katex) + 客户端 (MathBlock/MathInline) |
| 内容 Schema | ✅ 完成 | 支持 manimVideos, interactiveWidgets, mobileFallback, titleZh, moduleZh |
| 动态路由 | ✅ 完成 | `[course]/index.astro` + `[course]/[...slug].astro` — 自动从 MDX frontmatter 生成 |
| 搜索 | ✅ 完成 | Pagefind 静态搜索，自动检测 en + zh-cn |
| i18n 多语言 | ✅ 完成 | URL 路由 (`/` 英文, `/zh/` 中文)，翻译系统，语言切换按钮 |
| 字体自托管 | ✅ 完成 | Source Serif 4, Inter, JetBrains Mono (woff2) |
| Manim 管线 | ✅ 骨架 | 品牌主题、清单文件、首支脚本、本地渲染脚本 |
| 部署方案 | ✅ 完成 | deploy.sh — Nginx / Caddy / npx serve 自托管 |
| 课程内容 | ⚠️ 进行中 | 线性代数 1 课、微积分 3 课、概率论 3 课（共 7 课） |
| 测试 | ❌ 未开始 | 无单元测试、无 E2E 测试 |
| CI/CD | ❌ 未开始 | 无 GitHub Actions |

---

## 二、技术栈确认

| 层面 | 选择 | 选型依据 |
|------|------|----------|
| 框架 | **Astro 5** | 群岛架构：95% 静态内容零 JS，5% 交互组件按需 hydrate |
| 内容格式 | **MDX** | Markdown 写正文 + 嵌入 React 组件 |
| 数学排版 | **KaTeX**（服务端 + 客户端） | remark-math + rehype-katex build 时编译；MathBlock/MathInline 处理复杂 LaTeX |
| 交互组件 | **React 19** | Astro 官方支持，D3.js / Three.js 均有 React 封装 |
| 2D 可视化 | **D3.js**（主力） + SVG + React（轻量） | D3.js 是 2D 数学可视化的事实标准；简单交互用纯 SVG+React |
| 3D 可视化 | **React Three Fiber + Drei v10** | 线性代数 3D 可视化（向量空间、矩阵变换、特征向量等） |
| 预渲染叙事 | **Manim Community**（可选） | 仅用于特殊叙事场景，不再是主力 |
| 样式 | **Tailwind CSS 4** + CSS Variables | `@tailwindcss/vite` 插件，`@import "tailwindcss"` 语法 |
| 国际化 | **Astro i18n** | URL 路由 (`/` + `/zh/`)，`src/i18n/ui.ts` 翻译 |
| 搜索 | **Pagefind** | Build 时生成索引，支持中英文 |
| 字体 | **Self-hosted woff2** | 不依赖 Google Fonts CDN |
| 部署 | **Self-hosted** | Nginx / Caddy / `npx serve` |

---

## 三、系统架构

```
┌─────────────────────────────────────────────────────────┐
│                     用户浏览器                           │
│  ┌───────────┐  ┌──────────┐  ┌───────────────────────┐ │
│  │ 静态 HTML  │  │ KaTeX    │  │ React Islands         │ │
│  │ (MDX 渲染) │  │ (预编译)  │  │ ┌─────┐ ┌─────┐     │ │
│  └───────────┘  └──────────┘  │ │D3.js│ │R3F  │     │ │
│                                │ │2D   │ │3D   │     │ │
│                                │ └─────┘ └─────┘     │ │
│                                │ ┌───────────────┐   │ │
│                                │ │SVG + React    │   │ │
│                                │ │(轻量 2D)      │   │ │
│                                │ └───────────────┘   │ │
│                                └───────────────────────┘ │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────┐
│              自托管 Web 服务器 (Nginx / Caddy)           │
│  Astro 静态构建产物 (HTML + CSS + JS bundles)            │
│  /zh/ 路由 → 中文版页面                                  │
│  /pagefind/ → 搜索索引                                   │
└─────────────────────────────────────────────────────────┘
```

---

## 四、目录结构（当前态）

```
mathviz/
├── animations/                    # Manim 渲染管线
│   ├── shared/
│   │   └── mathviz_theme.py       # MathViz 品牌主题
│   ├── linear-algebra/
│   │   └── 01_vectors_intro.py
│   ├── manifest.json              # 动画元数据注册表
│   └── render.py                  # 本地渲染脚本
├── src/
│   ├── components/
│   │   ├── ui/                    # Button, Card, Badge, Tabs, ProgressBar
│   │   ├── layout/                # BaseLayout, Header, Footer
│   │   ├── learning/              # CourseCard, KeyInsight, ExerciseBlock, etc.
│   │   ├── animation/             # ManimVideo, InteractiveCanvas
│   │   ├── interactive/           # 交互式 SVG 组件
│   │   │   ├── linear-algebra/VectorCanvas.tsx
│   │   │   ├── calculus/DerivativeSlope.tsx
│   │   │   └── probability/NormalDistribution.tsx
│   │   └── math/                  # MathBlock, MathInline
│   ├── content/
│   │   ├── config.ts              # 内容 schema（含 i18n 字段）
│   │   └── lessons/
│   │       ├── linear-algebra/    # 1 lesson
│   │       ├── calculus/          # 3 lessons
│   │       └── probability/       # 3 lessons
│   ├── hooks/                     # useReducedMotion, useMobileDetect
│   ├── i18n/                      # ui.ts, utils.ts
│   ├── pages/
│   │   ├── index.astro            # 英文首页
│   │   ├── search.astro           # 英文搜索
│   │   ├── courses/
│   │   │   └── [course]/
│   │   │       ├── index.astro    # 课程列表页
│   │   │       └── [...slug].astro # 课程详情页
│   │   └── zh/                    # 中文镜像
│   │       ├── index.astro
│   │       ├── search.astro
│   │       └── courses/[course]/
│   └── styles/
│       ├── tokens.css
│       └── global.css
├── public/
│   ├── fonts/                     # 自托管字体
│   └── favicon.svg
├── astro.config.mjs               # i18n + Tailwind v4 配置
├── tailwind.config.mjs            # Tailwind 扩展配置
├── deploy.sh                      # 自托管部署脚本
├── CHANGELOG.md                   # 版本变更记录
├── CLAUDE.md                      # AI 编码指南
├── DESIGN_SYSTEM.md               # 设计系统参考
└── TECHNICAL_PLAN.md              # 本文件
```

---

## 五、待开发功能模块

### 模块 1：更多课程内容

当前仅有 7 课，需要扩充到完整课程体系：

- **线性代数**：向量加法、标量乘法、线性组合、span、基与维数、矩阵变换、行列式、特征值等
- **微积分**：积分基础、链式法则练习、黎曼和、定积分、微积分基本定理
- **概率论**：条件概率、贝叶斯定理、大数定律、中心极限定理

### 模块 2：更多交互组件

**2D 组件（D3.js）：**
- **RiemannSum** — 黎曼和近似（矩形逼近曲线下面积，可调分割数）
- **IntegralArea** — 积分面积可视化（填充区域动画）
- **SlopeField** — 斜率场（微分方程解的走势）
- **TaylorSeries** — 泰勒级数逼近（逐步增加项数）
- **OptimizationVis** — 最优化（极值点探索）
- **SamplingAnimation** — 中心极限定理采样演示
- **DiscreteDist** — 离散分布（伯努利、二项、泊松）
- **ConditionalProb** — 条件概率可视化
- **BayesVisualizer** — 贝叶斯定理可视化

**2D 组件（SVG + React，轻量级）：**
- **VectorAddition** — 向量加法（首尾相接拖拽）
- **DotProductVis** — 点积与投影

**3D 组件（React Three Fiber）：**
- **SpanExplorer** — 3D 向量空间 span 可视化
- **MatrixTransform3D** — 3D 矩阵变换（空间变形）
- **EigenvectorExplorer** — 特征向量 / 特征值 3D 探索器

### 模块 3：Manim 动画（可选）

Manim 降级为可选工具，仅用于特殊叙事场景。当前有脚本和管线骨架，如需要可安装 Manim (Python) 渲染 WebM/MP4 文件。大部分可视化需求由 D3.js 和 React Three Fiber 覆盖。

### 模块 4：测试

- Vitest 单元测试
- Playwright E2E 测试
- 视觉回归测试

### 模块 5：无障碍

- 键盘导航（交互组件）
- aria-label（动画/视频描述）
- "Skip to content" 链接
- Dark 模式对比度验证

### 模块 6：性能优化

- Core Web Vitals 优化
- 图片/视频 lazy loading
- Three.js bundle 拆分
- 字体 preload

### 模块 7：CI/CD

- GitHub Actions 构建部署
- Manim 渲染 workflow
- 自动部署到自托管服务器

---

## 六、已知技术约束

| 约束 | 说明 | 应对 |
|------|------|------|
| MDX + LaTeX `{}` 冲突 | MDX 解析器在 remark-math 之前处理 `{...}` | 使用 MathBlock/MathInline React 组件 |
| Safari 不支持 WebM | Manim 视频需双格式输出 | WebM VP9 + MP4 H.264 fallback |
| Pagefind 中文不支持词干提取 | Pagefind 对 zh-cn 无 stemming | 搜索仍可用，但不支持词根匹配 |
| Tailwind v4 语法变更 | 不再使用 `@tailwind` 指令 | 使用 `@import "tailwindcss"` + `@tailwindcss/vite` |
| 内容 slug 含目录前缀 | `lesson.slug` 如 `calculus/01-xxx` | 在页面中用 `split('/').slice(1)` 去掉课程前缀 |
