# MathViz · 用动画看见数学

> 从空间直觉到深层理解——一个为重建数学直觉而造的交互式学习工具。

## 为什么存在

MathViz 源于一个很个人的需求：在线性代数、微积分、概率论三门课中，建立真正的空间直觉——不只是会算题，而是能"看见"符号背后的几何含义。

**核心理念：先看见，再形式化。** 每个概念先用动画和交互让你看见它长什么样，然后再引入定义和公式。

**特点：**
- 每个概念配有可拖动、可调参的交互组件
- 中英双语（`/` English, `/zh/` 中文）
- 开源免费，静态站点可离线使用
- 一课一课来，每课让直觉扎根

## Tech Stack

Astro 5 · React 19 · Tailwind CSS 4 · KaTeX · D3.js (2D 动画) · React Three Fiber (3D 可视化) · Pagefind

## Quick Start

```bash
npm install
npm run dev          # → http://localhost:4321
npm run build        # Astro build + Pagefind index
```

## Project Structure

```
src/
├── components/
│   ├── ui/              # Button, Card, Badge, Tabs, ProgressBar
│   ├── layout/          # BaseLayout, Header (含语言切换), Footer
│   ├── learning/        # CourseCard, KeyInsight, ExerciseBlock
│   ├── animation/       # ManimVideo, InteractiveCanvas
│   ├── interactive/     # 交互式数学可视化
│   │   ├── linear-algebra/  # VectorCanvas (SVG + React)
│   │   ├── calculus/        # DerivativeSlope (D3.js 升级中)
│   │   └── probability/     # NormalDistribution (D3.js 升级中)
│   ├── 3d/              # React Three Fiber 3D 可视化 (计划中)
│   └── math/            # MathBlock, MathInline
├── content/lessons/     # MDX 课程文件
│   ├── linear-algebra/
│   ├── calculus/
│   └── probability/
├── i18n/                # ui.ts, utils.ts
├── pages/               # Astro 路由 (en + /zh/)
└── styles/              # tokens.css, global.css
```

## Documentation

| File | Purpose |
|---|---|
| `ROADMAP.md` | 产品理念、学习路径规划、版本节奏 |
| `CLAUDE.md` | AI 编码指南 |
| `DESIGN_SYSTEM.md` | 设计令牌参考 |
| `TECHNICAL_PLAN.md` | 技术架构和待办清单 |
| `CHANGELOG.md` | 版本变更记录 |

## Adding Content

使用 `/mathviz-new-lesson` skill 添加新课程，专注于数学内容和直觉构建，技术细节由 skill 处理。

## Status

**v0.2.0** — 基础平台就绪，7 节课程内容（线性代数 1 + 微积分 3 + 概率论 3），3 个 SVG 交互组件，中英双语。下一步：用 D3.js 升级 2D 动画，用 React Three Fiber 构建 3D 可视化。
