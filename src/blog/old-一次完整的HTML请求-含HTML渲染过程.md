---
title: "一次完整的HTML请求[含HTML渲染过程]"
date: 2022-03-01
description: "一次完整的HTTP请求过程 域名解析 --&gt; 发起TCP的3次握手 --&gt; 建立TCP连接后发起http请求 --&gt; 服务器响应http请求，浏览器得到html代码 --&gt; 浏览器解析html代码，并请求html代码中的资源（如js、css、图片等） --"
tags:
  - 浏览器
  - 网络协议
---

### 一次完整的HTTP请求过程

域名解析 --> 发起TCP的3次握手 --> 建立TCP连接后发起http请求 --> 服务器响应http请求，浏览器得到html代码 --> 浏览器解析html代码，并请求html代码中的资源（如js、css、图片等） --> 浏览器对页面进行渲染呈现给用户

### 页面解析过程

![image-20220303153637346](https://gitee.com/zhouj889/pih/raw/master/NewPic/202203031536393.png)

> - `CSS`不会阻塞`DOM`解析，但是会阻塞`DOM`渲染，严谨一点则是`CSS`会阻塞`render tree`的生成，进而会阻塞`DOM`的渲染
> - `JS`会阻塞`DOM`解析
> - `CSS`会阻塞`JS`的执行
> - 浏览器遇到`<script>`标签且没有`defer`或`async`属性时会触发**页面渲染**（渲染出来元素后才方便js获取元素，虽然浏览器在未执行js时，并不知道该js是否要操作元素）
> - css是异步下载的,不会阻塞dom解析
> - js的下载会阻塞dom解析

**关于最后两条**

css可以异步是因为css不会操作dom的结构,只是样式罢了,所以dom继续解析产生更多而元素之类的不会有任何影响,但是如果是js,则有可能js会改变目前已经出现的dom的结构,所以必须立刻暂停解析,下载好之后去执行.



1. 获取HTML文件,对其进行DOM解析
2. 如果遇到css文件,并行下载并解析CSSOM
3. 遇到js文件,立即下载并暂停dom解析,如果css的link在js的link的上面,则会等到CSSOM解析完成后再立刻执行js,**注意**此时DOM的解析一直处于停止状态,如果js的link在css的上面,则会先执行js,不用等待CSSDOM解析完成,但是js执行时DOM和CSSOM都是暂停解析的

![image-20220301192735130](https://gitee.com/zhouj889/pih/raw/master/NewPic/202203031457511.png)

请求html后会进行DOM构建,过程中遇到css引用会并行请求css并且进行cssom构建,当DOM和CSSOM构建完成,渲染树会进行合并渲染,但是如果过程中出现js引用并且没有使用async标签,则会停止dom树解析,先执行js

**为什么一定要等CSSOM解析完成才能执行js,不能像DOM一样停下来呢?**

因为CSSOM不能部分解析,也就是说,DOM解析出来多少就业以渲染出来多少(遇到js就会触发渲染,详情见上面),而CSS则不行,因为可能解析到一半,某个字体是16px,但是在最后的css里,会设置为10px,这时候js操作的文件就是不正确的.

**为什么js一定要停下来先执行，而不是等待dom解析完成再执行**?
JS经常会操纵DOM，影响到UI。
想一想浏览器在下载页面期间会发生什么事——页面开始（按文档结构）渲染时，突然遇到一个`<script>`标签。这时浏览器只能停止渲染，来加载这个JavaScript，因爲该脚本内容可能会影响/决定后续的UI。JavaScript加载完会立即执行，对页面造成影响（or not）后，浏览器再继续渲染页面UI

### script为何放在body后?如何优化

**原因** 放在后面是防止阻塞dom的渲染

**优化** 

- `window.onload`：当页面 DOM 结构中的 js、css、图片，以及 js 异步加载的 js、css 、图片都加载完成之后，才会触发 load 事件。
- `DOMContentLoaded`：在 html文档加载完毕，并且 html 所引用的内联 js、以及外链 js 的同步代码都执行完毕后触发。
- 采用`async`和`defer`

**async和defer的区别**

[详情](https://juejin.cn/post/6894629999215640583)

| script 标签      | JS 执行顺序      | 是否阻塞解析 HTML      |
| ---------------- | ---------------- | ---------------------- |
| `<script>`       | 在 HTML 中的顺序 | 阻塞                   |
| `<script async>` | 网络请求返回顺序 | 可能阻塞，也可能不阻塞 |
| `<script defer>` | 在 HTML 中的顺序 | 不阻塞                 |

**默认script标签**

![script](https://gitee.com/zhouj889/pih/raw/master/NewPic/202203031551916.webp)

**async**

![script](https://gitee.com/zhouj889/pih/raw/master/NewPic/202203031551110.webp)

![defer2](https://gitee.com/zhouj889/pih/raw/master/NewPic/202203031551372.webp)

**defer**

![script](https://gitee.com/zhouj889/pih/raw/master/NewPic/202203031551367.webp)