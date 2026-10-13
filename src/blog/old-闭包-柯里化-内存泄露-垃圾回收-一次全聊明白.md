---
title: "闭包、柯里化、内存泄露、垃圾回收，一次全聊明白"
date: 2022-03-05
description: "本文涉及内容 闭包 柯里化 内存泄露 垃圾回收 阅读本文前，您需要对作用域和作用域链、原型和原型链有足够了解，见本博客另一篇文章，点这里，以及对this指向有足够了解，点这里 什么是闭包 能够访问其他函数内部变量的函数，被称为 闭包，简单来说，闭包就是函数内部定义的函数，被返回了"
tags:
  - JavaScript
  - 计算机基础
---

### 本文涉及内容

- 闭包
- 柯里化
- 内存泄露
- 垃圾回收

**阅读本文前，您需要对作用域和作用域链、原型和原型链有足够了解，见本博客另一篇文章，[点这里](https://www.cnblogs.com/EQ1024/p/15977786.html)，以及对this指向有足够了解，[点这里](https://www.cnblogs.com/EQ1024/p/14303210.html)**

### 什么是闭包

> 能够访问其他函数内部变量的函数，被称为 闭包，简单来说，闭包就是函数内部定义的函数，被返回了出去并在外部调用，它绕过了作用域的监管机制，从外部也能获取到内部作用域的信息

笔者认为，不应该问什么是闭包，而是问谁有闭包。因为闭包的作用就如同一个作用域，携带着原本执行完就会销毁的数据（一个函数内的局部变量执行完毕后就会销毁），而能够访问其他函数内部变量的函数就会产生闭包。

把闭包想象成一个背包就行，当闭包函数被返回，作用域链的顺序是：

**闭包 --> 外部函数作用域  --> 外部函数的外部函数作用域  --> 直到全局作用域**

也就是说，会最先到闭包里**去找**



**作用域和上下文的区别**

上下文包含作用域,上下文指的是当前的作用域和包裹在它外面的作用域的合集.

#### 闭包例子

```javascript
function foo() {
  var a = 2;
  function bar() {
    console.log( a );
  }
  return bar;
}
var baz = foo();
baz(); // 这就形成了一个闭包
```

从上面的例子我们能看出闭包形成的主要特征：

- 一般会出现一个return，也可以不return直接调用（如在foo中直接调用bar）
- return中往往会出现引用函数作用域变量的代码
- 被返回到外部去

#### 复杂例子

```javascript
function createCounter() {
  let counter = 0
  const myFunction = function () {
    counter = counter + 1
    return counter
  }
  return myFunction
}
const increment = createCounter()
const c1 = increment()
const c2 = increment()
const c3 = increment()

//console.log('example increment', c1, c2, c3)
```

1. 第`1-8`行。我们在全局执行上下文中创建了一个新的变量`createCounter`，它得到了指定的函数定义。
2. 第`9`行。我们在全局执行上下文中声明了一个名为`increment`的新变量。
3. 第`9`行。我们需要调用`createCounter`函数并将其返回值赋给`increment`变量。
4. 第`1-8`行。调用函数，创建新的本地执行上下文。
5. 第`2`行。在本地执行上下文中，声明一个名为`counter`的新变量并赋值为 `0` 。
6. 第`3-6`行。声明一个名为`myFunction`的新变量，变量在本地执行上下文中声明,变量的内容是另一个函数定义。如第`4`行和第`5`行所定义，现在我们还创建了一个闭包，并将其作为函数定义的一部分。闭包包含作用域中的变量，在本例中是变量`counter`(值为`0`)。
7. 第`7`行。返回`myFunction`变量的内容,删除本地执行上下文。`myFunction`和`counter`不再存在。控制权交给了调用上下文，我们返回函数定义和它的闭包，闭包中包含了创建它时在作用域内的变量。
8. 第`9`行。在调用上下文(全局执行上下文)中，`createCounter`返回的值被指定为`increment`，变量`increment`现在包含一个函数定义(和闭包),由createCounter返回的函数定义,它不再标记为`myFunction`，但它的定义是相同的,在全局上下文中，称为`increment`。
9. 第`10`行。声明一个新变量`c1`。
10. 继续第`10`行。查找变量`increment`，它是一个函数，调用它。它包含前面返回的函数定义,如第`4-5`行所定义的。(它还有一个带有变量的闭包)。
11. 创建一个新的执行上下文，没有参数，开始执行函数。
12. 第`4`行。`counter = counter + 1`，寻找变量 `counter`，在查找本地或全局执行上下文之前，让我们检查一下闭包，瞧，闭包包含一个名为`counter`的变量，其值为`0`。在第`4`行表达式之后，它的值被设置为`1`。它再次被储存在闭包里，闭包现在包含值为`1`的变量 `counter`。
13. 第`5`行。我们返回`counter的值`，销毁本地执行上下文。
14. 回到第`10`行。返回值`1`被赋给变量`c1`。
15. 第`11`行。我们重复步骤`10-14`。这一次，在闭包中此时变量`counter`的值是1。它在第`12`行设置的，它的值被递增并以`2`的形式存储在递增函数的闭包中,`c2`被赋值为`2`。
16. 第`12`行。重复步骤`10-14`行,`c3`被赋值为3。
17. 第13行。我们打印变量`c1 c2`和`c3`的值。

### 柯里化

> 柯里化是一种将使用多个参数的一个函数转换成一系列使用一个参数的函数的技术

**示例一**

```javascript
源函数
addX= (a,b) => a+b

****柯里化****

简写
let c = 4
const addX = x => n => n + x
const addThree = addX(3)
let d = addThree(c)

正常写
let c = 4
function addX(x) {
  return function(n) {
     return n + x
  }
}
const addThree = addX(3)
let d = addThree(c)

```

**示例二**

```javascript
// 数学和计算科学中的柯里化：

//一个接收三个参数的普通函数
function sum(a,b,c) {
    console.log(a+b+c)
}

//用于将普通函数转化为柯里化版本的工具函数
function curry(fn) {
  //...内部实现省略，返回一个新函数
}

//获取一个柯里化后的函数
let _sum = curry(sum);

//返回一个接收第二个参数的函数
let A = _sum(1);
//返回一个接收第三个参数的函数
let B = A(2);
//接收到最后一个参数，将之前所有的参数应用到原函数中，并运行
B(3)    // print : 6

```

#### 柯里化的用途

借助柯里化对 checkByRegExp 函数进行封装，以简化代码书写，提高代码可读性。

```javascript
//进行柯里化
let _check = curry(checkByRegExp);
//生成工具函数，验证电话号码
let checkCellPhone = _check(/^1\d{10}$/);
//生成工具函数，验证邮箱
let checkEmail = _check(/^(\w)+(\.\w+)*@(\w)+((\.\w+)+)$/);

checkCellPhone('18642838455'); // 校验电话号码
checkCellPhone('13109840560'); // 校验电话号码
checkCellPhone('13204061212'); // 校验电话号码

checkEmail('test@163.com'); // 校验邮箱
checkEmail('test@qq.com'); // 校验邮箱
checkEmail('test@gmail.com'); // 校验邮箱
```

### 内存泄露

> 无法被自动回收，长期存在的数据，导致内存看浪费

**1. 意外的全局变量**

```javascript
function fn() {
  a = 'global variable'
   this.a = 'global variable'
}
fn()
```

函数内未声明的和使用this（指window的时候）的情况，变量挂载到全局上，造成内存泄露

**2. 闭包引起的内存泄漏**

见上面内容,通过obj=null清楚（垃圾回收为引用模式下，标记模式会清理）

**3. 没有清理的`DOM`元素引用**

```javascript
// 在对象中引用DOM
var elements = {
  btn: document.getElementById('btn'),
}
function doSomeThing() {
  elements.btn.click()
}

function removeBtn() {
  // 将body中的btn移除, 也就是移除 DOM树中的btn
  document.body.removeChild(document.getElementById('button'))
  // 但是此时全局变量elements还是保留了对btn的引用, btn还是存在于内存中,不能被GC回收
}

```

解决方法：手动删除，`elements.btn = null`。

**4. 被遗忘的定时器或者回调**

```javascript
// 定时器
var serverData = loadData()
setInterval(function () {
  var renderer = document.getElementById('renderer')
  if (renderer) {
    renderer.innerHTML = JSON.stringify(serverData)
  }
}, 5000)

// 观察者模式
var btn = document.getElementById('btn')
function onClick(element) {
  element.innerHTMl = "I'm innerHTML"
}
btn.addEventListener('click', onClick)
```

解决方法：

- 手动删除定时器和 dom。
- removeEventListener 移除事件监听

### 垃圾回收

> 分为`引用计数算法`和`清除标记算法`

IE9之前：引用计数算法

IE9之后：清除标记算法

#### 引用计数算法

> 就是判断一个对象的引用数，引用数`为0`就回收，引用数`大于0`就不回收

引用计数算法在处理 COM 对象（组件对象模型）会有循环引用的问题，而循环引用才是导致内存泄漏的元凶。

#### 清除标记算法

> 标记法就是，将`可达`的对象标记起来，`不可达`的对象当成垃圾回收。

就是从初始的`根对象（window或者global）`的指针开始，向下搜索子节点，子节点被搜索到了，说明该子节点的引用对象可达，并为其进行标记，然后接着递归搜索，直到所有子节点被遍历结束。那么没有被遍历到节点，也就没有被标记，也就会被当成没有被任何地方引用，就可以证明这是一个需要被释放内存的对象，可以被垃圾回收器回收。

```javascript
这种循环就会被清理
function cycle(){
  let obj1={}
  let obj2={}
  obj1[a]=obj2
  obj2[a]=obj1
}
```

普通的理解其实是不够的，因为`垃圾回收机制(GC)`其实不止这两个算法，想要更深入地了解`V8垃圾回收机制`，就继续往下看吧！！！

[掘金-20分钟打败了「V8垃圾回收机制」](https://juejin.cn/post/6995706341041897486)