---
title: "React  StrictMode 生命周期为什么会执行两次？"
date: 2022-12-13
description: "什么是 React.StrictMode? React.StrictMode 是在 2018 年的 16.3.0 版本中引入的组件。一开始，它只用在类组件中，而在 16.8.0 中，它对 hook 同样适用。 就像在版本说明中提及的一样： React.StrictMode 是帮助"
tags:
  - React
---

### 什么是 React.StrictMode?
React.StrictMode 是在 2018 年的 16.3.0 版本中引入的组件。一开始，它只用在类组件中，而在 16.8.0 中，它对 hook 同样适用。
就像在版本说明中提及的一样：

React.StrictMode 是帮助应用适应异步渲染的组件

所以它应该用来帮助工程师避免常见的错误，并使他们的 React 应用抛弃过时的 API，从而逐步升级。
这些提示对于更好地调试是有帮助的，因为这个库正在向异步渲染时代迈进，所以大的改动时时发生。
很有用，对吧？
### 为什么会渲染两次呢?
我们从使用 React.StrictMode 中获得的好处之一是，它帮助我们检测到渲染期生命周期的预期之外的副作用。
这些生命周期有：

constructor
componentWillMount (或者 UNSAFE_componentWillMount)
componentWillReceiveProps (或者 UNSAFE_componentWillReceiveProps)
componentWillUpdate (或者 UNSAFE_componentWillUpdate)
getDerivedStateFromProps
shouldComponentUpdate
render
setState 更新函数 (第一个参数)

所有这些方法都被调用不止一次，所以避免副作用是十分重要的。如果我们无视这个原则，就有可能造成状态不一致问题或者内存泄漏。
React.StrictMode 不能马上检测到副作用，但是它可以通过故意调用一些关键函数两次，来帮助我们发现副作用。
这些函数有:

类组件 constructor、render 以及 shouldComponentUpdate 方法
类组件静态 getDerivedStateFromProps 方法
方法组件的方法体
状态更新函数 (setState 的第一个参数)
传给 useState、useMemo、或 useReducer 的函数

这个行为肯定对性能有一些影响，但我们不应该担心，因为它只在开发而不是生产环境中发生。
这就是我们只有在开发环境下使用带 React.useState 的组件函数，才可以成功复现渲染两次的原因。