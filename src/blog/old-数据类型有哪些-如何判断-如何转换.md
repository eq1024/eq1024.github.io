---
title: "数据类型有哪些？如何判断？如何转换？"
date: 2022-03-06
description: "数据类型 分为简单类型(基本类型)和复杂类型(引用数据类型) 基本类型：字符串（String）、数字(Number)、布尔(Boolean)、对空（Null）、未定义（Undefined）、Symbol(ES6新增)。 复杂类型：对象(Object)、数组(Array)、函数(F"
tags:
  - JavaScript
  - 计算机基础
---

### 数据类型

> 分为简单类型(基本类型)和复杂类型(引用数据类型)

**基本类型**：字符串（String）、数字(Number)、布尔(Boolean)、对空（Null）、未定义（Undefined）、Symbol(ES6新增)。

**复杂类型**：对象(Object)、数组(Array)、函数(Function)。

`注意` : Array和Function都是Object的**子类**,所以复杂类型严格意义上只有object一种,使用 instanceof object可以确定.

```javascript
console.log(Function instanceof Object);  //true
console.log(Array instanceof Object);  //true
```

Symbol是ES6新的简单数据类型，表示独一无二 

### 数据类型判断

#### 简单数据

`typyof`可以直接检测简单数据类型，但是**`null`会被识别为`object`**原因是因为：机器码尾号是000的就是object,但是由于null是00000000,所以**错误识别为object**,是语言的bug。

```javascript
let a = 123
let b = '456'
let c = true
let d = [7, 8, 9]
let e = { a: 1, b: 2, c: 3 }
let f = function(){}

console.log(typeof (a));  //number
console.log(typeof (b));  //string
console.log(typeof (c));  //boolean
console.log(typeof (d));  //object
console.log(typeof (e));  //object
console.log(typeof (f));  //function
console.log(typeof (undefined)); // undefined
console.log(typeof (null));   //object
```

**注意** : `typeof`可以正确判断function类型，也可以使用`instanceof Function`来判断是不是函数,推荐第二种,已达到统一

```javascript
console.log(typeof (f));  //function
console.log(f instanceof Function); //true
```

#### 复杂数据类型

**function**

上面提到,function可以使用typeof正确判断,但为了统一简单和复杂类型的判断方式,建议使用instanceof的方式.

**array**

```javascript
console.log(d instanceof Array) //true
console.log(Array.isArray(d)) //true
```

**object**

当我们使用`instanceof`得到一个object时,还需要通过上面的两个方式来排除它**不是数组或者函数**.

```javascript
if(e instanceof Object){
    if(e instanceof Array){console.log('是数组')}
    if(e instanceof Function){console.log('是函数')}
    console.log('是对象'）
}
```

#### 关于instanceof

> instanceof本身是`是谁的实例`的意思，所以可以用来判断是不是某个构造函数的实例

使用**`new`**关键字创建的对象，其实就是实例，也就是说最终都是Object的实例

```javascript
function Person() { };
console.log(new Person() instanceof Person); //true
console.log(new Person() instanceof Object); //true

console.log(new Date() instanceof Date;//true
console.log(new Date() instanceof Object);//true
```

**instanceof**通过在原型链上查找`constructor`来确定是不是某一个的实例，因为原型链的缘故，所以一直往上找，最后就找到`Object`了。上面的Person和Date都是构造函数。

### 数据转换

#### 显式转换

1. Number()：接收一个参数：123，true,false,null,'123'能处理其他均是NaN
2. parseInt()：两个参数：对象+进制、123，'123','123a'，其他均为NaN;
3.  parseFloat()：一个参数：123，'123.11', '123.1a',其他均为NaN;
4.  String()：接收一个参数：接收任何参数相当于+'';
5.  obj.toString()：接收一个参数：进制
6.  Boolean()：接收一个参数：''、NaN、null、undefined、0是false,其他均为true;

#### 隐式转换

1. ++/--自增自减

```
会先使用`number()`处理，在进行增减。
```

2. ==

```
1.undefined等于null
2.字符串和数字比较时，字符串转数字
3.数字为布尔比较时，布尔转数字
4.字符串和布尔比较时，两者转数字
```

3. / % * - +

```
1.字符串加数字,数字就会转成字符串。
2.数字减字符串，字符串转成数字。如果字符串不是纯数字就会转成NaN。字符串减数字也一样。两个字符串相减也先转成数字。
3.乘，除，大于，小于跟减的转换也是一样。
```

4. 逻辑操作符中的隐式转换规律

```
逻辑非（!） 通过Boolean()函数将其操作值转换为布尔值，然后求反。

逻辑与（&&）操作符：如果第一个值经过Boolean()函数转换后为true，则返回第二个操作值，否则返回第一个操作值。如果有一个操作值为null这返回null，如果有一个操作值为undefined，则返回undefined，如果有一个值为NaN，则返回NaN。

逻辑或（||）操作符：如果第一个值经过Boolean()函数转换为false，则返回第二个操作值，否则返回第一个操作值。（注：逻辑操作符的运算为短路逻辑运算：前一个条件已经能够得出结果后续条件不再执行！）

```

需要注意的是NaN==NaN是false的，因为NaN**是指不是一个数**，而并没有指定NaN是啥， 所以两个NaN可能不一样，比如一个是对象，一个是函数。