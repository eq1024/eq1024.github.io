---
title: useMemo、useCallback、useEffect 不是同一类优化
date: 2023-04-24
description: 从值的缓存、函数身份、外部同步三个角度讲清三个 Hook，并说明什么时候不该用它们。
tags:
  - React
outline: true
---

这三个 Hook 经常被放在一起比较，因为名字都带 `use`，都涉及“依赖”和“性能”。

但它们解决的问题并不一样：

- `useMemo` 缓存一个计算结果。
- `useCallback` 缓存一个函数引用。
- `useEffect` 在提交后同步外部系统。

把三者混成“性能优化三件套”，很容易写出依赖数组很漂亮、实际却没有收益的代码。

## useMemo：缓存值

```jsx
const total = useMemo(() => {
  return items.reduce((sum, item) => sum + item.price, 0)
}, [items])
```

只有当 `items` 变化时才重新计算。

适合：

- 计算量确实很大
- 结果被用作其他 Hook 的依赖
- 需要保持对象引用稳定

不适合：

- 简单加法、简单字符串拼接
- 为了“看起来优化”而缓存所有东西
- 依赖数组写错，导致缓存了过期值

React 不保证 `useMemo` 永远保留缓存。它可能在未来丢弃缓存来释放内存。所以不要把“只执行一次”的业务逻辑塞进 `useMemo`，那是 `useRef` 或 Effect 的职责。

## useCallback：缓存函数身份

```jsx
const handleSelect = useCallback(id => {
  setSelectedId(id)
}, [])
```

它返回同一个函数引用，直到依赖变化。

单独使用 `useCallback` 通常没有意义。只有当函数被传给 `memo` 子组件、作为其他 Hook 的依赖，或者用于比较引用时，它才有价值。

```jsx
const Child = memo(function Child({ onSelect }) {
  return <button onClick={() => onSelect(1)}>select</button>
})
```

如果父组件每次渲染都创建新函数，`memo` 的浅比较会认为 `onSelect` 变了，子组件仍然会重新渲染。这时 `useCallback` 才有意义。

不要为了“避免重新渲染”给所有函数加 `useCallback`。缓存本身也有成本，依赖数组还会增加维护负担。

## useEffect：同步外部系统

```jsx
useEffect(() => {
  const controller = new AbortController()

  fetch(`/api/users/${id}`, { signal: controller.signal })
    .then(res => res.json())
    .then(setUser)

  return () => controller.abort()
}, [id])
```

Effect 在浏览器完成绘制后执行，用来同步 React 之外的东西：

- 请求
- 订阅
- 定时器
- DOM API
- 第三方库实例

它不是用来计算派生数据的。能在 render 中算出来的值，不应该再放进 state 和 Effect。

```jsx
// 没必要
const [total, setTotal] = useState(0)
useEffect(() => {
  setTotal(items.reduce((sum, item) => sum + item.price, 0))
}, [items])
```

直接计算或 `useMemo` 更合适。

## 依赖数组不是“告诉 React 什么时候执行”

依赖数组表达的是：这个 Effect 使用了哪些响应式值。

```jsx
useEffect(() => {
  console.log(userId)
}, [userId])
```

遗漏依赖会导致 stale closure。把依赖写全，通常比用 `// eslint-disable` 更安全。

如果依赖太复杂，通常说明 Effect 职责太多，应该拆分或把逻辑移到事件处理器里。

## 什么时候该优化

先问三个问题：

1. 这个计算真的慢吗？
2. 子组件真的因为引用变化而重新渲染吗？
3. 这个 Effect 真的需要存在吗？

没有测量之前，不要默认 `useMemo` 和 `useCallback` 会提升性能。它们可能降低可读性，并引入依赖错误。

React 的新编译器会减少一部分手动缓存需求，但底层判断没有变：纯计算、稳定引用、外部同步，各归各的 Hook。

## 最后

`useMemo` 管值，`useCallback` 管函数身份，`useEffect` 管外部副作用。

先写清楚数据流，再决定是否缓存。优化是结果，不是默认写法。
