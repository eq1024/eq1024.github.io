---
title: 闭包和柯里化，真正难的是边界
date: 2022-03-05
description: 闭包不是内存泄漏的同义词，柯里化也不是函数式编程的装饰品。从实际代码出发，理解它们为什么有用、什么时候不该用。
tags:
  - JavaScript
  - 计算机基础
outline: true
---

闭包可能是被解释得最多、也被误解得最多的 JavaScript 概念之一。

“函数内部返回函数”“可以访问外部变量”“会造成内存泄漏”，这些说法都不算错，但都不够解释真实代码里的问题。

我后来更愿意把闭包理解成：**函数和它定义时的词法环境一起被打包走了。**

## 闭包保存的是环境，不是快照

```js
function createCounter() {
  let count = 0

  return () => {
    count += 1
    return count
  }
}

const next = createCounter()
next() // 1
next() // 2
```

`createCounter` 返回的箭头函数仍然能访问 `count`，而且访问的是同一个绑定，不是调用时复制的一份值。

这也是闭包能做私有状态的基础：

```js
function createStore(initial) {
  let value = initial

  return {
    get: () => value,
    set: next => {
      value = next
    },
  }
}
```

外部拿不到 `value`，只能通过 `get` / `set` 操作。比起把所有状态都挂在对象上，这种方式能明确边界。

## 闭包也会带来过期状态

闭包不会自动读取“最新变量”，它读取的是自己作用域里的绑定。如果这个绑定没有更新，你拿到的就是旧值。

```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i)
  }, 0)
}

// 3 3 3
```

`var` 只有一个函数级绑定，三个回调共享同一个 `i`。改成 `let` 后，每次循环都会创建新的绑定：

```js
for (let i = 0; i < 3; i++) {
  setTimeout(() => {
    console.log(i)
  }, 0)
}

// 0 1 2
```

React 里的 stale closure 也是同一个问题。`useEffect` 或事件处理器捕获的是创建时的变量，如果没有正确的依赖或更新方式，就会一直读到旧值。

## 柯里化是参数的分批提交

柯里化把一个接收多个参数的函数，变成一串接收单个参数的函数：

```js
function add(a, b, c) {
  return a + b + c
}

function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args)
    }

    return (...next) => curried.apply(this, [...args, ...next])
  }
}

const curriedAdd = curry(add)
curriedAdd(1)(2)(3) // 6
curriedAdd(1, 2)(3) // 6
```

这里的 `fn.length` 是函数声明时的形参数量。遇到默认参数、剩余参数或可变参数时，这个简单实现就不够用了，需要显式传入参数个数。

柯里化的实用场景是复用配置：

```js
const check = curry((pattern, value) => pattern.test(value))

const isPhone = check(/^1\d{10}$/)
const isEmail = check(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
```

它不是为了把代码写得更“函数式”，而是把一部分参数提前固定，生成更小的工具函数。

## 不要为了柯里化而柯里化

如果一段逻辑只调用一次，拆成一层层函数只会增加阅读成本。

柯里化适合：

- 配置固定的校验器、请求器
- 组合函数时逐步传入上下文
- 需要复用中间函数的场景

不适合：

- 只有一次调用的业务代码
- 参数含义本来就不清晰，硬拆成 `a => b => c`
- 为了炫技而牺牲调试信息

## 闭包和内存

闭包会保留它引用的变量。这本身不是内存泄漏。

真正的问题是：**这个闭包活得比你想的久，并且继续引用着已经不需要的大对象。**

```js
function attach(element) {
  const hugeData = createHugeData()

  element.addEventListener("click", () => {
    console.log(hugeData.length)
  })
}
```

如果元素被移除，但事件监听器没有解绑，闭包和 `hugeData` 都可能继续可达。解决方式不是“不要用闭包”，而是管理生命周期：

```js
const controller = new AbortController()
element.addEventListener("click", handler, { signal: controller.signal })

controller.abort()
```

或者及时 `removeEventListener`、清理定时器、取消订阅。

闭包让代码更灵活，代价是你需要知道自己延长了哪些引用的生命周期。

## 最后

闭包不是“函数套函数”的语法游戏，柯里化也不是函数式编程的通行证。

它们真正有价值的地方，是让状态和配置有一个清晰的边界。边界清楚了，闭包会很好用；边界失控了，它才会变成内存和状态问题的来源。
