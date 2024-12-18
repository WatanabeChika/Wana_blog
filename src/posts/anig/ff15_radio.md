---
title: 我雷迦利亚只能刷漆贴膜不能升级中控？
excerpt: 利用MOD自定义FF15里的车载音乐（随身听歌曲）
date: 2024-08-26
isOriginal: true
category: 
    - Game
tag: 
    - FF15
    - Mod
    - Python
---


在最终幻想15（Final Fantasy XV: Windows Edition，以下简称FF15）里，主角诺克提斯拥有一辆豪车雷迦利亚，平常周游路西斯王国全靠它。由于在锚点之间传送需要花钱，博主在比较近的地点之间移动时，更倾向于坐在雷迦利亚上，一边听着车载音乐一边在美景中飞驰。 !!伊格尼斯：什么？你说飞驰？!!

::: info
在游戏内可以买到一个随身听，让玩家随时随地都能欣赏车载音乐（虽然极容易被打断）。博客里为了方便，统一表述为车载音乐。
:::

然而，令人遗憾的是：雷迦利亚的车载音乐不能自定义，只能听作品中自带的各种音乐，包括最终幻想系列各前作的原声带以及不少联动DLC乐曲。虽然歌曲数量庞大，林林总总共有三四百首，但是这总没有听着自己喜欢的歌曲来的舒适。好在*Von Lulech93*开发了一个MOD——[**Radio Tuner**](https://steamcommunity.com/sharedfiles/filedetails/?l=german&id=1329630729)，这让大家可以方便地自定义FF15里的车载音乐。

本篇博客就将介绍如何利用Radio Tuner方便快速地将FF15里的车载音乐替换成其他歌曲。

## Radio Tuner简述
Radio Tuner是FF15的一款MOD，它可以将游戏内的车载音乐导出为mp3格式文件，也可以将诸如mp3、wav、flac等格式的文件通过车载音乐替换导入至游戏内。这样游戏内的车载音乐虽然会显示原来的名称，但是实际的歌曲已经被替换。

优点：
- 适配多种音乐文件格式
- 简洁的GUI
- 支持命令行语句

缺点：
- 不能批量处理文件
- （用GUI操作时）需要先导入原文件才能进行替换
- 只能用cmd命令行，不支持powershell

## FF15车载音乐分析
从MOD的功能中可知，我们所做的工作仅仅是所谓“偷梁换柱”。因此替换后的歌曲数不能多于原有的歌曲数，而歌曲名也不会随着我们的替换而改变。

另外，FF15里的车载音乐按**专辑**区分，且播放器相关操作也支持对整张专辑进行跳过/循环/随机播放，如果我们按专辑对应添加不同类型和数目的歌曲，便能更进一步实现快速跳过同类歌曲等便捷操作。

### 源文件
FF15的车载音乐文件放在 `.../FINAL FANTASY XV/datas/sound/resources/20000music/jp/` 里，且文件后缀均为 `.win.sab`。 不同专辑的不同歌曲则通过文件名加以区分。博主根据名称含义和歌曲数目，尝试将游戏内各音乐专辑与源文件夹里不同名称的文件相对应，得到下表：

::: note
博主基于自己的游戏文件进行整理，如有纰漏请指正。

- **游戏内名称**省略“的回忆”后缀；分为多部的专辑（如最终幻想9、最终幻想11）合并成一个。

- **源文件名**省略 `.win.sab` 后缀；前缀相同的多个文件合并为一个，并用 *斜体* 表示数目。

- 部分源文件未找到对应的游戏内专辑，用 `???` 表示。 !!若之后找到对应专辑会及时更新!!
:::

| 游戏内名称 | <center>源文件名</center> | 歌曲数目 |
|  :----:  |  :----  |  :----:  |
| 最终幻想1 | bgm_car_ff1ar_*01*~*09* | 9 |
| 最终幻想2 | bgm_car_ff2ar_*01*~*11* | 11 |
| 最终幻想3 | bgm_car_ff3ar_*01*~*13* | 13 |
| 最终幻想4 | bgm_car_ff4ar_*01*~*12* | 12 |
| 最终幻想5 | bgm_car_ff5ar_*01*~*16* | 16 |
| 最终幻想6 | bgm_car_ff6or_*01*~*12* | 12 |
| 最终幻想7 | bgm_car_ff7or_*01*~*14* | 14 |
| 最终幻想8 | bgm_car_ff8or_*01*~*17* | 17 |
| 最终幻想9 | bgm_car_ff9or_*01*~*06* / *08*~*15* / *17*~*20* <br> bgm_car_ff9pl_*02*~*03* | 20 |
| 最终幻想10 | bgm_car_ff10or_*01*~*15* | 15 |
| 最终幻想11 | bgm_ff11_1-*01* / *04*~*05* / *09* / *13*~*14* / *20*~*21* <br> bgm_ff11_2-28 <br> bgm_ff11_p_1-*07*~*08* <br> bgm_ff11_promathia_07 <br> bgm_ff11_wings_*23*~*24* <br> bgm_ff11_zilart_*10*~*11* / *14* | 17 |
| 最终幻想12 | bgm_car_ff12or_*01*~*15* | 15 |
| 最终幻想13 | bgm_car_ff13or_*01*~*13* | 13 |
| 最终幻想14 | bgm_ff14_meteor_101 <br> bgm_ff14_realm_*002* / *005* / *018*~*019* / *027* / *067* / *080* | 8 |
| 最终幻想纷争 | bgm_dissidia_os_1-*01*~*04* / *06*~*30* <br> bgm_dissidia_os_2-*01* / *03*~*06* / *08*~*10* / *13* / *21* / *23*~*24* | 41 |
| 最终幻想纷争012 | bgm_1-*01*~*03* / *05*~*07* / *09*~*11* / *13*~*16* / *18*~*19* / *20* / *22*~*24* / *26*~*29* / *31*~*34* / *36*~*38* / *40*~*42*_duodecim <br> bgm_2-*01*~*02* / *06*~*07* / *11*~*13* / *17*~*20*_duodecim <br> bgm_3-*01*~*07*_duodecim | 51 |
| 最终幻想零式 | bgm_reishiki_os_colorful_falling_in_love <br> bgm_reishiki_os_soar <br> bgm_reishiki_os_tempus_finis <br> bgm_reishiki_os_the_earth_under_our_feet <br> bgm_reishiki_os_vermilion_fire <br> bgm_reishiki_os_war_the_white_weapon <br> bgm_reishiki_os_war_warrior_worth_a_thousand <br> bgm_reishiki_os_we_have_come | 8 |
| 路西斯 | bgm_car_*1*~*6* | 6 |
| 艾佛杰克 | bgm_afrojack | 1 |
| 王之剑 | bgm_kings_*01*~*07* | 7 |
| 正义怪兽5 | bgm_justice_*01*~*06* | 6 |
| 兄弟情 | bgm_original_brother_bgm*1*~*22* | 22 |
| 尼尔完全形态&伪装者 <br> 尼尔机械纪元 | bgm_nier_*01*~*02* | 2 |
| 古拉迪欧拉斯章 | bgm_epg_new_*01*~*02* | 2 |
| 普隆普特章 | bgm_epp_new_*01*~*03* | 3 |
| 伊格尼斯章 | bgm_epi_a_united_front <br> bgm_epi_main_theme <br> bgm_epi_ravus | 3 |
| FF15在线扩展包：战友 | bgm_mulit_plant <br> bgm_multi_*01*~*02* | 3 |
| 亚丹章 | bgm_nox2_epa_bgm*1*~*3* | 3 |
| 泰拉之战 <br> 泰拉战争 | bgm_terra_bons_03 <br> bgm_terra_dor_02 <br> bgm_terra_fftv_01 <br> bgm_terra_wars_bgm*1*~*2* | 5 |
| 古墓丽影 | bgm_tomb_raider_bgm*1*~*3* | 3 |
| 战国动作冒险解谜游戏：DJ信长 | bgm_dj_nobunaga_bgm1 | 1 |
| ??? | bgm_bat_maefuri <br> bgm_rayjack_*01*~*06* <br> bgm_result_2 <br> bgm_title | 9 |

### 游戏内专辑
源文件里的歌曲并非轻轻松松就能听到——在FF15中需要**解锁**专辑才能收听对应歌曲（即使歌曲被替换）。除了初始内置的几张专辑，其余各专辑需要在停车点商店购买获得。以下是能够买到的各专辑以及出售该专辑的商店地址：

| 专辑名称 | 商店地址 |
|  :----:  |  :----:  |
| 最终幻想2 | 【里德】兰戈维塔停车休息站|
| 最终幻想3 | 【达斯卡】考尔尼克斯矿物油奥尔斯特分店 |
| 最终幻想4 | 【里德】锤头鲨 |
| 最终幻想5 | 【里德】加迪纳渡船场 |
| 最终幻想6 | 【达斯卡】特尔帕停车休息站 |
| 最终幻想8 | 【里德】锤头鲨 |
| 最终幻想9 | 【达斯卡】考尔尼克斯矿物油卡提斯分店 |
| 最终幻想10 | 【达斯卡】陆行鸟驿站·维兹 |
| 最终幻想11 | 【库莱茵】巴布斯特土特产 |
| 最终幻想12 | 【库莱茵】贝利纳超市拉霸狄奥店 |
| 最终幻想14 | 【库莱茵】考尔尼克斯矿物油雷斯特尔姆分店（雷斯特尔姆） |
| 最终幻想纷争 | 【库莱茵】旧雷斯特尔姆 |
| 最终幻想纷争012 | 【库莱茵】旧雷斯特尔姆 |
| 最终幻想零式 | 【水都奥尔缇西】骊薇旅馆前 |

## 自动化替换过程
心里有了想要听的歌曲，也物色好并在游戏内购买了待替换的专辑，就可以开始着手替换了。

一般来说，一次性替换的歌曲数目较多，手动进行导入替换既耗费时间，又容易误操作造成重复或缺漏。鉴于Radio Tuner支持命令行语句，我们最好将该操作自动化，方便又省力。

::: note
建议提前做好被替换专辑源文件的备份。

使用Radio Tuner时，若手动用其GUI操作替换歌曲，则它会自动进行备份；若使用命令行语句，则不会自动备份。
:::

我们用到了Python中的**subprocess**库：它可以在Python文件中书写命令行语句并且执行，同时也可以显式选择命令行。

以替换 *最终幻想1* 专辑中的歌曲源文件举例：

```python
# Made by Wanakachi
def rpc_for_FF1():
    # 替换最终幻想1的音乐，共9首
    original_path = "/original/path/FINAL FANTASY XV/datas/sound/resources/20000music/jp"
    goal_path = "/goal/path"
    dic = {"bgm_car_ff1ar_01.win.sab": "1.mp3",
           "bgm_car_ff1ar_02.win.sab": "2.mp3",
           "bgm_car_ff1ar_03.win.sab": "3.mp3",
           "bgm_car_ff1ar_04.win.sab": "1.wav",
           "bgm_car_ff1ar_05.win.sab": "2.wav",
           "bgm_car_ff1ar_06.win.sab": "3.wav",
           "bgm_car_ff1ar_07.win.sab": "1.flac",
           "bgm_car_ff1ar_08.win.sab": "2.flac",
           "bgm_car_ff1ar_09.win.sab": "3.flac"}
    for i in dic:
        # 显式选择cmd
        command = 'cmd /c "FFXVRT.exe -i \"{}\" -r \"{}\""'.format(original_path + "/" + i, goal_path + "/" + dic[i])
        subprocess.run(command, shell=True)
    # 最后打开日志文件
    subprocess.run('cmd /c "FFXVRT.exe -v"')
```

唯一需要注意的是，被替换的歌曲名称内不能带有cmd的关键字符号（如&）。!!别问我是怎么知道的!!
