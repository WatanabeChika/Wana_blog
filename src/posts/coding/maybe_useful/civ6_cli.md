---
title: 挑战不碰鼠标玩一局《文明 VI》
excerpt: civ6-cli：利用 FireTuner 将后台游戏接入命令行，实现信息获取和操作执行
date: 2026-09-21
isOriginal: true
category: 
    - Technology
    - Game
tag: 
    - Python
    - Civilization VI
---

《文明 VI》（Sid Meier's Civilization VI）是一款以能够“让时光倒流”著称的回合制策略游戏——常常 8 点开始，7 点就结束了 !!只不过是次日!!。令人上瘾的游戏机制让人很容易就沉浸其中，因此导致的单局游戏超长耗时也让它成为了杀时间利器。

我休息时间没那么大把，工位上摸鱼的时间却不少，但我也不能在工位正大光明地打开《文明 VI》，那怎么办呢？我想到前不久在 GitHub 上看到的一个项目：[sts2-cli](https://github.com/wuhao21/sts2-cli)——《杀戮尖塔 2》（Slay the Spire 2）的命令行版本。这个项目将《杀戮尖塔 2》的游戏引擎 dll 文件抽了出来，剥离掉图形渲染层，让纯逻辑引擎在终端后台运行，实现《杀戮尖塔 2》的无头化。

《文明 VI》也可以这么做吗？我调研后发现，《文明 VI》的核心是由 C++ 编写并直接编译为机器码的原生二进制文件，且逻辑层和渲染层深度耦合，难以进行剥离。但是《文明 VI》给玩家提供了“官方后门”FireTuner。这个调试通道通过 TCP 协议接收外部的 lua 命令语句，并传回游戏执行，是很方便的 API。

更重要的是，GitHub 甚至有现成的利用 FireTuner 的项目：[civ6-mcp](https://github.com/lmwilki/civ6-mcp)。它在这条通道上实现了 70 多个游戏操作，让 LLM 代理能打完整局游戏。既然 LLM 能玩，那将其改造成人类玩家可读的命令行模式也完全可行！

于是，《文明 VI》的命令行游玩工具：[civ6-cli](https://github.com/WatanabeChika/civ6-cli) 应运而生。

::: note
这套流程稳定工作的前提是：

1. Windows + Steam 版《文明 VI》的**单人游戏**（FireTuner 在联机、热座模式下会被禁用）且已开启 FireTuner；因为 [civ6-mcp](https://github.com/lmwilki/civ6-mcp) 在 Mac 和 Linux 上能顺利运行，所以理论上该项目也能在 Mac 和 Linux 上运行（未经测试）。
2. 关闭 FireTuner GUI 与其他占用通道的客户端——这条通道同一时间只接受一个连接。

另外：**启用 Tuner 会禁用当前存档的 Steam 成就**，这是游戏本身的行为，与本项目无关。
:::

## 连接后台《文明 VI》
在《文明 VI》的游戏设置里打开 FireTuner 通道（或在 `AppOptions.txt` 里把 `EnableTuner 0` 改成 `1`）之后，游戏会在 `127.0.0.1:4318` 上监听一个 TCP 服务，接受外部送进来的 Lua 代码，并在游戏内部的两个 Lua 虚拟机（`GameCore` 与 `InGame`）中执行。

FireTuner 的报文结构非常朴素：

```text
┌──────────┐
│ 4 bytes  │ ← Length (uint32)
├──────────┤
│ 4 bytes  │ ← Type (uint32=3)
├──────────┤
│ payload  │ ← CMD:<vm_target>:<lua_code>\0
└──────────┘
```

于是，当游戏在后台运行时，只需要用几十行 Python 代码就能测试连接：

```python
import socket, struct

class FireTunerConnection:
    def __init__(self, host: str = "127.0.0.1", port: int = 4318):
        self.sock = socket.create_connection((host, port), timeout=5)

    def _recv_exact(self, size: int) -> bytes:
        data = b""
        while len(data) < size:
            chunk = self.sock.recv(size - len(data))
            if not chunk:
                raise ConnectionError("FireTuner connection closed")
            data += chunk
        return data

    def send(self, lua: str) -> str:
        payload = f"CMD:65535:{lua}\0".encode("utf-8")
        body = struct.pack("<I", 3) + payload
        self.sock.sendall(struct.pack("<I", len(body)) + body)
        length = struct.unpack("<I", self._recv_exact(4))[0]
        body = self._recv_exact(length)
        return body[4:].rstrip(b"\0").decode("utf-8", errors="replace")
```

连接成功后送进去的第一条 Lua 不是地图也不是单位，而是一句最简单最普通的回合查询：

```lua
return Game.GetCurrentGameTurn()
```

当终端里打印出 `1` 的那一刻，Python → TCP → FireTuner → 游戏内 Lua 虚拟机这条链就通了，最困难的工作已经完成了一半。

## 获取回合信息
在真正用命令行开始玩游戏之前，得先确保回合信息的获取正确而充分，把局势读清楚再谈操作。

《文明 VI》中丰富的回合信息读取不是一蹴而就，而是一步步“长”出来的：从最初的 `status / units / cities`，到覆盖科文研究、经济、外交、政体、宗教、伟人、时代、胜利条件、议会、间谍、商路、资源、城邦的完整查询矩阵。每一项背后都是一段固定的 Lua 模板，去游戏 API 里把字段找到，再拼成结构化文本返回。

![回合总览](/assets/images/civ6-cli/status.png)

听起来容易，但是实际做下来坑不少。

### 问题 1：通道噪音

有时，游戏 UI 自己会往输出里掺东西：`ViewUnitsPage`、`UpdateUnitsData`、`Timer1: Page Cities 29 milisecs` 这类调试信息会混进响应流，轻则污染结果，重则破坏"长度-类型-载荷"的 framing，让读取直接超时。

怎么解决呢？可以试着在 Lua 侧接管 `print`：业务输出全部落入自己的缓冲区，最后用标记包裹一次性返回，Python 侧只认标记之间的内容：

```lua
local __civ6cli_raw_print = print      -- 保住原始 print
local __buffer = {}
print = function(...)                  -- 接管：游戏 UI 的噪音不再进入业务输出
  local parts = {}
  for i = 1, select("#", ...) do
    parts[#parts + 1] = tostring(select(i, ...))
  end
  __buffer[#__buffer + 1] = table.concat(parts, "\t")
end
-- 业务 Lua：只 print 结构化结果
print = __civ6cli_raw_print            -- 还原
return "@@CIV6CLI@@\n" .. table.concat(__buffer, "\n") .. "\n@@END@@"
```

### 问题 2：乱码
在一次修改后，我发现生产列表里有好多看不懂的字眼，比如“灏勭鐐”和“姘存竱” :cold_sweat: 。我进游戏排查才知道，这其实显示的是“射石炮”和“水渠”。

这是经典的 UTF-8 字节流被按 GBK 解读的事故。因此统一字节边界、全程显式 UTF-8 解码之后，中文本地化才真正可用。

而本地化可用之后又带来一个新决定：所有内部类型（`UNIT_*`、`TECH_*`、`POLICY_*`）在输出里必须同时给出“可读名称 + 可复制的常量名”，让玩家既能理解类型含义，又能直接查看命令参数。

### 问题 3：API 语义和玩家理解的偏差
这类问题不太常见，因此也比较隐蔽。需要在游戏中挨个排查才能发现并解决。

比如城市的“宜居度”字段，按 API 读出来的是绝对值，而非盈余。这会导致玩家理解的偏差：我们在游戏界面里看到的宜居度值实际上是提供的宜居度减去当前城市所需宜居度，即宜居度盈余。

举个例子，开罗宜居度绝对值是 3，但人口 8 需要 4 宜居度，所以宜居度盈余其实是 -1。我们在游戏里看到的是 -1，但是按 API 读出来却是 3。

所以，每个 API 返回的数值都要和游戏界面逐项对照、换算成玩家语言后才允许出终端。终端里显示的每个数字，都应该是玩家在 UI 里能对上账的数字。

### 问题 4：地图可视化
《文明 VI》是六边形网格，而终端是只有四个方向的字符矩阵，两者之间有一层错位。如果不能精准显示地图，会大大影响玩家的决策。

因此我试着用**奇偶行缩进**：相邻两行错开半个格宽，视觉上就还原了六边形的咬合关系。

同时还有一个反直觉的细节——游戏坐标里 **Y 越小越靠北**，所以输出时必须把行序翻转过来，让地图在终端里“北朝上”，匹配 UI 视觉：

```python
def hex_distance(ax: int, ay: int, bx: int, by: int) -> int:
    """偏移坐标转立方体坐标，取真六边形距离（而非矩形距离）。"""
    aq = ax - (ay - (ay & 1)) // 2
    bq = bx - (by - (by & 1)) // 2
    return max(abs(aq - bq), abs(ay - by), abs(-aq - ay + bq + by))

def render(tile_rows: dict[int, list[str]], cy: int, radius: int) -> str:
    lines = []
    for y in range(cy - radius, cy + radius + 1):   # 小 Y 在北，先输出
        indent = " " if y % 2 else ""               # 奇偶行错位，拼出六边形
        lines.append(indent + "  ".join(tile_rows[y]))
    return "\n".join(lines)
```

显示整片大陆的地图显然不现实，所以设计成地图以任意单位或城市为中心展开的模式（`map unit <单位> [半径]`、`map city <城市> [半径]`），半径可选 0~5，按真正的六边形距离圈定范围。

至于地块上的建筑、单位等，用格子里叠着的多层标记进行指示：

```text
C 城市   U 己方单位   ! 其他可见单位   R 资源   D 区域   W 奇观
B 蛮族哨站   V 部落村庄   I 改良设施   ≈ 河流   @ 中心   ~ 迷雾   ?? 未探索
```

此外，还能通过 `map tile <x> <y> [半径]` 查看地块详情：地形、地貌、资源、归属、魅力值、六项产出。

::: note
地图有一条铁律：**终端不得泄露游戏没给你看的信息。**

未探索地块不显示地形；迷雾地块不显示实时单位、城市、归属、改良与产出；未解锁的战略资源、不可见的敌方单位一律不出现。

换句话说，这张 ASCII 地图的信息公开程度，必须和你在游戏画面里亲眼看到的完全一致。
:::

![城市地图 =700x](/assets/images/civ6-cli/map.png)

## 执行回合操作
读取完善之后，才轮到操作。参考 [civ6-mcp](https://github.com/lmwilki/civ6-mcp) 的分类，我把操作分成两类，但做了面向玩家的改造：

1. **回合阻塞项（待办）**：即游戏右下角中会显示的待办事项，没有完成这些事项不允许结束当前回合。

    如：选城市生产、选科技/市政、指挥尚有行动力的单位、换政体政策、用总督点数、选万神殿、招募伟人、派商路、议会投票、间谍行动、派使者、进入新时代的着力点、占领城市的处置等等。

    `turn todo` 会把它们连同“下一步该敲什么命令”一起列出来。

    需要注意的是，“必须处理”不等于“必须做点什么”——每个阻塞项都提供显式的跳过入口：单位可以 `unit skip`，政体可以 `government keep`，政策可以 `policy keep`。放弃也是一种决策。

2. **主动操作**：即游戏中需要玩家自发进行的活动与操作。

    如：宣战、结盟、派遣使者、交易、购买地块与单位、用金币/信仰获取伟人等等。

    这些操作将永远等待玩家主动发起。

所有写操作，都遵循同一套“确认机制”：**预览 → 确认 → 发送一次 → 复查**。

```python
console.print(action.preview())            # 动作、对象、参数
if not auto_yes and not confirm("确认发送？"):
    console.print("已取消。")
    return
result = conn.send(action.lua())           # 只发送一次
console.print(action.summarize(result))    # 若失败，会展开细节
```

::: note 为什么“发送一次”如此重要？
**因为超时不等于失败。**

发送后断线或超时，动作可能已经在游戏里生效了；此时自动重试，等于让一个单位移动两次、让一笔交易提交两遍。

所以结果状态被明确分成四种：成功、请求已发送待复查、已拒绝、结果未知。遇到"结果未知"，正确姿势是 `session reconnect` 后读取相关状态核对，而不是闭眼重发。该工具永远不会自动重放写请求、自动代选阻塞项、自动覆盖存档。
:::

对于一些“专业单位”，它们不能像普通单位那样 `move` 了事：
- 商人要选商路：选项页会给出目的城市、持续回合、双方每回合收益；
- 间谍要选任务：选项页会给出合法目标、回合数、成功概率；
- 使徒可能选择新增信条：被拆成两阶段流程，先 `religion evangelize` 传播获得待选信条，再 `religion add-belief` 落定。

它们的统一入口是 `unit options <单位>`：一行命令列清“现在能做什么、做不成是因为什么、下一步命令怎么抄”。

最后还要考虑**非玩家回合**的处理：AI 会向你递交易、发会面。

`trade pending`、`diplomacy pending` 随时可读，`trade respond`、`diplomacy respond` 被明确允许在非本地回合执行。

交易本身也继承了“先试算再发送”的习惯：`trade propose <玩家> test ...` 可以先探 AI 口风（接受/还价/拒绝），满意了再 `send`，之后用 `trade pending` 核对 AI 的真实回应。

![回合待办、单位操作列表 =700x](/assets/images/civ6-cli/options.png)

## 升级终端输出
功能现在是齐备了，但是复杂庞大的命令体系还需要整理，满屏参差不齐的宽大表格也需要改善统一。

### 完善 help 命令手册
目前的问题在于：
1. 单位相关命令一部分躺在 `help` 里、一部分藏在 `actions unit` 下；
2. `report` 这个二级入口和外面的一级命令大面积重叠（`envoy options` 已经完全包含 `envoy show` 的信息）；
3. 同一种信息有两三个入口、两份措辞不同的说明。

所以，我对“help”做了一次彻底重构：

- **统一语法**：主题 → 动词 → 对象 → 参数。二十个主题（`turn unit city research government policy governor envoy era religion great-person great-work diplomacy trade spy congress map economy victory session`）覆盖全部读写，读与写长在同一棵树上，不再有两套入口。

- **统一输出契约**：`list` 给紧凑列表，`show` 给对象详情，`options` 给决策页。决策页能让玩家直接抄到可用的下一步命令，而不是把原始字段再 dump 一遍。

- **统一手册**：原本分离的查询目录与操作目录合并成一份 `COMMAND_MANUAL.md`，按领域组织、读写并列；终端内 `help`、`help <主题>`、`help tree` 与手册同源生成。旧别名、冗余命令、"补丁式"的边界说明文字全部删除——手册里只留下对玩家有用的话。

### 用 Rich 优化终端视觉
早期的输出界面非常简陋，像个老旧的数据库管理后台：满屏都是生硬的等宽大表格，要么右半边空了一大截，要么字段稍长就被挤到硬换行，扫两眼就觉得眼花。

既然是人玩的项目，终端排版怎么也得看得过去。于是我引入了 Python 的 Rich 库把整个视觉重新理了一遍：

- **放弃硬塞表格**：表格不再锁死宽度，全部按终端实际大小自适应；对于属性特别多的单位或城市详情，不再硬塞进横向表格里，而是改成键值卡片逐行铺开；`status` 也回归纯粹的“局势总览”，不再把冗长的单位列表重复打一遍。

- **排版分块与色彩区分**：用 Panel 边框和分割线把同屏信息拆清楚，避免文字糊成一团；加上了一套克制的颜色规则（普通信息灰白，外交、资源、敌军和待办警告各自对应固定颜色），扫一眼就能抓住关键局势。

- **保留兜底模式**：虽然上了彩色排版，但没必要给纯文本环境添乱。项目完整支持 `--color auto|always|never`（默认遵守系统的 `NO_COLOR` 规范）、只出纯 ASCII 字符的 `--ascii`，以及自定义宽度的 `--width <列数>`。平时开着好看，扔进各种窄窗口或极简终端里也不会排版崩坏。