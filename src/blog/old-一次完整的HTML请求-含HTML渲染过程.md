---
title: 从地址栏到首屏，浏览器做了什么
date: 2022-03-01
description: 不只背“DNS、TCP、HTTP”，而是把请求、解析、渲染和阻塞关系串成一条能解释性能问题的链路。
tags:
  - 浏览器
  - 网络协议
outline: true
---

“输入 URL 到页面展示”是前端面试里非常经典的题。

但很多答案只停在一条流水线：

```text
DNS -> TCP -> HTTP -> HTML -> DOM -> 渲染
```

这条线没有错，但它解释不了真实页面为什么慢：为什么 CSS 会阻塞渲染？为什么脚本会卡住 DOM 解析？`DOMContentLoaded` 和 `load` 到底差在哪？

## 请求之前

浏览器先解析 URL，判断协议、主机、路径和查询参数。然后处理缓存：

- 强缓存命中，直接使用本地资源。
- 协商缓存命中，可能只返回 `304`。
- Service Worker 可能拦截请求并返回缓存或自定义响应。

没有命中缓存时，才进入网络请求。

## 建立连接

现代 Web 不一定还是“三次握手 + 一个 HTTP/1.1 请求”：

- HTTP/1.1 可能复用 TCP 连接，但队头阻塞仍然存在。
- HTTP/2 在一个连接上多路复用多个流。
- HTTP/3 使用 QUIC，基于 UDP，减少握手和队头阻塞。

HTTPS 还会在 TCP/QUIC 之上进行 TLS 握手，验证证书并协商会话密钥。

## HTML 到达后开始解析

浏览器边接收 HTML 边构建 DOM，不必等整个文档下载完。

解析过程中会遇到：

- CSS：构建 CSSOM。
- 图片：通常不会阻塞 DOM 解析。
- 同步脚本：暂停 HTML 解析，下载并执行脚本。
- `async` 脚本：下载不阻塞解析，下载完成后尽快执行，执行顺序不保证。
- `defer` 脚本：下载不阻塞解析，在 DOM 解析完成后、`DOMContentLoaded` 之前按顺序执行。
- `type="module"`：默认具有类似 `defer` 的行为，模块依赖图会先解析。

## CSS 为什么阻塞渲染

CSS 不改变 DOM 结构，所以通常不会阻塞 DOM 解析。但浏览器要等 CSSOM 准备好，才能构建渲染树。

如果样式还没确定就绘制，用户会看到无样式内容闪烁，或者重复绘制。所以 CSS 对渲染来说是阻塞资源。

CSS 还可能阻塞脚本执行。脚本可能需要读取样式或触发布局，浏览器必须确保前面的样式表已经解析。

## 脚本为什么阻塞解析

传统同步脚本可能修改 DOM，也可能通过 `document.write` 插入内容。浏览器无法预知脚本行为，只能暂停解析，先执行脚本。

```html
<script src="/app.js"></script>
```

这会阻塞后续 HTML 的解析。

```html
<script src="/app.js" defer></script>
```

`defer` 让下载和解析并行，执行放到 DOM 解析完成之后。

```html
<script src="/analytics.js" async></script>
```

`async` 适合独立、无顺序依赖的脚本。它可能在 DOM 解析完成前执行，也可能在之后执行。

## DOMContentLoaded 和 load

`DOMContentLoaded` 在 HTML 解析完成、延迟脚本执行之后触发。它不代表图片、字体、iframe 等所有资源都加载完成。

`load` 要等页面依赖的主要资源加载完成。

```js
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM ready")
})

window.addEventListener("load", () => {
  console.log("all resources loaded")
})
```

很多“页面白屏但接口很快”的问题，卡在的不是 DOMContentLoaded，而是首屏渲染、字体、图片或 JavaScript 执行。

## 渲染树之后

DOM 和 CSSOM 准备好后，浏览器计算样式、生成布局树、计算几何位置，然后绘制和合成。

现代浏览器会把页面拆成图层，部分更新可以走合成线程。`transform` 和 `opacity` 通常比修改布局属性更适合做动画，因为它们不一定触发布局和重绘。

但这不是绝对的。真正要不要优化，要看 Performance 面板里的主线程、布局、绘制和合成耗时。

## 我会怎么排查

1. 看 Network：请求是不是被缓存、是不是被阻塞、有没有大资源。
2. 看 Performance：主线程是不是被长任务占住。
3. 看 DOMContentLoaded 和 LCP：用户看到内容的时间到底卡在哪。
4. 再看脚本、样式和字体是否阻塞首屏。

“输入 URL 后发生了什么”不是一段背诵材料。把它和真实性能指标对应起来，才算真的理解。
