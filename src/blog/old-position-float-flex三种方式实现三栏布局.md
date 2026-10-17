---
title: 三栏布局：从圣杯、双飞翼到 Grid
date: 2022-03-01
description: 回顾圣杯和双飞翼要解决的问题，再用 flex、grid 和现代 CSS 写出更可靠的中间自适应布局。
tags:
  - CSS
outline: true
---

三栏布局是前端面试里很老的题：

```text
左右固定宽度，中间自适应
```

看起来简单，但它曾经衍生出圣杯布局、双飞翼布局和各种 float 负 margin 技巧。今天再用这些技巧，大多数时候是不必要的。

## 圣杯布局在解决什么

核心诉求是：

- 中间栏在 DOM 中先出现，利于阅读顺序和 SEO。
- 左右栏固定宽度。
- 中间栏自适应。
- 三栏高度可以不同。

传统圣杯用 float、负 margin 和 `padding` 让三栏并排。双飞翼则在中间栏里再套一层容器，用内层 margin 给左右栏让位。

这些方案能工作，但依赖负 margin、清除浮动和精心计算的宽度。维护成本高，响应式也麻烦。

## Flex 版本

```html
<div class="layout">
  <aside class="side">Left</aside>
  <main class="center">Center</main>
  <aside class="side">Right</aside>
</div>
```

```css
.layout {
  display: flex;
  min-height: 100vh;
}

.side {
  flex: 0 0 200px;
}

.center {
  flex: 1;
  min-width: 0;
}
```

`flex: 1` 让中间栏占据剩余空间。`min-width: 0` 很重要，它能防止长内容把 flex item 撑破。

如果希望中间栏在 DOM 中先出现，可以调整 HTML 顺序，再用 `order`：

```css
.center { order: 2; }
.side:first-child { order: 1; }
.side:last-child { order: 3; }
```

但 `order` 只改变视觉顺序，不改变键盘和屏幕阅读器的顺序。可访问性优先时，不要为了视觉顺序牺牲 DOM 语义。

## Grid 版本

```css
.layout {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr) 200px;
  min-height: 100vh;
}
```

中间的 `minmax(0, 1fr)` 和 flex 的 `min-width: 0` 是同一个思路：允许内容收缩，避免溢出。

也可以命名区域：

```css
.layout {
  display: grid;
  grid-template-areas: "left center right";
  grid-template-columns: 200px minmax(0, 1fr) 200px;
}

.left { grid-area: left; }
.center { grid-area: center; }
.right { grid-area: right; }
```

如果中间内容需要独立滚动，可以给中间栏设置 `min-height: 0` 和 `overflow: auto`。

## 为什么不再推荐 position 方案

用 `position: fixed` 或绝对定位强行摆放三栏，会让元素脱离文档流。页面高度、滚动、响应式和内容溢出都会变得难以处理。

绝对定位适合覆盖层、浮层、装饰元素，不适合作为普通页面布局的主结构。

## 响应式

窄屏时，三栏通常应该变成纵向：

```css
@media (max-width: 768px) {
  .layout {
    grid-template-columns: 1fr;
    grid-template-areas:
      "center"
      "left"
      "right";
  }
}
```

如果需要侧栏在桌面端吸顶，可以用 `position: sticky`，而不是 fixed：

```css
.side {
  position: sticky;
  top: 16px;
  align-self: start;
}
```

`sticky` 仍然参与文档流，通常比 fixed 更容易控制。

## 最后

圣杯和双飞翼值得了解，因为它们展示了 CSS 历史上一段真实的工程约束。

但今天写新页面，优先用 Flex 或 Grid。布局代码应该表达结构，而不是靠负 margin 和定位技巧硬拼。
