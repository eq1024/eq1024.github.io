---
title: 事件委托不是性能银弹
date: 2022-03-08
description: 从事件流、target 和 currentTarget 到 closest，重新理解事件委托真正解决的问题和它的边界。
tags:
  - JavaScript
  - 浏览器
outline: true
---

我第一次学事件委托时，记住的是一句很顺口的话：**把事件绑在父元素上，减少 DOM 操作，提高性能。**

这句话不能算错，但它把事件委托讲小了。

事件委托真正有价值的地方，是它把“事件发生在哪里”和“事件由谁处理”分开了。理解这一点，动态列表、表格操作和组件事件代理都会变得自然很多。

## 事件流有三个阶段

点击一个按钮时，事件并不是只在按钮上发生一次。

```text
document
  ↓ capture
父元素
  ↓ capture
button
  ↑ bubble
父元素
  ↑ bubble
document
```

现代浏览器使用 `addEventListener` 时，默认监听冒泡阶段：

```js
parent.addEventListener("click", handler)
```

第三个参数传 `true` 可以监听捕获阶段：

```js
parent.addEventListener("click", handler, true)
```

也可以传配置对象：

```js
parent.addEventListener("click", handler, {
  capture: false,
  once: true,
  passive: true,
})
```

`passive` 对滚动、触摸这类高频事件很有用，它告诉浏览器“我不会调用 `preventDefault`”，从而允许浏览器提前优化。

## target 和 currentTarget

```html
<ul id="list">
  <li data-id="1"><span>订单 1</span></li>
  <li data-id="2"><span>订单 2</span></li>
</ul>
```

```js
const list = document.querySelector("#list")

list.addEventListener("click", event => {
  console.log(event.target)        // 真正被点中的元素，可能是 span
  console.log(event.currentTarget) // 绑定监听器的 ul
})
```

这是事件委托的基础：

- `target` 是实际触发事件的元素。
- `currentTarget` 是当前执行监听器的元素。

不要假设 `target` 就是 `li`，它可能是 `li` 里的任意子元素。

## 用 closest 找到业务元素

```js
list.addEventListener("click", event => {
  const item = event.target.closest("li[data-id]")

  if (!item || !list.contains(item)) return

  console.log(item.dataset.id)
})
```

`closest` 会从当前元素开始向上查找，正好适合处理“点在子元素里”的情况。

`list.contains(item)` 是必要的校验：如果事件来自列表外的元素，`closest` 可能找到别的地方的 `li`。

## 为什么事件委托适合动态列表

假设列表来自接口，分页、筛选都会重新渲染。给每个 `li` 单独绑定事件，代码要跟着 DOM 生命周期走；绑在父级上，新增的子元素自动被覆盖。

```js
function render(rows) {
  list.innerHTML = rows
    .map(row => `<li data-id="${row.id}">${row.name}</li>`)
    .join("")
}
```

不需要每次渲染后重新绑定。

但“减少 DOM 操作”并不是唯一收益。更实际的好处是：事件处理逻辑集中，状态变化和操作入口更容易追踪。

## 事件委托的边界

### 不是所有事件都冒泡

`focus`、`blur` 不冒泡，通常用 `focusin`、`focusout`。`mouseenter` 不冒泡，可以用 `mouseover` 配合判断，或者直接监听具体元素。

### stopPropagation 会截断委托

```js
child.addEventListener("click", event => {
  event.stopPropagation()
})
```

子元素一旦阻止冒泡，父级委托就收不到事件。不要为了“避免影响父级”随手加 `stopPropagation`，先确认是否真的需要。

### 事件代理会增加匹配成本

一个父级监听器减少了监听器数量，但每次事件都要做 `closest` 和条件判断。对于简单静态元素，直接绑定可能更直观。

### Shadow DOM 需要额外处理

跨 Shadow DOM 时，`event.target` 可能被重定向。需要完整路径时用 `event.composedPath()`，并在设计组件边界时明确事件是否 `composed`。

## preventDefault 和 stopPropagation 不是一回事

- `preventDefault`：阻止浏览器默认行为，比如链接跳转、表单提交。
- `stopPropagation`：阻止事件继续传播。

事件委托依赖传播，所以除非明确知道后果，不要在委托容器内部随意调用 `stopPropagation`。

## 最后

事件委托不是“性能优化技巧”，而是一种事件处理组织方式。它适合动态、批量、结构稳定的列表，不适合所有场景。

先理解事件流，再决定监听器放在哪里。这个顺序比背“父级绑定”更重要。
