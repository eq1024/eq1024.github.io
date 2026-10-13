---
title: "CommonJS 和ES6 MODULE的使用以及区别"
date: 2022-03-06
description: "CommonJS 使用方式 注意：是exports不是export 导出 //通过module.exports导出一个对象，对象存放功能函数或数据或某个具体的值 //引入时通过自定义变量obj.fn1()使用即可 module.exports = { fn1: function "
tags:
  - JavaScript
  - 工程化
---

### CommonJS 使用方式

`注意`：是**exports**不是**export**

**导出**

```javascript
 //通过module.exports导出一个对象，对象存放功能函数或数据或某个具体的值
//引入时通过自定义变量obj.fn1()使用即可
module.exports = { 
  fn1: function () {
    console.log("fn1")
  },
  flag: true,
  arr: [],
}

//亦可通过exports直接导出，exports本质上是node实现的module.exports的简写，相当于var exports = module.exports
exports.fn2 = function () {
  console.log("fn2")
}

function mod1(){console.log(1);}
function mod2(){console.log(2);}
module.exports={mod1:mod1,mod2:mod2}
```

**引入**

```javascript
const express = require("express")      //express 是node第三方模块，直接引入模块名即可

const obj = require("模块文件路径")       // 引入自定义模块时，require函数的参数为模块的文件路径，引入了模块文件并赋值给自定义变量obj 

var {mod1,mod2} = require('./t');
```

### ES6 MODULE使用方式

**导出**

```javascript
第一种 - 直接导出
export var firstName = 'Michael';
export function multiply(x, y) { return x * y;};

第二种 - 使用{}导出
export { firstName, multiply };

```

`注意`：不可以直接导出`export 1`，也不可以直接`export m`

```javascript
// 报错
export 1;

// 报错
var m = 1;
export m;

正确
// 写法一
export var m = 1;

// 写法二
var m = 1;
export {m};

// 写法三
var n = 1;
export {n as m};
```

**引入**

```javascript
import { firstName, lastName, year } from './profile.js';

别名
import { lastName as surname } from './profile.js';
```

`注意`：不允许在加载模块的脚本里面，改写接口。 

可以直接理解成，通过ES6 MODULE引入的都是用`const`申明过。

```javascript
import {a} from './xxx.js'
a = {}; // Syntax Error : 'a' is read-only;
a.foo = 'hello'; // 合法操作
```

`注意`：如果想在一条`import`语句中，同时输入默认方法和其他接口，可以写成下面这样。

先写不带括号，再写带括号的

```javascript
import _, { each, forEach } from 'lodash';
```

#### export default的使用

```javascript
// 第一组
export default function crc32() { // 输出
  // ...
}

import crc32 from 'crc32'; // 输入

// 第二组
export function crc32() { // 输出
  // ...
};

import {crc32} from 'crc32'; // 输入
```

`export default`命令用在非匿名函数前，也是可以的。

```javascript
非匿名
export default function foo() {
  console.log('foo');
}
匿名
export default function () {
  console.log('foo');
}
```

#### export 与 import 的复合写法 

```javascript
export { foo, bar } from 'my_module';

// 可以简单理解为
import { foo, bar } from 'my_module';
export { foo, bar };
```

### CommonJS和ES6 MODULE差异

1. CommonJS 模块输出的是一个值的拷贝，ES6 模块输出的是值的引用。
2. CommonJS 模块是运行时加载（动态加载），ES6 模块是编译时输出接口（静态加载）。
3. CommonJS 模块的`require()`是同步加载模块，ES6 模块的`import`命令是异步加载，有一个独立的模块依赖的解析阶段。

**`ES2020`**支持`import`动态导入，[详情](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Statements/import#%E5%8A%A8%E6%80%81%E5%AF%BC%E5%85%A5)

动态加载会得到的是一个**promise**对象，并且也**支持await**，这样就可以实现**按需加载**（懒加载）

```javascript
import静态导入
import xxx from 'xxx.js'
import {xx,x} from 'xxx.js'

import动态导入
import(xxx.js)
```

#### 动态导入和静态导入的区别

`import`在静态解析阶段执行，所以它是一个模块之中最早执行的，而动态这是在执行到对于代码时再去请求。

CommonJS 加载的是一个对象（即`module.exports`属性），该对象只有在脚本运行完才会生成，也就是说要运行全部代码才能确定`module.exports`的完整性。而 ES6 模块不是对象，它的对外接口只是一种静态定义，在代码静态解析阶段就会生成（按需加载）。

#### 值的拷贝和值的引用的区别

 import和require都是会执行一遍代码，只是一个是在运行时执行（耽误时间），一个是编译时解析（达到按需导入，优化运行速度）。

在两种方式都引入需要的内容时，不管是当做整体还是使用`{}`选取部分，CommonJS 模块输出的是**值的拷贝**，运行完模块后，值会缓存在本地，**`注意`原始类型的值**，会被缓存，函数不会缓存到本地，所以执行的时候还是去内存找到原本存储位置，这样才能改变模块中的内容，不然的话，及时写了一个如下面代码那样改变模块内容的代码，但是由于函数也被拷贝到了新内存中，这样就找不到需要改变的模块内的那个值了，那就表示模块写死了，无法改变，但事实并非如此。也就是说，一旦输出一个值，模**块内部的变化就影响不到这个值**，除非采用刚刚说的方式。

**CommonJS获取模块变动后的值**

> 需要使用一个**取值函数**，不然会一直取到缓存好的值。

```javascript
// lib.js
var counter_num = 3;
function incCounter() {counter_num++;}
function counter() {return counter_num}
module.exports = {counter,incCounter,};

var mod = require('./lib');
console.log(mod.counter());  // 3
mod.incCounter();
console.log(mod.counter()); // 4
```



ES6则如同是将**引入文件**中选择好的代码**注入**到**被引入文件**里一样，JS 引擎对脚本静态分析的时候，遇到模块加载命令`import`，就会生成一个只读引用。等到脚本真正执行时，再根据这个只读引用，到被加载的那个模块里面去取值。

换句话说，ES6 的`import`有点像 Unix 系统的**“符号连接”**，原始值变了，`import`加载的值也会跟着变。因此，ES6 模块是动态引用，并且不会缓存值，模块里面的变量绑定其所在的模块。