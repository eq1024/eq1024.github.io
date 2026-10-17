---
title: 我重新认识了一次 JavaScript 事件循环
date: 2026-10-17
description: 从一道事件循环题出发，重新理解同步代码、微任务、await 续体与宏任务的执行顺序。
tags:
  - JavaScript
  - 事件循环
  - 异步
outline: true
---

前段时间，我重新做了一道事件循环题。

我一开始挺自信的。Promise、`async/await`、微任务、宏任务，这些词我都熟；Promise 我也手写过；Generator 配 runner 的旧写法，我甚至认真研究过。按理说，一道面试题不应该难倒我。

结果我还是排错了。

不是完全不会，而是卡在几个很具体的地方：为什么 `await` 后面的代码没有紧接着执行？为什么 `queueMicrotask` 里的 Promise 回调会跑到后面？为什么 `return Promise.resolve()` 之后的 `.then` 明明还是微任务，却要等那么久？

这件事让我意识到，**会用 Promise 和理解事件循环，是两件不同的事**。

所以我想把这道题完整地写下来。不是为了背一个输出顺序，而是想把我当时没想明白的地方讲清楚。

## 先把题目放出来

假设两个 `setTimeout` 的延迟都是 `0ms`：

```js
console.log("1");

setTimeout(() => {
  console.log("2");

  Promise.resolve().then(() => {
    console.log("3");
  });
}, 0);

Promise.resolve().then(() => {
  console.log("4");

  setTimeout(() => {
    console.log("5");
  }, 0);
});

(async () => {
  console.log("6");

  await Promise.resolve();
  console.log("7");

  await Promise.resolve();
  console.log("8");
})();

queueMicrotask(() => {
  console.log("9");

  Promise.resolve().then(() => {
    console.log("10");
  });
});

Promise.resolve()
  .then(() => {
    console.log("11");
    return Promise.resolve();
  })
  .then(() => {
    console.log("12");
  });

console.log("13");
```

正确答案是：

```text
1
6
13
4
7
9
11
8
10
12
2
3
5
```

如果你第一次也没排对，不用太沮丧。这道题不难在 API，难在顺序。

## 同步代码总是先跑完

事件循环的第一条规则其实很朴素：当前调用栈里的同步代码没有执行完，任何 Promise 回调和定时器都不会执行。

所以主脚本从上往下跑，先得到：

```text
1
6
13
```

`1` 和 `13` 很好理解。`6` 稍微值得说一下。

async 函数不是一调用就整个跳到后台执行。它会先同步执行到第一个 `await`：

```js
(async () => {
  console.log("6");

  await Promise.resolve();
  console.log("7");
})();
```

也就是说，`console.log("6")` 是同步执行的；执行到 `await` 时，函数才暂停，后面的 `7` 被安排到微任务队列。

同步阶段结束时，微任务队列大概是这样：

```text
[4, 7, 9, 11]
```

这里的数字不是队列里的值，而是“哪段代码先排队”。

## 排队顺序比想象中更重要

我一开始以为，既然都在同步阶段注册了回调，后面的顺序应该按“谁看起来更靠后”来排。

事实不是这样。微任务只认一个规则：**先进先出，新任务排到队尾。**

同步阶段发生的事情依次是：

```text
注册 4
async 函数执行到第一个 await，注册 7
调用 queueMicrotask，注册 9
注册 11
```

所以队列是：

```text
[4, 7, 9, 11]
```

不是 `[4, 9, 7, 11]`。

这也是为什么我会在 `7` 和 `9` 之间犯错。`await` 不是在等所有微任务跑完才排队，它在遇到 `await` 的那一刻，就已经把续体排进去了。

## 为什么是 4、7、9，而不是 4、9？

先执行 `4`：

```js
Promise.resolve().then(() => {
  console.log("4");

  setTimeout(() => {
    console.log("5");
  }, 0);
});
```

输出 `4`，同时注册定时器 `5`。

接着执行 `7`。`7` 是第一个 `await` 后面的续体。它输出 `7` 之后，又遇到第二个 `await`：

```js
await Promise.resolve();
console.log("8");
```

第二个 `await` 把 `8` 放到队尾。

这时队列从：

```text
[9, 11]
```

变成：

```text
[9, 11, 8]
```

注意，`8` 没有插到 `9` 前面。它只是一个新来的任务，只能排在已有的 `9` 和 `11` 后面。

然后执行 `9`：

```js
queueMicrotask(() => {
  console.log("9");

  Promise.resolve().then(() => {
    console.log("10");
  });
});
```

输出 `9`，又把 `10` 放到队尾。队列变成：

```text
[11, 8, 10]
```

接下来执行 `11`。到这里，第一轮微任务其实还没结束。`8` 和 `10` 已经在队列里，`12` 也会随着 Promise 链的解析排到后面。

所以第一轮微任务的输出是：

```text
4 7 9 11
```

第二轮才是：

```text
8 10 12
```

## `await` 到底在等什么？

我以前对 `await` 的理解是“等 Promise 完成”。这句话不能说错，但太粗了。

更准确地说，`await` 做的是：

1. 暂停当前 async 函数。
2. 把后面的代码作为续体排进微任务队列。
3. 把控制权交还给调用者。
4. 等待的 Promise 完成后，再恢复函数。

```js
async function f() {
  console.log("A");
  await Promise.resolve();
  console.log("B");
}
```

`A` 是同步执行的，`B` 是微任务。

如果连续写两个 `await`：

```js
await Promise.resolve();
console.log("7");

await Promise.resolve();
console.log("8");
```

第一个 `await` 先把 `7` 排进去；执行到 `7` 时，第二个 `await` 再把 `8` 排到队尾。

所以 `8` 永远不可能插到已经在队列里的任务前面。

这也是我后来记住 `await` 的方式：

> 它不是“立刻继续”，而是“把后面的我排进队列”。

## `return Promise.resolve()` 为什么也会影响顺序？

Promise 链这一段也容易让人误判：

```js
Promise.resolve()
  .then(() => {
    console.log("11");
    return Promise.resolve();
  })
  .then(() => {
    console.log("12");
  });
```

`11` 输出之后，回调返回了一个 Promise。下一个 `.then` 不会立刻执行，它要等这个 Promise 被解析。

所以 `12` 会排在已经等待的 `8`、`10` 后面。

这里有一个很容易犯的错误：看到 `return`，就以为函数已经结束了，后面的 `12` 应该马上执行。实际上，Promise 链在等返回值，而 `12` 仍然是微任务。

它不会跑到 `setTimeout` 的 `2` 后面去。

## 宏任务最后才登场

所有微任务清空后，才轮到定时器。

第一个定时器输出 `2`，并注册 `3`：

```js
setTimeout(() => {
  console.log("2");

  Promise.resolve().then(() => {
    console.log("3");
  });
}, 0);
```

`2` 所在宏任务结束后，事件循环再次清空微任务，于是输出 `3`。

最后，第二个定时器输出 `5`。

所以尾部顺序是：

```text
2
3
5
```

不是 `2 5 3`，因为每个宏任务结束后都会先清空微任务，再执行下一个宏任务。

## 我后来怎么记

最后我给自己留了四条规则：

1. 同步代码先跑完。
2. Promise 回调、`queueMicrotask`、`await` 续体进入微任务队列。
3. 微任务先进先出，新产生的微任务只能排队尾。
4. 微任务全部清空后，才进入下一个宏任务。

如果画成图，大概是：

```text
执行一个宏任务
  ↓
清空所有微任务
  ↓
浏览器可能进行渲染
  ↓
执行下一个宏任务
  ↓
清空所有微任务
  ↓
...
```

事件循环不是“Promise 和 setTimeout 谁先谁后”的死记硬背，而是两个队列在交替工作。

## 几个我踩过的坑

**`Promise.resolve()` 是同步的。**

它创建 Promise 是同步的，但 `.then` 回调是异步微任务。

**`await` 不会阻塞主线程。**

它只是暂停当前 async 函数，其他代码仍然可以继续执行。

**`setTimeout(fn, 0)` 不会立即执行。**

它要等当前任务和所有微任务清空。

**新微任务不能插队。**

不管它是在 `await`、`.then` 还是 `queueMicrotask` 里产生的，新任务都只能排到队尾。

**`return Promise.resolve()` 不会变成宏任务。**

它仍然属于 Promise 链和微任务体系，只是多了一步 Promise 解析。

## 最后

这道题本身有点刁钻，尤其是 `return Promise.resolve()` 和嵌套微任务。面试里真遇到，能讲清楚前几步已经比背答案有价值得多。

我把这次重新理解事件循环的过程写下来，也不是想证明什么。只是觉得，像 `await`、Promise 回调、任务队列这些东西，平时用得太顺手，反而很容易忽略它们真正的执行顺序。

如果你也曾经在这种题目前面卡住，不用急着怀疑自己。先把同步代码、微任务、宏任务分成三层，再按队列顺序一步步走，大多数看似混乱的输出都会变得有迹可循。

希望这篇梳理对你有用。干杯。

> 本文按浏览器环境解释，并假设两个 `0ms` 定时器按注册顺序执行。Node.js 中还有 `process.nextTick`、`setImmediate` 等额外概念，不在本文讨论范围内。
