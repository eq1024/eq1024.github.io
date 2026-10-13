---
title: "JS的节流、防抖及使用场景"
date: 2022-03-06
description: "函数防抖(debounce) 在事件被触发n秒后再执行回调，如果在这n秒内又被触发，则重新计时。 示例 function debounce(fun, delay) { return function () { clearTimeout(fun.id) fun.id = setTi"
tags:
  - JavaScript
---

### 函数防抖(debounce)

> 在事件被触发n秒后再执行回调，如果在这n秒内又被触发，则重新计时。

**示例**

```javascript
function debounce(fun, delay) {
  return function () {
      clearTimeout(fun.id)
      fun.id = setTimeout(function () {
          fun()
      }, delay)
  }
}
let biu = function () {
  console.log('biu biu biu')
}

let boom = function () {
  console.log('boom boom boom')
}
setInterval(debounce(biu,500),1000)
setInterval(debounce(boom,2000),1000)
```

一直输出`biu biu biu`，因为`boom`一直被打断，定时器一直被清除，来不及执行

### 函数节流(throttle)

> 规定在一个单位时间内，只能触发一次函数。如果这个单位时间内触发多次函数，只有一次生效。

```javascript

  function throttle(fun, delay) {
        let last, deferTimer
        return function (args) {
            let that = this
            let _args = arguments
            let now = +new Date()
            if (last && now < last + delay) {
                clearTimeout(deferTimer)
                deferTimer = setTimeout(function () {
                    last = now
                    fun.apply(that, _args)
                }, delay)
            }else {
                last = now
                fun.apply(that,_args)
            }
        }
    }

    let throttleAjax = throttle(ajax, 1000)

    let inputc = document.getElementById('throttle')
    inputc.addEventListener('keyup', function(e) {
        throttleAjax(e.target.value)
    })

```





### 总结

> 假设无限次触发：防抖函数永远不会真正执行；节流函数则会按照间隔时间执行

- 函数防抖和函数节流都是防止某一时间频繁触发，但是这两兄弟之间的原理却不一样。
- 函数防抖是某一段时间内只执行一次，而函数节流是间隔时间执行。

### 结合应用场景

- debounce
  - search搜索联想，用户在不断输入值时，用防抖来节约请求资源。
  - window触发resize的时候，不断的调整浏览器窗口大小会不断的触发这个事件，用防抖来让其只触发一次
- throttle
  - 鼠标不断点击触发，mousedown(单位时间内只触发一次)
  - 监听滚动事件，比如是否滑到底部自动加载更多，用throttle来判断