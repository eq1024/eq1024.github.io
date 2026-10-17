---
title: React StrictMode 为什么在开发环境执行两次
date: 2022-12-13
description: 从渲染期双调用、Effect 的挂载卸载重挂载到并发渲染，解释 StrictMode 想暴露什么问题。
tags:
  - React
outline: true
---

第一次看到 `StrictMode` 下组件渲染两次、接口请求两次、`useEffect` 执行两次时，很多人的第一反应是：

> 是不是 React 出 bug 了？

不是。`StrictMode` 是刻意这样做的，而且只在开发环境生效。

它的目的不是让代码变慢，而是提前暴露那些在并发渲染、组件重挂载和未来特性下会出问题的写法。

## StrictMode 在检查什么

React 的渲染阶段应该是一个纯计算过程：

```jsx
function User({ user }) {
  return <div>{user.name}</div>
}
```

给定相同的 props 和 state，应该得到相同的结果，不应该在 render 里发请求、改全局变量、写 DOM 或注册副作用。

但现实代码经常不纯：

```jsx
function BadComponent({ id }) {
  analytics.track("view", id) // 渲染期副作用
  return <div>{id}</div>
}
```

如果组件被重复执行，这段代码就会重复上报。

StrictMode 通过故意重复调用一些函数，让这类问题在开发阶段暴露出来。

## 哪些东西会执行两次

在 React 18 的开发模式下，常见的双调用包括：

- 函数组件体
- `useState` 的初始化函数
- `useMemo` / `useReducer` 的计算函数
- 类组件的 `constructor`、`render`、`shouldComponentUpdate`
- `getDerivedStateFromProps`
- Effect 的挂载、清理、再挂载

注意最后一条：Effect 不是简单执行两次，而是经历：

```text
mount effect
cleanup effect
mount effect again
```

这是为了检查你的 Effect 是否正确清理了订阅、定时器、事件监听器和请求。

## 为什么 Effect 要模拟卸载

React 正在为并发特性和未来的 Activity 组件做准备。组件可能被挂载、隐藏、恢复，Effect 需要能承受这种生命周期。

如果一个 Effect 只能挂载不能清理，它在真实的重挂载场景里就会泄漏。

```jsx
useEffect(() => {
  const controller = new AbortController()

  fetch("/api/data", { signal: controller.signal })
    .then(res => res.json())
    .then(setData)

  return () => controller.abort()
}, [])
```

这个 Effect 在 StrictMode 下会请求两次，但第一次请求会被 abort。它暴露的是“你有没有正确清理”，而不是“React 想浪费你的网络请求”。

## 不要用“去掉 StrictMode”解决

移除 `StrictMode` 只是把问题藏起来。生产环境可能不会双调用，但并发渲染、快速切换、组件重挂载仍然可能发生。

更合理的处理是：

- 保持 render 纯净，不在渲染期发请求或写全局状态。
- Effect 必须有清理逻辑。
- 订阅、定时器、事件监听器、WebSocket 都要能取消。
- 不要依赖“组件只会挂载一次”的假设。
- 用 `ref` 保存跨渲染的稳定实例，而不是在 render 里创建副作用。

## 接口为什么还是请求了两次

如果 Effect 没有 cleanup，或者请求库没有取消机制，开发环境确实会发两次请求。

这不一定说明代码有错，但你需要确认：

- 第二次请求是否会覆盖第一次的结果。
- 第一次请求是否已经取消。
- 服务端是否幂等。
- 是否存在重复创建资源的问题。

对于查询类请求，可以用缓存库或请求去重；对于提交类请求，不要把它放在无法清理的 Effect 里。

## 生产环境会发生吗

StrictMode 的双调用只在开发环境启用。生产构建不会因为这个特性故意执行两次。

但生产环境仍然可能有：

- 并发渲染导致 render 被丢弃和重试
- 组件卸载和重新挂载
- 用户快速切换路由
- Suspense、过渡和缓存机制

所以 StrictMode 检查的是代码是否能在这些情况下保持正确，而不是仅仅制造一个开发环境的怪现象。

## 最后

StrictMode 不是在惩罚你，而是在提前演练更复杂的生命周期。

把 render 写成纯函数，把 Effect 写成可清理的同步逻辑，双调用就不再是问题，而是一种有用的检查。
