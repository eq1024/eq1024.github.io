---
title: 防抖和节流，先把 this、参数和清理写对
date: 2022-03-06
description: 不背“n 秒后执行”，从调用频率、this、参数、取消和清理几个角度写出可靠的 debounce 与 throttle。
tags:
  - JavaScript
outline: true
---

防抖和节流是前端最常被复制粘贴的两个工具函数。

也正因为太常见，很多实现只考虑了“能跑”，没有考虑 `this`、参数、取消、重复调用和组件卸载。最后问题不在概念，而在细节。

## 防抖：等停下来再执行

防抖的规则是：事件不断触发时，只保留最后一次，等安静一段时间后执行。

```js
function debounce(fn, delay) {
  let timer = null

  function debounced(...args) {
    const context = this

    clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn.apply(context, args)
    }, delay)
  }

  debounced.cancel = () => {
    clearTimeout(timer)
    timer = null
  }

  return debounced
}
```

使用：

```js
const search = debounce(keyword => {
  fetch(`/api/search?q=${encodeURIComponent(keyword)}`)
}, 300)

input.addEventListener("input", event => {
  search(event.target.value)
})
```

注意这里没有把 `debounce(search)` 放进 `setInterval`。如果每次循环都创建一个新的防抖函数，它们各自持有自己的定时器，防抖就失去意义了。

## 防抖也可以有 leading

有些场景希望第一次立即执行，之后的连续触发再合并：

```js
function debounce(fn, delay, { leading = false } = {}) {
  let timer = null

  return function debounced(...args) {
    const context = this
    const callNow = leading && !timer

    clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
    }, delay)

    if (callNow) {
      fn.apply(context, args)
    }
  }
}
```

这就是“首次立即执行”的版本。很多库会同时支持 leading 和 trailing，实际使用时根据交互语义选择，不要默认两个都开。

## 节流：固定频率执行

节流是另一套规则：在一段时间内最多执行一次。

```js
function throttle(fn, interval) {
  let last = 0
  let timer = null
  let lastArgs
  let lastContext

  return function throttled(...args) {
    lastArgs = args
    lastContext = this
    const now = Date.now()
    const remaining = interval - (now - last)

    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }

      last = now
      fn.apply(lastContext, lastArgs)
      return
    }

    if (!timer) {
      timer = setTimeout(() => {
        last = Date.now()
        timer = null
        fn.apply(lastContext, lastArgs)
      }, remaining)
    }
  }
}
```

它同时处理了尾部调用：如果最后一次触发落在间隔内，会在间隔结束时补一次。

## 防抖和节流的区别

```text
防抖：等事件停止后执行一次
节流：在时间窗口内最多执行一次
```

输入联想适合防抖，因为用户还在输入时请求没有意义。

滚动位置、拖拽、鼠标移动适合节流，因为你需要持续得到反馈。

## 不要用 setInterval 套防抖

这是一个很常见的错误：

```js
setInterval(debounce(search, 300), 1000)
```

每次执行 `debounce(search, 300)` 都会创建新的 `debounced` 函数，内部定时器互不相干。看起来像在防抖，实际上只是每秒创建一个新的闭包。

正确做法是先创建一次：

```js
const debouncedSearch = debounce(search, 300)

input.addEventListener("input", event => {
  debouncedSearch(event.target.value)
})
```

## 清理和取消

组件卸载、路由切换、请求结束时，应该取消未执行的防抖任务：

```js
const handler = debounce(save, 500)

onBeforeUnmount(() => {
  handler.cancel()
})
```

如果防抖回调里发起请求，还应该配合 `AbortController` 取消旧请求，避免后到的旧响应覆盖新状态。

## 滚动场景可以用 requestAnimationFrame

对于滚动、resize 这类和渲染强相关的场景，`requestAnimationFrame` 往往比固定时间节流更自然：

```js
let ticking = false

window.addEventListener("scroll", () => {
  if (ticking) return

  ticking = true
  requestAnimationFrame(() => {
    updatePosition()
    ticking = false
  })
}, { passive: true })
```

它不会在页面不可见时盲目执行，也更贴近浏览器绘制节奏。

## 最后

防抖和节流的核心不是两段模板代码，而是你希望如何控制调用频率。

先确定交互语义，再处理 `this`、参数、取消和清理。这样它们才会成为工具，而不是下一处隐藏 bug。
