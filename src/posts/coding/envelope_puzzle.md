---
title: 三信封游戏
excerpt: 一道以后验更新驱动决策的概率题
date: 2026-03-17
isOriginal: true
category: 
    - Knowledge
tag: 
    - Puzzle
    - Python
---

在你面前有三个信封，每个信封里的金额分别是 $X,2X,4X$。你知道 $X$ 在 $[100,1000]$ 上**均匀分布**，即 $X\sim U[100,1000]$（为方便起见，将 $X$ 视为连续实数）。

你先打开一个信封，看到金额 $A$。此时你可以选择直接拿走，也可以选择继续打开其他信封。但是，之后每打开一个新信封都要**额外支付 200**，且一旦打开新信封，前一个信封**必须放弃**。

如果你的目标是最大化最终净收益，那么应该选择怎样的开封策略？最终的净收益期望又是多少？

## 打开第一个信封后的策略
你看到第一个信封金额 $A$ 后，它可能对应三种角色：

- $A=X$
- $A=2X$
- $A=4X$

由于 $X$ 在区间上均匀，而变量替换带来 Jacobian，三种角色的后验相对权重满足

$$
A=X:\;A=2X:\;A=4X\propto 1:\frac{1}{2}:\frac{1}{4}.
$$

::: tip
这里的 *Jacobian* 可以直观理解成**尺度修正系数**：当把变量从 $X$ 换成 $A=kX$ 时，区间长度会被放大 $k$ 倍，所以对应密度要除以 $k$。

想象你开封后看到的金额 $A=800$，考虑：
- $A=X$：由于 $X\sim U[100,1000]$，所以 $A\sim U[100,1000]$。
- $A=2X$：由于 $X\sim U[100,1000]$，所以 $A\sim U[200,2000]$。
- $A=4X$：由于 $X\sim U[100,1000]$，所以 $A\sim U[400,4000]$。

可以直观想象，相比于 $A=2X$ 和 $A=4X$，在 $A=X$ 时，**更有可能**观测到 $A=800$ 这个现象（因为 $A$ 均匀分布的区间更小）。相当于，$A=X$ 对 $A=800$ 这个现象的**贡献**最大。

因此在固定 $A$ 的条件下，$A=X,A=2X,A=4X$ 的权重会自然出现 $1,\frac12,\frac14$。
:::

据此可得分段后验（只写有可行解的区间）：

$$
P(A=X, A=2X, A=4X\mid A)=
\begin{cases}
(1,0,0), & 100\le A<200,\\
\left(\frac{2}{3},\frac{1}{3},0\right), & 200\le A<400,\\
\left(\frac{4}{7},\frac{2}{7},\frac{1}{7}\right), & 400\le A\le 1000,\\
\left(0,\frac{2}{3},\frac{1}{3}\right), & 1000<A\le 2000,\\
(0,0,1), & 2000<A\le 4000.
\end{cases}
$$

将该后验带入后续决策并倒推，**第一步最优规则**可以写成：

$$
\boxed{A<2000\Rightarrow\text{继续开第二只；}\;A\ge 2000\Rightarrow\text{直接停手。}}
$$

直观上也很好理解：
1. 当 $A\ge 2000$ 时，第一只只能是 $4X$ 档，不可能再有更大金额，继续开只会增加成本。

2. 当第一只不是 $4X$ 档时（等价于当前观测满足 $A<2000$），继续开的期望**严格高于**立刻拿走：原因是你付出的成本上界是固定的（最多两次共 400），而收益端仍保留“上档金额”的信息价值。

::: tip
用最直观的不等式看，$X>100$，因此 $2X-200>0$、$4X-400>0$，说明即便扣除开封成本，后续候选金额的净值仍为正。

更关键的点在于，后续决策是**先看再选**：若第二步信息不利可以立即停在 $B-200$，若信息有利再开第三只。所以继续开对应的是一个带最优停止的条件期望。

正因为这种可选性，第一步在 $A<2000$ 时满足 $\mathbb E[\text{继续后的最优净收益}\mid A]>A$，因此应继续，而不是直接拿走第一个信封。
:::

## 打开第二个信封后的策略
现在假设你已经支付一次成本打开第二只，看到金额 $B$。是否再开第三只，取决于第三只金额 $C$ 的条件期望：

- 现在停手净收益：$B-200$
- 再开第三只净收益期望：$\mathbb E[C\mid A,B]-400$

因此决策条件是

$$
\mathbb E[C\mid A,B] > B+200.
$$

记

$$
m=\min(A,B),\quad M=\max(A,B).
$$

则只会出现两类比例关系。

### 情况一：M=4m
说明已经看到的是 $\{X,4X\}$，第三只必然是 $2X=2m$。此时再开第三只当且仅当

$$
2m > B+200.
$$

化成可执行规则：

- 若当前 $B=4m$（手上是较大那只），一定不再开。
- 若当前 $B=m$（手上是较小那只），当且仅当 $m>200$ 再开。

### 情况二：M=2m
说明已见两只相邻，但不确定是 $\{X,2X\}$ 还是 $\{2X,4X\}$。

设 $q$ 是两只已开封金额为 $\{X,2X\}$ 的概率，即

$$
q=P(\{A,B\}=\{X,2X\}\mid A,B).
$$

由同样的 Jacobian 权重推得

$$
q=
\begin{cases}
1, & 100\le m<200,\\
\frac{2}{3}, & 200\le m\le 1000,\\
0, & 1000<m\le 2000.
\end{cases}
$$

::: tip
推导思路与前文一致：把“观测到的最小值 $m$”看成由 $X$ 线性缩放得到。已知看到的是一对 $(m,2m)$，只可能来自两种假设：

- $H_1:\{A,B\}=\{X,2X\}$，此时 $m=X$；
- $H_2:\{A,B\}=\{2X,4X\}$，此时 $m=2X$（即 $X=m/2$）。

因为 $X\sim U[100,1000]$，先验密度是常数，区分两种假设的关键就是变量替换的 Jacobian：

$$
w_1(m)\propto \left|\frac{dX}{dm}\right|_{H_1}=1,\qquad
w_2(m)\propto \left|\frac{dX}{dm}\right|_{H_2}=\frac12.
$$

再结合可行区间：$H_1$ 只在 $m\in[100,1000]$ 有效，$H_2$ 只在 $m\in[200,2000]$ 有效。于是归一化后

$$
q=P(H_1\mid m)=
\begin{cases}
1, & 100\le m<200,\\
\frac{1}{1+\frac12}=\frac23, & 200\le m\le 1000,\\
0, & 1000<m\le 2000.
\end{cases}
$$
:::

于是第三只条件期望为

$$
\mathbb E[C\mid A,B]=q\cdot 4m + (1-q)\cdot\frac{m}{2}
=
\begin{cases}
4m, & 100\le m<200,\\
\frac{17}{6}m, & 200\le m\le 1000,\\
\frac{m}{2}, & 1000<m\le 2000.
\end{cases}
$$

再与阈值 $B+200$ 比较，就得到**第二步策略**：

- 若当前拿的是较小那只（$B=m$），当且仅当 $m\le 1000$ 再开。
- 若当前拿的是较大那只（$B=2m$）：
  - $100<m<200$ 时再开；
  - $200\le m\le 240$ 时不再开；
  - $240<m\le 1000$ 时再开；
  - $m>1000$ 时不再开。

## 期望收益
下面在风险中性（线性效用）下，计算该最优策略的公允价格（期望净收益）。

::: tip
这里 *风险中性（线性效用）* 指效用函数取 $u(w)=w$：同样期望值的收益方案被认为等价，不额外奖励稳定性也不额外惩罚波动。因此本文可以直接以“期望净收益最大”为决策目标。
:::

令

- $V_1(X)$：第一只恰好是 $X$ 时的最优净收益；
- $V_2(X)$：第一只恰好是 $2X$ 时的最优净收益；
- $V_3(X)$：第一只恰好是 $4X$ 时的最优净收益。

1. **第一只是 $X$**：按上一节规则分段可得

$$
V_1(X)=
\begin{cases}
4X-300, & 100\le X<200,\\
3X-200, & 200\le X\le 240,\\
4X-300, & 240<X\le 1000.
\end{cases}
$$

2. **第一只是 $2X$**：同样按上一节规则分段可得

$$
V_2(X)=
\begin{cases}
4X-300, & 100\le X\le 120,\\
\frac{5}{2}X-400, & 120<X\le 500,\\
4X-300, & 500<X\le 1000.
\end{cases}
$$

3. **第一只是 $4X$**：当 $X\ge 500$ 时，第一步已满足 $A=4X\ge 2000$，应立即停手；当 $X<500$ 时按第二步规则分段，得到

$$
V_3(X)=
\begin{cases}
X-300, & 100\le X\le 200,\\
\frac{3}{2}X-400, & 200<X\le 500,\\
4X, & 500<X\le 1000.
\end{cases}
$$

**总期望**：第一只信封等概率对应三档，因此

$$
\mathbb E[V^*]=
\frac{1}{3}\cdot\frac{1}{900}
\left(
\int_{100}^{1000}V_1(X)\,dX+
\int_{100}^{1000}V_2(X)\,dX+
\int_{100}^{1000}V_3(X)\,dX
\right).
$$

分段积分后可得

$$
\boxed{\mathbb E[V^*]=\frac{47230}{27}\approx 1749.26.}
$$

作为对照，如果完全不使用“额外开封权”，随机拿第一只的期望仅为

$$
\mathbb E\left[\frac{X+2X+4X}{3}\right]
=\frac{7}{3}\cdot 550
=1283.33.
$$

因此策略带来的信息价值约为

$$
1749.26-1283.33\approx 465.93.
$$

## 代码验证
这里给出两种验证方式：

1. **蒙特卡洛模拟**：直接模拟“先验采样 + 按策略决策”。原理是大量重复随机实验，用样本均值近似理论期望；样本越多结果越稳定，但本质是数值近似，存在随机波动。

2. **Bellman 递推**：显式构造后验并计算值函数。原理是按“最后一步到第一步”做动态规划，在每个状态比较“停手”和“继续”两种动作的价值；与蒙特卡洛相比，它不是靠随机试验逼近，而是基于状态转移与条件期望直接求最优决策结构。

### 蒙特卡洛模拟验证
蒙特卡洛模拟验证将上文的策略编码，并依照此进行大量重复实验，观测最后结果的收敛值。

::: normal-demo Python demo

```python
import random

def should_open_third(a, b):
    """
    已看过第一只 a、第二只 b（且已支付一次 200）后，
    是否值得再花 200 开第三只。
    """
    m, M = min(a, b), max(a, b)

    # 情况 1：已看到 {X,4X}，第三只必为 2X = 2m
    if abs(M - 4 * m) < 1e-12:
        expected_last = 2 * m

    # 情况 2：已看到相邻两档 {X,2X} 或 {2X,4X}
    elif abs(M - 2 * m) < 1e-12:
        if 100 <= m < 200:
            q = 1.0
        elif 200 <= m <= 1000:
            q = 2 / 3
        elif 1000 < m <= 2000:
            q = 0.0
        else:
            raise ValueError(f"unexpected m={m}")

        # 若是 {X,2X}，剩下的是 4m；若是 {2X,4X}，剩下的是 m/2
        expected_last = q * (4 * m) + (1 - q) * (m / 2)

    else:
        raise ValueError(f"bad pair: {a}, {b}")

    # 再开第三只条件：E[C|A,B] > B + 200
    return expected_last > b + 200

def play_one_game():
    x = random.uniform(100, 1000)
    envelopes = [x, 2 * x, 4 * x]

    # 三只信封打开顺序随机
    order = random.sample([0, 1, 2], 3)

    # 第一次打开
    a = envelopes[order[0]]

    # 第一步策略：A < 2000 继续，否则停止
    if a >= 2000:
        return a

    # 第二次打开（已支付一次成本）
    b = envelopes[order[1]]

    # 决定是否开第三只
    if should_open_third(a, b):
        c = envelopes[order[2]]
        return c - 400
    else:
        return b - 200

def monte_carlo(n=1_000_000):
    total = 0.0
    for _ in range(n):
        total += play_one_game()
    return total / n

for n in [10_000, 100_000, 500_000, 2_000_000]:
    est = monte_carlo(n)
    print(f"{n:>9,d} 次模拟: 期望收益 ≈ {est:.4f}")
```

:::

随着样本数增大，结果会围绕理论值 $1749.26$ 波动并逐步收敛。

### Bellman 递推验证
Bellman 递推验证不硬编码阈值，而是显式计算后验并做动态规划。核心方程是

$$
V_2(a,b)=\max\{b,\;\mathbb E[C\mid a,b]-200\},
$$

$$
V_1(a)=\max\{a,\;\mathbb E[V_2(a,B)\mid a]-200\}.
$$

::: normal-demo Python demo

```python
from math import isclose
import numpy as np

COST = 200.0
ROLES = (1.0, 2.0, 4.0)  # 金额分别为 r * X
X_MIN, X_MAX = 100.0, 1000.0
EPS = 1e-12

def normalize(items):
    s = sum(w for _, w in items)
    return [(obj, w / s) for obj, w in items]

def posterior_after_first(a):
    """
    已知第一次看到 A=a，返回后验假设 [(hyp, prob), ...]
    hyp = {"x": x, "r1": r1}，表示 a = r1 * x
    """
    hyps = []
    for r1 in ROLES:
        x = a / r1
        if X_MIN - EPS <= x <= X_MAX + EPS:
            # 后验权重与 Jacobian 对应：proportional to 1 / r1
            hyps.append(({"x": x, "r1": r1}, 1.0 / r1))
    return normalize(hyps)

def posterior_after_second(a, b):
    """
    已知看到 a, b 后的后验。
    hyp = {"x": x, "r1": r1, "r2": r2, "r3": r3}
    其中第三只金额是 r3 * x
    """
    hyps2 = []
    for h1, p1 in posterior_after_first(a):
        x, r1 = h1["x"], h1["r1"]
        remaining = [r for r in ROLES if r != r1]
        for r2 in remaining:
            if isclose(r2 * x, b, abs_tol=1e-9):
                r3 = [r for r in remaining if r != r2][0]
                # 给定第一次假设后，第二次从剩余两个里均匀抽到
                hyps2.append(({"x": x, "r1": r1, "r2": r2, "r3": r3}, p1 * 0.5))
    return normalize(hyps2)

def expected_last(a, b):
    post = posterior_after_second(a, b)
    return sum(p * (h["r3"] * h["x"]) for h, p in post)

def V2(a, b):
    return max(b, expected_last(a, b) - COST)

def continue_value_after_first(a):
    """
    第一步若选择继续，进入第二步后的期望最优值（尚未扣第一笔 200）
    """
    total = 0.0
    for h1, p1 in posterior_after_first(a):
        x, r1 = h1["x"], h1["r1"]
        remaining = [r for r in ROLES if r != r1]
        val = 0.5 * V2(a, remaining[0] * x) + 0.5 * V2(a, remaining[1] * x)
        total += p1 * val
    return total

def V1(a):
    return max(a, continue_value_after_first(a) - COST)

def initial_value_grid(n=20001):
    """
    数值积分近似 E[V*] = E[(V1(X)+V1(2X)+V1(4X))/3]
    """
    xs = np.linspace(100.0, 1000.0, n)
    vals = [(V1(x) + V1(2 * x) + V1(4 * x)) / 3.0 for x in xs]
    return float(np.mean(vals))

print("Approx initial value =", initial_value_grid())
print("Theory =", 47230 / 27)
```

:::

该代码会给出与解析解一致的结果，数值积分逼近 $1749.26$。

## 小结
这个问题的关键不是“猜哪个信封更大”，而是每次观察后都进行**后验更新**，并把“信息价值 - 开封成本”作为决策标准。

**最终结论**：
- 第一阶段策略：$A<2000$ 继续开，$A\ge 2000$ 停止。
- 第二阶段策略：按 $A,B$ 的比值分成 $4:1$ 与 $2:1$ 两类，再比较 $\mathbb E[C\mid A,B]$ 与 $B+200$。
- 线性效用下的公允价格（最优期望净收益）：

$$
\frac{47230}{27}\approx 1749.26.
$$
