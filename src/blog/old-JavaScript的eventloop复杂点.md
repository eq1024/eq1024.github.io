---
title: "JavaScript的eventloop复杂点"
date: 2021-02-23
description: "什么是eventloop 推荐:掘金文章 eventloop的概念其实很简单 （1）所有同步任务都在主线程上执行，形成一个执行栈（execution context stack）。 （2）主线程之外，还存在&quot;任务队列&quot;(task queue)。只要异步任务有了"
tags:
  - JavaScript
  - 计算机基础
---

## 什么是eventloop
[推荐:掘金文章](https://juejin.cn/post/6844903512845860872)
**eventloop的概念其实很简单**
（1）所有同步任务都在主线程上执行，形成一个`执行栈`（execution context stack）。

（2）主线程之外，还存在`"任务队列"`(task queue)。只要异步任务有了运行结果，就在"任务队列"之中放置一个事件。

（3）一旦"执行栈"中的所有`同步任务`执行完毕，系统就会读取"任务队列"，看看里面有哪些事件。那些对应的`异步任务`，于是结束等待状态，进入执行栈，开始执行。

（4）主线程不断重复上面的第三步

关键难点在于,任务队列是分为`微任务`和`宏任务`
- 宏任务: setTimeout, setInterval, setImmediate, I/O, UI rendering
- 微任务: process.nextTick（Nodejs）, Promises, Object.observe, MutationObserver;

**`值得注意的是`: promise构造函数是`同步执行的`，then被分发到`微任务`**
![](https://img2020.cnblogs.com/blog/2059883/202102/2059883-20210223230217294-491706085.png)

## 宏任务和微任务区别
**宏任务**

| `I/O`                   | ✅    | ✅    |
| ----------------------- | ---- | ---- |
| `setTimeout`            | ✅    | ✅    |
| `setInterval`           | ✅    | ✅    |
| `setImmediate`          | ❌    | ✅    |
| `requestAnimationFrame` | ✅    | ❌    |

**微任务**

| `process.nextTick`           | ❌    | ✅    |
| ---------------------------- | ---- | ---- |
| `MutationObserver`           | ✅    | ❌    |
| `Promise.then catch finally` | ✅    | ✅    |

![image](https://img2022.cnblogs.com/blog/2059883/202203/2059883-20220303164233220-1024782153.png)


**这样理解**
一开始整个script作为宏任务入场,紧接着然后再执行微任务,然后在执行一个宏任务(如settimeout,如果这个定时器里面又产生了新的宏任务(如process.nextTick之类的,则会执行新产生的宏任务),没有的话去检测一下微任务队列,因为上一轮的微任务队列已经被清空了,所以此时宏任务也没产生新的微任务,所以继续执行下一个宏任务.以此往复

**举个例子**
去银行排队就是一个宏任务,一开始检查整个队列(同步执行),这也是以此宏任务,然后开始执行业务,比如排在第一的人要取钱,然后换到下一个人(下一个宏任务),这个人要处理很多业务(有很多个微任务),微任务进入队列,下一步执行微任务,然后再是宏任务.

先看例题
```
console.log('start')

setTimeout(() => {
  console.log('setTimeout')
}, 0)

new Promise((resolve) => {
  console.log('promise')
  resolve()
})
  .then(() => {
    console.log('then1')
  })
  .then(() => {
    console.log('then2')
  })

console.log('end')
```
结果:
```
start 
promise
end
then1
then2
setTimeout
```
问题:
1. 宏任务和微任务是什么？
2. 是谁发起的？
3. 为什么微任务的执行要先于宏任务呢？
```
执行栈选择最先进入队列的宏任务（一般都是script），执行其同步代码直至结束；
检查是否存在微任务，有则会执行至微任务队列为空；
如果宿主为浏览器，可能会渲染页面；
开始下一轮tick，执行宏任务中的异步代码（setTimeout等回调）。
```
![](https://img2020.cnblogs.com/blog/2059883/202102/2059883-20210223223853318-1075378514.png)

```js
console.log('1');

setTimeout(function() {
    console.log('2');
    process.nextTick(function() {
        console.log('3');
    })
    new Promise(function(resolve) {
        console.log('4');
        resolve();
    }).then(function() {
        console.log('5')
    })
})
process.nextTick(function() {
    console.log('6');
})
new Promise(function(resolve) {
    console.log('7');
    resolve();
}).then(function() {
    console.log('8')
})

setTimeout(function() {
    console.log('9');
    process.nextTick(function() {
        console.log('10');
    })
    new Promise(function(resolve) {
        console.log('11');
        resolve();
    }).then(function() {
        console.log('12')
    })
})
```
### 宏任务和微任务例题
**第一轮循环：**

```text
1）、首先打印 1
2）、接下来是setTimeout是异步任务且是宏任务，加入宏任务暂且记为 setTimeout1
3）、接下来是 process 微任务 加入微任务队列 记为 process1
4）、接下来是 new Promise 里面直接 resolve(7) 所以打印 7 后面的then是微任务 记为 then1
5）、setTimeout 宏任务 记为 setTimeout2


第一轮循环打印出的是 1 7
当前宏任务队列：setTimeout1, setTimeout2
当前微任务队列：process1, then1,
```

**第二轮循环：**

```text
1）、执行所有微任务
2）、执行process1，打印出 6
3）、执行then1 打印出8
4）、微任务都执行结束了，开始执行第一个宏任务
5）、执行 setTimeout1 也就是 第 3 - 14 行
6）、首先打印出 2
7）、遇到 process 微任务 记为 process2
8）、new Promise中resolve 打印出 4
9）、then 微任务 记为 then2

第二轮循环结束，当前打印出来的是 1 7 6 8 2 4
当前宏任务队列：setTimeout2
当前微任务队列：process2, then2
```

**第三轮循环：**

```text
1）、执行所有的微任务
2）、执行 process2 打印出 3
3）、执行 then2 打印出 5
4）、执行第一个宏任务，也就是执行 setTimeout2 对应代码中的 25 - 36 行
5）、首先打印出 9
6）、process 微任务 记为 process3
7）、new Promise执行resolve 打印出 11
8）、then 微任务 记为 then3


第三轮循环结束，当前打印顺序为：1 7 6 8 2 4 3 5 9 11
当前宏任务队列为空
当前微任务队列：process3，then3
```

### 第四轮循环：

```text
1）、执行所有的微任务
2）、执行process3 打印出 10
3）、执行then3 打印出 12

代码执行结束：
最终打印顺序为：1 7 6 8 2 4 3 5 9 11 10 12
```

### async函数属于宏任务还是微任务?
>这里有个很重要的概念

**async关键字的函数，它的仅仅是把return值包装成了promise，其他并没有什么不同的地方。**

![image](https://img2022.cnblogs.com/blog/2059883/202203/2059883-20220303165108217-1383373892.png)

### 关于await的细节
- await等的右边的计算结果
- await会先执行右边的内容
- await会让出线程，阻塞后面的代码，也就是跳出async函数

思考题:
```
console.log('script start')

async function async1() {
  await async2()
  console.log('async1 end')
}
async function async2() {
  console.log('async2 end')
}
async1()

setTimeout(function() {
  console.log('setTimeout')
}, 0)

new Promise(resolve => {
  console.log('Promise')
  resolve()
})
  .then(function() {
    console.log('promise1')
  })
  .then(function() {
    console.log('promise2')
  })

console.log('script end')
```