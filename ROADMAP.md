# MathViz — 产品理念与路线图

> 一个人的数学直觉重建工程，恰好开源给了所有人。

---

## 一、为什么做 MathViz

这个项目不是要做一个"产品"，不是为了跟 Brilliant 或 Khan Academy 竞争。

**它来自一个很私人的需求**：我想在这三门数学——线性代数、微积分、概率论——中，完成从"会做题"到"真正理解"的跨越。

我发现自己学数学最大的障碍不是计算能力，而是**缺乏空间直觉**。我能套公式求导数，但说不清导数的几何含义是什么；我能算特征值，但无法在脑海中"看到"特征向量。教科书直接从符号出发，跳过了"看见"这一步。

3Blue1Brown 让我第一次"看见"了线性代数。但视频是单向的——我只能看，不能动手。我想拖动那个向量，想调参数看分布怎么变形，想在切线上滑来滑去感受斜率的变化。

**MathViz 就是我为自己造的学习工具。**

### 核心信念

1. **先看见，再形式化。** 每个概念先用动画或交互让你"看见"几何含义，然后再引入符号定义
2. **空间直觉是理解的基础。** 数学不是符号游戏，是关于空间、变化和模式的语言
3. **动手操作胜过被动观看。** 能拖动、能调参、能探索的组件，比任何视频都更能建立直觉
4. **慢下来，一课一课来。** 不追求速度，每一课都要让直觉真正扎根

---

## 二、线性代数课程 — 8 模块 35 课（已完成）

> 综合四大教学体系重新设计：
> - **3Blue1Brown** — "矩阵即空间变换"为核心隐喻
> - **鸢尾花数学** — 多重视角 + 编程观察学习
> - **Strang** — 四子空间体系
> - **Axler** — 行列式延后，抽象空间

### 中心线索："矩阵变换空间"

每个概念都是这条线索的不同侧面：
- 向量是空间的构成单元
- 线性组合是到达空间中任意点的方式
- 点积衡量空间中向量间的关系
- 行列式测量变换改变了多少面积
- 特征向量是变换"尊重"的方向
- SVD 揭示任意变换的纯拉伸核心

### 直觉迁移链

```
线性组合 → 矩阵-向量乘积（"Ax 就是 A 的列的线性组合"）
Span → 列空间（"列空间就是列的 span"）
点积 → 投影 → Gram-Schmidt → SVD 的正交基
特征向量 → 对角化 → SVD（"SVD 就是非方阵的特征值分解"）
基变换 → 对角化（"对角化就是换到特征基"）
```

### 课程大纲

#### 模块 1: 向量与它的语言 (01-06) — 6 课, 90min, Beginner

| # | EN Title | ZH Title | 直觉目标 | 组件 |
|---|----------|----------|---------|------|
| 01 | Vectors as Arrows | 向量即箭头 | 方向 + 长度，与起点无关 | VectorCanvas |
| 02 | Vector Addition | 向量加法 | 首尾相接 | VectorAddition |
| 03 | Scalar Multiplication | 标量乘法 | 拉伸或翻转 | ScalarMult |
| 04 | The Dot Product | 点积 | 两箭头有多少指向同一方向 | DotProductVis |
| 05 | Length, Angles, Orthogonality | 长度、角度与正交 | 垂直 = 点积为零 | DotProductVis |
| 06 | Norms and Distances | 范数与距离 | L1/L2/L∞ 范数与单位球 | NormBallVis |

> "你现在知道如何构建箭头、测量它们的关系、以及用不同的'尺子'度量空间。下一步：用几根箭头能触及多大空间？"

#### 模块 2: 张成、基与坐标系 (07-11) — 5 课, 84min

| # | EN Title | ZH Title | 直觉目标 | 组件 |
|---|----------|----------|---------|------|
| 07 | Linear Combinations | 线性组合 | 缩放叠加到达任何点 | LinearCombo |
| 08 | Span and Linear Independence | Span 与线性无关 | 被困在线上 vs 填满平面 | SpanExplorer |
| 09 | Basis and Dimension | 基与维数 | 最小独立方向集 | LinearCombo |
| 10 | Projections | 投影 | 一向量在另一向量上的"影子" | ProjectionVis |
| 11 | Basis Change | 基变换 | 同一向量在不同基下的坐标 | BasisChangeVis |

> "基是空间的坐标系。改变基就是改变网格——但底层空间不变。下一步：当网格本身开始移动呢？"

#### 模块 3: 矩阵即空间变换 (12-18) — 7 课, 120min

| # | EN Title | ZH Title | 直觉目标 | 组件 |
|---|----------|----------|---------|------|
| 12 | Linear Transformations | 线性变换 | 线保持线、原点不动 | MatrixTransform2D |
| 13 | Matrices Encode Transformations | 矩阵编码变换 | 列是基向量落到的位置 | MatrixTransform2D |
| 14 | Matrix-Vector Product | 矩阵向量乘积 | Ax = x 份第一列 + y 份第二列 | MatrixTransform2D |
| 15 | The Determinant | 行列式 | 变换拉伸或压缩了多少面积 | MatrixTransform2D |
| 16 | Matrix Multiplication: Four Views | 矩阵乘法四视角 | 复合、行-列点积、列组合、行组合 | MatrixTransform2D |
| 17 | Inverse Matrices | 逆矩阵 | 逆变换撤销原变换 | MatrixTransform2D |
| 18 | Matrix Multiplication Perspectives | 矩阵乘法深层视角 | 列组合、行组合、外积和、块乘法 | MatrixMultPerspectives |

> "矩阵移动空间。复合链接移动。行列式测量面积变化。四种视角揭示乘法结构。"

#### 模块 4: 线性方程组与可逆性 (19-24) — 6 课, 108min

| # | EN Title | ZH Title | 直觉目标 | 组件 |
|---|----------|----------|---------|------|
| 19 | Linear Systems as Geometry | 线性方程组的几何 | 解 Ax=b 即问：b 在值域中吗？ | LinearSystemVis |
| 20 | Column Space | 列空间 | 变换的所有可能输出 | ColumnSpaceVis |
| 21 | Null Space | 零空间 | 变换压碎到零的所有输入 | NullSpaceVis |
| 22 | Rank and the Four Subspaces | 秩与四子空间 | 四子空间划分输入输出空间 | — |
| 23 | Least Squares and Regression | 最小二乘与回归 | 当 Ax=b 无解时的最佳近似 | LeastSquaresVis |
| 24 | Inverse Matrices (Deep) | 逆矩阵深入 | 高斯-若尔当、存在条件 | MatrixTransform2D |

> "每个变换有一个值域和一个盲区。当无解时，最小二乘找到最接近的投影。"

#### 模块 5: 正交与分解 (25-30) — 6 课, 110min

| # | EN Title | ZH Title | 直觉目标 | 组件 |
|---|----------|----------|---------|------|
| 25 | Orthogonal Bases & Gram-Schmidt | 正交基与 Gram-Schmidt | 反复减去投影"扶正"基 | GramSchmidtVis |
| 26 | Eigenvectors and Eigenvalues | 特征向量与特征值 | 只拉伸不旋转的特殊方向 | EigenvectorVis |
| 27 | Diagonalization | 对角化 | 特征基下矩阵变成拉伸因子列表 | DiagonalizationVis |
| 28 | Singular Value Decomposition | 奇异值分解 | 正交输入基 + 正交输出基 + 拉伸 | SVDExplorer |
| 29 | QR Decomposition | QR 分解 | Gram-Schmidt 的矩阵形式 | QRDecompositionVis |
| 30 | Principal Component Analysis | 主成分分析 | 协方差矩阵特征值 = 数据主方向 | PCAViz |

> "特征向量是方阵变换的骨架。SVD 推广到任意矩阵。QR 和 PCA 是线性代数最强大的应用。"

#### 模块 6: 超越二维 (31-33) — 3 课, 50min — **首次 R3F**

| # | EN Title | ZH Title | 直觉目标 | 组件 |
|---|----------|----------|---------|------|
| 31 | 3D Transformations | 三维变换 | 3D 与 2D 完全同理 | MatrixTransform3D (R3F) |
| 32 | The Cross Product | 叉积 | 平行四边形 + 垂直箭头 | CrossProductVis (R3F) |
| 33 | Non-Square Matrices | 非方阵 | 3D↔2D 投影/嵌入 | NonSquareVis (R3F) |

#### 模块 7: 抽象向量空间 (34-35) — 2 课, 34min

| # | EN Title | ZH Title | 直觉目标 | 组件 |
|---|----------|----------|---------|------|
| 34 | Functions as Vectors | 函数即向量 | 多项式满足箭头的所有规则 | FunctionSpaceVis |
| 35 | Inner Product Spaces | 内积空间 | 点积推广到积分和加权和 | InnerProductVis |

#### 模块 8: 尾声 (35) — 已合并至模块 7

> 第 30 课 "Where Linear Algebra Lives" 的应用连接内容已分散融入各课的 Connections 段落。

### 交互组件总览 (23 个)

| 类型 | 组件 | 技术 | 复用课程数 |
|------|------|------|-----------|
| 2D | VectorCanvas, VectorAddition, ScalarMult, LinearCombo, SpanExplorer | SVG+React | 1-2 |
| 2D | DotProductVis, EigenvectorVis, MatrixTransform2D | D3.js | 3-6 |
| 2D | ProjectionVis, BasisChangeVis, LinearSystemVis, NullSpaceVis | D3.js | 1 |
| 2D | GramSchmidtVis, DiagonalizationVis, SVDExplorer | D3.js | 1 |
| 2D | NormBallVis, MatrixMultPerspectives, LeastSquaresVis | D3.js | 1 |
| 2D | ColumnSpaceVis, QRDecompositionVis, PCAViz | D3.js | 1 |
| 2D | FunctionSpaceVis, InnerProductVis | D3.js | 1 |
| 3D | MatrixTransform3D, CrossProductVis, NonSquareVis | R3F | 1 |

---

## 三、后续课程规划

### 微积分 — 理解变化的语言 (计划 12-14 课)

> 现有 4 课，计划扩展至 12-14 课

| # | 课题 | 我要建立的直觉 | 组件 |
|---|------|---------------|------|
| 01 | 什么是导数 | 切线的斜率 = 瞬时变化率 | DerivativeSlope ✅ |
| 02 | 极限与连续 | "无限逼近"的几何含义 | — |
| 03 | 求导法则 | 幂法则/乘积法则/链式法则的几何解释 | — |
| 04 | 用导数画函数图像 | 导数符号 → 增减，二阶导 → 弯曲方向 | FunctionSketcher |
| 05 | 最优化 | 极值点 = 导数为零的地方 | OptimizationVis |
| 06 | 反导数 | "哪个函数的导数是这个？" | — |
| 07 | 黎曼和 | 用矩形逼近曲线下面积 | RiemannSumVis |
| 08 | 定积分 | 无限细分后矩形面积之和 | IntegralAreaVis |
| 09 | 微积分基本定理 | 积分是导数的逆运算——为什么？ | FTCVis |
| 10 | 积分技巧 | 换元、分部——几何上在做什么 | — |
| 11 | 微分方程入门 | 用斜率场"看见"解的走势 | SlopeFieldVis |
| 12 | 泰勒级数 | 用多项式无限逼近任意函数 | TaylorSeriesVis |

### 概率论 — 理解不确定性的语言 (8 模块 27 课 + 符号速查，已完成)

> 综合四大教学体系设计：
> - **Seeing Theory** (Brown University) — 可视化优先的概率教学
> - **Intro to Probability for Data Science** (Stanley Chan, 2021) — 期望/方差作为"形状描述子"
> - **Introduction to Probability** (Pishro-Nik, 开源) — 集中不等式、随机过程
> - **Penn State STAT 414** — 联合分布→边缘分布→条件分布的渐进结构

#### 模块 0: 符号速查 (00) — 1 课, 20min, Beginner

| # | EN Title | ZH Title | 直觉目标 | 组件 |
|---|----------|----------|---------|------|
| 00 | Probability Notation Reference | 概率论符号速查 | 概率论核心符号一览 | — |

#### 模块 1: 机会的语言 (01-04) — 4 课, 66min, Beginner

| # | EN Title | ZH Title | 直觉目标 | 组件 |
|---|----------|----------|---------|------|
| 01 | What is Probability? | 什么是概率？ | 古典/频率/主观三种视角 | — |
| 02 | Counting: The Art of Enumeration | 计数：枚举的艺术 | 排列组合是数东西的方法 | VennDiagramVis |
| 03 | Conditional Probability | 条件概率 | 新信息缩小可能性的世界 | ConditionalProbVis |
| 04 | Bayes' Theorem | 贝叶斯定理 | 翻转条件概率的视角 | BayesVisualizer |

#### 模块 2: 随机变量与它的形状 (05-09) — 5 课, 94min, Beginner→Intermediate

| # | EN Title | ZH Title | 直觉目标 | 组件 |
|---|----------|----------|---------|------|
| 05 | Random Variables | 随机变量 | 结果→数值的桥梁 | — |
| 06 | Expectation and Variance | 期望与方差 | 质心与散布 | ExpectationVis |
| 07 | Discrete Distributions | 离散分布 | Bernoulli→Binomial→Poisson 家族 | DiscreteDistVis |
| 08 | Continuous Distributions | 连续分布 | 密度曲线下的面积 = 概率 | ContinuousDistVis |
| 09 | The Normal Distribution | 正态分布 | 钟形曲线为什么无处不在 | NormalDistribution ✅ |

#### 模块 3: 当变量相遇 (10-13) — 4 课, 68min, Intermediate

| # | EN Title | ZH Title | 直觉目标 | 组件 |
|---|----------|----------|---------|------|
| 10 | Joint Distributions | 联合分布 | 两个变量的 3D 概率地形 | JointDistVis (D3) |
| 11 | Marginal and Conditional | 边缘分布与条件分布 | 投影影子 vs 切片 | MarginalVis |
| 12 | Covariance and Correlation | 协方差与相关 | 两个变量"一起跳舞"的幅度 | CovarianceVis |
| 13 | Independence | 独立性 | 联合地形分解为两座独立的山 | IndependenceVis |

#### 模块 4: 支配随机性的法则 (14-16) — 3 课, 54min, Intermediate

| # | EN Title | ZH Title | 直觉目标 | 组件 |
|---|----------|----------|---------|------|
| 14 | Concentration Inequalities | 集中不等式 | 随机性的数学护栏 | ChebyshevVis |
| 15 | Law of Large Numbers | 大数定律 | 长期中随机性趋于平滑 | LLNAnimation |
| 16 | Central Limit Theorem | 中心极限定理 | 任意分布→钟形曲线的魔法 | SamplingAnimation |

#### 模块 5: 从数据到推断 (17-20) — 4 课, 76min, Intermediate→Advanced

| # | EN Title | ZH Title | 直觉目标 | 组件 |
|---|----------|----------|---------|------|
| 17 | Sampling and Point Estimation | 抽样与点估计 | 从样本猜总体的规则 | SamplingVis |
| 18 | Maximum Likelihood Estimation | 最大似然估计 | 攀登似然地形到最高点 | MLEVis |
| 19 | Confidence Intervals | 置信区间 | 重复实验中 95% 的区间捕获真值 | ConfidenceIntervalVis |
| 20 | Hypothesis Testing | 假设检验 | 两类错误的权衡 | HypothesisTestVis |

#### 模块 6: 贝叶斯思维 (21-23) — 3 课, 52min, Advanced

| # | EN Title | ZH Title | 直觉目标 | 组件 |
|---|----------|----------|---------|------|
| 21 | Two Schools of Thought | 两种思想流派 | 频率学派 vs 贝叶斯学派 | — |
| 22 | Prior, Likelihood, Posterior | 先验、似然与后验 | 数据拉扯信念的几何 | BayesianUpdateVis |
| 23 | Bayesian Inference in Practice | 贝叶斯推断实践 | Beta 分布随数据演化的动态 | ConjugatePriorVis |

#### 模块 7: 随机过程初探 (24-26) — 3 课, 50min, Advanced

| # | EN Title | ZH Title | 直觉目标 | 组件 |
|---|----------|----------|---------|------|
| 24 | Random Walks | 随机游走 | √n 扩散与赌徒破产 | RandomWalkVis |
| 25 | Markov Chains | 马尔可夫链 | 无记忆过程与稳态 | MarkovChainVis |
| 26 | Poisson Processes | 泊松过程 | 事件在时间中随机到达 | PoissonProcessVis |

#### 模块 8: 尾声 (27) — 1 课, 16min, Intermediate

| # | EN Title | ZH Title | 直觉目标 | 组件 |
|---|----------|----------|---------|------|
| 27 | Where Probability Meets the World | 概率与世界的交汇 | 信息论、ML、物理、金融 | — |

---

## 四、开发节奏

**不求快，一课一课来。每课做到直觉真的建立起来。**

### 已完成的里程碑

- **v0.1.0** — 项目脚手架 + 首课 + 设计系统
- **v0.2.0** — i18n 多语言 + 微积分/概率论初版 + Pagefind 搜索
- **v0.3.0** — 线性代数课程全面重设计：15 课 → 30 课，18 个交互组件
- **v0.3.1** — 线性代数深度优化：30 课 → 35 课，18 → 23 个交互组件，全部课程深化

### 版本计划

- **v0.4** — 浏览器测试 + QuadraticFormVis 组件
- **v0.5** — 微积分扩展至 12 课
- **v0.6** — 概率论扩展至 27 课 (8 模块) ✅
- **v0.7** — 跨课程集成 (统一符号表、前置课链接、进度追踪)
- **v1.0** — 三门课程全部完成，所有交互组件就绪，公开上线

### 如果有社区参与

如果未来有人想用 MathViz 学习或贡献内容，那很好。但**内容质量和直觉准确性永远优先于内容数量**。

可能的社区协作方向：
- 翻译校对（特别是数学概念的中文表述）
- 新的交互组件（如果你有更好的可视化想法）
- 新课程方向（离散数学、统计学等）
- Bug 修复和性能优化

---

## 五、技术决策原则

所有技术选择服务于一个目的：**让我专注于写内容和建交互，不被工程细节拖慢。**

| 原则 | 体现 |
|------|------|
| 静态优先，零运维 | Astro 产出纯 HTML，自托管零成本 |
| 内容即文件 | 每课一个 MDX，Git 版本管理，无数据库 |
| 交互组件可复用 | MatrixTransform2D 在 6+ 课中复用 |
| 中英双语内建 | 每课写一次内容，frontmatter 加中文翻译即可 |
| 构建时验证 | `npm run build` 能发现所有路由和内容错误 |
| Web 原生可视化 | D3.js (2D) + React Three Fiber (3D) |
| 懒加载 3D | R3F 组件全部 `client:visible`，移动端按需降级 |

---

## 六、关于这个项目

MathViz 是一个开源的个人学习项目。如果你也正在学这三门数学，希望这里的动画和交互能帮你"看见"那些符号背后的世界。

如果你有任何建议或发现数学表述上的错误，欢迎提 Issue 或 PR。

---

## 七、当下最该做的事

**浏览器测试所有 35+27 课 + 23 个交互组件。** 构建需验证通过。重点关注：

1. R3F 3D 组件的移动端性能（MatrixTransform3D, CrossProductVis, NonSquareVis）
2. 所有课程导航链接是否正确连接
3. D3 组件在 dark mode 下的可读性
4. QuadraticFormVis (D3+R3F) 组件开发 — 二次型等高线 + 抛物面
5. 概率论交互组件开发（20 个计划组件，目前仅 NormalDistribution 已实现）
