---
title: Vue Router 4 动态路由，别再写 addRoutes
date: 2023-01-31
description: 从 addRoute、权限过滤、404 兜底到退出登录清理，整理 Vue Router 4 动态菜单的正确做法。
tags:
  - Vue
  - 工程化
outline: true
---

很多 Vue 后台项目都有同一套需求：

```text
登录 -> 拿到权限 -> 动态生成菜单和路由 -> 进入页面
```

但网上大量示例还停留在 Vue Router 3 的 `addRoutes`。到了 Vue Router 4，这个 API 已经不存在了，继续照抄就会出现“路由加了但页面白屏”“刷新后 404”“退出登录后路由还在”等问题。

## addRoutes 已经换成 addRoute

Vue Router 3：

```js
router.addRoutes(routes)
```

Vue Router 4：

```js
routes.forEach(route => {
  router.addRoute("Layout", route)
})
```

`addRoute` 一次添加一条路由，并返回一个移除函数：

```js
const remove = router.addRoute("Layout", route)
remove()
```

也可以传父路由名称，把子路由挂到布局下。

## 路由守卫的典型流程

```js
let routesReady = false

router.beforeEach(async to => {
  const auth = useAuthStore()
  const permission = usePermissionStore()

  if (!auth.token) {
    return {
      path: "/login",
      query: { redirect: to.fullPath },
    }
  }

  if (!routesReady) {
    const { permissions } = await auth.getInfo()
    const routes = permission.generateRoutes(permissions)

    routes.forEach(route => {
      router.addRoute("Layout", route)
    })

    routesReady = true

    return { ...to, replace: true }
  }
})
```

重点是最后一行：

```js
return { ...to, replace: true }
```

它不是“直接进入目标页”，而是带着原地址重新走一次匹配。此时动态路由已经注册，目标页面才能被解析到。

如果只写 `next()`，可能出现路由已经添加、但当前导航仍然按旧路由表解析的情况。

## 404 要最后加

```js
router.addRoute({
  path: "/:pathMatch(.*)*",
  name: "NotFound",
  component: NotFound,
})
```

兜底路由必须放在动态路由之后。否则它可能先匹配所有地址，把真正的页面挡住。

## 后端返回字符串组件名怎么办

很多后台会把 `component: "system/user/index"` 这样的字符串返回给前端。Vue Router 需要的是组件对象或异步组件函数，不能直接吃字符串。

在 Vite 里可以用 `import.meta.glob`：

```js
const views = import.meta.glob("/src/views/**/*.vue")

function resolveView(path) {
  const key = `/src/views/${path}.vue`
  return views[key]
}
```

它在构建时生成静态映射，比运行时 `require` 或动态 `import()` 更可控。

需要处理布局、父级容器和 404 等特殊组件时，先做显式映射，再回退到 `views`。

## 退出登录要清理动态路由

如果动态路由一直留在 router 里，换账号后可能看到上一位用户有权限的页面。

可以保存 `addRoute` 的返回值：

```js
const removers = []

routes.forEach(route => {
  removers.push(router.addRoute("Layout", route))
})

function resetRoutes() {
  removers.forEach(remove => remove())
  removers.length = 0
  routesReady = false
}
```

退出登录时调用 `resetRoutes()`，再清除 token。

## 常见坑

### 路由名重复

动态路由和静态路由使用了同一个 `name`，`addRoute` 会覆盖已有路由。给路由命名时要保证全局唯一。

### 刷新后状态丢失

`routesReady` 是内存变量，刷新页面会重置。守卫需要重新拉取用户信息并生成路由，这很正常。

### 无限重定向

如果守卫在未登录时不断返回登录页，而登录页又被权限判断拦截，就会循环。白名单要放在权限逻辑前面。

### 只过滤菜单，不过滤路由

菜单隐藏不等于路由不可访问。用户仍然可以手输 URL。权限必须在路由层和服务端接口层同时校验。

## 最后

Vue Router 4 动态路由的核心是：**先拿到权限，再注册路由，然后带着原地址重新导航。**

用 `addRoute` 替代 `addRoutes`，把 404 放到最后，退出时清理路由。这样动态菜单才不会变成一堆难以复现的白屏和 404。
