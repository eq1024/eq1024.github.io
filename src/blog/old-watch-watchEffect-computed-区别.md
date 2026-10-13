---
title: "watch watchEffect computed 区别"
date: 2024-08-29
description: "watch 概念：侦听一个或多个响应式数据源，并在数据源变化时调用所给的回调函数。 // 监视ref所定义的一个响应式数据 watch(sum,(newValue,oldValue)=&gt;{ console.log(&#39;sum变了&#39;,newValue,oldVa"
tags:
  - Vue
---

#### watch

概念：侦听**一个或多个**[响应式](https://so.csdn.net/so/search?q=响应式&spm=1001.2101.3001.7020)数据源，并在数据源变化时调用所给的回调函数。

```js
// 监视ref所定义的一个响应式数据
watch(sum,(newValue,oldValue)=>{
	console.log('sum变了',newValue,oldValue)
},{ immediate: true,deep: true })
    
// 监视ref所定义的多个响应式数据，newValue 和 oldValue都是数组
watch([sum,msg],(newValue,oldValue)=>{
	console.log('sum或msg变了',newValue,oldValue)
})

// 监视reactive所定义的一个响应式数中的某个属性
watch(()=>data.name,(newValue,oldValue)=>{
	console.log('data变化',newValue,oldValue)
})

// 监视reactive所定义的一个响应式数中的某些属性（同时侦听多个）
watch([()=>data.name,()=>data.age],(newValue,oldValue)=>{
	console.log('data变话',newValue,oldValue)
})

// 监视reactive所定义的一个响应式数中的对象属性，此时 deep 配置有效
// 这也是官方文档深度侦听器有介绍的特殊情况，上面有链接
watch(()=>data.job,(newValue,oldValue)=>{
	console.log('data变了',newValue,oldValue)
},{deep: true})

//监听完整对象
watch(data,(newValue,oldValue)=>{
	console.log('data变化',newValue,oldValue)
})
```

1. 第一个参数为需要侦听的属性且**必须为一个响应式数据**（不是会报警告）
2. 第二个参数为回调函数，就是你要如何处理侦听属性的逻辑代码
3. 第三个参数是可选参数，是一个对象，下面再详细介绍里面参数意义。
4. 可以在同一个watch中侦听多个响应式属性，具体做法就是将他们放到一个数组内，可参考上面的代码。

**配置参数**

##### immediate `watch`默认**懒侦听**，也就是默认`immediate：false`，如果把该值改为true，就会在setup函数执行阶段就调用回调函数一次

##### deep  `ref`处理的响应式对象的话，就需要手动开启 reactive 自动开启 



##### flush 可以设定三种值`'pre'（默认值）`、`‘post’`、`‘sync’`

我们知道Vue组件更新是异步的，当侦听属性发生变化时，就可能触发Vue组件的更新和侦听回调。默认情况下，侦听回调的触发会在Vue组件更新之前，也就是说，在没有设定flush值的时候，你在侦听回调函数中所能获取到的DOM是Vue组件更新前的状态，设定flush: post，就可以将侦听回调触发时机改为Vue组件更新之后。

#### watchEffect

```js
watchEffect(()=>{
    const x1 = sum.value
    console.log('watchEffect所指定的回调执行了')
})
```

不用指明监视哪个属性，监视的回调中用到哪个属性，就会自动追踪哪个属性（和computed类似）
非惰性侦听，（与默认的watch相反），但是在配置对象中没有像immediate这样的属性控制惰性或非惰性侦听，这也意味着非惰性侦听这个特性无法被更改。
最多只有两个参数，第一个参数为副作用函数（可以理解为回调函数），第二个是可选参数为配置对象，里面属性下面再说。
返回值是一个用来停止该副作用的函数。（可以理解为停止侦听器）



flush:sync 的作用

“在响应式依赖发生改变时立即触发侦听器”，可能有朋友对这点会有疑惑，我每次使用watch、watchEffect侦听响应式属性，每次在打印台都能马上看到打印，不就是说明立即触发了侦听器的副作用函数吗？其实并非如此，这里有必要解释一下，这里**“缓存”**的意义（严格意义上来说，watchEffect并没有缓存，这里只是把这种类似的情况比喻成“缓存”便于理解，computed才有缓存）。
缓存的概念相信大家都并不陌生，但是此处Vue中的缓存是指什么呢？

我们都早早的在Vue2时知道了$nextTick的意义，知道了Vue更新组件的异步渲染，知道Vue3中也有nextTick和$nextTick意义作用对等的东西，甚至熟悉 JS 事件循环机制的朋友知道eventloop一个循环我们称之为tick。

熟悉上面概念的朋友，理解这里的缓存就十分轻松了，原来Vue3会对watchEffect侦听器的副作用函数响应式依赖数据作缓存处理，watchEffect侦听器可能会同时追踪多个响应式数据，当多个响应式数据在同一时间发生变化时，内部会“稍作等待”，观察是否有其他响应式数据发生变化需要触发副作用函数，而最终的结果就是打印台只触发一次副作用函数，反映最终结果。在数据量少、逻辑简单时，“稍作等待”的时间十分短，就会让我们产生“立即触发了侦听器的错觉”。

言归正传，flush: sync就是希望打破这一缓存等待的机制，让其真正意义上的"立即触发侦听器"，谨慎使用

#### `watchEffect`停止侦听器。

```js
const stop = watchEffect(() => {})

// 当不再需要此侦听器时:
stop()
```



清除副作用:

```js
//watchEffect
//只需要看 onCleanup
//这个副作用函数的参数也是一个函数
//意思就是返回一个执行函数的函数 我们将清除副作用的函数传给他来执行  并且这个函数是在下次触发watchEffect的时候执行

watchEffect(async (onCleanup) => {
  const { response, cancel } = doAsyncWork(id.value)
  // `cancel` 会在 `id` 更改时调用
  // 以便取消之前
  // 未完成的请求
  onCleanup(cancel)
  data.value = await response
})


//watch 也是一样的 获得一个执行函数的函数
watch(id, async (newId, oldId, onCleanup) => {
  const { response, cancel } = doAsyncWork(newId)
  // 当 `id` 变化时，`cancel` 将被调用，
  // 取消之前的未完成的请求
  onCleanup(cancel)
  data.value = await response
})
```

#### `computed`特性

1. 在 getter 函数中，在追踪的响应式依赖没有发生变化时，返回都会是上次缓存的数据。（计算属性和方法的区别）
2. 只有在`computed`中的**响应式依赖发生变化**时，才会再次进行运算。



总结
watch和watchEffect区别
参数上
watch接收三个参数，watchEffect接收两个参数，因为watchEffect会自动追踪副作用函数中的响应式数据。

执行上
watch默认懒侦听，可以通过第三个参数配置对象中的 immediate 属性修改，watchEffect强制非惰性侦听，且参数配置对象中没有 immediate 属性修改。

副作用函数上的参数
watch回调函数可接收三个参数新值、旧值，以及一个用于注册副作用清理的回调函数；watchEffect回调函数只接受一个用于注册副作用清理的回调函数。

参数上，computed只接受一个 getter 函数，watch和watchEffect可以看开头链接的最后面。

返回值，computed必须要有个返回值，他会是一个只读的ref对象（最佳实践场景），watch和watchEffect的返回会是一个用于停止侦听的函数。

computed、watchEffect都会自动追踪响应式依赖，watch则需要主动追踪响应式依赖。

使用上，computed着重计算，watch和watchEffect着重侦听。
从参数上考究，computed没有像watch和watchEffect的配置对象参数去支持调整函数触发时机，官方也说了，在computed的函数中不能做异步请求或者更改 DOM，而watch和watchEffect则相反，十分支持完成类似操作。