---
title: "作用域和作用域链、原型和原型链"
date: 2022-03-07
description: "作用域和作用域链 ES6 之前 JavaScript 没有块级作用域,只有全局作用域和函数作用域。ES6的到来，为我们提供了‘块级作用域’,可通过新增命令let和const来体现。 函数作用域 静态作用域 要到创建这个函数的那个域”。 作用域中取值,这里强调的是“创建”，而不是“"
tags:
  - JavaScript
  - 计算机基础
---

## 作用域和作用域链

**ES6 之前 JavaScript 没有块级作用域,只有全局作用域和函数作用域**。ES6的到来，为我们提供了‘块级作用域’,可通过新增命令let和const来体现。

### 函数作用域

### 静态作用域

**要到创建这个函数的那个域”。 作用域中取值,这里强调的是“创建”，而不是“调用”**，切记切记——其实这就是所谓的"静态作用域"

```javascript
var a = 10
function fn() {
  var b = 20
  function bar() {
    console.log(a + b) //30
  }
  return bar
}
var x = fn(),
  b = 200
x() //bar()
```

### 块级作用域

块级作用域在如下情况被创建：

1. 在一个函数内部
2. 在一个代码块（由一对花括号包裹）内部

```javascript
function getValue(condition) {
if (condition) {
let value = "blue";
return value;
} else {
// value 在此处不可用
return null;
}
// value 在此处不可用
}
```

### 作用域链

**什么是作用域链**

如果父级也没呢？再一层一层向上寻找，直到找到全局作用域还是没找到，就宣布放弃。这种一层一层的关系，就是 作用域链 。

## 原型和原型链

![image.png](https://gitee.com/zhouj889/pih/raw/master/NewPic/202203072015426.webp)

我们先来了解下面引用类型的四个规则：

1、引用类型，都具有对象特性，即可自由扩展属性。

2、引用类型，都有一个隐式原型 `__proto__` 属性，属性值是一个普通的对象。

3、引用类型，隐式原型 `__proto__` 的属性值指向它的构造函数的显式原型 `prototype` 属性值。

4、当你试图得到一个对象的某个属性时，如果这个对象本身没有这个属性，那么它会去它的隐式原型 `__proto__`（也就是它的构造函数的显式原型 `prototype`）中寻找。