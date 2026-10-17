---
title: CommonJS 和 ESM，不只是 require 和 import 的写法差异
date: 2022-03-06
description: 从加载时机、缓存、值绑定、动态导入和互操作问题出发，理解 CommonJS 与 ES Module 的真正差异。
tags:
  - JavaScript
  - 工程化
outline: true
---

CommonJS 和 ES Module 最表面的区别是：

```js
const fs = require("fs")
import fs from "node:fs"
```

但如果只记这两行，遇到 `require` 和 `import` 混用、默认导入、循环依赖、`__dirname` 找不到时，还是会一头雾水。

## CommonJS

```js
// math.cjs
function add(a, b) {
  return a + b
}

module.exports = { add }
```

```js
const { add } = require("./math.cjs")
```

`require` 是同步加载，模块执行后返回 `module.exports` 对象。模块第一次加载后会被缓存，后续 `require` 直接拿缓存。

`exports` 是 `module.exports` 的初始引用：

```js
exports.a = 1
```

但重新赋值会断开联系：

```js
exports = { a: 1 } // 不会影响 module.exports
module.exports = { a: 1 } // 正确
```

CommonJS 的顶层 `this` 通常指向 `module.exports`，并且可以直接使用 `__dirname`、`__filename`、`require`。

## ES Module

```js
// math.mjs
export function add(a, b) {
  return a + b
}
```

```js
import { add } from "./math.mjs"
```

ESM 的导入是静态的：模块依赖在代码执行前就能被分析出来。它适合 tree shaking，也要求路径、扩展名和包导出配置更明确。

ESM 导出的是活绑定：

```js
// counter.mjs
export let count = 0

export function increment() {
  count++
}
```

```js
import { count, increment } from "./counter.mjs"

console.log(count) // 0
increment()
console.log(count) // 1
```

导入的 `count` 不是拷贝，而是对原绑定的只读视图。你不能直接给 `count` 赋值，但模块内部更新后，导入方能看到新值。

CommonJS 更接近“导出对象的值”。如果解构的是原始值，后续变化不会自动同步；如果通过对象属性访问，则可能看到更新。

## 加载时机

CommonJS 的 `require` 在运行时执行，所以可以根据条件动态加载：

```js
if (needHeavy) {
  const heavy = require("./heavy")
}
```

ESM 的静态 `import` 必须在模块顶层，依赖在模块图解析阶段确定。需要按需加载时用动态导入：

```js
if (needHeavy) {
  const { default: heavy } = await import("./heavy.mjs")
}
```

动态 `import()` 返回 Promise，适合路由懒加载和大型依赖按需加载。

注意，静态 `import` 不是“运行时异步加载一个变量”。模块加载可能涉及网络或文件系统，但它的语义是在执行前解析依赖图。不要和动态导入混为一谈。

## 常见的互操作坑

### package.json 的 type

```json
{
  "type": "module"
}
```

设置后，`.js` 默认按 ESM 解释。需要 CommonJS 时用 `.cjs`，需要 ESM 时可以用 `.mjs`。

### __dirname 不存在

ESM 中没有 `__dirname`：

```js
import { fileURLToPath } from "node:url"
import { dirname } from "node:path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
```

### 默认导入

CommonJS 模块被 ESM 导入时，默认导出通常是 `module.exports`，但不同工具链的互操作行为可能不同。库作者最好明确 `exports` 字段和入口，不要把兼容性留给猜测。

### 循环依赖

两种模块系统都可能有循环依赖，但表现不同。CommonJS 可能在模块还没执行完时拿到不完整的 `exports` 对象；ESM 的活绑定会提前建立，但初始化顺序仍然需要小心。

## 最后

CommonJS 是运行时加载、缓存 `module.exports`；ESM 是静态依赖图、活绑定、支持动态导入。

新项目优先 ESM，老包和 Node 工具链需要兼容时再处理 CJS。理解加载时机和绑定方式，比记住两套语法更重要。
