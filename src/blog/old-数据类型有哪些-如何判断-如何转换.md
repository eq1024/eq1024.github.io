---
title: 判断 JavaScript 类型，别再只背 typeof
date: 2022-03-06
description: 从八种语言类型到 typeof、instanceof、Object.is 和显隐式转换，整理一份真正能用的类型判断笔记。
tags:
  - JavaScript
  - 计算机基础
outline: true
---

`typeof null === "object"` 几乎成了 JavaScript 面试的暗号。

但真正写代码时，类型判断远比背这一条复杂：数组和对象怎么分？跨 iframe 的对象还能用 `instanceof` 吗？`NaN` 为什么连自己都不等于？`==` 到底在什么时候会把人坑哭？

这篇文章想把这些边界一次讲清楚。

## 语言里到底有几种类型

JavaScript 有八种语言类型：

- `Undefined`
- `Null`
- `Boolean`
- `Number`
- `BigInt`
- `String`
- `Symbol`
- `Object`

数组、函数、日期、正则、`Map`、`Set` 都是 `Object` 的不同形态，不是独立的语言类型。

## typeof 能做什么，不能做什么

```js
typeof undefined      // "undefined"
typeof true           // "boolean"
typeof 1              // "number"
typeof 1n             // "bigint"
typeof "hello"        // "string"
typeof Symbol("id")   // "symbol"
typeof {}             // "object"
typeof []             // "object"
typeof function () {} // "function"
typeof null           // "object"
```

`typeof null` 返回 `"object"` 是规范保留下来的历史行为。把它解释成“机器码后三位是 000”并不适合当作心智模型，知道这个结果不可靠就够了。

`typeof` 也不能区分数组和普通对象，更不能区分 `Date`、`Map`、`Set` 这些具体对象。

## 判断数组：Array.isArray

```js
Array.isArray([])        // true
Array.isArray({})        // false
Array.isArray(new Set()) // false
```

它比 `instanceof Array` 更稳，因为它不依赖当前执行上下文里的 `Array` 构造函数。

## instanceof 看的是原型链

```js
const date = new Date()

date instanceof Date   // true
date instanceof Object // true
```

`instanceof` 会沿着对象的原型链查找构造函数的 `prototype`。所以它判断的是“原型链上有没有这个构造函数的原型”，不是读 `constructor.name`。

跨 iframe 或不同 realm 时，两边的 `Array`、`Object` 构造函数不是同一个，`instanceof` 可能失效。这种场景更适合用 `Array.isArray` 或标签判断。

## 更通用的标签判断

```js
function getTag(value) {
  return Object.prototype.toString.call(value)
}

getTag([])        // "[object Array]"
getTag(null)      // "[object Null]"
getTag(new Map()) // "[object Map]"
```

这个方法依赖 `Symbol.toStringTag`，适合做兜底，但不要把它当成唯一的真理。业务代码里优先用更具体的 API：

- 数组：`Array.isArray`
- `NaN`：`Number.isNaN`
- 整数：`Number.isInteger`
- 普通对象：原型是 `Object.prototype` 或 `null`，同时排除数组等

## NaN 和 -0

```js
NaN === NaN        // false
Object.is(NaN, NaN) // true

0 === -0           // true
Object.is(0, -0)    // false
```

需要区分 `NaN` 和 `-0` 时，用 `Object.is`。日常判断 `NaN` 更推荐 `Number.isNaN`：

```js
Number.isNaN("hello") // false
Number.isNaN(NaN)     // true
```

全局 `isNaN` 会先做类型转换，所以 `isNaN("hello")` 是 `true`，很容易误判。

## 显式转换

### Number

```js
Number("")        // 0
Number(" 42 ")    // 42
Number("42px")    // NaN
Number(null)      // 0
Number(undefined) // NaN
Number(true)      // 1
```

`Number` 是整体转换。只要字符串里有多余字符，就可能得到 `NaN`。

`parseInt` 是逐字符解析：

```js
parseInt("42px", 10) // 42
parseInt("08", 10)   // 8
```

它适合“从字符串开头提取整数”，不适合做严格的输入校验。严格校验最好配合正则或表单规则。

### String

```js
String(42)   // "42"
String(null) // "null"
```

模板字符串和 `+ ""` 也会触发字符串转换，但显式 `String()` 更容易读。

### Boolean

这些值会转换成 `false`：

```js
false
0
-0
0n
NaN
""
null
undefined
```

其他值都是 `true`，包括 `[]`、`{}` 和 `"0"`。不要用“看起来空不空”来判断布尔值。

## 隐式转换

`+` 最容易出问题：

```js
1 + "2"   // "12"
1 - "2"   // -1
1 + true  // 2
[] + []   // ""
[] + {}   // "[object Object]"
```

`+` 只要遇到字符串或能被转成字符串的对象，就可能做拼接。`-`、`*`、`/` 则会倾向数字转换。

`==` 也有一套复杂的转换规则：

```js
null == undefined // true
0 == ""           // true
0 == false        // true
"" == false       // true
```

这就是为什么现代代码通常要求用 `===`。不是 `==` 一定错，而是你需要为每一次使用解释清楚转换过程，成本太高。

## BigInt 和 Symbol 的边界

`BigInt` 不能和 `Number` 直接混合运算：

```js
1n + 1 // TypeError
```

需要显式转换，但要小心精度。

`Symbol` 不会出现在普通的字符串拼接和 `JSON.stringify` 里：

```js
JSON.stringify({ id: Symbol("id") }) // "{}"
```

`BigInt` 也不能直接 `JSON.stringify`，需要自定义序列化。

## 我现在的习惯

- 输入边界先校验类型，不要等到业务深处再猜。
- 数组用 `Array.isArray`，`NaN` 用 `Number.isNaN`，值比较优先 `Object.is`。
- 不用 `instanceof` 判断跨 realm 的对象。
- 不写依赖隐式转换的“聪明代码”。
- 遇到 `typeof` 的结果，先想清楚它是语言行为，还是当前运行环境的实现细节。

类型判断本身不难，难的是知道哪个判断在什么边界下会失效。
