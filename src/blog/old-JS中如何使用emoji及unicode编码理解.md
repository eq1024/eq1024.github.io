---
title: 为什么 '😊'.length 等于 2
date: 2023-02-18
description: 从码点、UTF-8、UTF-16 代理对到字素簇，解释为什么字符串长度、截断和 emoji 处理总出问题。
tags:
  - JavaScript
  - 计算机基础
outline: true
---

先看一个很小但很反直觉的例子：

```js
"😊".length // 2
```

一个看起来只有一个表情的字符串，长度却是 2。

这不是 JavaScript 故意和开发者作对，而是因为“字符”这个词在不同层次上指的不是同一个东西。

## 码点、编码和字符串

Unicode 给字符分配码点，例如：

```text
U+1F60A 😊
U+0041  A
U+4E2D  中
```

码点是一个抽象编号，不是磁盘上的字节。

UTF-8、UTF-16、UTF-32 是把码点编码成字节的不同方式：

- UTF-8 变长，1 到 4 字节。
- UTF-16 使用 2 字节或 4 字节。
- UTF-32 固定 4 字节，占用大，实际使用少。

所以“Unicode 用四个字节编码”是错误的。Unicode 是字符集和码点空间，UTF 才是编码方式。

## 为什么 length 是 2

JavaScript 字符串按 UTF-16 代码单元计数。基本多文种平面之外的码点需要用代理对表示：

```js
"😊".length        // 2
"😊".codePointAt(0) // 128522

"😊"[0] // "\uD83D"
"😊"[1] // "\uDE0A"
```

`length` 返回的是代码单元数量，不是码点数量，也不是用户感知的字符数量。

## 正确遍历码点

用 `for...of` 或展开运算符：

```js
[... "😊"] // ["😊"]
Array.from("😊") // ["😊"]

for (const char of "😊") {
  console.log(char)
}
```

## fromCharCode 和 fromCodePoint

```js
String.fromCharCode(0x1F60A) // 截断后的结果
String.fromCodePoint(0x1F60A) // "😊"
```

`fromCharCode` 接收 UTF-16 代码单元，超出 16 位的值会被截断。`fromCodePoint` 接收完整码点。

同理，`charCodeAt` 得到的是代码单元，`codePointAt` 才能拿到完整码点。

## 字素簇才是用户眼里的“字符”

即使按码点计算，也不一定符合用户直觉。

```js
"👨‍👩‍👧‍👦".length          // 多个代码单元
"👍🏽".length               // 基础表情 + 肤色修饰符
"🇨🇳".length               // 两个区域指示符
```

这些由多个码点组合成的“一个字”，在 Unicode 里叫字素簇（grapheme cluster）。

如果需要按用户感知字符切分，可以使用 `Intl.Segmenter`：

```js
const segmenter = new Intl.Segmenter("zh", {
  granularity: "grapheme",
})

const segments = [...segmenter.segment("👨‍👩‍👧‍👦")]
console.log(segments.length) // 1
```

处理昵称、评论、输入框字数时，这一点很重要。直接 slice 可能把 emoji 或代理对截断。

## UTF-8 和 UTF-16 不是一回事

浏览器内部字符串通常以 UTF-16 代码单元为单位暴露给 JavaScript，但网络传输和文件存储常用 UTF-8。

```js
const bytes = new TextEncoder().encode("😊")
// Uint8Array(4) [240, 159, 152, 138]

const text = new TextDecoder().decode(bytes)
// "😊"
```

UTF-8 编码 `U+1F60A` 是 4 个字节。

如果错误地把 UTF-16 的两个代理项分别当成独立字符去编码，可能得到一种类似 CESU-8 的 6 字节结果，而不是标准 UTF-8。它看起来像“同一个字符的两种编码”，但本质上是编码层次被弄混了。

## 规范化

有些字符可以用不同码点序列表示：

```js
"é" === "e\u0301" // false
"é".normalize("NFC") === "e\u0301".normalize("NFC") // true
```

用户输入、URL、文件名和搜索匹配时，可能需要进行 Unicode 规范化。

## 最后

记住三个层次：

```text
码点：字符的抽象编号
代码单元：JavaScript 字符串的计数单位
字素簇：用户感知的一个字符
```

看到 `'😊'.length === 2` 时，不要急着说“JavaScript 的 bug”。它只是按代码单元计数。

真正需要处理用户输入时，按字素簇切分，别按代码单元硬切。
