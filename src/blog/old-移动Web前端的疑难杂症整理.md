---
title: 移动端适配，别再从 rem 和 1px 开始背
date: 2022-03-01
description: 从 viewport、DPR、安全区、软键盘、bfcache 和事件模型出发，重新整理移动端 Web 的常见问题。
tags:
  - CSS
  - 浏览器
outline: true
---

移动端适配的文章很容易写成一份“代码片段合集”：

```text
设置 viewport
用 rem
用 transform 画 1px
加 safe-area
```

这些片段都有用，但如果不理解背后的布局视口、设备像素和浏览器行为，换个机型就会继续踩坑。

## 先理解 viewport

移动浏览器默认会用一个较宽的布局视口来渲染页面，再缩放到屏幕宽度。常见做法是：

```html
<meta name="viewport" content="width=device-width, initial-scale=1">
```

`width=device-width` 让布局视口接近设备宽度。`viewport-fit=cover` 则让页面延伸到刘海屏的安全区。

不要随手加 `user-scalable=no` 或 `maximum-scale=1`。它会破坏用户缩放，影响可访问性。

## CSS 像素不等于物理像素

`devicePixelRatio` 表示一个 CSS 像素对应多少个物理像素。

在 2x 屏幕上，1 个 CSS 像素可能对应 2×2 个物理像素。图片、边框和 canvas 的清晰度问题通常来自这里。

但不要把 DPR 当成设备型号判断。浏览器缩放、系统缩放和不同浏览器实现都会影响实际值。

## 响应式和自适应不是两个口号

更实用的区分是：

- 响应式：布局随可用空间连续变化。
- 自适应：在若干断点切换布局。

现代 CSS 不必二选一。可以用 `grid`、`flex`、`clamp()` 和容器查询做连续适配，再在关键断点调整结构。

```css
.page {
  width: min(100% - 32px, 1120px);
  margin-inline: auto;
}

.title {
  font-size: clamp(1.25rem, 2vw + 1rem, 2rem);
}
```

不要按 UA 判断设备。UA 可以伪造，也不能可靠表达屏幕尺寸、输入方式和能力。

## 1px 边框不是所有屏幕都一样

高 DPR 屏幕上，CSS 的 `1px` 可能看起来很粗，因为它占用了多个物理像素。

一种常见方案是用伪元素画出 1 物理像素：

```css
.hairline {
  position: relative;
}

.hairline::after {
  position: absolute;
  inset: 0;
  border: 1px solid #ddd;
  content: "";
  pointer-events: none;
  transform-origin: top left;
}

@media (min-resolution: 2dppx) {
  .hairline::after {
    width: 200%;
    height: 200%;
    transform: scale(0.5);
  }
}

@media (min-resolution: 3dppx) {
  .hairline::after {
    width: 300%;
    height: 300%;
    transform: scale(0.3333);
  }
}
```

如果设计系统允许，很多时候直接使用普通 `1px` 或 `box-shadow` 更简单。不要为了绝对物理像素把结构搞复杂。

## 安全区和软键盘

刘海屏使用 `env(safe-area-inset-*)`：

```css
.bottom-bar {
  padding-bottom: env(safe-area-inset-bottom);
}
```

软键盘弹出时，`window.innerHeight` 不一定变化，但 `visualViewport` 会提供更准确的可视区域信息。

输入框被遮挡时，可以监听 `visualViewport.resize`，在聚焦后把元素滚动到可视区域：

```js
input.addEventListener("focus", () => {
  requestAnimationFrame(() => {
    input.scrollIntoView({ block: "center" })
  })
})
```

固定底部栏在键盘弹出时容易遮挡内容。优先使用普通文档流和 `sticky`，比全屏 fixed 布局更稳。

## bfcache 不是“返回一定刷新”

移动端浏览器常使用前进后退缓存。页面从缓存恢复时，不一定重新执行完整加载流程。

```js
window.addEventListener("pageshow", event => {
  if (event.persisted) {
    // 页面从 bfcache 恢复，按需刷新状态
  }
})
```

不要无条件 `location.reload()`。先判断页面状态是否真的过期，否则会把本可以秒开的返回操作变成一次完整网络请求。

## 触摸和点击

现代浏览器在正确设置 viewport 后通常已经消除了 300ms 点击延迟，但旧 WebView 和特殊场景仍可能有差异。

对于滚动和触摸交互，优先使用 Pointer Events：

```js
element.addEventListener("pointerdown", handler, { passive: true })
```

只有确实需要阻止默认行为时才用非 passive 监听。乱用 `preventDefault` 会影响滚动和手势。

## 后台定时器会被节流

页面进入后台后，浏览器会降低定时器频率，甚至暂停执行。不要依赖 `setInterval` 精确计时。

```js
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    // 暂停动画或轮询
  } else {
    // 重新同步状态
  }
})
```

`requestIdleCallback` 不是定时器的替代品，它在后台标签页也不保证按预期执行。

## 最后

移动端适配不是一套固定公式，而是对布局视口、像素比、浏览器生命周期和输入方式的理解。

先在真实设备上复现问题，再选择方案。不要因为某个片段流行，就把它复制到所有页面。
