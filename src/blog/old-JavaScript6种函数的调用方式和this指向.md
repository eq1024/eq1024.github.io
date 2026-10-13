---
title: "【JavaScript】6种函数的调用方式和this指向"
date: 2021-01-20
description: "六种调用函数的方法 普通函数 function fn1(){ log(1); } 调用 : fn1(); this指向 : window 对象函数 var obj={ a : 0, b : 1, fn2:function(){ log(2); } } 调用 : obj.fn2()"
tags:
  - JavaScript
  - 计算机基础
---

## 六种调用函数的方法

### 普通函数

```
function fn1(){
log(1);
}
```
`调用 :` fn1();
`this指向 :` window


### 对象函数
```
var obj={ 
a : 0,
b : 1,
fn2:function(){
log(2);
}
}
```
`调用 :` obj.fn2();
`this指向 :` 该方法所属对象 即此处的`obj`


### 构造函数
```
function fn3(uname,uage){
  this.uname=uname;
  this.uage=uage;
  this.log=function(){log(3)};
}

fn3.prototype.sing=function(){
      console.log(this);
}
```
`调用 :` var fn = new fn3('参数','参数')
`this指向 :` 实例对象,即此处的`fn`,值得注意的是,构造函数的`原型对象`的`this`也是指向`实例对象`的


### 事件函数
```
btn.onclick=function fn1(){
log(4);
}
```
`调用 :` 点击/ele.click()
`this指向 :` 绑定事件的对象,即此处`btn`

### 定时函数
```
setTimeout=(function fn1(){
log(5);
},500)
```
`调用 :` 自动调用
`this指向 :` window


### 立即执行
```
(function fn1(){
log(6);
})()
```
`调用 :` 自动执行
`this指向 :` window

## this指向问题详解

> #### 看一道题

```javascript
var number = 5;
var obj = {
    number: 3,
    fn1: (function () {
        var number;
        this.number *= 2;
        number = number * 2;
        number = 3;
        return function () {
            var num = this.number;
            this.number *= 2;
            console.log(num);
            number *= 3;
            console.log(number);
        }
    })()
}
var fn1 = obj.fn1;
fn1.call(null);
obj.fn1();
console.log(window.number);
```

### this是什么

> this**不是指向自身**！this 就是一个**指针**，指向**调用函数**的**对象**。

### 默认绑定

默认绑定，在不能应用其它绑定规则时使用的默认规则，通常是独立函数调用。

```javascript
function sayHi(){
    console.log('Hello,', this.name);
}
var name = 'YvetteLau';
sayHi();
复制代码
```

在调用Hi()时，应用了默认绑定，this指向全局对象（非严格模式下），严格模式下，this指向undefined，undefined上没有this对象，会抛出错误。

### 隐式绑定

函数的调用是在某个对象上触发的，即调用位置上存在上下文对象。典型的形式为 XXX.fun().我们来看一段代码：

```
function sayHi(){
    console.log('Hello,', this.name);
}
var person = {
    name: 'YvetteLau',
    sayHi: sayHi
}
var name = 'Wiliam';
person.sayHi();
复制代码
```

打印的结果是 Hello,YvetteLau.

```javascript
person1.friend.sayHi();
```

`注意`对象属性链中只有最后一层会影响到调用位置，不管有多少层，在判断this的时候，我们只关注最后一层，即此处的friend。

**特殊情况**

```javascript
var name='Wiliam';
function sayHi(){
    console.log('Hello,', this.name);
}
var person2 = {
    name: 'Christina',
    sayHi: sayHi
}
setTimeout(person2.sayHi,100); // Hello, Wiliam
```

我们知道`setTimeout`是由`Window`调用，也就是说this是**默认绑定**，但是执行的时候执行的应该是`person2.sayHi`，也就是说，`sayHi`的方法是隐式绑定，`this`应该是指向`person2`的，但实际上是指向`Window`的，因为`setTimeout`会默认把需要执行的函数，也就是`setTimeout`的第一个参数，直接当做一个整体，直接去执行他，所以执行的对象是`Window`。上面的只关注最后一层方法在这里是不适用的，这种现象我们成为**绑定丢失**。

**绑定丢失：**this不再绑定在方法的最后一层对象上，而是在其他对象上直接执行，跳过最后一层对象。

### 显式绑定

> 就是通过call,apply,bind的方式，显式的指定this所指向的对象

call和apply的作用一样，只是传参方式不同。call和apply都会执行对应的函数，而bind方法不会。

```
function sayHi(){
    console.log('Hello,', this.name);
}
var person = {
    name: 'YvetteLau',
    sayHi: sayHi
}
var name = 'Wiliam';
var Hi = person.sayHi;
Hi.call(person); //Hi.apply(person)
复制代码
```

输出的结果为: Hello, YvetteLau. 因为使用硬绑定明确将this绑定在了person上。

**特殊情况**

和隐式绑定一样，也会出现**绑定丢失**的情况。

```javascript
function sayHi(){
    console.log('Hello,', this.name);
}
var person = {
    name: 'YvetteLau',
    sayHi: sayHi
}
var name = 'Wiliam';
var Hi = function(fn) {
    fn.call(this);
}
Hi.call(person, person.sayHi);
复制代码
```

此时，输出的结果为: Hello, YvetteLau，因为person被绑定到Hi函数中的this上，fn又将这个对象绑定给了sayHi的函数。这时，sayHi中的this指向的就是person对象。

### new 绑定

> 使用new来调用函数，会自动执行下面的操作：

1. 创建一个空对象，构造函数中的this指向这个空对象(CO.call(obj);)
2. 这个新对象被执行 [[原型]] 连接，将这个空对象的\__proto__成员指向了构造函数对象的prototype成员对象
3. 执行构造函数方法，属性和方法被添加到this引用的对象中
4. 如果构造函数中没有返回其它对象(是否使用了return)，那么返回this，即创建的这个的新对象（下面例子），否则，返回构造函数中返回的对象。

```javascript
function fn()  {  this.user = '二柒';  return {};  }
function fn1()  {  this.user = '二柒';    }
var a = new fn;  
var b = new fn1;  
console.log(a); // {}
console.log(b); // {user = '二柒'}
```



### 箭头函数

箭头函数是ES6中新增的，它和普通函数有一些区别，箭头函数没有自己的this，它的this继承于外层代码库中的this。箭头函数在使用时，需要注意以下几点:

（1）函数体内的this对象，继承的是外层代码块的this。

（2）不可以当作构造函数，也就是说，不可以使用new命令，否则会抛出一个错误。

（3）不可以使用arguments对象，该对象在函数体内不存在。如果要用，可以用 rest 参数代替。

（4）不可以使用yield命令，因此箭头函数不能用作 Generator 函数。

（5）箭头函数没有自己的this，所以不能用call()、apply()、bind()这些方法去改变this的指向.

```javascript
var obj = {
    hi: function(){
        console.log(this);
        return ()=>{
            console.log(this);
        }
    },
    sayHi: function(){
        return function() {
            console.log(this);
            return ()=>{
                console.log(this);
            }
        }
    },
    say: ()=>{
        console.log(this);
    }
}
let hi = obj.hi();  //输出obj对象
hi();               //输出obj对象
let sayHi = obj.sayHi();
let fun1 = sayHi(); //输出window
fun1();             //输出window
obj.say();          //输出window
```

我们来分析一下上面的执行结果：

1. obj.hi(); 对应了this的隐式绑定规则，this绑定在obj上，所以输出obj，很好理解。
2. hi(); 这一步执行的就是箭头函数，箭头函数继承上一个代码库的this，刚刚我们得出上一层的this是obj，显然这里的this就是obj.
3. 执行sayHi();这一步也很好理解，我们前面说过这种隐式绑定丢失的情况，这个时候this执行的是默认绑定，this指向的是全局对象window.
4. fun1(); 这一步执行的是箭头函数，如果按照之前的理解，this指向的是箭头函数定义时所在的对象，那么这儿显然是说不通。OK，按照箭头函数的this是继承于外层代码库的this就很好理解了。外层代码库我们刚刚分析了，this指向的是window，因此这儿的输出结果是window.
5. obj.say(); 执行的是箭头函数，当前的代码块obj中是不存在this的，只能往上找，就找到了全局的this，指向的是window.

> #### 例题解答

```
var number = 5;
var obj = {
    number: 3,
    fn: (function () {
        var number;
        this.number *= 2;
        number = number * 2;
        number = 3;
        return function () {
            var num = this.number;
            this.number *= 2;
            console.log(num);
            number *= 3;
            console.log(number);
        }
    })()
}
var myFun = obj.fn;
myFun.call(null);
obj.fn();
console.log(window.number);
复制代码
```

我们来分析一下，这段代码的执行过程。

1. 在定义obj的时候，fn对应的闭包就执行了，返回其中的函数，执行闭包中代码时，显然应用不了new绑定(没有出现new 关键字)，硬绑定也没有(没有出现call,apply,bind关键字),隐式绑定有没有？很显然没有，如果没有XX.fn()，那么可以肯定没有应用隐式绑定，所以这里应用的就是默认绑定了，非严格模式下this绑定到了window上(浏览器执行环境)。【这里很容易被迷惑的就是以为this指向的是obj，一定要注意，除非是箭头函数，否则this跟词法作用域是两回事，一定要牢记在心】

```
window.number * = 2; //window.number的值是10(var number定义的全局变量是挂在window上的)

number = number * 2; //number的值是NaN;注意我们这边定义了一个number，但是没有赋值，number的值是undefined;Number(undefined)->NaN

number = 3;          //number的值为3
复制代码
```

1. myFun.call(null);我们前面说了，call的第一个参数传null，调用的是默认绑定;

```
fn: function(){
    var num = this.number;
    this.number *= 2;
    console.log(num);
    number *= 3;
    console.log(number);
}
复制代码
```

执行时:

```
var num = this.number; //num=10; 此时this指向的是window
this.number * = 2;     //window.number = 20
console.log(num);      //输出结果为10
number *= 3;           //number=9; 这个number对应的闭包中的number;闭包中的number的是3
console.log(number);   //输出的结果是9
复制代码
```

1. obj.fn();应用了隐式绑定，fn中的this对应的是obj.

```
var num = this.number;//num = 3;此时this指向的是obj
this.number *= 2;     //obj.number = 6;
console.log(num);     //输出结果为3;
number *= 3;          //number=27;这个number对应的闭包中的number;闭包中的number的此时是9
console.log(number);  //输出的结果是27
复制代码
```

1. 最后一步console.log(window.number);输出的结果是20

因此组中结果为:

```
10
9
3
27
20
复制代码
```