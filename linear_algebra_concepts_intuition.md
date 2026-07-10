现在我有完整数据了。下面是 30 课每个概念的直觉、核心公式和交互组件对照表。

---

## 模块 1：向量与它的语言

### 01 向量即箭头 / Vectors as Arrows
- **直觉**：向量 = 方向 + 长度，与起点无关。同一根箭头从不同原点画出都是同一个向量。
- **核心公式**：$\vec{v} = (v_1, v_2)$，$\lVert\vec{v}\rVert = \sqrt{v_1^2 + v_2^2}$
- **组件**：`VectorCanvas` — 拖拽箭头端点，实时显示坐标和长度

### 02 向量加法 / Vector Addition
- **直觉**：首尾相接——沿一根箭头走完，再沿另一根走。三箭头形成三角形。
- **核心公式**：$\vec{a} + \vec{b} = (a_1 + b_1,\; a_2 + b_2)$
- **组件**：`VectorAddition` — 两箭头首尾相接，第三条边即和向量

### 03 标量乘法 / Scalar Multiplication
- **直觉**：拉伸或翻转箭头。$c > 0$ 方向不变，$c < 0$ 方向反转，$c = 0$ 缩为零。
- **核心公式**：$c\vec{v} = (cv_1, cv_2)$
- **组件**：`ScalarMult` — 滑块控制标量 $c$，箭头在方向线上伸缩/翻转

### 04 点积 / The Dot Product
- **直觉**：两箭头有多少指向同一方向。正 = 同向，零 = 垂直，负 = 反向。
- **核心公式**：$\vec{a} \cdot \vec{b} = a_1 b_1 + a_2 b_2 = \lVert\vec{a}\rVert \lVert\vec{b}\rVert \cos\theta$
- **组件**：`DotProductVis` — 拖拽向量 + 投影影子；点积正负零实时变化

### 05 长度、角度与正交 / Length, Angles, Orthogonality
- **直觉**：点积编码了长度和角度。垂直 = 点积为零，是最重要的几何条件。
- **核心公式**：$\cos\theta = \frac{\vec{a} \cdot \vec{b}}{\lVert\vec{a}\rVert \lVert\vec{b}\rVert}$，$\vec{a} \perp \vec{b} \iff \vec{a} \cdot \vec{b} = 0$
- **组件**：`DotProductVis` — 旋转向量直到点积恰好为零，直角标记出现

---

## 模块 2：张成、基与坐标系

### 06 线性组合 / Linear Combinations
- **直觉**：缩放并叠加两根箭头能到达平面上的任何点（如果它们不共线）。
- **核心公式**：$c_1 \vec{v_1} + c_2 \vec{v_2}$，滑动 $c_1, c_2$ 观察结果点扫过空间
- **组件**：`LinearCombo` — 首尾相接构造；$c_1/c_2$ 变化时结果点实时移动

### 07 Span 与线性无关 / Span and Linear Independence
- **直觉**：向量被困在一条线上 vs 自由填满整个平面。无关 = 方向不同；相关 = 被困。
- **核心公式**：$\text{span}(\vec{v_1}, \vec{v_2}) = \{c_1\vec{v_1} + c_2\vec{v_2} : c_1, c_2 \in \mathbb{R}\}$
- **组件**：`SpanExplorer` — 密集点阵填满平面（独立）vs 点落在一条线上（相关）

### 08 基与维数 / Basis and Dimension
- **直觉**：基是最小独立方向集；其数量即维数。同一空间可以用不同的基描述。
- **核心公式**：$\mathcal{B} = \{\vec{b_1}, \vec{b_2}\}$ 是基 $\iff$ 线性无关且张成整个空间
- **组件**：`MatrixTransform2D` — 同一目标点在不同基下坐标不同但点不变

### 09 投影 / Projections
- **直觉**：向量 $\vec{b}$ 在 $\vec{a}$ 上的"影子"——垂直落点到 $\vec{a}$ 的线上。
- **核心公式**：$\text{proj}_{\vec{a}} \vec{b} = \frac{\vec{a} \cdot \vec{b}}{\vec{a} \cdot \vec{a}} \vec{a}$
- **组件**：`ProjectionVis` — 箭头 + 垂线落点 + 直角标记 + 投影坐标读数

### 10 基变换 / Basis Change
- **直觉**：同一向量在不同基下有不同坐标。基变换矩阵 $P$ 的列就是新基向量。
- **核心公式**：$[\vec{v}]_\text{new} = P^{-1} \vec{v}$，$P = [\vec{b_1} \mid \vec{b_2}]$
- **组件**：`BasisChangeVis` — 双重网格（标准基 + 新基虚线），坐标实时对比

---

## 模块 3：矩阵即空间变换

### 11 线性变换 / Linear Transformations
- **直觉**：线保持线、原点不动、网格均匀变形。整个网格像橡皮布一样被拉扯。
- **核心公式**：$T(c\vec{v}) = c\,T(\vec{v})$，$T(\vec{a}+\vec{b}) = T(\vec{a}) + T(\vec{b})$
- **组件**：`MatrixTransform2D` — 网格从恒等矩阵平滑变形到目标矩阵

### 12 矩阵编码变换 / Matrices Encode Transformations
- **直觉**：矩阵的列就是基向量落到的位置。知道列就知道整个变换。
- **核心公式**：$A = \begin{bmatrix} A\hat{e}_1 & A\hat{e}_2 \end{bmatrix}$，两个彩色列箭头移到新位置
- **组件**：`MatrixTransform2D` — 基箭头着色，整个网格跟随变形

### 13 矩阵向量乘积 / Matrix-Vector Product
- **直觉**：$A\vec{x}$ 就是 $\vec{x}$ 份第一列 + $y$ 份第二列——列的线性组合。
- **核心公式**：$A\vec{x} = x_1 \vec{c_1} + x_2 \vec{c_2} = x_1 \begin{pmatrix}a\\c\end{pmatrix} + x_2 \begin{pmatrix}b\\d\end{pmatrix}$
- **组件**：`MatrixTransform2D` — 向量被分解为列的线性组合

### 14 行列式 / The Determinant
- **直觉**：变换拉伸或压缩了多少面积。$\det = 0$ 意味着空间坍缩。
- **核心公式**：$\det\begin{pmatrix}a&b\\c&d\end{pmatrix} = ad - bc$，面积缩放因子
- **组件**：`MatrixTransform2D` — 单位正方形变平行四边形；面积数字 + 坍缩提示

### 15 矩阵乘法 / Matrix Multiplication
- **直觉**：复合变换——先变形一次，再变形一次。顺序重要：$AB \neq BA$。
- **核心公式**：$(AB)_{ij} = \sum_k a_{ik} b_{kj}$，$(BA)\vec{x} = B(A\vec{x})$
- **组件**：`MatrixTransform2D` — 连续网格变形

---

## 模块 4：线性方程组与可逆性

### 16 线性方程组的几何 / Linear Systems as Geometry
- **直觉**：解 $A\vec{x} = \vec{b}$ 即问：$\vec{b}$ 在变换的值域中吗？行视角看交点，列视角看组合。
- **核心公式**：$A\vec{x} = \vec{b}$，行视角：直线交点；列视角：$\vec{b} = x_1 \vec{c_1} + x_2 \vec{c_2}$
- **组件**：`LinearSystemVis` — 行视角（线交点）/ 列视角（向量组合）切换

### 17 逆矩阵 / Inverse Matrices
- **直觉**：逆变换撤销原变换，把变形的网格变回来。仅在 $\det \neq 0$ 时存在。
- **核心公式**：$A^{-1}A = I$，$\det(A) \neq 0 \iff A^{-1}$ 存在
- **组件**：`MatrixTransform2D` — 正变换 → 逆变换 → 回到原始网格

### 18 列空间与零空间 / Column Space and Null Space
- **直觉**：列空间是变换的所有可能输出；零空间是被压碎到零的所有输入。
- **核心公式**：$\text{Col}(A) = \text{span}(\vec{c_1}, \ldots, \vec{c_n})$，$\text{Null}(A) = \{\vec{x} : A\vec{x} = \vec{0}\}$
- **组件**：`MatrixTransform2D` + `ColumnSpaceVis` — 随机输入经变换后着色点填满列空间

### 19 零空间 / Null Space
- **直觉**：零空间是变换的"盲区"——哪些输入全部映射到原点。
- **核心公式**：$\text{Null}(A) = \{\vec{x} : A\vec{x} = \vec{0}\}$，$\dim(\text{Null}) = n - \text{rank}(A)$
- **组件**：`NullSpaceVis` — 输入向量场中被压碎到原点的方向高亮

### 20 子空间 / Subspaces
- **直觉**：秩 = 列空间维数；四子空间划分输入输出空间，成对正交互补。
- **核心公式**：$\text{Row}(A) \perp \text{Null}(A)$，$\text{Col}(A) \perp \text{Null}(A^T)$
- **组件**：`SpanExplorer` + `FourSubspacesVis` — 四子空间正交补关系示意图

---

## 模块 5：正交与分解

### 21 正交基与 Gram-Schmidt / Orthogonal Bases
- **直觉**：任何基都可以通过反复减去投影"扶正"——从倾斜变垂直。
- **核心公式**：$\vec{u_2} = \vec{v_2} - \text{proj}_{\vec{u_1}} \vec{v_2} = \vec{v_2} - \frac{\vec{v_2} \cdot \vec{u_1}}{\vec{u_1} \cdot \vec{u_1}} \vec{u_1}$
- **组件**：`GramSchmidtVis` — 逐步"甩掉"沿前一向量方向的分量，弹到垂直位置

### 22 特征向量与特征值 / Eigenvectors and Eigenvalues
- **直觉**：变换中只拉伸不旋转的特殊方向。向量圆变成椭圆，但特征箭头保持在自己线上。
- **核心公式**：$A\vec{v} = \lambda\vec{v}$，$\det(A - \lambda I) = 0$
- **组件**：`EigenvectorVis` — 向量圆变椭圆；特征箭头只拉伸

### 23 对角化 / Diagonalization
- **直觉**：在特征基下，矩阵变成简单的拉伸因子列表——对角线上的 $\lambda$。
- **核心公式**：$A = PDP^{-1}$，$D = \begin{pmatrix}\lambda_1 & 0 \\ 0 & \lambda_2\end{pmatrix}$
- **组件**：`DiagonalizationVis` — 标准坐标下复杂变形 vs 特征坐标下仅沿轴拉伸

### 24 奇异值分解 / SVD
- **直觉**：每个矩阵都有正交输入基和输出基，中间是拉伸因子。圆 → 椭圆。
- **核心公式**：$A = U\Sigma V^T$，$U^TU = I$，$V^TV = I$，$\Sigma = \text{diag}(\sigma_1, \sigma_2)$
- **组件**：`SVDExplorer` — 单位圆 → 沿轴拉伸 → 旋转；三阶段动画

---

## 模块 6：超越二维

### 25 三维变换 / 3D Transformations
- **直觉**：3D 矩阵与 2D 完全同理。网格立方体变平行六面体，列是三个基向量落到的位置。
- **核心公式**：$3 \times 3$ 矩阵，$\det(A)$ = 体积缩放因子，旋转矩阵 $R_z(\theta)$ 保持 $z$ 轴
- **组件**：`MatrixTransform3D` (R3F) — 3D 线框笼旋转/剪切/拉伸

### 26 叉积 / The Cross Product
- **直觉**：3D 中两向量定义平行四边形，叉积构建垂直箭头，长度等于面积。
- **核心公式**：$\vec{a} \times \vec{b} = \lVert\vec{a}\rVert \lVert\vec{b}\rVert \sin\theta\;\hat{n}$
- **组件**：`CrossProductVis` (R3F) — 两向量 + 平行四边形 + 垂直箭头

### 27 非方阵 / Non-Square Matrices
- **直觉**：矩阵可以改变维度——$3 \times 2$ 矩阵把 2D 提升到 3D，$2 \times 3$ 矩阵把 3D 压平到 2D。
- **核心公式**：$2 \times 3$: $\begin{pmatrix}1&0&0\\0&1&0\end{pmatrix}\begin{pmatrix}x\\y\\z\end{pmatrix} = \begin{pmatrix}x\\y\end{pmatrix}$（丢弃 $z$）
- **组件**：`NonSquareVis` (R3F) — 3D↔2D 投影/嵌入切换

---

## 模块 7：抽象向量空间

### 28 函数即向量 / Functions as Vectors
- **直觉**：多项式和函数满足箭头的所有规则——相加、缩放、寻找基底。微分是线性变换。
- **核心公式**：基 $\{1, x, x^2\}$，微分矩阵 $D = \begin{pmatrix}0&1&0\\0&0&2\\0&0&0\end{pmatrix}$
- **组件**：`FunctionSpaceVis` — 多项式曲线逐点相加/缩放/基组合

### 29 内积空间 / Inner Product Spaces
- **直觉**：点积推广到函数——积分就是"连续的求和"。积分为零 = 函数"正交"。
- **核心公式**：$\langle f, g \rangle = \int_0^1 f(x)\,g(x)\,dx$，$f \perp g \iff \langle f, g \rangle = 0$
- **组件**：`InnerProductVis` — 函数乘积积分区域着色（蓝 = 正，红 = 负）

---

## 模块 8：尾声

### 30 线性代数在哪里 / Where Linear Algebra Lives
- **直觉**：PCA、图形学、量子力学、PageRank——每个应用都是"矩阵变换空间"的不同外衣。
- **核心公式**：PCA = 协方差矩阵特征分解；PageRank = $A\vec{x} = \lambda\vec{x}$ 的稳态
- **组件**：`EigenvectorVis` + `DotProductVis` — 数据点云 + 主成分方向

---

**直觉迁移链总结：**

```
向量加法 ──→ 线性组合 ──→ 矩阵-向量乘积（"Ax = 列的线性组合"）
   │                                          │
点积 ──→ 投影 ──→ Gram-Schmidt ──→ SVD 正交基  │
   │                                          │
基变换 ──────────────→ 对角化（"换到特征基"）←─ 特征向量
                                                    │
                                              SVD（推广到任意矩阵）
```