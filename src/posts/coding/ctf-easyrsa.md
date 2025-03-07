---
title: RSA——熟悉又陌生的朋友
excerpt: 解析来自CTF-Crypto的9道RSA题目
date: 2024-10-21
isOriginal: true
category: 
    - Knowledge
tag: 
    - CTF
    - Crypto
    - Python
---


提到RSA，大多数人的第一反应是“经典”。作为早在1977年就被提出的公钥加密算法，RSA一直坚持到现在：时至今日仍然有许多领域采用RSA加密算法（如支付系统、电子门禁等）。

虽然RSA的大名家喻户晓，但是你真正了解RSA吗？如果对目前的RSA算法中稍作改动，使其安全性急剧降低，你能够敏锐地发现漏洞并利用它攻破RSA吗？让我们今天来试试吧！

## RSA简介
RSA加密算法基于数论中的大质数和模运算。

生成密钥时，首先选择两个大质数 $p$ 和 $q$，计算它们的乘积 $n = p \times q$。然后，计算 $\phi(n) = (p-1) \times (q-1)$，这是 $n$ 的欧拉函数。

接下来，选择一个整数 $e$，使其与 $\phi(n)$ 互质，通常选择小的质数如 65537。然后，计算 $d$ 使得 $d \times e \mod \phi(n) = 1$。最后得到**公钥** $(e, n)$ 和**私钥** $(d, n)$。

加密时，用公钥将明文 $m$ 转换为密文 $c$：  
$$ c = m^e \mod n $$
解密时，用私钥将密文 $c$ 转换回明文 $m$：  
$$ m = c^d \mod n $$
这样，只有持有私钥的人才能解密信息。

::: note
这里的**大**质数非常大，为了保证安全性，一般选择2048位的 $p$ 和 $q$。

这个数量级大约是 $10^{616}$，要知道可观测宇宙中所有原子的数量只有大约 $10^{80}$。
:::

以上给出的 *Plain RSA* 算法的定义非常简单，也足够保护明文不被只拥有窃听能力的敌手破译。

针对具有更强能力的敌手，有大量针对 *Plain RSA* 算法的改良，但本质都相同。因此在本篇博客中不介绍各种强大的改良RSA算法，仅通过 *Plain RSA* 算法了解基本原理即可。!!并且以下关于RSA的题目使用的也都是 *Plain RSA*!!

## 相关题目
博主在上海交大CTF的在线练习平台——[0ops OJ](https://ctfzone.sjtu.cn/)上挑选了9道名为 *easyrsa* 的题目，想在实战中加深对RSA的理解。以下是对这9道题的回顾和解析，读者有兴趣也欢迎一起思考。

::: info
**CTF**（Capture The Flag，夺旗赛）起源于 1996 年 DEFCON 全球黑客大会，是网络安全爱好者之间的竞技游戏。

目前的CTF题目主要依据常见的 **Web**-网络攻防、**RE**-逆向工程、**Pwn**-二进制漏洞利用、**Crypto**-密码攻击、**Mobile**-移动安全 以及 **Misc**-安全杂项 来进行分类。

本篇博客中介绍的 *easyrsa* 组题属于**Crypto**。
:::

在以下题目的回顾解析中，博主将统一按**原题、思路、解答**三个部分顺序书写。其中
- 原题：仅摘录必要的源代码，如输入输出之类的无关代码会省略。
- 思路：或多或少，如果需要额外知识会附加在思路部分。
- 解答：完整的获取flag的解答函数（Python），默认折叠状态。

为了方便，以下内容中若无特别说明，下列字符均表示相同含义（如有下标，则同下标的字符相互对应）：

|   字符      |   含义   |
|  :----:    |  :----:  |
|  $p$、$q$   |  随机选取的大质数   |
|  $n$       |  $p \cdot q$   |
|  $\phi(n)$ |  $(p-1)(q-1)$   |
|  $e$       |  与 $\phi(n)$ 互质的随机数   |
|  $d$       |  满足 $d \cdot e \mod \phi(n) = 1$ 的随机数  |
|  $c$       |  密文   |
|  $plain$   |  明文   |

### *easyrsa0*
```python
# Known: n、e、c
# Goal: plain
plain = int(FLAG[5:-1])
p = getPrime(24)
q = getPrime(24)
n = p*q
e = 65537
c = pow(plain,e,n)
```

这个RSA算法毫无安全性可言。
当看到这可怜的只有**24位**的质数 $p$ 和 $q$ 的时候，我就知道，直接因式分解 $n$ 即可解出答案。

::: normal-demo My answer

```python
def easyrsa0(n, e, c):
    from sympy import factorint, mod_inverse
    # 因式分解 n
    factors = factorint(n)
    p, q = factors.keys()
    # 计算 φ(n)
    phi_n = (p - 1) * (q - 1)
    # 计算 d
    d = mod_inverse(e, phi_n)
    # 解密密文
    plain_text = pow(c, d, n)
    print(f"私钥 d: {d}")
    print(f"明文: {plain_text}")
    byte_array = plain_text.to_bytes((plain_text.bit_length() + 7) // 8, byteorder='big')
    # 将字节串解码为字符串
    ascii_string = byte_array.decode('ascii', errors='ignore')
    print(ascii_string)
```

:::

### *easyrsa1*
```python
# Known: n、e、c
# Goal: plain
plain = bytes_to_long(FLAG)
p = getPrime(64)
q = getPrime(64)
n = p*q
e = 65537
c = pow(plain,e,n)
```

64位？你是在小看当今CPU的运算能力？方法同上，直接秒杀。

!!解答略，直接调用 *easyrsa0* 的函数即可!!

### *easyrsa2*
```python
# Known: n1、n2、e、c1、c2
# Goal: plain
plain = bytes_to_long(FLAG)
p = getPrime(1024)
q1 = getPrime(1024)
q2 = getPrime(1024)
n1 = p*q1
n2 = p*q2
e = 65537
c1 = pow(plain,e,n1)
c2 = pow(plain,e,n2)
```

1024位可不能暴力因式分解了，这难度可是指数级增长，我们必须另想它法。

仔细一看，发现这人竟然用**同一个** $p$ 生成了**不同的** $n$，还用同一个 $e$ 加密了同一个 $plain$。
考虑到 $n_1$ 和 $n_2$ 已知，且都是质数之积，我们直接找 $n_1$、$n_2$ 的最大公因数，$p$ 不就出来了吗。
$p$ 一出来，所有问题都迎刃而解了。

::: normal-demo My answer

```python
def easyrsa2(n1, n2, e, c1, c2):
    import math
    from sympy import mod_inverse
    # 找 n1、n2 的最大公因数，解出 p
    p = math.gcd(n1, n2)
    q1 = n1//p
    # 计算 φ(n)
    phi_n1 = (p - 1) * (q1 - 1)
    # 计算 d
    d1 = mod_inverse(e, phi_n1)
    # 解密密文
    plain_text1 = pow(c1, d1, n1)
    print(f"私钥 d1: {d1}")
    print(f"明文: {plain_text1}")
    byte_array = plain_text1.to_bytes((plain_text1.bit_length() + 7) // 8, byteorder='big')
    # 将字节串解码为字符串
    ascii_string = byte_array.decode('ascii', errors='ignore')
    print(ascii_string)
```

:::

### *easyrsa3*
```python
# Known: n、e、c
# Goal: plain
plain = bytes_to_long(FLAG*2)
p = getPrime(1024)
q = getPrime(1024)
n = p*q
e = 3
c = pow(plain,e,n)
```

好家伙，这下咋办？1024位的大质数挡在面前，也没有用同一质数生成 $n$ 的漏洞可钻，还有什么奇怪的地方呢……

诶，$e$ 是一个**很小很小**的质数：3——这表示我们可以不用管 $p$、$q$ 和 $n$，直接反过来对 $c$ 开立方根。
由于最后的 $c$ 是模 $n$ 后的结果，所以可以不断加 $n$ 尝试，直至结果是一个整数，这就解出了 $plain$。

::: normal-demo My answer

```python
def easyrsa3(n, e, c):
    import gmpy2
    plain_text = 0
    # 从 c 开始，逐步增加 n，直到找到明文
    while True:
        plain = gmpy2.iroot(c, e)
        if plain[1]:
            # plain 刚好是 c 的 e 次方根
            print(f"明文：{plain[0]}")
            plain_text = plain[0]
            break
        c += n
    byte_array = plain_text.to_bytes((plain_text.bit_length() + 7) // 8, byteorder='big')
    # 将字节串解码为字符串
    ascii_string = byte_array.decode('ascii', errors='ignore')
    # flag重复了两次，故只输出一半
    print(ascii_string[:len(ascii_string)//2])
```

:::

### *easyrsa4*
```python
# Known: n、e、c
# Goal: plain
plain = bytes_to_long(FLAG)
p = getPrime(1024)
q = gmpy2.next_prime(p+0xdddd)
n = p*q
e = 65537
c = pow(plain,e,n)
```

这次似乎一切正常：位数足够大、只生成了一个 $n$，$e$ 也是一个合适大小的质数。
但是 $p$ 和 $q$ 不再无关，$q$ 只比 $p$ 大一点点。这有什么用呢？

最直观的想法是，减少了一层循环。
相比于双层循环遍历寻找 $p$ 和 $q$，这种情况下只需要一层循环即可：知道了 $p$ 则可以**确定** $q$。

由于 $q$ 还只比 $p$ 大一点点，因此两者之积更接近于某个数的**平方**，而且 $p$ 一定比这*某个数*更小。
这启发我们，可以从 $n$ 的平方根开始，逐渐往下找满足条件的质数 $p$：是质数，且 $p \cdot q = n$。

::: normal-demo My answer

```python
def easyrsa4(n, e, c):
    import gmpy2
    from sympy import mod_inverse
    # 因为 p 和 q 的位数相差不大，所以遍历可能的质数寻找 p 和 q，从 n 的平方根开始
    p_guess = int(gmpy2.isqrt(n))
    while True:
        # 按原题中的方法定位 q
        q_guess = gmpy2.next_prime(p_guess + 0xdddd)
        if n == p_guess * q_guess:
            break
        # 继续遍历下一个更小的质数
        p_guess = gmpy2.prev_prime(p_guess)
    phi_n = (p_guess - 1) * (q_guess - 1)
    d = mod_inverse(e, phi_n)
    plain_text = pow(c, d, n)
    print(f"私钥 d: {d}")
    print(f"明文: {plain_text}")
    byte_array = plain_text.to_bytes((plain_text.bit_length() + 7) // 8, byteorder='big')
    # 将字节串解码为字符串
    ascii_string = byte_array.decode('ascii', errors='ignore')
    print(ascii_string)
```

:::

### *easyrsa5*
```python
# Known: (n, c)*3、e
# Goal: plain
plain = bytes_to_long("\xdd"*128+FLAG)
def encrypt(plain):
    p = getPrime(1024)
    q = getPrime(1024)
    n = p*q
    assert(plain<n)
    e = 3
    c = pow(plain,e,n)
    assert(c!=plain**e)
    return (c,n)
with open("enc.txt","wb") as f:
    for _ in range(3):
        (c,n) = encrypt(plain)
        f.write("n = "+str(n)+"\n")
        f.write("c = "+str(c)+"\n")
```

这次的题目有些不同：总共给了我们3组不同的 $(n, c)$ 数据，分别由不同的 $p$ 和 $q$ 生成。

尽管 $e$ 很小，但是 *easyrsa3* 中的 $plain$ 比本题的要大得多，<ruby>遍历<rt>$+ n$</rt></ruby>的次数自然要少很多。因此本题不能使用类似 *easyrsa3* 的解法，只能从多组数据着手。

于是，一个定理呼之欲出：**中国剩余定理**。

::: info
中国剩余定理（Chinese Remainder Theorem，CRT）是一个关于整数同余的定理，主要用于解决以下类型的问题：给定几个不同模数的同余方程，求一个整数使得它在各个模数下的余数分别等于给定的数。

假设有 $n$ 个互质的正整数 $m_1, m_2, \ldots, m_n$，以及对应的整数 $a_1, a_2, \ldots, a_n$，如果我们有以下同余方程：
$$
\begin{align*}
x & \equiv a_1 \mod m_1 \\
x & \equiv a_2 \mod m_2 \\
& \vdots \\
x & \equiv a_n \mod m_n
\end{align*}
$$

那么存在一个唯一的整数 $x$ 使得：
$$ 0 \leq x < M $$

其中 $M = m_1 \times m_2 \times \ldots \times m_n$。
:::

由于我们知道多组 $(n, c)$，且都是同一个 $plain$ 的加密结果，用数学式表达出来就是：
$$ c_i \equiv plain^e \mod n_i $$
即
$$ plain^e \equiv c_i \mod n_i $$

据此就可以轻松解出 $plain$ 了。

::: normal-demo My answer

```python
# group_of_nc: [(c1, n1), (c2, n2), (c3, n3)]
def easyrsa5(group_of_nc, e):
    from sympy.ntheory.modular import solve_congruence
    import gmpy2
    # 利用中国剩余定理解密
    # result: (x, mod)
    result = solve_congruence(*group_of_nc)
    plain_text = gmpy2.iroot(result[0], e)
    # 再次确保开 e 次方根之后是整数
    assert plain_text[1]
    print(f"明文：{plain_text[0]}")
    byte_array = plain_text[0].to_bytes((plain_text[0].bit_length() + 7) // 8, byteorder='big')
    # 将字节串解码为字符串
    ascii_string = byte_array.decode('ascii', errors='ignore')
    print(ascii_string)
```

:::

### *easyrsa6*
```python
# Known: n、e1、e2、c1、c2
# Goal: plain
plain = bytes_to_long(FLAG)
p = getPrime(1024)
q = getPrime(1024)
n = p*q
e1 = 65537
e2 = 54049
c1 = pow(plain,e1,n)
c2 = pow(plain,e2,n)
```

乍一看，又是多组数据，能不能用CRT求解呢？很可惜，不能——我们把这次的条件用数学式描述出来就是：
$$
\begin{align*}
plain^{e_1} & \equiv c_1 \mod n \\
plain^{e_2} & \equiv c_2 \mod n \\
\end{align*}
$$

这明显不符合CRT的形式。那么有什么办法呢？

注意到，上述两式的模数都是 $n$，那么自然想到对式子进行相加；如果左边是 $plain$ 就好了……有了，**扩展欧几里得算法**！

::: info
扩展欧几里得算法（Extended Euclidean Algorithm）是一种用于求解整数线性方程 $ax + by = d$ 的方法，其中 $a$ 和 $b$ 是给定的整数，$d$ 是 $a$ 和 $b$ 的最大公因数（GCD）。这个算法不仅可以计算 GCD，还可以找到 $x$ 和 $y$ 的值。
:::

我们利用扩展欧几里得算法可以求得 $d_1$、$d_2$，使 $e_1 \cdot d_1 + e_2 \cdot d_2 = gcd(e_1, e_2) = 1$。而上述两式可以变形为：
$$
\begin{align*}
plain^{e_1 \cdot d_1} & \equiv c_1^{d_1} \mod n \\
plain^{e_2 \cdot d_2} & \equiv c_2^{d_2} \mod n \\
\end{align*}
$$
两式相加，得到
$$ plain^{e_1 \cdot d_1 + e_2 \cdot d_2} \equiv c_1^{d_1} \cdot c_2^{d_2} \mod n $$
即
$$ plain \equiv c_1^{d_1} \cdot c_2^{d_2} \mod n $$

这样就成功解出 $plain$ 了。

::: normal-demo My answer

```python
def easyrsa6(n, c1, c2, e1, e2):
    # 扩展欧几里得算法
    def extended_gcd(a, b):
        if a == 0:
            return (b, 0, 1)
        else:
            g, x, y = extended_gcd(b % a, a)
            return (g, y - (b // a) * x, x)
    # e1 * d1 + e2 * d2 = 1
    _, d1, d2 = extended_gcd(e1, e2)
    plain_text = pow(c1, d1, n) * pow(c2, d2, n) % n
    print(f"明文：{plain_text}")
    byte_array = plain_text.to_bytes((plain_text.bit_length() + 7) // 8, byteorder='big')
    # 将字节串解码为字符串
    ascii_string = byte_array.decode('ascii', errors='ignore')
    print(ascii_string)
```

:::

### *easyrsa7*
```python
# Known: n、e、d
# Goal: p
p = getPrime(1024)
q = getPrime(1024)
if q < p:
    p, q = q, p
n = p*q
e = 65537
phi = (p-1)*(q-1)
d = gmpy2.invert(e,phi)
flag = hashlib.sha1(long_to_bytes(p)).hexdigest()
```

这次的题目大不相同：没有明文和密文，只要求在已知 $n$、$e$、$d$ 的情况下求出 $p$。

仔细一想，似乎没那么难嘛。由于 $n = p \cdot q$，并且 $e \cdot d - 1$ 是 $\phi(n)$ 的倍数（记为 $k$ 倍），
而 $\phi(n) = (p-1)(q-1) = n - (p+q) + 1$，这样就知道了 $p$、$q$ 的和与积，解方程即可。 

但是实际这么操作之后就会发现完全解不出来——可能是因为性能有限，无法解决如此大数的一元二次方程；况且还需要通过遍历 $k$ 来找到精确的 $\phi(n)$，这样一来时间复杂度会高到完全无法接受。

根据题目本身的限制，有效的思路应该仅有以上一个，那么只能在算法上寻求突破了。好在博主上网查询发现，寻求有效求解该问题的算法确实是一个有价值的问题，而[NIST](https://www.nist.gov/)官方也在标准文件中收录了其中一个优秀的解答（详见[Recommendation for Pair-Wise Key-Establishment Using Integer Factorization Cryptography](https://doi.org/10.6028/NIST.SP.800-56Br2)附录C），那么我就抄过来实现一下好啦~

::: normal-demo My answer

```python
def easyrsa7(n, e, d):
    # 用了《Recommendation for Pair-Wise Key-Establishment Using Integer Factorization Cryptography》中的算法
    ########## -------------------------------
    ### 1. Let k = de – 1. If k is odd, then go to Step 4.
    ### 2. Write k as k = 2^t*r, where r is the largest odd integer dividing k, and t ≥ 1. Or in simpler terms, divide k repeatedly by 2 until you reach an odd number.
    ### 3. For i = 1 to 100 do:
    ###     1. Generate a random integer g in the range [0, n−1].
    ###     2. Let y = g^r mod n
    ###     3. If y = 1 or y = n – 1, then go to Step 3.1 (i.e. repeat this loop).
    ###     4. For j = 1 to t – 1 do:
    ###         1. Let x = y^2 mod n
    ###         2. If x = 1, go to (outer) Step 5.
    ###         3. If x = n – 1, go to Step 3.1.
    ###         4. Let y = x.
    ###     5. Let x = y^2 mod n
    ###     6. If x = 1, go to (outer) Step 5.
    ###     7. Continue
    ### 4. Output “prime factors not found” and stop.
    ### 5. Let p = GCD(y – 1, n) and let q = n/p
    ### 6. Output (p, q) as the prime factors.
    ########## -------------------------------
    import random
    import math
    import hashlib
    from Crypto.Util.number import long_to_bytes

    # 1
    k = d * e - 1
    if k % 2 != 0:
        print("prime factors not found")
    # 2
    t, r = 0, k
    while r % 2 == 0:
        r //= 2
        t += 1
    success = False
    continue_flag = False
    # 3
    for i in range(101):
        # 3.1
        g = random.randint(0, n - 1)
        # 3.2
        y = pow(g, r, n)
        # 3.3
        if y == 1 or y == n - 1:
            continue
        # 3.4
        for j in range(1, t):
            # 3.4.1
            x = pow(y, 2, n)
            # 3.4.2
            if x == 1:
                success = True
                break
            # 3.4.3
            if x == n - 1:
                continue_flag = True
                break
            # 3.4.4
            y = x
        # 3.4.2
        if success:
            break
        # 3.4.3
        if continue_flag:
            continue_flag = False
            continue
        # 3.5
        x = pow(y, 2, n)
        # 3.6
        if x == 1:
            success = True
            break
        # 3.7 auto continue
    # 4
    if not success:
        print("prime factors not found")
    # 5
    p = math.gcd(y - 1, n)
    # 6
    print(f"p: {p}")
    # 找到 flag
    flag = hashlib.sha1(long_to_bytes(p)).hexdigest()
    print(f"0ops{{{flag}}}")
```

:::

### *easyrsa8*
```python
# Known: n、e、c
# Goal: plain
p = getPrime(80)
q = getPrime(432)
n = p*q
plain = bytes_to_long(FLAG)
e = 65537
c = pow(plain,e,n)
```

这次没有花里胡哨，回归到正常生成 $p$、$q$，正常生成 $e$、$c$，最后要求找回明文。和 *plain RSA* 唯一的不同是 $p$ 和 $q$ 的大小不够大。

第一反应是利用 *easyrsa0* 的暴力求解法，但是位数的上升会使因式分解难度指数级上涨：即便64位的 $p$ 和 $q$ 能够被暴力分解出来，80位和432位的 $p$ 和 $q$ 却让我这台小小的计算机无能为力。必须另寻他法。

就在这时，一个叫做**椭圆曲线因式分解法**的词映入了我的眼帘。

::: info
椭圆曲线因式分解法（Elliptic Curve Factorization Method，ECM）是一种用于整数因式分解的算法，特别适合于**中等大小**的数。该方法利用了椭圆曲线的数学性质，通过寻找特定的椭圆曲线与数之间的关系来找到非平凡因子。
:::

只要能够因式分解，一切将水到渠成。我既不愿自己实现这复杂的算法，也没能在Python库中找到便利执行ECM的函数，于是我选择了[在线做ECM的网站](https://www.alpertron.com.ar/ECM.HTM)。在网站上提前分解大质数，再将得到的 $p$ 和 $q$ 抄下来就好了。

::: normal-demo My answer

```python
def easyrsa8(n, e, c):
    from sympy import mod_inverse
    # 因式分解 n, from: https://www.alpertron.com.ar/ECM.HTM
    p = A_NUMBER # 80位
    q = ANOTHER_NUMBER # 432位
    # 计算 φ(n)
    phi_n = (p - 1) * (q - 1)
    # 计算 d
    d = mod_inverse(e, phi_n)
    # 解密密文
    plain_text = pow(c, d, n)
    print(f"私钥 d: {d}")
    print(f"明文: {plain_text}")
    byte_array = plain_text.to_bytes((plain_text.bit_length() + 7) // 8, byteorder='big')
    # 将字节串解码为字符串
    ascii_string = byte_array.decode('ascii', errors='ignore')
    print(ascii_string)
```

:::
