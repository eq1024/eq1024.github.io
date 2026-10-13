---
title: "Vue动态菜单addRoutes的使用和踩坑事项"
date: 2023-01-31
description: "坑一 添加route后马上跳转可能出现白屏情况 原因分析:还未成功添加就next()跳转,找不到组件 解决办法: 使用next()传参,在路由守卫beforeEach中持续循环,知道确认已经添加成功,代码如下 router.beforeEach((to, from, next) "
tags:
  - Vue
  - 工程化
---

![image](https://img2023.cnblogs.com/blog/2059883/202301/2059883-20230131205913665-640483779.png)

坑一 添加route后马上跳转可能出现白屏情况
`原因分析:`还未成功添加就`next()`跳转,找不到组件
`解决办法:`
使用`next()`传参,在路由守卫`beforeEach`中持续循环,知道确认已经添加成功,代码如下
```JavaScript
router.beforeEach((to, from, next) => {
      if (store.getters.roles.length === 0) {
          store.dispatch('GenerateRoutes').then(accessRoutes => {
            router.addRoutes(accessRoutes) // 动态添加可访问路由表
            next({ ...to, replace: true })
          })
      } else {
        next()
      }
})
```
next()传参的**作用**是继续**还会**走`beforeEach`而不是直接进入某个路由
```JavaScript
beforeEach((to, from, next) => {
  next('/logon')
}
这行代码并不是直接进入 /logon
而是会一直循环在这里,知道遇到`next()`

正确代码

beforeEach((to, from, next) => {
   if(to.path === '/home') {
   	next('/logon')
   } else {
    // 如果要去的地方不是 /home ， 就放行
   	next()
   }
}
```
坑二 找不到component
而是组件component的引入,在服务器传递回来的组件是地址是**字符串**需要获取对应的组件
```JavaScript
// 遍历后台传来的路由字符串，转换为组件对象
function filterAsyncRouter(asyncRouterMap, lastRouter = false) {
  return asyncRouterMap.filter(route => {
    if (route.component) {
      // Layout ParentView 组件特殊处理
      if (route.component === 'Layout') {
        route.component = Layout
      } else if (route.component === 'ParentView') {
        route.component = ParentView
      } else if (route.component === 'InnerLink') {
        route.component = InnerLink
      } else {
        route.component = loadView(route.component)
      }
    }
    if (route.children != null && route.children && route.children.length) {
      route.children = filterAsyncRouter(route.children, route, type)
    } else {
      delete route['children']
      delete route['redirect']
    }
    return true
  })
}

const loadView = (view) => {
  if (process.env.NODE_ENV === 'development') {
    return (resolve) => require([`@/views/${view}`], resolve)
  } else {
    // 使用 import 实现生产环境的路由懒加载
    return () => import(`@/views/${view}`)
  }
}
```