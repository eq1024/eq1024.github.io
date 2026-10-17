---
title: 作用域链和原型链，不是同一件事
date: 2022-03-07
description: 把词法作用域、闭包、原型查找和 this 分开理解，避免把两套完全不同的机制混在一起。
tags:
  - JavaScript
  - 计算机基础
outline: true
---

作用域链和原型链经常一起出现，因为它们都和“向上查找”有关。

但它们解决的问题完全不同：

- 作用域链决定**变量从哪里来**。
- 原型链决定**对象的属性从哪里来**。

把这两件事混在一起，后面理解闭包、`this`、`class` 和原型继承都会变得很别扭。

## 作用域是词法环境

JavaScript 采用词法作用域。函数在哪里定义，它的外层作用域就在哪里，而不是在哪里调用。

```js
const message = "global"

function outer() {
  const message = "outer"

  function inner() {
    console.log(message)
  }

  return inner
}

outer()() // "outer"
```

`inner` 在 `outer` 内部定义，所以它查找 `message` 时先看自己的作用域，再看 `outer`，最后才看全局。

这和 `this` 不一样。`this` 主要看调用方式，箭头函数除外。

## var、let 和块级作用域

`var` 只有函数作用域和全局作用域，`let` / `const` 还有块级作用域。

```js
function demo() {
  if (true) {
    var a = 1
    let b = 2
  }

  console.log(a) // 1
  console.log(b) // ReferenceError
}
```

`let` 和 `const` 还有暂时性死区：

```js
console.log(value) // ReferenceError
let value = 1
```

变量并不是“提升之后就是 undefined”。`let` 的声明会被提升到作用域顶部，但在初始化之前不能访问。

## 闭包是作用域的延续

```js
function createCounter() {
  let count = 0

  return function increment() {
    count += 1
    return count
  }
}

const increment = createCounter()
increment() // 1
increment() // 2
```

`createCounter` 执行完后，`count` 并没有立刻消失，因为返回的函数仍然引用着它。

闭包不是某种特殊语法，而是词法作用域和函数值结合后的自然结果。

## 原型链是属性查找

每个普通对象都有一个内部原型，通常可以通过 `Object.getPrototypeOf` 读取。

```js
const animal = {
  eat() {
    console.log("eating")
  },
}

const dog = Object.create(animal)
dog.bark = () => console.log("woof")

dog.bark() // woof
dog.eat()  // eating
```

`dog` 自己没有 `eat`，于是沿着原型链找到 `animal`。

用构造函数创建对象时：

```js
function Person(name) {
  this.name = name
}

Person.prototype.greet = function () {
  console.log(`Hi, ${this.name}`)
}

const person = new Person("Ada")
person.greet()
```

这里有两个不同的东西：

- `Person.prototype` 是构造函数上的属性。
- `person` 的内部原型指向 `Person.prototype`。

`person.__proto__` 是非标准的历史访问器，现代代码更适合用 `Object.getPrototypeOf(person)`。

`instanceof` 会沿原型链判断：

```js
person instanceof Person // true
person instanceof Object // true
```

但它不是读 `constructor.name`，也不是在判断“谁创建了谁”这么拟人化的事情。

## 两套链的对照

| | 作用域链 | 原型链 |
|---|---|---|
| 查找什么 | 变量和函数 | 对象属性 |
| 什么时候确定 | 函数定义时的词法环境 | 对象创建时的内部原型 |
| 典型结果 | 闭包、变量遮蔽 | 继承、方法复用 |
| 和 this 的关系 | 无直接关系 | 无直接关系 |

`this` 经常被误认为属于作用域，其实它由调用点决定。箭头函数没有自己的 `this`，会捕获外层函数的 `this`，这是另一个话题。

## 最后

作用域链回答的是“这个变量是谁”，原型链回答的是“这个属性从哪来”。两者都叫“链”，但不要把它们当成同一套查找机制。

理解这一点之后，闭包、原型继承、`class`、`instanceof` 和 `this` 就不会互相打架了。
