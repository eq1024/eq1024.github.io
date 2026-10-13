---
title: "移动Web前端的疑难杂症整理"
date: 2022-03-01
description: "移动web页面多端屏幕适配 逻辑像素（logical pixel） CSS像素就是逻辑像素，CSS像素是Web编程的概念,在普通屏幕下，1个CSS像素对应1个物理像素(1:1)。 逻辑像素 ≈ 设备独立像素。 设备像素比 (device pixel ratio) 设备像素比 = "
tags:
  - CSS
  - 浏览器
---

### 移动web页面多端屏幕适配

> **逻辑像素（logical pixel）**
>
> CSS像素就是逻辑像素，CSS像素是Web编程的概念,**在普通屏幕下，1个CSS像素对应1个物理像素(1:1)。**
>
> **逻辑像素 ≈ 设备独立像素。**
>
> **设备像素比 (device pixel ratio)**
>
> 设备像素比 = 设备像素 / 设备独立像素
>
> iphone5 为例： 640X1136 / 320X568 = 2

#### 自适应（Adaptive）方案

> 应对在浏览器的宽度变化不调整网页元素的位置，缩放网页元素，以适应在可用空间。
>
> 优点：实现简单，针对移动端进行适配，独立维护。
>
> 缺点：多端的操作可能没有一致性，无法聚集多端的SEO权重。

使用rem单位，固定页面宽度居中自适应。

以iphone6为基准，设计稿是750px。

设计稿宽度／100 = 7.5 把1rem=100px转换，比值是7.5。

也就是 设计稿宽度与rem的比值是7.5。

320px ／7.5 = 42.6666（html的font-size值）

写出不同设备媒体查询font-size值。

```css
@media only screen and (min-width: 320px) {
    html {
        font-size: 42.6666px
    }
}

...
```

设计稿元素高宽／100 就得出元素的高宽rem。

```css
div {
    height: 100px;
    width: 100px;
}

/*转rem*/

div {
    height: 1rem;
    width: 1rem;
}
```

**使用rem或者em单位的性能略低于px。（原因是px是绝对单位，rem与em是相对单位）**

**使用rem与em单位效果是差不多，唯一的区别是rem是根据html标签的字体大小,em是根据相对当前元素（或者是父元素）的字体大小。**

延伸：

rem 与 em 转化 px 单位计算。

```css
/* rem */
html {
    font-size: 16px;
}
div {
    width: 10rem;  /* 16px*10 = 160px; */
    height: 10rem; /* 16px*10 = 160px; */
}

/* em */
.header {
    font-size: 16px;
    width: 100%;
    height: 10em;  /* 16px*10=160px; */
}
```

#### 响应式（Responsive）方案

> 应对在浏览器的宽度变化通过调整网页元素的位置，以适应在可用空间。
>
> 优点：实现简单，完美适配各种不同屏幕的，多端的操作一致性，可以聚集多端的SEO权重。
>
> 缺点：代码量大，不易于维护与调试。

1. 使用CSS媒体查询。

html

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

***媒体查询一定要设置meta viewport。***

css

```css
.btn {
  width: 140px;
  height: 40px;
  line-height: 40px;
  text-align: center;
  border: 1px solid;
}

@media only screen and (max-width: 768px) {
  .btn {
    width: 120px;
  }
}
@media only screen and (max-width: 375px) {
  .btn {
    width: 80px;
  }
}
```

**注意媒体查询CSS代码顺序。**

***注意@viewport 属性已经废弃了。***[废弃文档](https://link.zhihu.com/?target=https%3A//developer.mozilla.org/zh-CN/docs/Web/CSS/%40viewport)

延伸：

如何优化响应式网站？

根据当前设备屏幕逻辑像素对应加载不同的CSS与JavaScript代码。

CSS

```html
<!-- 默认文档 -->
<link href="pc.css" rel="stylesheet" media="print">
<!-- 文档宽度小于 600 像素 -->
<link href="mobile.css" rel="stylesheet" media="screen and (max-width: 600px)">
```

JavaScript

```js
var documentWdith = window.innerWidth|| document.documentElement.clientWidth || document.body.clientWidth;

var el = document.getElementById("canvas");

if(documentWdith<600){
  // 移动设备方法
  el.addEventListener("touchstart", ()=>{
    // 触摸事件
  });
}else{
  // 电脑设备方法
  el.addEventListener("click", ()=>{
    // 点击事件
  });
}
```

***不建议通过UA获取用户的浏览器信息，因为很多移动浏览器可以设置自定义UA。\***

### 

### 移动端通用兼容问题

1. 点击延时300毫秒。

[300原因](https://link.zhihu.com/?target=https%3A//thx.github.io/mobile/300ms-click-delay)

***值得庆幸的是，所有移动端浏览器都已经解决这个问题了。\***

2. 页面回弹效果。

如果页面是全屏，不超过可视高度的话，建议禁用touchmove事件。

如果页面不是全屏，超过可视高度的话，就不要禁用touchmove事件。

***虽然有办法阻挡X5内核（QQ浏览器内核）的“网页有XXX提供”的这些信息，但是并没有真正阻挡iphone的回弹效果，拖拽还是会回弹。\***

延伸：[iOS safari 如何阻止“橡皮筋效果”？ --知乎)](https://www.zhihu.com/question/22256539)

3. 页面返回不刷新。

往返缓存（Back/Forward cache）是浏览器的一种浏览器内存缓存机制。

解决方案：

```js
var isPageHide = false;
window.addEventListener("pageshow", function () {
  if (isPageHide) {
    window.location.reload();
  }
});
window.addEventListener("pagehide", function () {
  isPageHide = true;
});
```

4. 1px 边框问题。

由于移动端屏幕的**设备像素**与**逻辑像素**并不相等，所以产生在某些移动端的屏幕上1px边框略显粗。

解决方案：

```css
.row-1px {
    position: relative;
}
.row-1px:after {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    width: 200%;
    border-bottom: 1px solid #e6e6e6;
    color: #000;
    height: 200%;
    -webkit-transform-origin: left top;
    transform-origin: left top;
    -webkit-transform: scale(0.5);
    transform: scale(0.5);
    pointer-events: none;
    box-sizing: border-box;
}
```

5. 输入法挡住输入框。

在混合应用开发中，移动端内置浏览器组件设置了全屏。那么问题来了，假如是一个表单页面，里面有很多的输入框，点击最顶部的输入框的时候，移动端就会唤起输入法软件，于是就挡住最底部的输入框，导致无法看到输入框里面的内容。

```html
<!DOCTYPE html>
<html>

    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0">
        <title>移动端输入法挡住输入框</title>
        <style>
            input {
                width: 100%;
                line-height: 1.5rem;
                border: 1px solid red;
            }
            
            .block-fill {
                height: 500px;
            }
        </style>
    </head>

    <body>

        <div id="main">
            <!--占位div-->
            <div class="block-fill"></div>
            <!--聚焦（方法一）-->
            <input id="input" type="text"></input>
            <!--聚焦（方法二）-->
            <!--<input id="input" type="text" onfocus="focusInput()"></input>-->
        </div>

    </body>
    <script>
        //方法一：
        //获取页面高度
        var clientHeight = document.body.clientHeight;
        //设置监听聚焦事件
        document.body.addEventListener("focus", function(e) {
            var focusElem = document.getElementById('input')
        }, true);
        //设置监听窗口变化时间
        window.addEventListener("resize", function() {
            if(focusElem && document.body.clientHeight < clientHeight) {
                //使用scrollIntoView方法来控制输入框
                focusElem.scrollIntoView(false);
            }
        });
        //方法二：
       //设置监听聚焦事件，延时滚动屏幕
       funtion focusInput(){
            setTimeout(function() {
                 document.body.scrollTop=document.body.scrollHeight
            }, 100)
       }
    </script>

</html>
```

6. 刘海屏适配问题

使用viewport的viewport-fit属性。

```html
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
```

***viewport-fit属性也是由苹果公司推出的属性，并非标准属性。***

使用margin与padding属性对页面布局撑开。

```css
.iphonex-mt{
      margin-top: constant(safe-area-inset-top);
      margin-top: env(safe-area-inset-top);
 }
 .iphonex-mb{
      margin-bottom: constant(safe-area-inset-bottom);
      margin-bottom: env(safe-area-inset-bottom);
 }
 .iphonex-pl{
      padding-left: constant(safe-area-inset-left);
      padding-left: env(safe-area-inset-left);
 }
 .iphonex-pr{
      padding-right: constant(safe-area-inset-right);
      padding-right: env(safe-area-inset-right);
 }
```

延伸：[Designing Websites for iPhone](https://link.zhihu.com/?target=https%3A//webkit.org/blog/7929/designing-websites-for-iphone-x/)

7. setTimeout 、setInterval函数冻结问题

PC端浏览器（Firefox、Chrome 和 Safari）
场景：浏览器最小化、非激活当前标签页面。
例子：非激活当前标签页面运行settimeout小于1秒的定时任务，会调整为1秒。

mobile端浏览器（Firefox、Chrome 和 Safari）
场景：浏览器进入后台、非激活当前标签页面。
例子：非激活当前标签页面运行settimeout小于1秒的定时任务，会暂停执行。

解决方案：

1. 监听页面状态，重置定时任务

```js
document.addEventListener('visibilitychange', function() {     
   if(document.hidden) { 
      // 清除定时器         
   }else { 
      // 重置定时器        
   } 
});
```

2. 使用requestIdleCallback函数继续执行定时任务。



[window.requestIdleCallback() - MDN](https://link.zhihu.com/?target=https%3A//developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback)



**实验室性方法，慎用。**

延伸：

从Chrome 88开始，在特定情况下，用于非激活页面的setTimeout、setInterval将被限制为1分钟。

[timer-throttling-in-chrome-88developer.chrome.com/blog/timer-throttling-in-chrome-88/](https://link.zhihu.com/?target=https%3A//developer.chrome.com/blog/timer-throttling-in-chrome-88/)