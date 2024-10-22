---
title: 一键生成多台词类长截图
excerpt: 记一次基于mpv的小型插件制作过程
date: 2024-10-12
isOriginal: true
category: 
    - Technology
tag: 
    - mpv
    - Lua
---


这是一个基于mpv视频播放器的小插件，名叫[mpv-lines-meme-generator](https://github.com/WatanabeChika/mpv-lines-meme-generator)，目前仅支持在Windows上使用。我将在下文对其进行详细的介绍。

## 关于mpv
[mpv](https://mpv.io/)是一个免费、开源、跨平台的视频播放器。它不仅具有识别多轨字幕/音频和外挂字幕/音频的基础功能，还能通过各种各样的插件进行功能增强和拓展。有翻新UI的插件，有增强画质的插件，有配合切屏等动作自行暂停视频的插件，有自动识别音频字幕的插件，还有一键生成GIF的插件，等等。

mpv自定的快捷键便几乎涵盖了整个键盘，也囊括了日常所需的几乎所有功能：音量、视频切换、快进快退，甚至有亮度、对比度、字幕偏移量等细致入微的设置。

![mpv默认键位绑定一览](/assets/images/mpv-lines/mpbindings.png)

大多数mpv的插件由Lua语言编写，其余插件由JavaScript语言编写。因此对其中至少一门语言进行一定程度的了解是编写mpv插件的必要条件。博主此次使用的是Lua语言。!!Lua语言中，数组首位竟然是从1开始！这太反直觉了！!!

## 需求及思路
经常看meme的人知道，有一种meme类型是：一张视频截图，下面拼接了很多接下去的台词，最后形成能够表现一整段台词的长截图。这类meme通常用于表现说话人的独白场景，而**台词**正是精髓所在。

![JOJO4中吉良吉影的自我介绍名场面](/assets/images/mpv-lines/lines.jpg)

这样截图的优点在于：
1. 保留首张截图，清晰表明说话人（或视频来源）。
2. 其余截图只保留台词，在避免产生超长图的条件下完整引用一整段台词。

正因为自己看视频时经常会涌现出“这段台词太经典了我一定要把它截下来”的想法，而mpv社区中还没有专门实现该功能的插件，于是博主自己动手，丰衣足食——开始着手开发该插件。

---

整体思路很简单：**截图 → 剪切 → 拼接**。

- 截图：mpv自带截图键，也有对应的脚本命令获取截图文件。
- 剪切：有很多图像处理库/软件可供使用，博主选择了[ffmpeg](https://www.ffmpeg.org/)，调节`crop`选项参数就可以对图片进行裁剪。

::: info
在ffmepg中，`crop`选项有四个参数，分别表示输出图像的**宽度**、输出图像的**高度**、裁切起点的**x**方向值、裁切起点的**y**方向值。

举例来说，`ffmpeg -i screenshot.jpg -vf crop=iw:ih*0.2:0:ih*0.8 processed.jpg`表示：
- 输出图像与输入图像相比，宽度不变，高度是原图像的20%。
- 裁切从原图像最左边开始到最右边，从原图像高度的80%开始到底部。
:::

- 拼接：同样选择ffmpeg，调节`filter_complex`的参数就可以指定拼接方向和拼接图片数量。

::: info
在ffmpeg中，如果想要在垂直方向拼接图像，除了要将所有原图像作为输入值，还需要用到`vstack`参数（水平方向则是`hstack`）；而拼接多个图像则简单地在后面加上数量即可。

举例来说，`ffmpeg -i image1.jpg -i image2.jpg -i image3.jpg -filter_complex vstack=3 stitched.jpg`表示：将image1、image2、image3总共3个图像按垂直方向拼接起来。
:::

## 代码实现
几个细微的逻辑：
1. 实现当中为了方便自定义设置，一些需要经常修改的变量被提到文件开头的`options`结构体里。
2. 增加时间戳，既为每一张截图增加可识别性，也防止误覆盖。
3. 由于第一张截图不需要剪切，循环逻辑中需要对其单独进行处理。
4. 最后移除所有操作中间临时保存的图片。
5. 绑定键位时选择不和默认键位冲突的键（博主此次选择了n键）。

完整代码可移步[Github](https://github.com/WatanabeChika/mpv-lines-meme-generator/blob/main/mpv-lines.lua)，也可在下面查看。

::: normal-demo Lua script

```lua
-- Made by Wanakachi
require "mp.options"
local utils = require "mp.utils"

local options = {
    dir = "YOUR_PATH_HERE", -- Your path to save screenshots
    height = 0.15,  -- Height of the lines to keep (starting from the bottom)
    lossless = false,  -- Use lossless screenshots
}

read_options(options, "line-shot")

local timestamp = os.date("%Y%m%d_%H%M%S")
local screenshot_dir = options.dir
local screenshot_format = options.lossless and ".png" or ".jpg"
local screenshot_count = 0
local screenshots = {}

-- Take and crop screenshots
function take_screenshot()
    screenshot_count = screenshot_count + 1

    -- Take original shots
    local screenshot_file = utils.join_path(screenshot_dir, "temp_screenshot_" .. screenshot_count .. screenshot_format)
    mp.commandv("screenshot-to-file", screenshot_file, "subtitles")

    -- Crop the shots (except the first one)
    local processed_file = utils.join_path(screenshot_dir, string.format("line_shot_%03d" .. screenshot_format, screenshot_count))
    local crop_arg = ""

    if screenshot_count > 1 then
        crop_arg = "crop=iw:ih*" .. options.height .. ":0:ih*" .. (1 - options.height)
    else
        crop_arg = "crop=iw:ih:0:0"
    end

    -- Use ffmpeg to crop the shots 
    local crop_command = {"ffmpeg", "-i", screenshot_file, "-vf", crop_arg, processed_file}

    local result = utils.subprocess({args = crop_command})
    if result.status == 0 then
        mp.osd_message("Shot saved: " .. processed_file)
        table.insert(screenshots, processed_file)
    else
        mp.osd_message("Cropping failed: " .. result.error)
    end

    -- Delete the original shots
    os.remove(screenshot_file)
end

-- Stitch the cropped screenshots together
function stitch_images()
    if #screenshots <= 1 then
        mp.osd_message("No shots to stitch!")
        return
    end

    local command = {"ffmpeg", "-y"}
    local output_file = utils.join_path(screenshot_dir, "stitched_screenshot_" .. timestamp .. screenshot_format)
    local filter_expr = "vstack=" .. #screenshots

    -- Add input files, filter, output filename, one by one
    for i = 1, #screenshots do
        table.insert(command, "-i")
        table.insert(command, screenshots[i])
    end
    table.insert(command, "-filter_complex")
    table.insert(command, filter_expr)
    table.insert(command, output_file)

    -- Run the command
    local result = utils.subprocess({args = command})

    if result.status == 0 then
        mp.osd_message("Stitched shot saved: " .. output_file)
    else
        mp.osd_message("Stitching failed: " .. result.error)
        return
    end

    -- Delete the cropped shots and reset the counter
    for _, img in ipairs(screenshots) do
        os.remove(img)
    end

    screenshots = {}
    screenshot_count = 0
end

-- Bindings
mp.add_key_binding("n", "take-screenshot", take_screenshot)
mp.add_key_binding("Ctrl+n", "stitch-images", stitch_images)
```

:::