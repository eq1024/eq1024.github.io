---
title: "HLS 和 DASH 编码与封装格式比较"
date: 2024-10-29
description: "HLS 和 DASH 编码与封装格式比较 HLS（HTTP Live Streaming） 1. 视频编码格式 H.264/AVC (Advanced Video Coding)：最广泛使用的编码格式，兼容性好，几乎所有支持 HLS 的设备都能解码。 H.265/HEVC (Hi"
tags:
  - 网络协议
---

# HLS 和 DASH 编码与封装格式比较

## HLS（HTTP Live Streaming）

### 1. 视频编码格式
- **H.264/AVC (Advanced Video Coding)**：最广泛使用的编码格式，兼容性好，几乎所有支持 HLS 的设备都能解码。
- **H.265/HEVC (High Efficiency Video Coding)**：用于高分辨率（如 4K 和 HDR）视频流，支持在 iOS 11 及以上版本的设备。
- **AV1**：HLS 支持 AV1，但在实际应用中尚不普及。

### 2. 音频编码格式
- **AAC (Advanced Audio Coding)**：HLS 中最常见的音频编码格式，兼容性好。
- **ALAC (Apple Lossless Audio Codec)**：Apple 的无损音频编码格式，适用于高音质场景。
- **MP3**：用于向更旧设备提供支持。
- **Dolby AC-3 和 Dolby E-AC-3**：提供环绕声支持的音频编码格式。

### 3. 封装格式
- **MPEG-2 TS (Transport Stream)**：HLS 最早期和最普遍使用的封装格式，兼容性极好。
- **fMP4 (Fragmented MP4)**：支持低延迟流媒体传输，节省带宽和存储空间。

### 4. 文件结构与分段
HLS 使用 `.m3u8` 清单文件描述分段、时长和 URL。分段文件通常为 `.ts` 或 `.m4s` 格式，播放器根据网络状况和设备能力动态选择不同分辨率的分段文件，实现自适应码率。

---

## DASH（Dynamic Adaptive Streaming over HTTP）

### 1. 视频编码格式
- **H.264/AVC (Advanced Video Coding)**：兼容性好，几乎所有设备和浏览器都能解码。
- **H.265/HEVC (High Efficiency Video Coding)**：适用于 4K 和 HDR 视频，压缩效率高。
- **VP9**：Google 的开源编码格式，主要在 Chrome 和 Android 设备上有支持。
- **AV1**：最新的视频编码格式，具有高压缩效率。

### 2. 音频编码格式
- **AAC (Advanced Audio Coding)**：最常见的音频编码格式，广泛兼容。
- **Opus**：适合高音质和低延迟场景的音频编码格式。
- **MP3**：用于支持旧设备的音频编码格式。

### 3. 封装格式
- **ISO Base Media File Format (MP4)**：DASH 中常见的封装格式，支持多种编码格式。
- **WebM**：与 VP9 或 AV1 编码一起使用的开放封装格式。

### 4. 文件结构与分段
DASH 将媒体流分割成多个小文件或“分段”，提供一个 `.mpd`（Media Presentation Description）清单文件，描述这些分段的顺序、时长和 URL。客户端根据网络和设备条件动态加载不同的分段文件，实现自适应播放。

---

## 总结

### HLS 的常见组合
- **H.264 + MPEG-2 TS**：传统且广泛支持的组合。
- **H.264 + fMP4**：在 iOS 10+ 设备上支持，适合节省带宽。
- **H.265 + fMP4**：适合高分辨率视频流。
- **AAC + MPEG-2 TS 或 fMP4**：音频流的主流选择。

### DASH 的常见组合
- **H.264 + MP4**：广泛兼容的组合。
- **H.265 + MP4**：适用于高分辨率流。
- **VP9 + WebM**：高效的 Web 流媒体播放。
- **AV1 + MP4/WebM**：下一代高效组合，适合带宽要求高的场景。

选择 HLS 还是 DASH 取决于你的特定需求、目标受众和播放设备。