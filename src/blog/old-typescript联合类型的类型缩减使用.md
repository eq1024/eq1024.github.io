---
title: "typescript联合类型的类型缩减使用"
date: 2023-01-22
description: "never是所有类型的子类型 当我们想要一个这样一个类型时 困难1 因为采用索引签名要满足 所有成员都必须符合字符串的索引签名 所有不能采用 { [index:string]:string | age } 只能采用联合类型缩减, 核心:找到一个既是number 的子类型，这样ag"
tags:
  - TypeScript
---

`never`是所有类型的子类型

当我们想要一个这样一个类型时
![image](https://img2023.cnblogs.com/blog/2059883/202301/2059883-20230122210020302-1714844101.png)
困难1 因为采用索引签名要满足 **所有成员都必须符合字符串的索引签名**
所有不能采用
```typescript
{
[index:string]:string | age
}
```
只能采用联合类型缩减,
核心:找到一个既是number 的子类型，这样age类型缩减之后的类型就是 number同时也是string的子类型，这样才能满足属性和string索引类型的约束关系
![image](https://img2023.cnblogs.com/blog/2059883/202301/2059883-20230122210249371-1577321321.png)

因为`never`是string子类,由此满足了age:never符合格式,然后因为联合缩减,`never`属于`number`的子类,所以会使用`age:nunber`覆盖`age:never`.