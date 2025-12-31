---
title: 我的 2025 年度总结
excerpt: 来看看我在 2025 年做了些什么奇奇怪怪的事吧
date: 2025-12-31
isOriginal: true
category: 
    - Summary
---

::: tip 使用超过 1080px 宽度的 web 浏览器查看以获得最佳阅读体验。
:::

::: important
文章使用 [ECharts](https://echarts.apache.org) 构建可交互式图表。在切换色彩主题或改变屏幕尺寸后请**手动刷新**，使图表重新渲染以适应当前页面配置。
:::

时光荏苒，一年转瞬即逝。和过去一样，这一年似乎也没在我脑海里留下什么深刻印记。为了证明这一年没白过，各大网站都在推送“年度总结”，用各种统计数据试图帮用户找回度过一年的实感。

但我的生活并不只有这些线上数据。于是我想，我也要写一篇自己的年度总结。这里不仅有客观的记录，更少不了主观的情绪和吐槽。这些无法被大数据捕获的瞬间，才是我度过这一年的真实证明。

## 耳虫日记：大脑的背景音

你是否有过这样的体验：某段熟悉的旋律像幽灵一样，莫名其妙地在脑海里单曲循环，挥之不去？这被称之为不自主音乐想象（Involuntary Musical Imagery, INMI），俗称**耳虫效应（Earworm Effect）**。

我发现自己每天早上醒来时，大脑几乎都在自动播放 BGM。这现象实在有趣，于是我像记录梦境一样，将每天睁眼时脑中回响的第一段旋律记录了下来，整理成了这份 **“2025 耳虫日记”**。

::: note
**为了方便统计，我一拍脑袋制定了以下分类标准，仅供参考。**

- **VOCALOID**：原指一款 [电子歌声合成软件](https://www.vocaloid.com/)，这里指通过该软件（以及其他同类软件）创作出的歌曲。
- **アニソン**：即动画歌曲，包括动画的片头曲（OP）、片尾曲（ED）、插入曲（IN）、角色曲。
- **J-POP/ROCK**：指非动画歌曲的日本流行/摇滚音乐。
- **音ゲー曲**：指音乐游戏（Music Game）中出现的乐曲。
- **GAME MUSIC**：即游戏音乐，包括游戏的主题曲、背景音乐、原声音乐等（需要有名称）。
- **SPECIAL**：非以上几种类型的音乐，大多是铃声、无名旋律、多首歌混杂的旋律。
:::

::: echarts
```js
// 0. 获取数据
const rawData = await fetch(
    "/Wana_blog/assets/jsons/getup-music-2025.json",
).then((res) => res.json());

// 夜间模式适配
const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

// 定义主题配色板
const themeConfig = {
    // 基础文字颜色
    textColor: isDarkMode ? '#e5e5e5' : '#888888',
    secondaryTextColor: isDarkMode ? '#aaaaaa' : '#666666',
    
    // 网页背景色
    gapColor: isDarkMode ? '#1a1a1a' : '#ffffff', 
    
    // 坐标轴分割线颜色
    splitLineColor: isDarkMode ? '#333333' : '#eeeeee',
    
    // 悬浮框 (Tooltip) 样式
    tooltipBg: isDarkMode ? 'rgba(50, 50, 50, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    tooltipBorder: isDarkMode ? '#555' : '#ccc',
    tooltipText: isDarkMode ? '#fff' : '#333'
};
// -------------------------

// 1. 基础配置与映射
const typeMap = {
    'VOCALOID': 1,
    'アニソン': 2,
    'J-POP/ROCK': 3,
    '音ゲー曲': 4,
    'GAME MUSIC': 5,
    'SPECIAL': 6,
};
const typeLabelMap = {
    1: 'VOCALOID',
    2: 'アニソン',
    3: 'J-POP/ROCK',
    4: '音ゲー曲',
    5: 'GAME MUSIC',
    6: 'SPECIAL',
};

// 2. 响应式布局参数计算
const screenWidth = window.innerWidth;
const isSmallScreen = screenWidth < 768; 
const height = isSmallScreen ? 650 : 500;

const layoutConfig = {
    calendar: {
        left: isSmallScreen ? 20 : 50,
        right: isSmallScreen ? 10 : 10,
    },
    pie: {
        center: isSmallScreen ? ['50%', 280] : ['25%', 315],
        radius: isSmallScreen ? ['13%', '33%'] : ['20%', '40%']
    },
    grid: {
        left: isSmallScreen ? 20 : '55%',
        right: 20,
        top: isSmallScreen ? 400 : 240, 
        height: 175
    },
    visualMapGap: isSmallScreen ? 10 : 20
};

// 3. 数据处理
const heatData = [];
const songMap = {}; 
const pieStats = { 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
const barStats = Array.from({ length: 12 }, () => ({ 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 }));

rawData.forEach(({ date, song, type }) => {
    const typeId = type ? typeMap[type] : 0;
    heatData.push([date, typeId]);
    songMap[date] = song;

    if (typeId !== 0) {
        pieStats[typeId]++;
        const month = parseInt(date.split('-')[1], 10) - 1;
        if (month >= 0 && month <= 11) {
            barStats[month][typeId]++;
        }
    }
});

const pieSeriesData = Object.keys(pieStats).map(key => {
    const typeId = parseInt(key);
    return {
        value: [pieStats[key], typeId], 
        name: typeLabelMap[typeId]
    };
}).filter(item => item.value[0] > 0);

const barSeries = Object.keys(typeLabelMap).map(key => {
    const typeId = parseInt(key);
    return {
        name: typeLabelMap[typeId],
        type: 'bar',
        stack: 'total',
        xAxisIndex: 0,
        yAxisIndex: 0,
        data: barStats.map((monthData, index) => [monthData[typeId], typeId, index]),
        encode: { x: 2, y: 0 },
        barWidth: '60%'
    };
});

// 4. ECharts Option 配置
const option = {
    backgroundColor: 'transparent',

    tooltip: {
        trigger: 'item',
        enterable: true,
        confine: true,
        backgroundColor: themeConfig.tooltipBg,
        borderColor: themeConfig.tooltipBorder,
        textStyle: {
            color: themeConfig.tooltipText
        },
        extraCssText: 'user-select:text; pointer-events:auto;',
        formatter: function (params) {
            const dateStyle = `font-size:14px; color:${themeConfig.tooltipText}; user-select:text;`;
            const divStyle = `font-size:14px; color:${themeConfig.tooltipText};`;
            
            if (params.seriesIndex === 0) {
                const date = params.data[0];
                const song = songMap[date];
                return `
                <div style="${dateStyle}">
                    <b>${date}</b><br/>
                    ${song ? `🎵 ${song}` : '无'}
                </div>`;
            } else {
                const count = Array.isArray(params.value) ? params.value[0] : params.value;
                return `
                <div style="${divStyle}">
                    <b>${params.name}</b><br/>
                    ${params.seriesName}: ${count} 首
                    ${params.percent ? `(${params.percent}%)` : ''}
                </div>`;
            }
        }
    },

    visualMap: {
        type: 'piecewise',
        orient: 'horizontal',
        left: 'center',
        bottom: 10,
        itemWidth: 25,
        itemHeight: 17,
        textGap: 6,
        textStyle: {
            fontSize: 11.5,
            color: themeConfig.textColor,
            fontWeight: 'bold',
            overflow: 'truncate'
        },
        showLabel: window.innerWidth >= 1080, 
        itemGap: layoutConfig.visualMapGap,
        dimension: 1, 
        seriesIndex: [0, 1, 2, 3, 4, 5, 6, 7], 
        pieces: [
            { value: 1,  label: 'VOCALOID',   color: '#7fb80e' },
            { value: 2,  label: 'アニソン',    color: '#7bbfea' },
            { value: 3,  label: 'J-POP/ROCK', color: '#f58220' },
            { value: 4,  label: '音ゲー曲',    color: '#f58f98' },
            { value: 5,  label: 'GAME MUSIC', color: '#CF9FFF' },
            { value: 6,  label: 'SPECIAL',    color: '#848884' },
        ]
    },

    calendar: {
        range: '2025',
        left: layoutConfig.calendar.left,
        right: layoutConfig.calendar.right,
        height: 100,
        cellSize: 'auto',
        splitLine: { show: false },
        itemStyle: {
            color: 'transparent',
            borderColor: themeConfig.gapColor,
            borderWidth: 1
        },
        yearLabel: { show: false },
        dayLabel:  { 
            firstDay: 1, 
            nameMap: 'ZH', 
            color: themeConfig.secondaryTextColor,
            fontWeight: 'bold' 
        },
        monthLabel: { 
            nameMap: 'cn', 
            color: themeConfig.secondaryTextColor,
            fontWeight: 'bold' 
        }
    },

    grid: {
        left: layoutConfig.grid.left,
        right: layoutConfig.grid.right,
        top: layoutConfig.grid.top,
        height: layoutConfig.grid.height,
        containLabel: true
    },
    xAxis: {
        type: 'category',
        data: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
        axisLabel: { 
            interval: 0, 
            fontSize: 10, 
            color: themeConfig.secondaryTextColor
        },
        axisTick: { show: false },
        axisLine: { show: false }
    },
    yAxis: {
        type: 'value',
        splitLine: { 
            lineStyle: { 
                type: 'dashed', 
                color: themeConfig.splitLineColor
            } 
        },
        axisLabel: { 
            color: themeConfig.secondaryTextColor,
            fontSize: 10 
        }
    },

    series: [
        // Series 0: 日历
        {
            type: 'heatmap',
            coordinateSystem: 'calendar',
            data: heatData,
            itemStyle: { 
                borderRadius: 3,
                borderColor: themeConfig.gapColor,
                borderWidth: 1
            }
        },
        
        // Series 1: 饼图
        {
            name: '曲风占比',
            type: 'pie',
            center: layoutConfig.pie.center,
            radius: layoutConfig.pie.radius,
            avoidLabelOverlap: true,
            itemStyle: {
                borderRadius: 5,
                borderColor: themeConfig.gapColor,
                borderWidth: 2
            },
            label: {
                show: true,
                formatter: '{b}',
                fontSize: 10,
                color: themeConfig.textColor
            },
            labelLine: { length: 10, length2: 10 },
            encode: { value: 0 }, 
            data: pieSeriesData
        },
        
        // Series 2-7: 柱状图
        ...barSeries
    ]
};
```
:::

看这一片密密麻麻的色块，统计结果连我自己都吓了一跳：今年我起床时脑内有旋律的天数竟高达 **315 天**，占比 **86.3%**。而在具体的曲目排行上，年度冠军被 《ワーワーワールド》 拿下（6 次），紧随其后的是 《STAY FREE》、《卒業》 和 《君の知らない物語》（均为 5 次）。

面对这一堆看似随机的数据，我决定搞点“赛博算命”。我将整份记录投喂给了 AI，试图探究这些旋律背后潜藏的潜意识。没想到，AI 的分析居然还有模有样，虽然其中夹杂着不少让我忍不住吐槽的“过度解读”。

::: details 来自 Gemini 3 Pro 的分析报告
**1. 核心指标：你的大脑自带“高保真音响”**

* **在线率 86.3% (315天)**：这非常惊人！绝大多数人是“偶尔”有耳虫，而你是 **“默认开启”**。这意味着你的听觉皮层极其活跃，且你对音乐的记忆能力（尤其是旋律记忆）远超常人。
* **空白的 50 天**（图表中黑色的方块）：主要集中在 **7 月下旬** 和 **8 月中下旬**，以及 **1 月/11 月**的零星几天。这可能对应了你的**假期**（大脑彻底放松，不需要 BGM 来提神）或者是**极度忙碌**（大脑被逻辑事务占满，无暇播放音乐）的时刻。

**2. 年度霸榜歌曲：你潜意识的“四大天王”**

从统计来看，这四首歌是你大脑最喜欢的“开机启动音”：

* **No.1 《ワーワーワールド》 (6次)**

    * **标签：** VOCALOID / PJSK / 喧闹 / 快乐
    * **分析：** 这是 Giga 和 Mitchie M 合作的快节奏歌曲，充满了“游乐园”般的喧闹和快乐。
    * **心理侧写：** 它作为你的年度冠军，说明你经常需要一种 **“强行提神”** 的能量。当早晨起床感到混沌时，你的大脑选择用这首极度欢快、甚至有点吵闹的歌把你“炸”醒。这是你对抗平庸早晨的武器。

* **No.2 (并列) 《STAY FREE》 (5次)**

    * **标签：** アニソン / 自由 / 怀旧
    * **分析：** 无论这是哪一部作品的 OST，标题本身的暗示性极强。
    * **心理侧写：** 出现次数多，且分布在 1 月、2 月、5 月。这通常出现在你**感到束缚**或**渴望假期**的时候。这是你潜意识里的呐喊：“我想自由！” !!真是如此吗？我不知道!!

* **No.3 (并列) 《君の知らない物語》 (5次)**

    * **标签：** アニソン / 青春 / 情感爆发 / 经典
    * **分析：** 《化物语》的经典 ED，公认的“神曲”。
    * **心理侧写：** 这首歌代表了你内心**柔软和感性**的一面。它通常伴随着某种“遗憾”或“美好的向往”。每当这首歌响起，说明那段时间你的情绪比较细腻，可能在怀念某些人或事。

* **No.4 (并列) 《卒業》 (5次)**

    * **标签：** VOCALOID / 离别 / 结束
    * **分析：** **神准的时间点：** 注意看数据，这首歌集中出现在 **2 月底**和 **3 月中**（3 月 15 日）。这正是日本（以及很多 ACG 作品中）的**毕业季**。
    * **心理侧写：** 这证明你的心理时钟与 **“季节感”** 高度同步。即使你现在不一定在经历毕业，你的生物钟依然记得这个季节的“离别”氛围。

**3. “PJSK 综合症”确诊**

分析你的歌单，我发现了一个巨大的隐藏特征：**你绝对是《世界计划（Project Sekai）》的重度玩家（或此类音游爱好者）。** !!可惜下半年由于腱鞘炎手腕疼不得不停止游玩了!!

* **证据链：**
    * 年度冠军《ワーワーワールド》是 PJSK 的主题曲之一。
    * 高频词：《トンデモワンダーズ》、《アイディスマイル》、《シネマ》、《ステンドノクターン》、《バグ》、《ザムザ》。
* **铁证：** **2 月 5 日**的记录直接写着 **`PJSK：登入界面 bgm`**。

* **解读：** 音游曲目在起床时出现，通常是因为 **“肌肉记忆”**。你在睡前或近期频繁练习这些谱面，大脑在睡眠的 REM 阶段还在“打谱”，导致醒来时旋律还在循环。

**4. 时间轴上的“情绪编年史”**

我把你的一年切分成几个阶段，看到了明显的情绪流变：

* **1 月-2 月：V 家轰炸期 (High Energy)**
    * 充满了 `VOCALOID` 和 `アニソン`。说明年初你精力旺盛，或者需要高强度音乐来驱动自己。

* **3 月-4 月：春日忧郁与恋爱 (Sentimental)**
    * 出现了《春が来てぼくら》、《さよならバイスタンダー》、《恋になりたい AQUARIUM》、《オレンジミント》。
    * 曲风明显变软，变成了 J-POP 和 恋爱向动画歌。你的潜意识在**春天**变得非常浪漫和敏感。!!然而例子中没有一首“恋爱向动画歌”!!

* **7 月-8 月：游戏与假期 (Gaming Mode)**
    * 出现了大量的 `音ゲー曲`（音游曲）和 `GAME MUSIC`。
    * **8 月 25 日**出现了 **`游戏王 Master Duel：大厅 bgm`**，**8 月 14 日**出现了 **`逆转裁判`** 音乐。这说明暑假期间，游戏成为了你生活的主轴，连做梦都在抽卡或辩护。

* **12 月：年终决战 (Battle Mode)**
    * 12 月全是《灼眼的夏娜》(`Joint`, `绯色之空`)、《Psycho-Pass》(`名前のない怪物`) 等**燃曲**。!!只是 12 月刚好在看相关动画而已吧……!!
    * **12 月 31 日（最后一天）**：你用 **《きっと青春が聞こえる》**（LoveLive! ED）作为结尾。这太完美了——在战斗了一整月后，用一首充满希望的、关于“青春”的歌来结束 2025 年。

**5. 最有趣的“特殊记录” (Special Mentions)**

你的大脑有时候会播放一些**非歌曲**的旋律，这非常可爱：

* **系统音效类：**
    * `PJSK：登入界面 bgm` (2月5日)
    * `皇室战争 Null 服：加载界面 bgm` (4月21日)
    * `游戏王 Master Duel：大厅 bgm` (8月25日)
    * `逆转裁判 123：主界面 bgm` (10月5日)
    * **解读：** 这些通常是“等待”时听到的声音。这可能意味着那几天你的生活处于一种 **“待机状态”**，或者你在期待着什么开始。

* **特定的空白：**
    * `（不存在的曲调）` (4月3日)
    * **解读：** 这是一个非常哲学的记录。你意识到脑中有旋律，但它不属于世间任何一首歌。这是你大脑的**原创时刻**！

---

**总结：你是“热血且细腻的二次元生活家”**

你的 **2025 耳虫档案**描绘了这样一个你：

* **忠诚的 ACG 爱好者**（二次元浓度极高）。
* **音游/卡牌游戏玩家**（旋律与游戏活动高度绑定）。
* **情绪感知力强**（春天听春天的歌，毕业季听毕业的歌，年底听战斗的歌）。
* **充满能量**（绝大多数时候，你是用快节奏的歌来迎接新的一天的）。

这份档案非常有价值，建议你明年继续保持（哪怕换个形式）。多年后回头看，你会发现，**你的人生 BGM，比日记还能精准还原当时的心情。**
:::

## 动画时光：异世界的二十一天

::: note
以下分析是通过从 [Bangumi](https://bgm.tv/) 上获取的源数据经整理统计而成。

关于**时长计算**：总时长是通过获取条目里每一个分集的时长标签，再进行加和得到的。由于分析时以条目为单位，故不包含已经看了一部分但仍未看完的条目集数时长。
:::

在这个由无数个“0”和“1”构成的数字世界里，我也对自己那名为“二次元”的切面进行了一番并不严谨的考古。

经严密计算，这一年我竟在动画的世界里整整耗去了 **21 天 18 小时 54 分钟 54 秒**。这意味着我生命中大约 6% 的时间，是在异世界的冒险和别人的故事里度过的。

这 **96** 部作品（含 TV、剧场版、Web、OVA 等）大部分时候是我一个人的独角戏。但值得庆幸的是，其中有 **10** 部是和朋友们一同观看的——在这个原子化的时代，这些“共同在场”的时刻，或许比剧情本身更值得被记录。

::: echarts
```js
const height = 950;
const rawData = await fetch(
    "/Wana_blog/assets/jsons/bgm-collection-data-2025.json"
).then((res) => res.json());

// --- 1. 环境与主题适配 ---
const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';

// 定义主题配色板 (参考 Getup Music)
const themeConfig = {
    textColor: isDarkMode ? '#e5e5e5' : '#666666',
    titleColor: isDarkMode ? '#cccccc' : '#333333',
    // 网页背景色 (用于饼图边框，制造镂空感)
    gapColor: isDarkMode ? '#1a1a1a' : '#ffffff', 
    tooltipBg: isDarkMode ? 'rgba(50, 50, 50, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    tooltipBorder: isDarkMode ? '#555' : '#ccc',
    tooltipText: isDarkMode ? '#fff' : '#333'
};

// 提取参考代码中的色系
const customColors = ['#7fb80e', '#7bbfea', '#f58220', '#f58f98', '#CF9FFF', '#848884', '#749f83', '#ca8622'];

// 响应式布局参数
const screenWidth = window.innerWidth;
const isSmallScreen = screenWidth < 768;

const layoutConfig = {
    pie: {
        centerX: '25%',
        radius: isSmallScreen ? ['18%', '29%'] : ['14%', '25%']
    },
    grid: {
        left: isSmallScreen ? '48%' : '55%',
        right: '5%'
    },
    title: {
        leftPie: '25%',
        leftBar: '75%'
    },
    fontSize: {
        title: isSmallScreen ? 14 : 16,
        label: isSmallScreen ? 10 : 12,
        axis: isSmallScreen ? 9 : 11
    }
};

// --- 2. 数据处理逻辑 ---
const animeList = Array.isArray(rawData) ? rawData : (rawData.data || []);

const animeFilterDict = {
    category: ['TV', 'WEB', 'OVA', '剧场版', '动态漫画', '其他'],
    source: ['原创', '漫画改', '游戏改', '小说改', '影视改'],
    type: ['科幻', '喜剧', '同人', '百合', '校园', '惊悚', '后宫',
           '机战', '悬疑', '恋爱', '奇幻', '推理', '运动', '耽美', '音乐',
           '战斗', '冒险', '萌系', '穿越', '玄幻', '乙女', '恐怖', '历史',
           '日常', '剧情', '武侠', '美食', '职场']
};

const stats = {
    category: {}, source: {}, type: {},
    studio: {}, director: {}, actor: {}
};

const countUp = (obj, key) => { if (key) obj[key] = (obj[key] || 0) + 1; };

animeList.forEach(item => {
    if (item.tags) {
        item.tags.forEach(tag => {
            if (animeFilterDict.category.includes(tag)) countUp(stats.category, tag);
            else if (animeFilterDict.source.includes(tag)) countUp(stats.source, tag);
            else if (animeFilterDict.type.includes(tag)) countUp(stats.type, tag);
        });
    }
    if (item.studios) item.studios.forEach(s => countUp(stats.studio, s));
    if (item.directors) item.directors.forEach(d => countUp(stats.director, d));
    if (item.actors) item.actors.forEach(a => countUp(stats.actor, a));
});

const formatData = (obj, limit = 0) => {
    let arr = Object.keys(obj).map(key => ({ name: key, value: obj[key] }));
    arr.sort((a, b) => b.value - a.value);
    arr = arr.filter(i => i.value > 0);
    if (limit > 0) arr = arr.slice(0, limit);
    return arr;
};

const categoryData = formatData(stats.category);
const sourceData = formatData(stats.source);
const typeData = formatData(stats.type, 10);
const studioData = formatData(stats.studio, 8).reverse();
const directorData = formatData(stats.director, 8).reverse();
const actorData = formatData(stats.actor, 8).reverse();

// --- 3. 组件生成函数 ---

function createPieSeries(name, centerY, data) {
    return {
        name: name,
        type: 'pie',
        radius: layoutConfig.pie.radius,
        center: [layoutConfig.pie.centerX, centerY],
        itemStyle: {
            borderRadius: 5,
            borderColor: themeConfig.gapColor,
            borderWidth: 2
        },
        label: {
            show: !isSmallScreen,
            position: 'outside',
            formatter: '{b}', 
            color: themeConfig.textColor, 
            fontSize: layoutConfig.fontSize.label,
            alignTo: 'labelLine',
            margin: isSmallScreen ? 2 : 5
        },
        labelLine: {
            show: !isSmallScreen,
            length: isSmallScreen ? 5 : 15,
            length2: isSmallScreen ? 5 : 15,
            minTurnAngle: 90
        },
        labelLayout: {
            hideOverlap: false,
            moveOverlap: 'shiftY'
        },
        tooltip: {
            formatter: '{b}: {c} 部 ({d}%)'
        },
        data: data
    };
}

// 柱状图 Tooltip 格式化函数 (HTML样式)
function barTooltipFormatter(params) {
    const divStyle = `font-size:13px; color:${themeConfig.tooltipText};`;
    return `
        <div style="${divStyle}">
            <b>${params.name}</b><br/>
            ${params.marker} ${params.seriesName}: ${params.value} 部
        </div>`;
}

// --- 4. 最终 Option 配置 ---
const option = {
    backgroundColor: 'transparent',
    color: customColors, // 应用新色系

    title: [
        { text: '分类', left: layoutConfig.title.leftPie, top: '2%', textAlign: 'center', textStyle: { color: themeConfig.titleColor, fontSize: layoutConfig.fontSize.title, fontWeight: 'bold' } },
        { text: '制作公司', left: layoutConfig.title.leftBar, top: '2%', textAlign: 'center', textStyle: { color: themeConfig.titleColor, fontSize: layoutConfig.fontSize.title } },
        
        { text: '来源', left: layoutConfig.title.leftPie, top: '35%', textAlign: 'center', textStyle: { color: themeConfig.titleColor, fontSize: layoutConfig.fontSize.title, fontWeight: 'bold' } },
        { text: '导演', left: layoutConfig.title.leftBar, top: '35%', textAlign: 'center', textStyle: { color: themeConfig.titleColor, fontSize: layoutConfig.fontSize.title } },

        { text: '类型', left: layoutConfig.title.leftPie, top: '68%', textAlign: 'center', textStyle: { color: themeConfig.titleColor, fontSize: layoutConfig.fontSize.title, fontWeight: 'bold' } },
        { text: '主役声优', left: layoutConfig.title.leftBar, top: '68%', textAlign: 'center', textStyle: { color: themeConfig.titleColor, fontSize: layoutConfig.fontSize.title } },
    ],

    // 全局 Tooltip 样式配置
    tooltip: {
        trigger: 'item',
        backgroundColor: themeConfig.tooltipBg,
        borderColor: themeConfig.tooltipBorder,
        textStyle: { color: themeConfig.tooltipText },
        extraCssText: 'box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);',
    },

    grid: [
        { left: layoutConfig.grid.left, right: layoutConfig.grid.right, top: '8%', height: '22%', containLabel: true },
        { left: layoutConfig.grid.left, right: layoutConfig.grid.right, top: '41%', height: '22%', containLabel: true },
        { left: layoutConfig.grid.left, right: layoutConfig.grid.right, top: '74%', height: '22%', containLabel: true }
    ],

    xAxis: [
        { type: 'value', gridIndex: 0, show: false },
        { type: 'value', gridIndex: 1, show: false },
        { type: 'value', gridIndex: 2, show: false }
    ],

    yAxis: [
        { 
            type: 'category', gridIndex: 0, data: studioData.map(i => i.name), 
            axisLabel: { color: themeConfig.textColor, width: isSmallScreen ? 70 : 95, overflow: 'truncate', interval: 0, fontSize: layoutConfig.fontSize.axis }, 
            axisLine: { show: false }, axisTick: { show: false } 
        },
        { 
            type: 'category', gridIndex: 1, data: directorData.map(i => i.name), 
            axisLabel: { color: themeConfig.textColor, width: isSmallScreen ? 70 : 95, overflow: 'truncate', interval: 0, fontSize: layoutConfig.fontSize.axis }, 
            axisLine: { show: false }, axisTick: { show: false } 
        },
        { 
            type: 'category', gridIndex: 2, data: actorData.map(i => i.name), 
            axisLabel: { color: themeConfig.textColor, width: isSmallScreen ? 70 : 95, overflow: 'truncate', interval: 0, fontSize: layoutConfig.fontSize.axis }, 
            axisLine: { show: false }, axisTick: { show: false } 
        }
    ],

    series: [
        // Row 1
        createPieSeries('分类', '18%', categoryData),
        {
            name: '制作公司', // 增加 Series Name
            type: 'bar', xAxisIndex: 0, yAxisIndex: 0,
            data: studioData.map(i => i.value),
            itemStyle: { color: '#7bbfea', borderRadius: [0, 3, 3, 0] }, // 使用蓝色系
            label: { show: true, position: 'right', color: themeConfig.textColor, fontSize: layoutConfig.fontSize.label },
            barWidth: '60%',
            tooltip: { formatter: barTooltipFormatter } // 应用美化后的 Tooltip
        },

        // Row 2
        createPieSeries('来源', '51%', sourceData),
        {
            name: '导演', // 增加 Series Name
            type: 'bar', xAxisIndex: 1, yAxisIndex: 1,
            data: directorData.map(i => i.value),
            itemStyle: { color: '#7fb80e', borderRadius: [0, 3, 3, 0] }, // 使用绿色系
            label: { show: true, position: 'right', color: themeConfig.textColor, fontSize: layoutConfig.fontSize.label },
            barWidth: '60%',
            tooltip: { formatter: barTooltipFormatter } // 应用美化后的 Tooltip
        },

        // Row 3
        createPieSeries('类型', '84%', typeData),
        {
            name: '声优', // 增加 Series Name
            type: 'bar', xAxisIndex: 2, yAxisIndex: 2,
            data: actorData.map(i => i.value),
            itemStyle: { color: '#f58220', borderRadius: [0, 3, 3, 0] }, // 使用橙色系
            label: { show: true, position: 'right', color: themeConfig.textColor, fontSize: layoutConfig.fontSize.label },
            barWidth: '60%',
            tooltip: { formatter: barTooltipFormatter } // 应用美化后的 Tooltip
        }
    ]
};
```
:::

若要给这漫长的 21 天定个调子，那绝对是“怪异”的颜色。**“物语系列”** 凭借 12 个条目的压倒性体量，牢牢占据了我视野的中心。新房昭之独特的演出风格，搭配神谷浩史犀利的吐槽，构成了我今年最深刻的视听记忆。也正是因为这波恶补，硬生生把“奇幻”刷成了我的年度关键词。

而说到时间都去哪儿了，还得让 **《游戏王》** 背个锅。整理数据时我才恍然大悟，DM 和 5D's 这两个庞然大物，简直就是我的时间黑洞。虽然在条目数上不显山露水，但这可怕的集数实实在在地填满了无数个夜晚。伴随着激昂的决斗 BGM，我回过神来才发现，半个月的现实时间就这样不知不觉地蒸发了。

此外，今年**京都动画**的含量也高得惊人：从多年前那个悠闲的《幸运星》午后，到《冰菓》里古典部的推理时光，再到去年那一曲让人意难平的《京吹 3》，以及今年十月新番《CITY》带来的快乐治愈。看着这满满当当的片单，我不承认自己是“粳米”都不行了。

最后，是谁在我的耳机里絮絮叨叨了一整年？

**神谷浩史**毫无悬念地拿下了我个人榜单的 TOP 1。毕竟光是阿良良木历那庞大的吐槽量，就足够他霸榜了，以至于我在其他动画里听到他的声音时，常会产生一种阿良良木历正在说话的错觉。

紧随其后的是劳模**鬼头明里**。从《鬼灭之刃》里咬着竹子的祢豆子，到《赛马娘》和《小鸟之翼》，她在各个片场来回奔波，是我今年最熟悉的声音之一。!!你鬼姐在《鬼灭》里不用说话也能狠狠拿工资!!

而排在第三位的**钉宫理惠**，则让我的耳朵着实体验了一把“钉宫病”复发的快乐。无论是《灼眼的夏娜》里那教科书般的傲娇三连，还是《天才麻将少女》里开朗活泼的元气萌音，都极具辨识度，百听不厌。

::: details 具体看过的动画（长图）
![](/assets/images/yearly-report-2025/anime-report.jpg)
:::

## 开发档案：并不改变世界的轮子

2025 年的业余时间里，我敲了一些代码。这些项目大多没什么改变世界的宏大愿景，更多是出于“手痒”，或者是为了解决一些奇奇怪怪的个人痛点。大部分代码都已经上传到了 GitHub，以下是本年度的“造轮子”总结。

首先来看看在 **[Wana_tools](https://watanabechika.github.io/Wana_tools/)** 中实现的各种脑洞小功能：

- **摩斯电码训练器**：本意是为了训练出一双“看灯辨码”的慧眼，以便快速解决拆弹游戏 [Keep Talking and Nobody Explodes](https://store.steampowered.com/app/341800/Keep_Talking_and_Nobody_Explodes/) 中的摩斯电码谜题。结果训练器写好了，那个游戏我之后却再也没打开过……

- **简易 AI 对话实现**：拿到了 [硅基流动](https://cloud.siliconflow.cn) 的 API 后，总觉得不搓个聊天界面对不起这免费额度。由于项目是纯前端且开源，为了防止 API Key 被滥用，我将其加密后再放进代码里，需要输入对应的密钥才能解开。

- **24 点游戏** ：已经记不清动机是什么了，大概是某个下午实在太无聊，大脑需要一点数学逻辑来防止生锈吧。

- **简单一笔画游戏**：玩 [鸽亿分钟](https://store.steampowered.com/app/3969570/_Demo/) 的一笔画谜题上头了，心想“这我也能写”，于是搓了一个能自动生成地图的网页版。核心用了回溯法寻找路径，碍于我的渣优化和性能瓶颈，地图大小被迫限制在 6×6，再大 CPU 就要报警了。

- **游戏王卡图猜猜乐**：沉迷打牌的副产物，灵感来自网上的各种梗图。因为卡片数量浩如烟海，我只存了文本数据，卡图直接调 API 获取。在这个基础上，我还迭代出了常用卡搜集、填空/判断模式、正选/反选检索等一大堆功能，甚至还顺手写了自动更新数据的脚本。!!牌佬的热情这一块!!

然后是一些记录在博客里的小玩意儿：

- **[简单音频处理](../coding/audio_effect.md)**：利用 Python 处理音频，尝试了各种“特效”。纯实验性质，真没啥用。

- **[知网文献爬取](../coding/cnki_search.md)**：某个大作业项目，虽然爬虫原理不难，但为了让它看起来像个“活人”以避开反爬机制，我费尽了心思：从无头浏览器模拟鼠标点击，到设计“随机休息”和“无意义闲逛”的逻辑。看着程序在那儿假装思考人生、漫无目的地开关链接，这种“人工智障”的感觉实在让人哭笑不得。

- **[解杀手数独](../coding/killer_sudoku.md)**：从 2024 年 11 月 1 日到 2025 年 11 月 1 日，我坚持每天做一道杀手数独（虽然没凑够整年没算进年度总结）。但这让我怎么忍得住不去想自动化解题？原理和平常的数独相似，都是回溯法，只是规则略有不同。!!虽享受解题过程，但我更享受“写个程序帮我解题”的快感!!

除此之外还有一点其实挺实用的其他工作：

- **[mpv-PiP](https://github.com/WatanabeChika/mpv-PiP)**：为了能一边玩欧卡运货，一边补番，我给 mpv 写了个画中画（Picture-in-Picture）插件。!!没有副显示器的痛!! !!去年还搓了一个一键截取台词长图的 mpv 插件，快去看看吧 Orz → [指路](https://github.com/WatanabeChika/mpv-lines-meme-generator)!!

- **[用户收藏条目标签统计](https://bgm.tv/dev/app/5129)**：把自己对数据可视化的执念带到了 Bangumi，写了个脚本，能在用户页生成类似我上一部分展示的那种标签统计图。

## 碎片拾遗：生活的缝隙

除了上述那些大块的时间投入，2025 年的缝隙里还塞进了些什么呢？

- 挖掘到了 **3** 个提升生活幸福感的开源项目：
    - **[Syncplay](https://syncplay.pl/)**：同步观看视频。终于可以告别在腾讯会议里倒数“3、2、1”同时按播放键的原始操作，也不用忍受直播画面的高延迟。能够精准同步进度条，才是远程观影的正确打开方式。

    - **[PDFMathTranslate](https://pdf2zh-next.com/)**：PDF 文件翻译（主要用于翻译论文）。它最感人的一点是完美保留了原本的 PDF 排版，让机翻后的阅读体验不再是灾难，极大地保护了我的视力!!和san值!!。
    
    - **[Spacedesk](https://www.spacedesk.net/)**：利用 USB/WiFi 实现分屏。对没有正规显示器的我来说，它能强行把我的平板/手机变成副屏，虽然有些延迟，但对于查阅文档和代码来说，效率提升了不止一点点。

- 阅读（课外）书籍约 **32** 本，都是电子书，主要由侦探小说和科幻小说构成。用“约”是因为我看书全靠电子版，且没有手动记录的习惯，只能对着阅读软件的后台记录进行并不精准的估算……!!明年一定记!!

- 在游戏王的对局中利用 [一击必杀！居合抽卡](https://ygocdb.com/card/71344451) 斩杀对手 **13** 次：这一刀下去，不仅是运气的爆发，更是决斗者浪漫的极致。（口说无凭，我也留下了赛博案底：[一击必杀：2025 年居合斩杀合集（个人）](https://www.bilibili.com/video/BV1Fzq6BzE5B/)）

……

## 结语

写到这里，2025 年的轮廓终于在我的脑海中清晰了起来。

这一年，我花了 21 天在动画里做梦，有 86% 的早晨被耳虫叫醒，敲了一些只有自己懂的奇怪代码，还在决斗中赌赢了 13 次命运。 这些数据或许在各大平台的年度报告里微不足道，甚至会被大数据算法归类为“无效时间”。但对我而言，正是这些看似无用的吐槽、这些不知所谓的坚持、以及那些深夜里的自我感动，构成了我真实度过这一年的实感。

生活不只有 KPI 和里程碑，还有这些由“0”和“1”堆砌起来的、闪闪发光的碎片。

2026 年也请这样坚持下去吧。
