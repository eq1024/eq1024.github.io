---
title: this 不是作用域，它看的是调用方式
date: 2021-01-20
description: 用调用点而不是“六种函数写法”理解 this：默认绑定、隐式绑定、显式绑定、new 和箭头函数。
tags:
  - JavaScript
  - 计算机基础
outline: true
---

我早年学 `this` 时，背过一份“六种函数调用方式”的清单：

```text
普通函数
对象方法
构造函数
事件函数
定时器
立即执行函数
```

清单本身没错，但它容易让人以为 `this` 和函数写法绑定。真正决定 `this` 的，是**函数被调用时的位置和方式**。

## this 不是作用域

作用域决定变量从哪里找，`this` 是当前调用上下文里的一个值。

```js
const user = {
  name: "Ada",
  greet() {
    console.log(this.name)
  },
}

user.greet() // "Ada"
```

这里 `this` 指向 `user`，不是因为 `greet` 定义在 `user` 里，而是因为调用形式是 `user.greet()`。

## 默认绑定

独立调用函数：

```js
function show() {
  console.log(this)
}

show()
```

在非严格模式下，`this` 通常指向全局对象；在严格模式或 ES Module 中，`this` 是 `undefined`。

不要依赖全局对象上的 `this`。现代代码应该明确写出依赖的上下文。

## 隐式绑定

通过对象调用：

```js
const person = {
  name: "Ada",
  greet() {
    console.log(this.name)
  },
}

person.greet()
```

`this` 指向 `person`。

但把方法取出来再调用，绑定就丢了：

```js
const greet = person.greet
greet() // 默认绑定
```

这是 React 事件处理、回调注册和定时器里最常见的 `this` 问题。

## 显式绑定

`call`、`apply`、`bind` 可以指定 `this`：

```js
function greet() {
  console.log(this.name)
}

const person = { name: "Ada" }

greet.call(person)  // 立即执行
greet.apply(person) // 立即执行，参数用数组

const bound = greet.bind(person)
bound() // 返回新函数，之后执行
```

`bind` 适合把方法作为回调传出去，同时保留上下文。

## new 绑定

```js
function Person(name) {
  this.name = name
}

const person = new Person("Ada")
```

`new` 大致做了几件事：

1. 创建一个新对象。
2. 让新对象的内部原型指向 `Person.prototype`。
3. 以新对象为 `this` 执行构造函数。
4. 如果构造函数返回对象，就使用返回对象；否则返回新对象。

```js
function A() {
  this.value = 1
  return { value: 2 }
}

new A().value // 2
```

返回原始值时不会覆盖新对象：

```js
function B() {
  this.value = 1
  return 2
}

new B().value // 1
```

## 箭头函数没有自己的 this

```js
const obj = {
  name: "Ada",
  greet() {
    const inner = () => {
      console.log(this.name)
    }
    inner()
  },
}

obj.greet() // "Ada"
```

箭头函数不会创建自己的 `this`，它捕获定义时外层函数的 `this`。

所以箭头函数不能当构造函数，也没有自己的 `arguments`。不要用 `call` / `apply` / `bind` 去改变箭头函数的 `this`，它不会生效。

## 事件和定时器

普通函数作为事件监听器：

```js
button.addEventListener("click", function () {
  console.log(this) // button
})
```

这里的 `this` 指向绑定监听器的元素，通常是 `currentTarget`。如果改成箭头函数，`this` 会来自外层。

定时器：

```js
setTimeout(function () {
  console.log(this)
}, 0)
```

不同宿主环境对这里的 `this` 处理不同。浏览器非严格模式下通常是全局对象，Node.js 中不是同一个东西。

不要在这里靠猜。需要上下文时，用 `bind` 或箭头函数明确捕获。

## 一张判断表

| 调用方式 | this |
|---|---|
| `fn()` | 非严格模式为全局对象，严格模式为 undefined |
| `obj.fn()` | `obj` |
| `fn.call(obj)` / `fn.apply(obj)` | `obj` |
| `new Fn()` | 新创建的实例 |
| 箭头函数 | 外层函数的 this |

## 最后

`this` 不是“函数内部的变量”，也不是词法作用域的一部分。它由调用点决定，箭头函数是例外。

当你看到 `this` 时，先找调用表达式，再看是否用了 `call` / `apply` / `bind`，最后看是不是箭头函数。按这个顺序，大多数题都不需要背。
