---
title: JavaScript 内存管理，可达性比“栈和堆”更重要
date: 2021-02-23
description: 从内存生命周期、可达性、V8 垃圾回收和常见泄漏场景出发，理解为什么对象没有被回收。
tags:
  - JavaScript
  - 计算机基础
outline: true
---

“JavaScript 会自动垃圾回收，所以不用管内存。”

这句话大概只对了一半。

JavaScript 确实没有手动的 `free`，但对象什么时候能被回收，取决于它是否还能从根对象到达。只要还有一条可达路径，垃圾回收器就不能把它当成垃圾。

## 内存生命周期

不管什么语言，内存基本都经历三步：

```text
分配 -> 使用 -> 释放
```

JavaScript 的分配通常发生在：

- 创建对象、数组、函数
- 创建闭包
- 字符串拼接、解析 JSON
- DOM 节点和事件监听器

释放由垃圾回收器负责，但它只能回收“不可达”的对象。

## 可达性

可以从根对象出发访问到的对象，就是可达的。根包括全局对象、当前调用栈中的变量、闭包引用等。

```js
let user = { name: "Ada" }

user = null
```

如果没有其他引用，原来的对象就不可达了，之后可能被回收。

但下面这种情况不一样：

```js
let user = { name: "Ada" }
const cached = new Map()
cached.set("user", user)

user = null
```

对象仍然可以通过 `cached` 到达，所以不会被回收。

## V8 的垃圾回收大概在做什么

V8 使用分代式垃圾回收，把对象大致分为新生代和老生代：

- 新生代对象通常存活时间短，回收频繁。
- 老生代对象存活时间长，回收成本更高。
- 回收器会从根出发标记可达对象，清理不可达对象，并整理内存碎片。

不同引擎和版本的实现细节会变化，不需要背具体算法。关键心智模型是：**从根出发，能不能找到它。**

## 常见的内存问题

### 意外的全局变量

```js
function save() {
  data = createLargeObject()
}
```

没有声明 `data`，在非严格模式下它会变成全局变量。全局引用可能一直存在。

使用严格模式或显式声明可以减少这类问题。

### 忘记清理定时器

```js
const timer = setInterval(() => {
  updateChart(largeData)
}, 1000)
```

组件卸载后没有 `clearInterval`，回调、`largeData` 和闭包里的引用都可能继续存在。

### 事件监听器没有解绑

```js
element.addEventListener("click", handler)
```

如果元素被移除，但监听器仍然被其他对象引用，相关闭包可能无法释放。现代代码可以用 `AbortController`：

```js
const controller = new AbortController()
element.addEventListener("click", handler, { signal: controller.signal })
controller.abort()
```

### 保留已经移除的 DOM

```js
const cache = {
  panel: document.querySelector(".panel"),
}

document.body.removeChild(document.querySelector(".panel"))
```

`cache.panel` 仍然引用着被移除的节点。如果这个缓存是全局的，节点和它关联的资源就可能继续存在。

### 无上限的缓存

```js
const cache = new Map()

cache.set(key, hugeResult)
```

`Map` 会强引用键和值。缓存如果没有淘汰策略，就会一直增长。

`WeakMap` 的键是弱引用，适合把额外数据关联到对象上，但它不是“自动清理所有缓存”的魔法。键不可达后，值才有机会被回收。

## 闭包一定会泄漏吗

不会。

闭包只是保留了它引用的环境。只要这个闭包本身不再可达，环境也会被回收。

真正的问题是：闭包被一个长期存在的对象持有，而它又引用了很大的数据。

```js
function createHandler() {
  const huge = loadHugeData()

  return () => {
    console.log(huge.length)
  }
}
```

如果这个 handler 被长期保存，`huge` 也会一直被保存。解决方式是缩小闭包捕获范围，或者在不需要时解除引用。

## 怎么排查

Chrome DevTools 的 Memory 面板可以做：

- Heap snapshot：看对象类型、大小和引用链。
- Allocation timeline：看哪段操作持续分配内存。
- 多次快照对比：确认对象是否应该被释放。

不要只看一次内存曲线就下结论。垃圾回收本身会让曲线波动，真正要看的是快照之间的对象增长和引用路径。

## 最后

JavaScript 的垃圾回收不是“自动帮你忘掉内存”。它只负责不可达对象。

你真正要管理的是引用：全局变量、定时器、监听器、缓存、闭包和 DOM 关联。把引用生命周期想清楚，内存问题通常会简单很多。
