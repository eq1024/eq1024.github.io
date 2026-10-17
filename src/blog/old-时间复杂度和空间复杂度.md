---
title: 时间复杂度不是用来算时间的
date: 2021-02-23
description: 从 Big O 的定义、常见量级到均摊复杂度和递归空间，重新理解复杂度分析。
tags:
  - 计算机基础
outline: true
---

刚学算法时，我总觉得时间复杂度是在算代码要跑多少秒。后来才发现，它根本不关心你的电脑有多快，也不关心循环体里写了几行 `console.log`。

它只回答一个问题：**当输入规模变大时，工作量会怎么增长。**

## Big O 看的是趋势

```js
function sum(items) {
  let total = 0
  for (const item of items) {
    total += item
  }
  return total
}
```

这段代码循环 `n` 次，所以是 `O(n)`。

如果循环里再多做几次加法、判断、赋值，它仍然是 `O(n)`。常数项会被忽略，因为当 `n` 足够大时，决定增长趋势的是循环次数，不是某一行代码写了几遍。

这也是 Big O 最容易被误解的地方：**它描述的是增长率，不是绝对耗时。**

一个 `O(n²)` 的算法在 `n = 10` 时可能比 `O(n log n)` 更快。复杂度只告诉你，输入变大之后谁更容易失控。

## 常见量级

### O(1)

固定次数的操作：

```js
function first(items) {
  return items[0]
}
```

数组按下标访问通常是 `O(1)`。对象的属性读取平均也可以看作 `O(1)`，但哈希冲突严重时会退化。

### O(log n)

每次把问题规模缩小一半：

```js
function binarySearch(sorted, target) {
  let left = 0
  let right = sorted.length - 1

  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    if (sorted[mid] === target) return mid
    if (sorted[mid] < target) left = mid + 1
    else right = mid - 1
  }

  return -1
}
```

每次排除一半，最多执行 `log₂n` 次。

### O(n)

遍历一次：

```js
function findUser(users, id) {
  return users.find(user => user.id === id)
}
```

最坏情况下要看完整数组。

### O(n log n)

排序是最常见的例子：

```js
const sorted = users.sort((a, b) => a.age - b.age)
```

比较排序的下界通常是 `O(n log n)`。外层遍历 `n` 次，内部每次做 `log n` 的工作，也会得到这个量级。

### O(n²)

两层嵌套循环：

```js
function hasDuplicate(items) {
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      if (items[i] === items[j]) return true
    }
  }
  return false
}
```

数据量翻倍，工作量大约变成四倍。

同样的需求可以用 `Set` 降到 `O(n)`：

```js
function hasDuplicate(items) {
  const seen = new Set()
  for (const item of items) {
    if (seen.has(item)) return true
    seen.add(item)
  }
  return false
}
```

代价是额外空间。

## 最好、最坏、平均和均摊

同一段代码，不同输入的复杂度可能不同。

`find` 找第一个元素是 `O(1)`，找最后一个或找不到是 `O(n)`。讨论复杂度时，最好说清楚是最坏还是平均。

均摊复杂度也很实用。比如数组的 `push`：

```js
const list = []
list.push(1)
```

数组扩容时确实会复制旧元素，但扩容不是每次都发生。把多次操作摊开看，`push` 的均摊复杂度是 `O(1)`。而 `unshift` 每次都要移动后面所有元素，通常是 `O(n)`。

## 空间复杂度不只是“开了几个变量”

空间复杂度看的是额外空间如何随输入增长。

```js
function reverse(items) {
  return [...items].reverse()
}
```

这里创建了一个新数组，空间是 `O(n)`。

递归还要算调用栈：

```js
function factorial(n) {
  if (n <= 1) return 1
  return n * factorial(n - 1)
}
```

时间是 `O(n)`，递归栈空间也是 `O(n)`。很多人只数局部变量，最后把递归栈漏掉了。

## 不要把复杂度当成性能清单

复杂度能帮我们排除明显不合理的方案，但它不能替代测量。

真实性能还受数据分布、缓存命中、DOM 操作、网络、垃圾回收和引擎优化影响。前端里一个 `O(n)` 的循环，可能比一次强制同步布局便宜得多。

我的习惯是：先看数据规模，再判断复杂度是否值得优化；如果确实卡了，用 Performance 面板和基准测试说话，而不是看到嵌套循环就条件反射地重写。

复杂度是地图，不是终点。
