---
title: 怎么对付天鹅绒房间那俩狱警？
excerpt: 作战记录——P5R物理输出单挑C难度双子
date: 2024-07-18
isOriginal: true
category: 
    - Game
tag: 
    - P5R
    - Battle
---

众所周知，在P5R二周目的印象空间里，天鹅绒房间里管理<ruby>囚犯<rt>J o k e r</rt></ruby>的狱警芮丝汀娜和卡萝莉娜（下文将两人简称为**双子**）会邀请你与她们对战，以亲身检验你所谓“更生”的成果。

这场战斗是本作游戏里名副其实的高难战斗，不仅需要强大的实力支撑，更需要高超的战斗技巧。除去挑战房间，双子是仅次于拉雯坦的最强敌手。

本篇博客将深入剖析双子的战斗机制，并以博主本人的[Challenge难度作战记录](https://www.bilibili.com/video/BV1Ry85ePEwf)作为思路参考，分析如何才能在与双子的对战当中占得优势，直至打败双子。

::: note
该作战记录由博主手打，不具备官方性质，仅供参考。

博客内容根据该作战记录进行编写，目的是记录思路，因此难免有所局限。

本篇博客默认玩家**不使用**伊邪那岐大神或伊邪那岐大神·贼神。~~都用大神了还能不会打？~~
:::

## 前期准备
对于高难战斗，万全的准备必不可少。

首先是定调：**主要使用物理输出**。

然后是基本战斗思路：**蓄力 → 输出 → 蓄力 → 输出 → ... 中途用BuffP回血/续Buff**。

接着再一步步从人格面具、装备、道具、队友配置四个方面进行分析。

### 人格面具
考虑合适的输出P和辅助P，并将用到的人格面具凹成完全体：保留核心输出技能，无弱点，（如果还有空余技能格）耐性够好。

- 对于物理输出P，推荐使用义经（物理P）以及 !!二周目才能合成的!! 撒旦耶尔（枪P）。最好是满级，并且*力*属性也是99max。

- 对于辅助P，使用了路西法（开场P）、法夫纳（蓄力P）以及俄耳普斯·贼神F（BuffP）。等级和属性影响不大。

::: details 用到的人格面具（长图）
![](/assets/images/p5r-twins/Personas.jpg)
:::

### 装备
- 近战武器和远程武器随意选择，最好选择附带有加强各属性的Buff的武器。

- 防具数值越高越好，推荐换上最好的 *弘誓之铠R* 。!!警报电椅撒旦可得!!

- 饰品应戴上回血效果最好的（物理输出比较吃血条），推荐戴上具有 *大治愈促进* 能力的饰品。!!武见妙处购买可得!!

### 道具
在有蓄力技能和回血技能的情况下对道具的需求不大。

- 如果缺蓄力技能，那么可多带 *大地鲜豆* 。!!学校天台处请奥村春栽培可得!!

- 如果缺回血技能，那么可多带HP回复道具。

### 队友配置
物理输出队伍一般选择龙司、佑介和春。龙司和佑介都具有超高伤物理属性技能，春具有高暴击枪击属性技能。

但是博主选择了单挑，原因有二：
1. 队友的人格面具存在**弱点**。即使有对应弱点的 *极·识破* ，也无法保证能躲开双子的攻击。被击中弱点的代价是巨大的，不仅会使己方队友受到更高伤害并倒地，还会给敌方1more的机会再次发动攻击。

2. 队友（包括其人格面具）的**基础属性**相对较低，因此状态消耗得更快。这导致Joker不得不打乱攻击计划对其进行治疗或换人将其顶替。

但是辩证的来看，带上队友的好处也显而易见：
1. **增伤**，四个人的伤害一定比一个人更高。

2. 倒地后有**回旋余地**，即使Joker倒地了，队友只要撑过这一回合就不会失败；而单挑时Joker倒地即被秒杀。

这里玩家需要仔细斟酌，确定是否与队友并肩作战。

## 正式战斗
::: note
其中的“参考流程”**严格**按照作战记录进行书写，其中包含偶然情况。

博主会将非偶然情况下的对策放于括号内，并单独详细说明。
:::

### 敌人机制
- 双子血量在8000左右，没有弱点和耐性。每回合卡萝莉娜先手。

- 在双子中的一方血量下降到一半以下时会触发另一方为其回复至满血，只能触发一次。

- 在双子中的一方血量耗尽而另一方存活时，会触发另一方为其回复至半血，可以无限触发。

- 以触发双子对话为临界点，与双子的战斗可分为六个阶段。
    - 前五个阶段中，双子的攻击技能固定；第六阶段随机。
    - 前五个阶段中，触发 *迪亚拉翰* 的一方的固定出招向后顺延，直至该阶段结束。
    - 前五个阶段中，每个阶段持续五回合，每阶段需打满2700左右的伤害，否则被强行秒杀。第六阶段回合数无限。
    - 阶段转换发生在双子的回合中。也就是说，阶段转换后一定是双子先行动。
    - 即使失败，双子也会根据撑过的阶段数给予对应的奖励。

::: tip 对战思路
1. 最大化输出，尽量在第六阶段前结束战斗。
2. 输出均衡，避免同一回合内只击败一方。
3. 保证血量上限/耐性抗性足够高，防止在一个阶段内治疗回合数过多导致输出不够。
:::

### 一阶段
| 回合数 | 芮丝汀娜 | 卡萝莉娜 |
| :----: | :----: | :----: |
| 1~5 | 三连倒 | 金刚发破 |

主要使用耐受物理属性和枪击属性的人格面具，对应参考输出P为**撒旦耶尔**。

如果没有开场P，则可以第一回合先用BuffP给自己上Buff。由于前期伤害不高，暴击率也较低，硬吃技能伤害无大碍。

!!但是仍有概率触发暴击：博主曾就在一阶段被一发金刚发破触发暴击击倒在地，然后被双子合力秒杀，迅速结束战斗。!!

::: tip 参考流程
上/续Buff（先手） → 蓄力 → 输出 → 蓄力 → 输出 → 蓄力
:::

### 二阶段
| 回合数 | 芮丝汀娜 | 卡萝莉娜 |
| :----: | :----: | :----: |
| 6 | 玛哈布芙达因 | 玛哈拉基达因 |
| 7 | 玛哈加尔达因 | 玛哈吉欧达因 |
| 8 | 玛哈布芙达因 | 玛哈拉基达因 |
| 9 | 玛哈加尔达因 | 玛哈吉欧达因 |
| 10 | 玛哈布芙达因 | 玛哈拉基达因 |

主要使用耐受火冰电风四属性的人格面具，对应参考输出P为**义经**。

如果按照基本战斗思路进行，则输出P一定对上双子的电风属性技能，蓄力P一定对上双子的火冰属性技能。故可根据具体情况穿插BuffP进行调轴。

由于参考BuffP没有火冰风耐性，仅有电击反弹，参考流程中将续Buff操作放在蓄力之后进行调轴。

::: tip 参考流程
输出 → 蓄力 → 续Buff → 输出 → 输出（蓄力）
:::

[战斗记录](https://www.bilibili.com/video/BV1Ry85ePEwf)中这里最后一击仍为输出，是因为双叶偶然给Joker上了双Buff，也直接导致了后续唯一的一击魔法伤害。

这里将输出换成蓄力即可，不影响整体思路。如果前面触发了双叶的偶然事件也请玩家自行调轴，参见**对战思路**，确保足够的输出和血量的安全即可。

### 三阶段
| 回合数 | 芮丝汀娜 | 卡萝莉娜 |
| :----: | :----: | :----: |
| 11 | 玛哈芙雷达因 | 玛哈赛达因 |
| 12 | 玛哈耶加翁 | 玛哈克加翁 |
| 13 | 玛哈芙雷达因 | 玛哈赛达因 |
| 14 | 玛哈耶加翁 | 玛哈克加翁 |
| 15 | 玛哈芙雷达因 | 玛哈赛达因 |

主要使用耐受念核祝咒四属性的人格面具，对应参考输出P为**义经**。

这里是一个绝佳的续Buff阶段，因为念核属性的攻击不会概率附带异常，也没有祝咒属性技能花样繁多的扣血方式。为了不在之后较为紧张的战斗中抽出回合续Buff导致意外死亡，推荐在这个阶段续上足够时长的Buff。

::: tip 参考流程
蓄力（输出） → 续Buff → 输出（蓄力） → 续Buff → 输出
:::

[战斗记录](https://www.bilibili.com/video/BV1Ry85ePEwf)中为了不浪费双叶的Buff，这里的第一次输出是魔法攻击。

由于这一阶段的主要任务是续Buff，更多的输出只是缩短战斗时间，在这个阶段结束时Joker的状态是完全相同的。

### 四阶段
| 回合数 | 芮丝汀娜 | 卡萝莉娜 |
| :----: | :----: | :----: |
| 16 | 三连倒 | 金刚发破 |
| 17 | 玛哈布芙达因 | 玛哈拉基达因 |
| 18 | 玛哈加尔达因 | 玛哈吉欧达因 |
| 19 | 玛哈芙雷达因 | 玛哈赛达因 |
| 20 | 玛哈耶加翁 | 玛哈克加翁 |

主要使用拥有全耐性/全抗性的人格面具，对应参考输出P为**义经**。

这里可以选择抓住念核属性攻击之前的回合续Buff。其余流程按思路进行。

::: tip 参考流程
蓄力 → 输出 → 续Buff → 蓄力 → 输出
:::

### 五阶段
| 回合数 | 芮丝汀娜 | 卡萝莉娜 |
| :----: | :----: | :----: |
| 21 | 至高魔弹 | 空间杀法 |
| 22 | 大冰河时期 | 大燃烧 |
| 23 | 真空波 | 崇高圣战 |
| 24 | 宇宙火焰 | 念动力 |
| 25 | 恶魔审判 | 神之审判 |

主要使用拥有全耐性/全抗性的人格面具，对应参考输出P为**义经**。

基本思路同四阶段。但是对抗这一阶段的祝咒属性技能的人格面具**务必**具有祝咒无效/吸收/反弹，否则会直接削减当前HP的一半，对后续战斗非常不利。

::: tip 参考流程
蓄力 → 输出 → ... （续Buff → 蓄力 → 输出）
:::

[战斗记录](https://www.bilibili.com/video/BV1Ry85ePEwf)中在第一次输出后击败双子并结束战斗。

### 六阶段
| 回合数 | 芮丝汀娜 | 卡萝莉娜 |
| :----: | :----: | :----: |
| 25~ | 从五阶段技能中随机 | 从五阶段技能中随机 |

**尽量不要拖到六阶段。**

基本思路同五阶段，但是续Buff和避免减半HP的时机无法精准掌控，难度颇高。

## 注意事项
1. 在二四五六阶段中，如果卡萝莉娜先手的火属性技能给Joker上了燃烧异常状态，芮丝汀娜后手会立即使出风属性技能触发Technical倒地，然后被秒杀。

2. 在五阶段中，芮丝汀娜的至高魔弹暴击率较高，避免被暴击需要一定运气成分，否则会直接倒地被秒杀。
