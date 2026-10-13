---
title: "position、float、flex三种方式实现三栏布局"
date: 2022-03-01
description: "&lt;div class=&quot;wrapper&quot;&gt; &lt;div class=&quot;left&quot;&gt;试一下自适应效果试一下自适应效果试一下自适应效果试一下自适应效果试一下自适应效果试一下自适应效果 试一下自适应效果试一下自适应效果试一下"
tags:
  - CSS
---

```html
<div class="wrapper">
        <div class="left">试一下自适应效果试一下自适应效果试一下自适应效果试一下自适应效果试一下自适应效果试一下自适应效果
            试一下自适应效果试一下自适应效果试一下自适应效果试一下自适应效果试一下自适应效果
        </div>
        <div class="mid">试一下自适应效果试一下自适应效果试一下自适应效果试一下自适应效果试一下自适应效果试一下自适应效果
            试一下自适应效果试一下自适应效果试一下自适应效果试一下自适应效果试一下自适应效果
        </div>
        <div class="right">试一下自适应效果试一下自适应效果试一下自适应效果试一下自适应效果试一下自适应效果试一下自适应效果
            试一下自适应效果试一下自适应效果试一下自适应效果试一下自适应效果试一下自适应效果试一下自适应效果试一下自适应效果
        </div>
    </div>
```

    ### position方式

```css
.left{
    position: fixed;
    height:200px;
    width: 200px;
    background-color:cadetblue;
}
.mid{
    overflow: hidden;
    height: 200px;
    background-color: yellowgreen;
    margin: 0 200px 0  200px;

}
.right{
    position: relative;
    height: 200px;
    width: 200px;
    background-color: bisque;
    top: -200px;
    left: calc(100% - 200px);
}
/* calc() 函数运算符前后都需要保留一个空格，例如：width: calc(100% - 10px)；*/

```

### float方式

```css
.left{
    float: left;
    width:200px;
    height:200px;
    background-color:cadetblue;
}
.mid{
    overflow: hidden;
    height:200px;
    background-color:yellowgreen;
    margin-right: 200px;   
}
.right{
    float: right;
    height:200px;
    width: 200px;
    background-color: bisque;
    margin-top: -200px;
} 
```

### flex方式

> 要使用flexbox，就必须先设置弹性容器。display：flex（块级弹性容器）/inline-flex（行内弹性容器）
>
> - flex-direction:指定容器中弹性元素的排列方式。
> - row（默认，水平排列，主轴）column（竖直排列，侧轴）
> - flex-wrap:设置元素是否在弹性容器中自动换行。nowrap（默认，不自动换行）
> - justify-content:设置主轴上的元素如何排列。
> - flex：增长 缩减 基础 ；（简写属性）

```css
.wrapper{
    display: flex;
    height:200px;
    flex-direction: row;
    flex-wrap: nowrap;
    justify-content: start;
}
.left{
    flex: 0 0 200px;
    background-color:cadetblue;
    overflow: hidden;
}
.mid{
    overflow: hidden;
    background-color: yellowgreen;
}
.right{
    flex: 0 0 200px;
    background-color: bisque;
}
```