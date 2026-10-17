---
title: computed、watch、watchEffect 的选择，不是 API 记忆题
date: 2024-08-29
description: 从派生值、显式侦听和自动追踪三个角度理解 Vue 的响应式 API，并处理异步、清理和竞态。
tags:
  - Vue
outline: true
---

`computed`、`watch`、`watchEffect` 都能“跟着响应式数据变化”，所以很容易被当成三个可以互换的 API。

但它们的设计目标不同：

- `computed` 计算派生值。
- `watch` 显式侦听数据源，执行副作用。
- `watchEffect` 自动追踪依赖，立即执行副作用。

先想清楚你要的是值还是副作用，选择会自然很多。

## computed：从状态派生值

```js
const firstName = ref("Ada")
const lastName = ref("Lovelace")

const fullName = computed(() => {
  return `${firstName.value} ${lastName.value}`
})
```

`fullName` 是一个只读 ref，依赖不变时会使用缓存。

适合：

- 过滤、排序、格式化
- 多个状态组合出一个新值
- 在模板中重复使用派生值

不适合：

- 发请求
- 写 DOM
- 修改其他 state
- 依赖异步结果后再修改外部状态

computed 的 getter 应该是纯计算，不要在里面制造副作用。

## watch：显式侦听

```js
watch(
  () => props.userId,
  async (userId, oldUserId, onCleanup) => {
    const controller = new AbortController()
    onCleanup(() => controller.abort())

    const user = await fetchUser(userId, {
      signal: controller.signal,
    })
    data.value = user
  },
  { immediate: true },
)
```

`watch` 默认是懒执行的，只有依赖变化才触发。它提供新值、旧值，适合做：

- 请求
- 本地存储同步
- 路由参数变化后的副作用
- 需要比较新旧值的逻辑

常用配置：

- `immediate: true`：创建时立即执行一次
- `deep: true`：深度侦听对象
- `flush: "post"`：在 DOM 更新后执行
- `flush: "sync"`：依赖变化时同步执行，通常只在特殊场景使用

`deep` 不是越多越好。深层侦听大对象会带来遍历和触发成本，优先侦听具体字段。

## watchEffect：自动追踪

```js
const stop = watchEffect(() => {
  console.log(userId.value)
})
```

`watchEffect` 会立即执行一次，并自动追踪回调里访问到的响应式依赖。

它适合依赖关系简单、逻辑集中、不需要旧值的副作用。

缺点是依赖是隐式的：

```js
watchEffect(async () => {
  const user = await fetchUser(userId.value)
  data.value = user
})
```

看起来没问题，但如果 `userId` 快速变化，旧请求可能后返回，覆盖新请求。`watchEffect` 不会自动解决竞态。

需要取消时：

```js
watchEffect(onCleanup => {
  const controller = new AbortController()
  onCleanup(() => controller.abort())

  fetch(`/api/users/${userId.value}`, {
    signal: controller.signal,
  })
})
```

`watch` 也可以使用 `onCleanup`，在回调参数里注册清理函数。

## flush 的时机

默认 `flush: "pre"`，侦听回调在组件更新前执行。

如果需要在 DOM 更新后读取布局：

```js
watch(
  () => props.open,
  () => {
    nextTick(() => {
      // 读取更新后的 DOM
    })
  },
  { flush: "post" },
)
```

`flush: "sync"` 会同步触发，可能造成多次执行和性能问题。除非你非常清楚依赖更新顺序，否则不要把它当默认选项。

## 怎么选

```text
要一个派生值 -> computed
要显式侦听并在变化时做副作用 -> watch
依赖简单、需要自动追踪 -> watchEffect
```

如果 `computed` 里出现了请求或 DOM 操作，说明你想做的是副作用。

如果 `watchEffect` 里依赖很多、分支复杂，`watch` 的显式数据源通常更容易读。

如果多个状态变化都需要触发同一个异步请求，要考虑取消和去重，而不是只选一个 API。

## 最后

这三个 API 的差别不在“谁更高级”，而在职责：

- `computed` 负责算。
- `watch` 负责看。
- `watchEffect` 负责自动跟着跑。

把职责分清，再处理异步清理和竞态，响应式代码会稳定很多。
