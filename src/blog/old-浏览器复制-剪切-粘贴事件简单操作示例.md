---
title: 剪贴板不是只有 copy 和 paste
date: 2022-02-26
description: 从 copy/cut/paste 事件到 navigator.clipboard、图片粘贴和权限边界，整理现代浏览器的剪贴板实践。
tags:
  - JavaScript
  - 浏览器
outline: true
---

复制粘贴看起来是浏览器里最普通的功能之一。

但真正做起来，问题很快就来了：为什么 `navigator.clipboard` 在某些页面不可用？为什么粘贴图片拿不到文件？为什么 `copy` 事件里改完剪贴板还要调用 `preventDefault`？

这篇文章把常见场景和边界整理一遍。

## 三个事件

```js
document.addEventListener("copy", event => {})
document.addEventListener("cut", event => {})
document.addEventListener("paste", event => {})
```

- `copy`：用户或脚本触发复制。
- `cut`：用户触发剪切。
- `paste`：用户触发粘贴。

事件对象的 `clipboardData` 是同步访问剪贴板的入口：

```js
document.addEventListener("copy", event => {
  console.log(event.clipboardData?.getData("text/plain"))
})
```

`beforecopy`、`beforecut`、`beforepaste` 是旧实现，现代项目不建议依赖。

## 复制时写入文本

```js
document.addEventListener("copy", event => {
  const text = window.getSelection()?.toString()

  if (!text) return

  event.clipboardData.setData("text/plain", text)
  event.preventDefault()
})
```

如果自己不调用 `setData`，浏览器会使用默认复制行为。调用 `preventDefault` 是为了接管这次复制，避免默认内容覆盖你写入的内容。

实际项目里通常不会全局拦截 `copy`，而是给复制按钮绑定明确的行为。

## 现代 API：navigator.clipboard

```js
await navigator.clipboard.writeText("hello")
```

它比 `document.execCommand("copy")` 更现代，但有几个前提：

- 页面处于安全上下文，通常是 HTTPS 或 localhost。
- 读取剪贴板通常需要用户手势或权限。
- 不同浏览器对权限和焦点状态的要求不完全一样。

读取文本：

```js
const text = await navigator.clipboard.readText()
```

这类 API 是异步的，适合按钮点击，不适合在没有用户交互的页面加载阶段直接调用。

## 粘贴图片

```js
document.addEventListener("paste", event => {
  const items = [...(event.clipboardData?.items ?? [])]
  const imageItem = items.find(item => item.type.startsWith("image/"))

  if (!imageItem) return

  const file = imageItem.getAsFile()
  if (!file) return

  const url = URL.createObjectURL(file)
  preview.src = url
})
```

拿到 `File` 后有三条常见路径：

```js
// 上传
const formData = new FormData()
formData.append("file", file)

// 预览
const url = URL.createObjectURL(file)

// 读取为 Data URL
const reader = new FileReader()
reader.readAsDataURL(file)
```

如果使用 `URL.createObjectURL`，记得在图片不再需要时调用 `URL.revokeObjectURL(url)`，否则会一直占用内存。

## 为什么有时拿不到图片

粘贴事件里的数据类型取决于来源：

- 从网页复制图片，可能只有 URL 或 HTML 片段。
- 从系统截图工具复制，可能是 `image/png`。
- 从本地文件管理器复制，有些浏览器只提供文件引用，不提供图片二进制。

不要假设所有“图片粘贴”都能拿到 `File`。先遍历 `items` 看类型，再决定走文件上传、URL 预览还是提示用户。

## 权限和降级

```js
if (!navigator.clipboard) {
  // 回退到旧的复制方案，或者直接提示用户手动复制
}
```

不要为了兼容极旧浏览器把主流程写得非常复杂。先保证现代浏览器可用，再给一个明确的降级提示，通常比隐藏错误更好。

## 最后

剪贴板的核心不是记住几个事件，而是分清同步事件和异步 API、用户手势和权限、文本和二进制。

复制粘贴是用户已经形成肌肉记忆的操作。让它在边界情况下仍然可预期，比多支持一个旧 API 更重要。
