---
title: 移动竹管，能窥见整只猎豹吗？
excerpt: 利用 OpenCV 从视频的移动镜头中拼接出全景图
date: 2026-04-20
isOriginal: true
category: 
    - Technology
tag: 
    - Python
---

想象一下我们平时看视频的体验：当摄像机跟随着主角的步伐，或是掠过一段壮丽的风景时，我们常常会被那种流畅的**移动镜头**所吸引。然而，受限于屏幕和镜头的物理画幅，我们的视线只能被禁锢在那个不断移动的矩形框内，始终无法同时将整个宏大的场景尽收眼底。

这就像是古人常说的**管中窥豹**——随着时间的推移，我们确实看到了猎豹身上的每一块斑纹，但由于视野受限，我们很难在脑海中瞬间拼凑出这只猎豹完整而震撼的全貌。

![通过镜头移动展示大型物体](/assets/images/panorama-in-video/moving-camera.gif)

那么，有没有一种技术，能够打破时空的限制，将这段视频里随时间流逝的移动画面，全部展开并压缩进同一个平面，变成一张能让人纵览全貌的全景图呢？

答案是肯定的，这项技术被称为**全景拼接**。它的核心在于：通过计算机视觉算法，将时间轴上流动的离散画面提取出来，寻找它们之间的空间关联，再经过精准的对齐与融合，最终生成一张静态全景大图。接下来博主将介绍自己用 OpenCV 库实现这项技术的具体流程和细节。

::: note
这一套流程稳定工作的前提是：
1. **镜头运动相对连贯平滑**，没有极其剧烈的突发抖动。
2. **主要拍摄对象大致处于同一平面上**（比如扫拍一排建筑、一整面涂鸦墙或远处的山脉）。如果画面里远近物体交错太深（视差太大），拼接时就很容易出现割裂和重影。
:::

## 生命周期总览
整个流程可以按生命周期拆成 4 个阶段：

1. **参数解析与时间精确化**：把输入的时间精准吸附到真实的视频帧上。
2. **抽帧与关键帧筛选**：剔除重复和模糊的废片，只留下最精华的关键帧。
3. **帧间配准**：通过特征匹配和单应性矩阵，让两张图找到彼此的位置。
4. **建画布与多帧融合**：建立全局大画布，把画面平滑地揉捏在一起，最后裁掉多余的黑边。

此外，代码还进一步做了**性能增强**：引入多线程和块处理，加快代码处理速度。

## 时间精确化
我们平时习惯用 `HH:MM:SS.xxx`（如 `00:47:24.216`）这样的连续时间来给视频定位，但视频的本质是离散的——它不过是一秒钟内闪过的几十张静态照片（帧）而已。

如果强行拿着带小数点的浮点时间去截取，而不把它“吸附”到最近的物理帧边界上，就会遇到一个极具迷惑性的 Bug：在不同的播放器里，明明输入的是同一个时间点，取出来的画面却总是差那么一两帧。

为了彻底消除这种偏差，我们的第一步必须严谨精确：先利用 ffprobe 强行嗅探出视频底层最真实的平均帧率（FPS），然后再把输入的秒数**换算成绝对的物理帧索引**。

```python
def probe_video_fps(video_path: str) -> float:
    cmd = [
        "ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=avg_frame_rate",
        "-of", "default=noprint_wrappers=1:nokey=1", video_path,
    ]
    out = subprocess.check_output(cmd, text=True).strip()
    if "/" in out:
        return float(Fraction(out))
    return float(out)

def snap_to_frame_time(time_sec: float, fps: float) -> tuple[int, float]:
    idx = int(round(time_sec * fps))
    return idx, idx / fps
```

## 抽帧与关键帧筛选
有人可能会想：既然要拼全景，干脆把每一帧都拿来拼不就好了？但是不然，直接用所有帧会带来两个问题：

1. 信息高度重复，计算量爆炸；
2. 模糊帧和低质量帧会污染配准与融合结果。

::: info
所谓*模糊帧*和*低质量帧*，通常是指摄像机在快速移动或手抖时产生的**运动拖影**，以及镜头未能及时跟上导致的**虚焦画面**。

这类画面缺乏锐利的边缘和纹理细节。如果强行参与计算，不仅会导致特征提取算法找不到足够的可靠特征点，进而引起两张图“对不齐”（配准误差）；在最终叠加混合时，还会像蒙上一层脏滤镜一样，将原本的模糊感和重影强加给最终的全景图，严重拉低整体画质。
:::

因此，我们需要在这一步做两层筛选：先按 `sample-fps` 做候选抽样，再按清晰度（Laplacian 方差）和运动量（phase correlation 位移）筛出关键帧，只留下**既清晰又带来了新视野**的画面。

```python
def blur_score(gray: np.ndarray) -> float:
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())

def estimate_motion(prev_gray: np.ndarray, curr_gray: np.ndarray) -> tuple[float, float]:
    shift, response = cv2.phaseCorrelate(prev_gray.astype(np.float32), curr_gray.astype(np.float32))
    dx, dy = shift
    return math.hypot(dx, dy), float(response)
```

```python
if blur_score(gray) < blur_thr:
    continue

motion_px, response = estimate_motion(last_kept_preview, gray)
elapsed = item.timestamp - last_kept_ts
if motion_px >= motion_thr or (elapsed >= keep_gap_sec and response < 0.20):
    kept.append(item)
```

对于那些本身就很短，或者镜头几乎没怎么动的片段，这套高标准可能会导致选不出关键帧。因此，我们加入了**动态兜底机制**：一旦发现剩余的帧数不够拼图了，程序会自动向下放宽清晰度和位移的阈值，避免有效关键帧不足而直接失败。

```python
if len(keyframes) < 2:
    keyframes = filter_candidates(...) # 调整参数以放宽阈值
if len(keyframes) < 2:
    keyframes = candidates # 直接使用抽样出的所有帧
```

## 帧间配准
拿到筛选好的关键帧后，接下来的核心任务是找到帧与帧之间的空间位置关系。具体来说，就是通过**特征匹配**找到两者的联系，并据此计算出决定它们位置关系的**单应性矩阵**。

::: info
*单应性矩阵*（Homography Matrix）本质上是一个 3×3 的**变形公式**。在二维平面上，它可以将一张图片完美地拉伸、倾斜、扭曲成另一张图片的视角。在全景拼接中，我们利用它来消除相机的移动和旋转带来的视角差异，把连续的视频帧“压平”并对齐到同一个大画布上。
:::

首先，我们利用 SIFT 或 ORB 算法提取出相邻图像各自的关键特征点；然后，通过比值测试剔除掉那些模棱两可的错误匹配；接着，将这些高质量的匹配点送入 `cv2.findHomography`，并结合 RANSAC 算法排除异常干扰，从而算出我们需要的变换矩阵 $H$。为了保证最终的拼接质量，如果算出的内点率太低，我们会果断舍弃这次匹配。

::: info
*比值测试*（Ratio Test）是一种专治算法“脸盲”的过滤机制。在匹配特征时，算法会为每个特征点寻找第一相似和第二相似的匹配点。只有当第一名的匹配度远远甩开第二名时（距离差距足够明显），才认为这是一个独一无二的有效匹配。这能完美过滤掉由于砖墙、波浪、树叶等大面积重复纹理带来的混淆错配。

*内点率*（Inlier Ratio）：RANSAC 算法在计算矩阵时，会将真正符合该矩阵变换规律的匹配点称为“内点”。内点占所有参与计算的匹配点的比例就是内点率。内点率越高，说明算出的变形公式越令人信服；如果太低（比如代码中低于 22%），说明匹配点里绝大多数都是瞎猜的噪点，算出的矩阵自然宁可不用。
:::

```python
src = np.float32([curr_pts[m.trainIdx] for m in good]).reshape(-1, 1, 2)
dst = np.float32([prev_pts[m.queryIdx] for m in good]).reshape(-1, 1, 2)
h, inliers = cv2.findHomography(src, dst, cv2.RANSAC, 3.0)
inlier_ratio = float(inliers.sum()) / max(1, len(inliers))
if inlier_ratio < 0.22:
    return None
```

算出了相邻两帧之间的变换矩阵后，为了把所有的图片都映射到同一块大画布上，我们需要通过矩阵的**链式相乘**，把它们串联推导到同一个坐标系下。

```python
h_curr_to_0 = chain[-1] @ h_curr_to_prev
chain.append(h_curr_to_0)
```

需要注意的是，如果单纯以第 0 帧作为全局的参考中心，随着矩阵越乘越多，微小的误差会像滚雪球一样累积，导致画面末尾出现非常夸张的拉伸变形。

为了避免这个问题，我们选取整个序列中**最中间的那一帧**作为真正的基准原点。通过计算它前方各帧的逆矩阵，将整条变换链重新映射过去。这样一来，长链条累积的畸变被均匀地向画面两端化解，整体比例会协调不少。

```python
ref_idx = len(accepted) // 2
ref_inv = np.linalg.inv(chain[ref_idx])
transforms = [ref_inv @ h for h in chain]
```

## 建画布与多帧融合
我们规划一张足够大的“无限画布”，随后将所有图片的四个角点，通过前面算好的变换矩阵投射到全局坐标系中，找出整个场景的极大和极小值，从而圈定全景图的绝对边界。

```python
corners_all.append(cv2.perspectiveTransform(corners, h))
all_pts = np.concatenate(corners_all, axis=0).reshape(-1, 2)
min_x, min_y = np.min(all_pts, axis=0)
max_x, max_y = np.max(all_pts, axis=0)
```

画布铺好了，最后一步就是把图片画上去。这里不能简单“贴图”，如果直接把新画面盖在旧画面上，天空和背景里会出现极其生硬的刀割般接缝；但如果无脑地将重叠区域的像素取平均值，画面又很容易糊成一团，产生强烈的雾化或重影。

为了在自然度和清晰度之间找到完美的平衡，我们在这里采用折中的办法：**加权平均 + 边缘羽化 + 重叠区色彩微调**。

实现边缘羽化的方法具体是：通过形态学的腐蚀操作和距离变换，为每一张图生成一个专属的“权重遮罩”。这个遮罩的中心区域是实心的（权重最高），越靠近边缘则越透明（权重递减）。有了它，图片边缘的像素就能以一种极其柔和的方式消散并融入底图中。

```python
def build_soft_weight(shape: tuple[int, int], feather_radius: int) -> np.ndarray:
    src_mask = np.full((h, w), 255, dtype=np.uint8)
    inner = cv2.erode(src_mask, kernel)
    dist = cv2.distanceTransform(inner, cv2.DIST_L2, 3)
    dist = dist / float(dist.max())
    return np.clip(dist, 0.05, 1.0).astype(np.float32)
```

接着是真正的像素叠加。利用 NumPy 的矩阵运算，把经过形变处理的像素块乘以刚刚生成的权重遮罩，一层层累积到主画布上。

```python
acc_roi += warped_roi * score_roi[:, :, None]
wsum_roi += score_roi
coverage_roi += valid_roi
```

在叠图的同时，还需要考虑图像的色彩均衡。由于视频每一帧的曝光可能存在微小差异，直接拼合很容易产生一块亮一块暗的“补丁感”。为此，我们瞬间提取出两张图的重叠区域，计算出底图和新图的亮度均值比，然后将这个增益系数乘到新图片上。这样一来，新加入的图像在色彩和曝光上就与之前的相同了。

```python
overlap = (wsum_roi > 1e-6) & (valid_roi > 0.5) & (score_roi > 1e-4)
if np.any(overlap):
    curr_overlap = acc_roi[overlap] / wsum_roi[overlap, None]
    ref_mean = curr_overlap.mean(axis=0)
    src_mean = warped_roi[overlap].mean(axis=0)
    gain = np.clip(ref_mean / np.maximum(src_mean, 1e-6), 0.88, 1.12)
    warped_roi *= gain[None, None, :]
```

所有的图层铺垫完毕后，我们用累加的像素值除以总权重，得出每一个像素最终的色彩。最后做有效区域裁边，去掉黑边，就得到了最后的成果全景图。

```python
pano = (acc / np.maximum(wsum[:, :, None], 1e-6)).clip(0, 255).astype(np.uint8)
pano = crop_valid_area(pano, coverage)
```

![拼接出的全景图像](/assets/images/panorama-in-video/panorama-image.png)

## 性能优化
在跑通了全景拼接的完整流程后，我们面临着一个非常现实的工程挑战：**慢**。高清视频的单应性矩阵计算和透视变换会耗费大量的时间，而接下来我们需要通过优化架构设计加快程序运行速度。

### 多线程并发
在整个流程中，最吃 CPU 算力的环节有两个：一个是计算每一张图片的 SIFT/ORB 特征，另一个是将图片投射到大画布上的 Warp 透视变形。

因此我们引入 Python 的 `ThreadPoolExecutor`，将每一帧的预处理任务打包丢进线程池，让多个线程同时工作。各个线程完成任务的时间有先有后，于是我们利用字典记录下任务对应的帧索引 `idx`，在 `as_completed` 获取到结果后，再填回对应位置。

```python
# 特征提取的并发
with ThreadPoolExecutor(max_workers=feat_workers) as executor:
    futures = {executor.submit(compute_feature_pack, img, use_sift): i for i, img in enumerate(images)}
    for future in as_completed(futures):
        idx = futures[future]
        features[idx] = future.result()
```

```python
# Warp 形变的并发
with ThreadPoolExecutor(max_workers=workers) as executor:
    futures = {executor.submit(prepare_warp_pack, idx): idx for idx in batch_indices}
    for future in as_completed(futures):
        idx, bbox, warped_roi, score_roi, valid_roi = future.result()
        batch_results[idx] = (bbox, warped_roi, score_roi, valid_roi)
```

### 向量化与 ROI 局部运算
在传统的融合实现中，很容易犯一个极其消耗资源的错误：每一次将新图片融入大画布时，都在整张巨大的全景画布上进行计算。想象一下，一张全景画布可能是 8000x4000 的超高分辨率，而我们当前要贴上去的这一帧其实只占了其中很小的一块。如果每次都遍历整张大画布去算增益、算累加，绝大多数的算力都浪费在了黑边上。

针对这个问题，我们选择进行**局部运算**，只在有效区域（ROI, Region of Interest）内动刀。

具体来说，我们先利用 `np.argwhere` 找出变形后图像中真正有像素的边界，将这个子块单独切片出来。

```python
# 锁定有效像素的边界
nz = np.argwhere(valid_mask > 0.5)
y0, x0 = np.min(nz, axis=0)
y1, x1 = np.max(nz, axis=0) + 1

# 仅切片提取有效区域 (ROI)
warped_roi = warped[y0:y1, x0:x1].astype(np.float32)
score_roi = score[y0:y1, x0:x1]
valid_roi = valid_mask[y0:y1, x0:x1]
```

拿到切片后，我们在融合阶段也同样只对总画布 `acc` 和总权重 `wsum` 的对应局部区域进行操作。运算时配合 NumPy 原生的矩阵乘法，避免任何低效的 Python `for` 循环。

```python
# 在大画布上切出对应的操作区
acc_roi = acc[y0:y1, x0:x1]
wsum_roi = wsum[y0:y1, x0:x1]
coverage_roi = coverage[y0:y1, x0:x1]

# 纯矩阵累加
acc_roi += warped_roi * score_roi[:, :, None]
```

::: note
在使用多线程加速时，有一个关键约束：**融合顺序必须严格保持不变**。我们在计算色彩增益和像素累加时，当前帧的结果依赖于前面已经画好的底图状态。如果这部分也做并发，会导致严重的*数据踩踏*——即多个线程同时试图修改主画布上同一个像素的数值，导致部分帧的画面被相互覆盖或丢失，最终拼出带有随机色块和撕裂的废图。

所以，我们将并行优化仅仅限制在特征提取和 Warp 变形这些相互独立、可交换顺序的预处理步骤上。而当程序真正执行到更新 `acc/wsum/coverage` 这些全局画布状态时，依然老老实实地按照视频帧的先后顺序串行执行。保证结果与原逻辑一致。
:::

::: normal-demo 完整 Python 代码
```python
# Made by Wanakachi
from __future__ import annotations

import argparse
import math
import os
import subprocess
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from fractions import Fraction
from pathlib import Path

import cv2
import numpy as np
from tqdm.auto import tqdm


@dataclass
class FrameItem:
    image: np.ndarray
    frame_index: int
    timestamp: float


def parse_time_to_seconds(text: str) -> float:
    text = text.strip()
    if ":" not in text:
        return float(text)
    hh, mm, ss = text.split(":")
    return int(hh) * 3600 + int(mm) * 60 + float(ss)


def seconds_to_hhmmss(seconds: float) -> str:
    hh = int(seconds // 3600)
    mm = int((seconds % 3600) // 60)
    ss = seconds - hh * 3600 - mm * 60
    return f"{hh:02d}:{mm:02d}:{ss:09.6f}"


def probe_video_fps(video_path: str) -> float:
    cmd = [
        "ffprobe",
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=avg_frame_rate",
        "-of",
        "default=noprint_wrappers=1:nokey=1",
        video_path,
    ]
    out = subprocess.check_output(cmd, text=True).strip()
    if "/" in out:
        return float(Fraction(out))
    return float(out)


def snap_to_frame_time(time_sec: float, fps: float) -> tuple[int, float]:
    idx = int(round(time_sec * fps))
    return idx, idx / fps


def resize_keep_ratio(image: np.ndarray, target_width: int) -> np.ndarray:
    if image.shape[1] <= target_width:
        return image
    scale = target_width / float(image.shape[1])
    target_height = max(1, int(round(image.shape[0] * scale)))
    return cv2.resize(image, (target_width, target_height), interpolation=cv2.INTER_AREA)


def blur_score(gray: np.ndarray) -> float:
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


def estimate_motion(prev_gray: np.ndarray, curr_gray: np.ndarray) -> tuple[float, float]:
    shift, response = cv2.phaseCorrelate(
        prev_gray.astype(np.float32), curr_gray.astype(np.float32)
    )
    dx, dy = shift
    return math.hypot(dx, dy), float(response)


def extract_keyframes(
    video_path: str,
    start_frame: int,
    end_frame: int,
    video_fps: float,
    sample_fps: float,
    min_blur: float,
    min_motion_px: float,
    force_keep_seconds: float,
    preview_width: int,
    max_keyframes: int,
) -> list[FrameItem]:
    total_decode_frames = max(1, end_frame - start_frame + 1)

    def sample_candidates(step: int) -> list[FrameItem]:
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise RuntimeError(f"Cannot open video: {video_path}")
        cap.set(cv2.CAP_PROP_POS_FRAMES, start_frame)
        pbar = tqdm(
            total=total_decode_frames,
            desc=f"decode(step={step})",
            unit="f",
            dynamic_ncols=True,
            leave=False,
        )

        sampled: list[FrameItem] = []
        frame_idx = start_frame
        next_pick = start_frame
        while frame_idx <= end_frame:
            ok, frame = cap.read()
            if not ok:
                break
            if frame_idx >= next_pick:
                sampled.append(
                    FrameItem(
                        image=frame.copy(),
                        frame_index=frame_idx,
                        timestamp=frame_idx / video_fps,
                    )
                )
                next_pick += step
            frame_idx += 1
            pbar.update(1)
        pbar.close()
        cap.release()
        return sampled

    def filter_candidates(
        candidates: list[FrameItem],
        blur_thr: float,
        motion_thr: float,
        keep_gap_sec: float,
    ) -> list[FrameItem]:
        if len(candidates) <= 2:
            return candidates

        pbar = tqdm(
            total=max(1, len(candidates) - 1),
            desc="keyframe-filter",
            unit="f",
            dynamic_ncols=True,
            leave=False,
        )
        kept: list[FrameItem] = [candidates[0]]
        last_kept_preview = cv2.cvtColor(
            resize_keep_ratio(candidates[0].image, preview_width), cv2.COLOR_BGR2GRAY
        )
        last_kept_ts = candidates[0].timestamp
        last_idx = len(candidates) - 1

        for i, item in enumerate(candidates[1:], start=1):
            preview = resize_keep_ratio(item.image, preview_width)
            gray = cv2.cvtColor(preview, cv2.COLOR_BGR2GRAY)

            # Always retain the final sampled frame if we still have too few keyframes.
            if i == last_idx and len(kept) < 2:
                kept.append(item)
                last_kept_preview = gray
                last_kept_ts = item.timestamp
                pbar.update(1)
                continue

            if blur_score(gray) < blur_thr:
                pbar.update(1)
                continue

            motion_px, response = estimate_motion(last_kept_preview, gray)
            elapsed = item.timestamp - last_kept_ts
            if motion_px >= motion_thr or (
                elapsed >= keep_gap_sec and response < 0.20
            ):
                kept.append(item)
                last_kept_preview = gray
                last_kept_ts = item.timestamp
            pbar.update(1)

        pbar.close()

        if len(kept) < 2 and len(candidates) >= 2:
            kept = [candidates[0], candidates[-1]]
        return kept

    def limit_keyframes(items: list[FrameItem], limit: int) -> list[FrameItem]:
        if len(items) <= limit:
            return items
        picks = np.linspace(0, len(items) - 1, limit).astype(int)
        return [items[i] for i in picks]

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise RuntimeError(f"Cannot open video: {video_path}")
    step = max(1, int(round(video_fps / sample_fps)))
    cap.release()
    candidates = sample_candidates(step=step)

    # Short clips or very low sample-fps may produce too few sampled frames.
    # Automatically fallback to frame-by-frame sampling before giving up.
    if len(candidates) < 2:
        candidates = sample_candidates(step=1)

    if len(candidates) < 2:
        raise RuntimeError("Not enough frames in selected segment after decoding.")

    keyframes = filter_candidates(
        candidates=candidates,
        blur_thr=min_blur,
        motion_thr=min_motion_px,
        keep_gap_sec=force_keep_seconds,
    )

    if len(keyframes) < 2:
        keyframes = filter_candidates(
            candidates=candidates,
            blur_thr=max(0.0, min_blur * 0.45),
            motion_thr=max(0.6, min_motion_px * 0.45),
            keep_gap_sec=max(0.15, force_keep_seconds * 0.5),
        )
        if len(keyframes) >= 2:
            print("[warn] Keyframe filter auto-relaxed for short/low-motion clip.")

    if len(keyframes) < 2:
        # Last fallback: keep all sampled frames to avoid false failure on short shots.
        keyframes = candidates
        print("[warn] Using all sampled frames because strict keyframe filtering was too aggressive.")

    keyframes = limit_keyframes(keyframes, max_keyframes)
    if len(keyframes) < 2:
        raise RuntimeError(
            "Not enough keyframes even after fallback. Try a slightly longer segment."
        )
    return keyframes


def feature_config() -> tuple[bool, int, float, int, int]:
    use_sift = hasattr(cv2, "SIFT_create")
    if use_sift:
        return True, cv2.NORM_L2, 0.72, 40, 30
    return False, cv2.NORM_HAMMING, 0.75, 30, 25


def compute_feature_pack(
    bgr: np.ndarray,
    use_sift: bool,
) -> tuple[np.ndarray, np.ndarray | None]:
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    if use_sift:
        detector = cv2.SIFT_create(nfeatures=4000)
    else:
        detector = cv2.ORB_create(nfeatures=5000)
    kp, des = detector.detectAndCompute(gray, None)
    if not kp:
        return np.empty((0, 2), dtype=np.float32), None
    pts = np.float32([k.pt for k in kp])
    return pts, des


def estimate_homography_from_packs(
    prev_pack: tuple[np.ndarray, np.ndarray | None],
    curr_pack: tuple[np.ndarray, np.ndarray | None],
    norm: int,
    ratio: float,
    min_kp: int,
    min_good: int,
) -> np.ndarray | None:
    prev_pts, des1 = prev_pack
    curr_pts, des2 = curr_pack
    if des1 is None or des2 is None or len(prev_pts) < min_kp or len(curr_pts) < min_kp:
        return None

    matcher = cv2.BFMatcher(norm)
    knn = matcher.knnMatch(des1, des2, k=2)
    good = []
    for pair in knn:
        if len(pair) < 2:
            continue
        m, n = pair
        if m.distance < ratio * n.distance:
            good.append(m)
    if len(good) < min_good:
        return None

    src = np.float32([curr_pts[m.trainIdx] for m in good]).reshape(-1, 1, 2)
    dst = np.float32([prev_pts[m.queryIdx] for m in good]).reshape(-1, 1, 2)
    h, inliers = cv2.findHomography(src, dst, cv2.RANSAC, 3.0)
    if h is None or inliers is None:
        return None
    inlier_ratio = float(inliers.sum()) / max(1, len(inliers))
    if inlier_ratio < 0.22:
        return None
    return h


def build_soft_weight(shape: tuple[int, int], feather_radius: int) -> np.ndarray:
    h, w = shape
    src_mask = np.full((h, w), 255, dtype=np.uint8)
    k = max(3, feather_radius)
    if k % 2 == 0:
        k += 1
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
    inner = cv2.erode(src_mask, kernel)
    dist = cv2.distanceTransform(inner, cv2.DIST_L2, 3)
    if float(dist.max()) <= 1e-6:
        return np.ones((h, w), dtype=np.float32)
    dist = dist / float(dist.max())
    return np.clip(dist, 0.05, 1.0).astype(np.float32)


def crop_valid_area(image: np.ndarray, weight: np.ndarray) -> np.ndarray:
    valid = (weight > 0.01).astype(np.uint8) * 255
    points = cv2.findNonZero(valid)
    if points is None:
        return image
    x, y, w, h = cv2.boundingRect(points)
    return image[y : y + h, x : x + w]


def stitch_panorama(
    keyframes: list[FrameItem],
    stitch_width: int,
    max_output_megapixels: float,
    feather_radius: int,
) -> tuple[np.ndarray, int]:
    stitch_start = time.perf_counter()
    images = [resize_keep_ratio(item.image, stitch_width) for item in keyframes]

    use_sift, norm, ratio, min_kp, min_good = feature_config()
    feat_start = time.perf_counter()
    features: list[tuple[np.ndarray, np.ndarray | None] | None] = [None] * len(images)
    feat_workers = min(max(1, os.cpu_count() or 1), len(images), 8)
    with tqdm(total=len(images), desc="feature-prep", unit="f", dynamic_ncols=True, leave=False) as feat_pbar:
        with ThreadPoolExecutor(max_workers=feat_workers) as executor:
            futures = {executor.submit(compute_feature_pack, img, use_sift): i for i, img in enumerate(images)}
            for future in as_completed(futures):
                idx = futures[future]
                features[idx] = future.result()
                feat_pbar.update(1)
    print(f"[time] feature precompute ({feat_workers} threads): {time.perf_counter() - feat_start:.2f}s")

    chain: list[np.ndarray] = [np.eye(3, dtype=np.float64)]  # i -> 0
    accepted = [images[0]]
    accepted_indices = [0]
    h_start = time.perf_counter()
    with tqdm(
        total=max(1, len(images) - 1),
        desc="homography",
        unit="f",
        dynamic_ncols=True,
        leave=False,
    ) as h_pbar:
        for i in range(1, len(images)):
            prev_idx = accepted_indices[-1]
            prev_pack = features[prev_idx]
            curr_pack = features[i]
            if prev_pack is None or curr_pack is None:
                h_pbar.update(1)
                continue
            h_curr_to_prev = estimate_homography_from_packs(
                prev_pack, curr_pack, norm, ratio, min_kp, min_good
            )
            if h_curr_to_prev is None:
                h_pbar.update(1)
                continue
            h_curr_to_0 = chain[-1] @ h_curr_to_prev
            chain.append(h_curr_to_0)
            accepted.append(images[i])
            accepted_indices.append(i)
            h_pbar.update(1)
    print(f"[time] homography chain: {time.perf_counter() - h_start:.2f}s")

    if len(accepted) < 2:
        raise RuntimeError("Cannot stitch: insufficient reliable frame matches.")

    # Use middle frame as reference to reduce long-chain distortion.
    ref_idx = len(accepted) // 2
    ref_inv = np.linalg.inv(chain[ref_idx])
    transforms = [ref_inv @ h for h in chain]  # i -> ref

    corners_all = []
    for img, h in zip(accepted, transforms):
        hh, ww = img.shape[:2]
        corners = np.array([[0, 0], [ww, 0], [ww, hh], [0, hh]], dtype=np.float32).reshape(
            -1, 1, 2
        )
        corners_all.append(cv2.perspectiveTransform(corners, h))
    all_pts = np.concatenate(corners_all, axis=0).reshape(-1, 2)

    min_x, min_y = np.min(all_pts, axis=0)
    max_x, max_y = np.max(all_pts, axis=0)
    out_w = max(1, int(math.ceil(float(max_x - min_x))))
    out_h = max(1, int(math.ceil(float(max_y - min_y))))

    max_pixels = max_output_megapixels * 1_000_000.0
    scale = 1.0
    if out_w * out_h > max_pixels:
        scale = math.sqrt(max_pixels / float(out_w * out_h))
        out_w = max(1, int(round(out_w * scale)))
        out_h = max(1, int(round(out_h * scale)))

    shift = np.array(
        [[1.0, 0.0, -float(min_x)], [0.0, 1.0, -float(min_y)], [0.0, 0.0, 1.0]],
        dtype=np.float64,
    )
    resize_h = np.array(
        [[scale, 0.0, 0.0], [0.0, scale, 0.0], [0.0, 0.0, 1.0]], dtype=np.float64
    )

    # First-version style blending: weighted averaging across frames.
    # Improve seam quality by stronger edge falloff + mild overlap color balancing.
    acc = np.zeros((out_h, out_w, 3), dtype=np.float32)
    wsum = np.zeros((out_h, out_w), dtype=np.float32)
    coverage = np.zeros((out_h, out_w), dtype=np.float32)

    sharpness_values = []
    for img in accepted:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        sharpness_values.append(blur_score(gray))
    sharpness_values = np.array(sharpness_values, dtype=np.float32)
    if float(sharpness_values.max()) > float(sharpness_values.min()):
        sharpness_norm = 0.85 + 0.30 * (
            (sharpness_values - sharpness_values.min())
            / (sharpness_values.max() - sharpness_values.min())
        )
    else:
        sharpness_norm = np.ones_like(sharpness_values, dtype=np.float32)

    weight_cache: dict[tuple[int, int], np.ndarray] = {}
    valid_cache: dict[tuple[int, int], np.ndarray] = {}
    for img in accepted:
        shape_key = (img.shape[0], img.shape[1])
        if shape_key not in weight_cache:
            weight_cache[shape_key] = build_soft_weight(shape_key, feather_radius)
            valid_cache[shape_key] = np.ones(shape_key, dtype=np.float32)

    def prepare_warp_pack(
        idx: int,
    ) -> tuple[int, tuple[int, int, int, int] | None, np.ndarray | None, np.ndarray | None, np.ndarray | None]:
        img = accepted[idx]
        h = transforms[idx]
        h_canvas = resize_h @ shift @ h
        warped = cv2.warpPerspective(
            img, h_canvas, (out_w, out_h), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT
        )

        shape_key = (img.shape[0], img.shape[1])
        src_weight = weight_cache[shape_key]
        src_valid = valid_cache[shape_key]

        w = cv2.warpPerspective(
            src_weight,
            h_canvas,
            (out_w, out_h),
            flags=cv2.INTER_LINEAR,
            borderMode=cv2.BORDER_CONSTANT,
        )
        valid_soft = cv2.warpPerspective(
            src_valid,
            h_canvas,
            (out_w, out_h),
            flags=cv2.INTER_LINEAR,
            borderMode=cv2.BORDER_CONSTANT,
        )
        valid_mask = (valid_soft > 0.6).astype(np.float32)
        valid_u8 = (valid_mask * 255).astype(np.uint8)
        valid_u8 = cv2.erode(valid_u8, np.ones((3, 3), np.uint8), iterations=1)
        valid_mask = (valid_u8 > 0).astype(np.float32)

        score = (w * valid_mask * sharpness_norm[idx]).astype(np.float32)
        nz = np.argwhere(valid_mask > 0.5)
        if nz.size == 0:
            return idx, None, None, None, None
        y0, x0 = np.min(nz, axis=0)
        y1, x1 = np.max(nz, axis=0) + 1

        warped_roi = warped[y0:y1, x0:x1].astype(np.float32)
        score_roi = score[y0:y1, x0:x1]
        valid_roi = valid_mask[y0:y1, x0:x1]
        return idx, (int(y0), int(y1), int(x0), int(x1)), warped_roi, score_roi, valid_roi

    prep_start = time.perf_counter()
    workers = min(max(1, os.cpu_count() or 1), len(accepted), 8)
    batch_size = max(8, workers * 2)

    blend_start = time.perf_counter()
    prep_elapsed = 0.0
    blend_elapsed = 0.0
    with tqdm(total=len(accepted), desc="warp-prep", unit="f", dynamic_ncols=True, leave=False) as prep_pbar:
        with tqdm(total=len(accepted), desc="blend", unit="f", dynamic_ncols=True, leave=False) as blend_pbar:
            with ThreadPoolExecutor(max_workers=workers) as executor:
                for batch_start in range(0, len(accepted), batch_size):
                    batch_indices = list(range(batch_start, min(batch_start + batch_size, len(accepted))))

                    t0 = time.perf_counter()
                    futures = {
                        executor.submit(prepare_warp_pack, idx): idx for idx in batch_indices
                    }
                    batch_results: dict[
                        int,
                        tuple[
                            tuple[int, int, int, int] | None,
                            np.ndarray | None,
                            np.ndarray | None,
                            np.ndarray | None,
                        ],
                    ] = {}
                    for future in as_completed(futures):
                        idx, bbox, warped_roi, score_roi, valid_roi = future.result()
                        batch_results[idx] = (bbox, warped_roi, score_roi, valid_roi)
                        prep_pbar.update(1)
                    prep_elapsed += time.perf_counter() - t0

                    t1 = time.perf_counter()
                    for idx in batch_indices:
                        packed = batch_results.get(idx)
                        if packed is None:
                            blend_pbar.update(1)
                            continue
                        bbox, warped_roi, score_roi, valid_roi = packed
                        if (
                            bbox is None
                            or warped_roi is None
                            or score_roi is None
                            or valid_roi is None
                        ):
                            blend_pbar.update(1)
                            continue

                        y0, y1, x0, x1 = bbox
                        acc_roi = acc[y0:y1, x0:x1]
                        wsum_roi = wsum[y0:y1, x0:x1]
                        coverage_roi = coverage[y0:y1, x0:x1]

                        # Mild per-frame color gain alignment in overlap to reduce "block" perception.
                        overlap = (wsum_roi > 1e-6) & (valid_roi > 0.5) & (score_roi > 1e-4)
                        if np.any(overlap):
                            curr_overlap = acc_roi[overlap] / wsum_roi[overlap, None]
                            ref_mean = curr_overlap.mean(axis=0)
                            src_mean = warped_roi[overlap].mean(axis=0)
                            gain = ref_mean / np.maximum(src_mean, 1e-6)
                            gain = np.clip(gain, 0.88, 1.12)
                            warped_roi *= gain[None, None, :]
                            np.clip(warped_roi, 0.0, 255.0, out=warped_roi)

                        acc_roi += warped_roi * score_roi[:, :, None]
                        wsum_roi += score_roi
                        coverage_roi += valid_roi
                        blend_pbar.update(1)
                    blend_elapsed += time.perf_counter() - t1

    print(f"[time] warp precompute ({workers} threads): {prep_elapsed:.2f}s")
    print(f"[time] blend accumulate: {blend_elapsed:.2f}s")

    pano = (acc / np.maximum(wsum[:, :, None], 1e-6)).clip(0, 255).astype(np.uint8)

    pano = crop_valid_area(pano, coverage)
    print(f"[time] stitch total: {time.perf_counter() - stitch_start:.2f}s")
    return pano, len(accepted)


def main() -> None:
    total_start = time.perf_counter()
    parser = argparse.ArgumentParser(
        description="Extract keyframes from a video segment and stitch a large object panorama."
    )
    parser.add_argument("input_video", help="Input video path.")
    parser.add_argument("output_image", help="Output panorama image path.")
    parser.add_argument("--start", required=True, help="Start time, e.g. 00:47:24.216")
    parser.add_argument("--end", required=True, help="End time, e.g. 00:47:34.310")
    parser.add_argument("--sample-fps", type=float, default=12.0, help="Sampling fps. Default: 12")
    args = parser.parse_args()

    # Quality-oriented defaults (keep these fixed unless you have a special scene):
    # - PREVIEW_WIDTH/STITCH_WIDTH: full-HD level feature matching and output sharpness.
    # - MIN_BLUR/MIN_MOTION_PX: avoid blurry/duplicate frames while keeping camera motion continuity.
    # - FORCE_KEEP_SECONDS: force sparse keep in low-texture regions to avoid missing areas.
    # - FEATHER_RADIUS: larger value softens seams and reduces block-like stitching artifacts.
    # - MAX_OUTPUT_MP: keep high-resolution panorama, but prevent uncontrolled memory growth.
    PREVIEW_WIDTH = 1920
    STITCH_WIDTH = 1920
    MIN_BLUR = 18.0
    MIN_MOTION_PX = 4.0
    FORCE_KEEP_SECONDS = 0.5
    MAX_KEYFRAMES = 260
    FEATHER_RADIUS = 71
    MAX_OUTPUT_MP = 120.0

    if not os.path.isfile(args.input_video):
        raise FileNotFoundError(f"Input video does not exist: {args.input_video}")
    if args.sample_fps <= 0:
        raise ValueError("--sample-fps must be > 0")

    fps = probe_video_fps(args.input_video)
    start_raw = parse_time_to_seconds(args.start)
    end_raw = parse_time_to_seconds(args.end)
    if end_raw <= start_raw:
        raise ValueError("--end must be later than --start")

    start_idx, start_precise = snap_to_frame_time(start_raw, fps)
    end_idx, end_precise = snap_to_frame_time(end_raw, fps)
    if end_idx <= start_idx:
        end_idx = start_idx + 1
        end_precise = end_idx / fps

    print(f"[info] fps={fps:.6f}")
    print(
        f"[info] precise segment: {seconds_to_hhmmss(start_precise)} -> "
        f"{seconds_to_hhmmss(end_precise)} (frame {start_idx} -> {end_idx})"
    )

    extract_start = time.perf_counter()
    keyframes = extract_keyframes(
        video_path=args.input_video,
        start_frame=start_idx,
        end_frame=end_idx,
        video_fps=fps,
        sample_fps=args.sample_fps,
        min_blur=MIN_BLUR,
        min_motion_px=MIN_MOTION_PX,
        force_keep_seconds=FORCE_KEEP_SECONDS,
        preview_width=PREVIEW_WIDTH,
        max_keyframes=MAX_KEYFRAMES,
    )
    print(f"[time] keyframe extraction: {time.perf_counter() - extract_start:.2f}s")
    print(f"[1/2] keyframes selected: {len(keyframes)}")

    stitch_start = time.perf_counter()
    pano, used = stitch_panorama(
        keyframes=keyframes,
        stitch_width=STITCH_WIDTH,
        max_output_megapixels=MAX_OUTPUT_MP,
        feather_radius=FEATHER_RADIUS,
    )
    print(f"[time] stitch pipeline: {time.perf_counter() - stitch_start:.2f}s")
    print(f"[2/2] stitched frames: {used}/{len(keyframes)}")

    write_start = time.perf_counter()
    out_path = Path(args.output_image).resolve()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    if not cv2.imwrite(str(out_path), pano):
        raise RuntimeError(f"Failed to write output image: {out_path}")
    print(f"[time] write image: {time.perf_counter() - write_start:.2f}s")
    print(f"[time] total runtime: {time.perf_counter() - total_start:.2f}s")
    print(f"[done] panorama saved: {out_path}")


if __name__ == "__main__":
    main()
```
:::