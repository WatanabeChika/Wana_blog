---
title: 给歌曲加点特效
excerpt: 频域分析、节奏划分——用Python进行音频处理
date: 2025-03-07
isOriginal: true
category: 
    - Technology
tag: 
    - Python
    - Fourier
    - BPM
---

在音频处理的领域中，Python凭借其功能强大的库和简洁直观的语法，成为众多开发者进行音频处理工作的得力工具。!!并不，你见过哪个搞音乐的用Python？然而我是程序员，我用!! 

本篇博客将简要介绍如何借助Python处理音频文件，以及记录几个比较实用的音频处理函数 ~~（加特效函数）~~。

我们主要利用Python中的`numpy`、`librosa`、`soundfile`和`pydub`库来辅助处理音频文件。

::: tip
如果你没有安装这四个库，请先运行库安装命令：
::: tabs#python_install
@tab pip
```powershell
pip install numpy librosa soundfile pydub
```
@tab conda
```powershell
conda install numpy librosa soundfile pydub
```
:::

## MP3 vs. WAV
在进行音频处理是，通常都需要将待处理的音频文件格式转为WAV格式，这是为什么呢？WAV格式和平时最常见的音频格式MP3有什么区别呢？

**MP3**，全称 MPEG-1 Audio Layer 3，是一种**有损**压缩格式，它通过剔除人耳难以察觉的音频信息，以此来大幅减小文件体积。这种特性使得MP3在存储空间和网络传输方面展现出显著优势，因此在音乐播放、在线音频等诸多场景中得到了极为广泛的应用。不过，这种压缩方式不可避免地会造成一定程度的音频质量损耗。

**WAV** —— Waveform Audio File Format ——格式则属于**无损**音频格式，它能够完整保留原始音频的全部信息，确保音频质量达到极高水准。在音频处理过程中，我们常常需要对音频进行精准操作，诸如调整频率、添加特效等。这就要求音频文件能够提供完整且精确的音频数据。WAV格式由于具备无损的特性，恰好能够充分满足这一严苛需求。所以，在音频处理时，我们通常会优先选用WAV格式文件。

::: info
除了上文提到的音频格式，还有几种在音频领域占据重要地位的常见格式。

- **Flac**，即 Free Lossless Audio Codec，属于无损音频格式，它能够在不损失任何音频数据的前提下压缩音频文件，确保还原出与原始音频一模一样的音质，常被音乐发烧友用于高品质音乐收藏。

- **Ogg**，确切说是 Ogg Vorbis，是一种开源的有损音频格式，其压缩算法在中低码率下能展现出优秀的音质表现，在网络音频流传输，如在线音乐播放、网络电台广播等场景中应用广泛。

- **Avc**，准确来讲是 Advanced Video Coding，它主要用于视频中的音频编码，常与视频轨道一同封装在视频文件中，是有损编码，在兼顾视频画面质量的同时，对音频进行高效压缩，适配多种视频播放平台与设备。

- **Mka**，即 Matroska Audio，是 Matroska 多媒体容器格式的音频部分，它可以容纳多种音频编码，无损、有损皆可，在多媒体编辑、高清音频存储等方面有独特优势，比如能灵活处理多声道音频。
:::

## 频域分析
这一部分的音频处理函数基于音频的频域信号，因此需要简要介绍时域、频域的概念，以及傅里叶变换。

时域描述的是信号随时间变化的情况，我们日常听到的声音，直观感受就是其在时域上的表现，比如声音的强弱随时间起伏。而频域则是从频率的角度来分析信号，它展示了不同频率成分在信号中的占比情况。​

傅里叶变换就像是一座桥梁，能够将时域信号转换为频域信号，反之，逆傅里叶变换可以把频域信号还原为时域信号。通过傅里叶变换，我们能把复杂的时域音频信号分解成不同频率的正弦和余弦波的组合，这对于音频处理非常关键，因为许多音频特效和滤波操作都是基于对频域信号的调整来实现的。

![傅里叶变换（Fourier transform）](/assets/images/audio-effect/Fourier.gif =500x)

### 模拟电话音效
模拟电话音效的实现，主要基于对音频频域的精确操作。

电话音效的特点是频率范围相对较窄，通常集中在 300Hz - 3000Hz 之间。通过傅里叶变换将音频信号转换到频域后，我们创建掩码来**筛选特定频段**（带通滤波）。保留 300Hz - 3000Hz 这个频段的信号，同时将低于 300Hz 和高于 3000Hz 的频段信号设为 0，这样就去除了电话音效范围外的频率成分。并且，还可以通过增强因子对保留的频段进行适当增强，从而模拟出更具特色的电话音效。

主要实现思路为：

1. 运用`librosa.load`函数加载音频文件，获取音频数据`y`以及采样率`sr`。
2. 对音频数据执行傅里叶变换（FFT），将时域信号转换为频域信号`Y`，与此同时获取对应的频率数组`freq`。
3. 创建频段掩码`band_mask`，以此筛选出需要去除的频率范围（即低于`low_freq`和高于`high_freq`的部分），并将这些频段的频域数据设置为0。
4. 创建中间频段掩码`mid_band_mask`，筛选出需要保留并增强的频段（也就是`low_freq`到`high_freq`之间的部分），然后将该频段的频域数据乘以`enhancement_factor`。
5. 对处理完毕的频域数据进行逆傅里叶变换（IFFT），将其转换回时域信号`y_new`，并取实部。
6. 利用`soundfile.write`函数将处理后的音频数据写入输出文件。

用Python写出来就是：

```python
def apply_phone_filter(input_file, output_file, 
                       low_freq=300, high_freq=3000, enhancement_factor=1.0):
    """
    模拟电话音效：仅保留特定频段并可增强该频段。
    :param input_file: 输入音频文件路径
    :param output_file: 处理后音频文件路径
    :param low_freq: 低频截止
    :param high_freq: 高频截止
    :param enhancement_factor: 增强中间频段的倍数
    """
    y, sr = librosa.load(input_file, sr=48000)
    Y = np.fft.fft(y)
    freq = np.fft.fftfreq(len(y), d=1/sr)
    
    band_mask = (np.abs(freq) < low_freq) | (np.abs(freq) > high_freq)
    Y[band_mask] = 0
    
    mid_band_mask = (np.abs(freq) >= low_freq) & (np.abs(freq) <= high_freq)
    Y[mid_band_mask] *= enhancement_factor
    
    y_new = np.fft.ifft(Y)
    y_new = np.real(y_new)
    sf.write(output_file, y_new, sr)
```

### 回声（眩晕）效果

回声效果的实现基于频域中的信号延迟和衰减原理。

在频域中，通过对原始音频信号进行一定时间的**延迟**（由delay_seconds决定延迟时间），并乘以衰减系数decay_factor来模拟回声随着距离和时间**逐渐减弱**的特性。将延迟衰减后的回声频域信号与原始频域信号相加，再通过逆傅里叶变换转换回时域，就得到了带有回声效果的音频信号。

主要实现思路为：

1. 同样使用`librosa.load`函数加载音频文件，获取音频数据`y`和采样率`sr`。
2. 进行傅里叶变换，得到频域信号`Y`和频率数组`freq`。
3. 根据设定的延迟时间`delay_seconds`，计算出延迟的采样点数`delay_samples`。
4. 对频域信号进行延迟操作（借助`np.roll`函数），并乘以衰减系数`decay_factor`，从而得到回声的频域信号`Y_echo`。
5. 将回声的频域信号与原始频域信号相加，得到处理后的频域信号`Y`。
6. 进行逆傅里叶变换并取实部，得到处理后的时域信号`y_new`。
7. 最后使用`soundfile.write`函数将处理后的音频写入输出文件。

用Python写出来就是：

```python
def apply_dizzy_effect(input_file, output_file, delay_seconds=0.01, decay_factor=0.6):
    """
    添加回声（眩晕）效果。
    :param input_file: 输入音频文件路径
    :param output_file: 处理后音频文件路径
    :param delay_seconds: 回声延迟时间（秒）
    :param decay_factor: 回声衰减系数
    """
    y, sr = librosa.load(input_file, sr=48000)
    Y = np.fft.fft(y)
    freq = np.fft.fftfreq(len(y), d=1/sr)
    
    delay_samples = int(delay_seconds * sr)
    Y_echo = np.roll(Y, delay_samples) * decay_factor
    Y += Y_echo
    
    y_new = np.fft.ifft(Y)
    y_new = np.real(y_new)
    sf.write(output_file, y_new, sr)
```

::: note
博主为什么要在这里加一个 *眩晕* 呢？因为博主实际听完发现，施加该效果后，

- 如果延迟时间较小（如0.01），歌曲振幅会周期性地忽大忽小；
- 如果延迟时间较大（如0.1），歌曲会有“断断续续”的感觉；
- 如果延迟时间中等（如0.05），则会有明显的抖动感（就像边捶胸口边发出声音）。

所以与其叫回声效果，还不如叫眩晕效果，这更能描述实际听感。!!回声效果还不如下面的带状滤波做得好!!

:::

### 移除特定频率
移除特定频率的操作是通过对频域信号的逐个检查来实现的。

根据设定的cut_freq，我们可以将频域中的频率看作是一系列以cut_freq为间隔的区间。对于每个频率点，计算其与cut_freq的余数remainder。如果余数在half_width范围内，或者大于(cut_freq - half_width)，则认为该频率点属于需要移除的频率范围——与cut_freq足够接近，将其对应的频域信号设为 0，以此达到**移除特定频率**的目的（带状滤波）。

主要实现思路为：

1. 加载音频文件，获取音频数据`y`和采样率`sr`，并进行傅里叶变换，得到频域信号`Y`和频率数组`freq`。
2. 遍历频域信号的每个元素，计算其对应的频率`f`。
3. 计算频率`f`与`cut_freq`的余数`remainder`。
4. 如果余数`remainder`在`half_width`范围内，或者大于`(cut_freq - half_width)`，则将该频域元素设置为0。
5. 进行逆傅里叶变换并取实部，得到处理后的时域信号`y_new`。
6. 写入输出文件。

用Python写出来就是：

```python
def apply_cut_frequencies(input_file, output_file, cut_freq=10, half_width=3.0):
    """
    移除特定倍数的频率（带状滤波）。
    :param input_file: 输入音频文件路径
    :param output_file: 处理后音频文件路径
    :param cut_freq: 需要移除的频率间隔
    :param half_width: 允许保留的频率范围
    """
    y, sr = librosa.load(input_file, sr=48000)
    Y = np.fft.fft(y)
    freq = np.fft.fftfreq(len(y), d=1/sr)
    
    for i in range(len(Y)):
        f = abs(freq[i])
        remainder = f % cut_freq
        if remainder < half_width or remainder > (cut_freq - half_width):
            Y[i] = 0
    
    y_new = np.fft.ifft(Y)
    y_new = np.real(y_new)
    sf.write(output_file, y_new, sr)
```

## 节奏划分
什么是节奏？

节奏，作为音乐的核心要素之一，是指音乐中音符有规律的长短组合与强弱交替。这种规律性的变化构成了音乐的基本韵律，如同心跳般赋予音乐生命力。

节奏的划分极为关键，不同的划分方式会产生不同的节拍。例如，当我们把音乐的时间流按照特定的模式分割时，就形成了诸如 2/4 拍、3/4 拍、4/4 拍等不同的节拍类型。

发挥想象力，如果交换一首歌的第二拍和第四拍，那么是不是会带来一种非常后现代的错乱风格呢？**交换节拍**这一想法看似简单，实际上实现起来有诸多需要考虑的地方：

1. 利用`AudioSegment.from_file`函数加载音频文件，获取音频片段`audio_segment`，并获取其位深度`bit_depth`。
2. 借助`tempfile.NamedTemporaryFile`创建一个临时的WAV文件，将音频片段以WAV格式导出到该临时文件中。之所以这样做，是因为后续的一些音频处理操作在WAV格式下更为便捷。
3. 使用`soundfile.read`函数读取临时WAV文件的音频数据`audio`和采样率`sr`，并将音频数据转换为二维数组并转置。
4. 运用`librosa.to_mono`函数将音频数据转换为单声道（前提是音频原本为立体声），然后使用`librosa.beat.beat_track`函数获取音频的节奏信息，包括节拍速度`tempo`和节拍帧`beat_frames`。
5. 初始化一些变量，比如交叉渐变时间`crossfade_duration`和总采样点数`total_samples`。
6. 遍历节拍帧，将音频分割成一个个片段`segment`，每个片段包含一个节拍及其前后的交叉渐变部分。在分割过程中，对每个片段的开头和前一个片段的结尾进行交叉渐变处理，目的是**避免音频拼接时出现明显的跳跃**。交叉渐变通过在一定时间范围内（`crossfade_duration`）线性改变音频的增益来达成。
7. 将分割好的片段存储在`segments`列表中。
8. 对`segments`列表中的片段进行分组，每4个片段为一组。在每组中，交换第2和第4个片段的位置，然后将处理后的组重新合并到`new_segments`列表中。
9. 将`new_segments`列表中的所有片段沿时间轴拼接起来，得到处理后的音频数据`processed_audio`。
10. 根据输出文件的格式（`.wav`或`.mp3`），采用相应的方法将处理后的音频数据写入输出文件。如果是`.wav`格式，直接使用`soundfile.write`函数；如果是`.mp3`格式，先将处理后的音频数据写入一个临时WAV文件，然后使用`AudioSegment.from_wav`将临时WAV文件转换为MP3格式并导出，最后删除临时WAV文件。如果输出文件格式不被支持，则抛出`ValueError`异常。

用Python写出来就是：

```python
def swap_beats(input_file, output_file):
    """
    交换每组的第2和第4拍，以产生新的节奏感。
    :param input_file: 输入音频文件路径
    :param output_file: 处理后音频文件路径
    """
    audio_segment = AudioSegment.from_file(input_file)
    bit_depth = audio_segment.sample_width * 8
    
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        wav_path = tmp.name
        audio_segment.export(wav_path, format="wav", parameters=["-acodec", "pcm_s{}le".format(bit_depth)])
    
    audio, sr = sf.read(wav_path, always_2d=True, dtype='float32')
    audio = audio.T
    os.remove(wav_path)
    
    y_mono = librosa.to_mono(audio) if audio.shape[0] == 2 else audio[0]
    tempo, beat_frames = librosa.beat.beat_track(y=y_mono, sr=sr, units="samples")
    
    segments = []
    crossfade_duration = 512  # 交叉渐变时间
    total_samples = audio.shape[1]
    
    for i in range(len(beat_frames)):
        start = max(0, beat_frames[i] - crossfade_duration//2)
        end = beat_frames[i+1] + crossfade_duration//2 if i < len(beat_frames)-1 else total_samples
        segment = audio[:, start:end]
        
        if i > 0:
            fade_in = np.linspace(0, 1, crossfade_duration)
            segment[:, :crossfade_duration] *= fade_in
            prev_segment[:, -crossfade_duration:] *= (1 - fade_in)
            segments[-1] = prev_segment
        
        segments.append(segment)
        prev_segment = segment.copy()
    
    new_segments = []
    for i in range(0, len(segments), 4):
        group = segments[i:i+4]
        if len(group) >= 4:
            group[1], group[3] = group[3].copy(), group[1].copy()
        new_segments.extend(group)
    
    processed_audio = np.concatenate(new_segments, axis=1)
    
    if output_file.lower().endswith('.wav'):
        sf.write(output_file, processed_audio.T, sr, subtype=f'PCM_{bit_depth}')
    elif output_file.lower().endswith('.mp3'):
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
            tmp_wav = tmp.name
            sf.write(tmp_wav, processed_audio.T, sr, subtype=f'PCM_{bit_depth}')
        AudioSegment.from_wav(tmp_wav).export(output_file, format='mp3', bitrate='320k', parameters=["-ar", str(sr), "-q:a", "0"])
        os.remove(tmp_wav)
    else:
        raise ValueError("Unsupported format")
```
