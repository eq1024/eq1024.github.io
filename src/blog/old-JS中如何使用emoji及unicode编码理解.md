---
title: "JS中如何使用emoji及unicode编码理解"
date: 2023-02-18
description: "前瞻 回顾第一章: 同一个字符的两种 UTF-8 编码 正文 &#128522; 这是一个笑脸,它的编码如下 Unicode编码：1F60A UTF-8编码：F09F 988A UTF-16编码: D83D DE0A 概念 Unicode 使用四个字节为每个字符编码，UTF 是英"
tags:
  - JavaScript
---

### 前瞻
[回顾第一章: 同一个字符的两种 UTF-8 编码](https://www.cnblogs.com/EQ1024/p/16551168.html9)

### 正文
😊

这是一个笑脸,它的编码如下

```
Unicode编码：1F60A
UTF-8编码：F09F 988A
UTF-16编码: D83D DE0A
```

**概念**

**Unicode** 使用四个字节为每个字符编码，**UTF** 是英文 Unicode Transformation Format 的缩写，意为把 Unicode 字符转换为某种格式。

UTF-8：变长，1-4 字节，根据码点范围，采用不同字节数

| Unicode码范围    | UTF-8编码方式                       |
| :--------------- | :---------------------------------- |
| U+0000~U+007F    | 0????????                           |
| U+0080~U+07FF    | 110????? 10??????                   |
| U+0800~U+FFFF    | 1110???? 10?????? 10??????          |
| U+10000~U+10FFFF | 11110??? 10?????? 10?????? 10?????? |

**转换例子**：

```
1 F6 0A  //转16

1 11110110 00001010  //填充

11110??? 10?????? 10?????? 10?????? 

11110000 10011111 10011000 10001010`  //转16进制的utf-8编码

F0 9F 98 8A
```



UTF-16：变长，2 或 4 字节，根据码点范围，采用不同字节数。

| Unicode范围      | UTF-16编码方式                                               |
| :--------------- | :----------------------------------------------------------- |
| U+000~U+FFFF     | 2 Byte存储，编码后等于Unicode值                              |
| U+10000~U+10FFFF | 4 Byte存储，现将Unicode值减去（0x10000），得到20bit长的值。再将Unicode分为高10位和低10位。UTF-16编码的高位是2 Byte，高10位Unicode范围为0-0x3FF，将Unicode值加上0XD800，得到高位代理（或称为前导代理，存储高位）；低位也是2 Byte，低十位Unicode范围一样为0~0x3FF，将Unicode值加上0xDC00,得到低位代理（或称为后尾代理，存储低位） |

**转换例子**：

-  `U+0020`，这个值的范围在第一部分，即经过UTF-16编码后，结果仍然为`U+0020`，在内存中的顺序为`00 20`。
-  `U+12345`, 这个值的范围在第二部分，因此需要先减去`0x10000`，得到`0x02345`，拆分成高10位`00 0000 1000`和低10位`11 0100 0101`。根据上面规则加上特定值后，高位代理值为`D808`，低位代理值为`DF45`，最终内存中的顺序为`D8 08 DF 45`。

UTF-32：定长，4 字节，浪费空间，没人用。

| 编码范围           | 字节数量 |
| ------------------ | -------- |
| U+0000 - U+FFFF    | 2        |
| U+10000 - U+10FFFF | 4        |

**网址**

[emoji link](https://apps.timwhitlock.info/emoji/tables/unicode)

[unicode link](https://home.unicode.org/)

### 使用

> JS语言采用的是Unicode字符集，utf-16的编码方式



```ts
let e = '😊'
e.length  // 2
/**
获取的是浏览器根据unicode`1F60A`进行
utf-16规则转码后的 编码
*/
e[0]  //'\uD83D'
e[1]  //'\uDE0A'
```

#### 显示和储存

```ts
'😁'.codePointAt()   //128513

String.fromCodePoint(128513)  //😁
```



#### 区别

> fromCharCode和fromCodePoint区别

fromCharCode只能对不大于`0xFFFF`的码点才有效

```ts
String.fromCharCode(0x1F60A) //""输出的是一个方框
```

es6出现了fromCodePoint

```ts
String.fromCodePoint(0x1F60A)//"😁"
```