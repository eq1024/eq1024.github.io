---
title: HLS 和 DASH 的区别，不在 .m3u8 和 .mpd
date: 2024-10-29
description: 从编码、封装、清单、分片、DRM 和延迟几个维度比较 HLS 与 DASH，而不是只列常见组合。
tags:
  - 网络协议
  - 音视频
outline: true
---

很多人第一次接触 HLS 和 DASH，会记住两个文件后缀：

- HLS：`.m3u8`
- DASH：`.mpd`

但这两个后缀只是清单文件。真正的区别在于它们如何描述媒体、如何分片、如何做自适应码率，以及浏览器和设备怎么播放。

## 编码、封装、协议是三件事

这三层经常被混在一起：

- **编码**：H.264、H.265、VP9、AV1、AAC、Opus。
- **封装**：MPEG-TS、fMP4、WebM。
- **流媒体协议**：HLS、DASH。

一个 HLS 流可以是 H.264 + AAC + MPEG-TS，也可以是 HEVC + fMP4。DASH 也可以用同样的编码，只是清单和分片组织方式不同。

所以“HLS 使用 H.264”不是协议规定，而是常见组合。

## HLS

HLS 使用 `.m3u8` 清单描述媒体播放列表。主清单列出不同码率的子清单，播放器根据网络和设备选择合适的一路。

传统 HLS 使用 MPEG-TS 分片，后来也支持 fMP4。它的优势是设备支持广，尤其是 Apple 生态；Safari 和 iOS 原生支持 HLS。

在 Chrome、Firefox 等浏览器里，通常需要 `hls.js` 这类基于 MSE 的播放器。

HLS 的延迟通常比 DASH 高，因为分片和清单更新有额外等待。LL-HLS 通过部分分片和阻塞式清单请求降低延迟，但需要播放器、CDN 和源站一起支持。

## DASH

DASH 使用 `.mpd` 清单，通常配合 fMP4 分片。它的规范更灵活，可以描述多种编码、字幕、音轨和 DRM。

浏览器端通常通过 MSE + `dash.js`、Shaka Player 等库播放。Safari 对 DASH 的支持不如 HLS 原生，所以实际项目经常按设备做分流。

DASH 的灵活性也意味着工程复杂度更高：清单结构、分片模板、时间轴、码率切换和 DRM 都需要正确配置。

## CMAF 让两者靠得更近

CMAF 定义了通用的 fMP4 分片格式。使用 CMAF 后，HLS 和 DASH 可以共享同一套媒体分片，只在清单层做不同描述。

这也是很多现代流媒体架构的做法：一次转码，产出 CMAF 分片，再生成 HLS 和 DASH 两套清单。

它减少存储和打包成本，也让低延迟方案更容易复用。

## DRM 不是 HLS 或 DASH 自带的

DRM 通常通过 EME（Encrypted Media Extensions）接入：

- FairPlay：Apple 生态，常见于 HLS。
- Widevine：Chrome、Android 等。
- PlayReady：Microsoft 生态。

HLS 和 DASH 都可以承载加密内容，但具体用哪个 DRM，取决于设备和内容保护要求。

## 怎么选

如果你的主要目标是 Apple 设备和广泛兼容，HLS 通常是默认选择。

如果你的播放器、CDN 和 DRM 体系更偏向多编码、多音轨和灵活清单，DASH 更合适。

但现实里经常不是二选一：

- 同一套内容同时产出 HLS 和 DASH。
- Safari 走 HLS，其他浏览器走 DASH。
- 低延迟场景评估 LL-HLS 或 LL-DASH。
- 有 DRM 需求时，先确认设备支持，再谈协议。

## 最后

HLS 和 DASH 不是视频编码，也不是封装格式，而是两套基于 HTTP 的自适应流媒体组织方式。

先把编码、封装、协议和 DRM 分开，再看延迟、设备和播放器支持，选择会清楚很多。
