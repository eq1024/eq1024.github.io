---
title: pnpm Monorepo 实战避坑指南
date: 2026-07-15
description: 基于 Vue 3 + Vite + Turborepo 技术栈，独立搭建 9 个共享包的经验总结——从依赖地狱到工程化最佳实践。
tags:
  - 工程化
  - Monorepo
outline: true
---

在最近的项目中，我独立将一个由 3 个独立 Git 仓库组成的系统重构为 pnpm + Turborepo 的 Monorepo 架构——3 个应用，9 个共享包，代码量缩减 92%。这篇文章整理了过程中踩过的坑和沉淀的经验。

## 依赖地狱：谁装什么、谁能用谁的

### 坑 1：pnpm 严格模式——import 了就必须声明

pnpm 默认严格模式：一个包只能 import 自己 `package.json` 里声明过的依赖。npm 和 yarn 会把所有依赖拍平到根 `node_modules`，任何包都能蹭别人的——pnpm 不会。

```bash
# 错误示范 — @bsd/ui 里这么写
import { h } from "snabbdom";

# 但 @bsd/ui/package.json 没有声明 snabbdom
# → pnpm 会报错，即使别的包已经装了它
```

**规则很简单**：一个包 `import` 了什么，就必须在自己的 `package.json` 里声明它。

### 坑 2：Singleton 库装了两份——整个应用就炸了

Vue、Pinia、Vue Router、Element Plus 这些库全局只有一个实例。如果共享包把它们写在 `dependencies` 里，版本不匹配时可能装两份——**两份 Pinia = 两个 store 注册表 = store 互相找不到**。

```jsonc
// ❌ 错误 — 共享包里直接 depend singleton
{
  "dependencies": {
    "element-plus": "2.11.3",
    "pinia": "^3.0.3"
  }
}

// ✅ 正确 — peerDependencies，用宿主的
{
  "peerDependencies": {
    "element-plus": "^2.11.0",
    "pinia": "^3.0.3"
  }
}
```

**判断标准**：

| 类型 | 例子 | 放哪里 |
|---|---|---|
| Singleton（两份会炸） | vue, pinia, vue-router, element-plus, echarts | `peerDependencies` |
| 纯工具（多份无所谓） | dayjs, axios, radash, mitt | `dependencies` |
| workspace 内部包 | @bsd/ui, @bsd/utils | `dependencies: "workspace:*"` |

### 坑 3：`^` 版本范围不一定只装一份

```jsonc
// admin/package.json    "pinia": "~3.0.3"
// server/package.json   "pinia": "~3.1.0"
// → 范围无交集，pnpm 装两份 ❌
```

**解决**：用 `pnpm.overrides` 强制统一所有子包的 singleton 库版本：

```jsonc
// 根 package.json
{
  "pnpm": {
    "overrides": {
      "pinia": "^3.0.5",
      "vue": "^3.4.0",
      "element-plus": "~2.11.3"
    }
  }
}
```

## 共享包的边界：什么能共享、什么不该共享

### 坑 4：路径别名在共享包里不解析

`@/` 是每个应用的 `vite.config.js` 里定义的别名。共享包里根本没有这个别名。

```js
// ❌ packages/ui/src/some-component.vue
import { httpClient } from "@/utils/request";  // @/ 不存在于共享包
```

**解决**：依赖注入——宿主传给共享包，共享包不反向 import 应用的东西。

```js
// ✅ packages/ui/src/plugin.js
export function registerPlugin(httpClient) {
  // 宿主传来，不反向 import
}

// ✅ apps/admin/src/main.js
import { registerPlugin } from "@bsd/ui";
registerPlugin(httpClient);  // 注入宿主实例
```

### 坑 5：三个应用的 Store 90% 相同——但没强行统一

当 admin/server/client 的 auth store 结构高度相似时，容易每个 app 复制一份再微调。我的选择是**工厂函数 + 配置化**：

```js
// ✅ packages/stores/createAuthStore.js
export function createAuthStore({ portal, api, router, extraState, onGetInfo }) {
  return defineStore("auth", {
    state: () => ({ /* 公共状态 */ ...extraState }),
    actions: { /* 公共逻辑 */ },
  });
}

// ✅ 各应用分别调用工厂函数
export const useAuthStore = createAuthStore({
  portal: "management",
  api,
  router,
  extraState: {},
  onGetInfo(state, data) { /* ... */ },
});
```

**判断标准**：100% 相同 → 抽共享包；90% 相同有差异 → 工厂函数；差异太大 → 独立维护。不要为了"统一"而强行抽象。

## 运行时陷阱

### 坑 6：响应拦截器直接操作 DOM / 路由 → 循环依赖

```js
// ❌ 共享包里直接 push 路由
if (status === 401) {
  router.push("/login");  // 哪来的 router？循环依赖！
}
```

**解决**：工厂模式 + 回调注入：

```js
createHttpClient({
  handlers: {
    redirectToLogin: () => router.push("/login"),
    getToken: () => authStore.token,
    clearToken: () => authStore.clearToken(),
  },
});
```

### 坑 7：CSS 样式重复打包

Element Plus 的 CSS 如果同时在共享包和应用里 import，可能打包两份（每份 ~300KB）。**解法**：CSS 统一在应用层 `main.js` 里 import，共享包只写组件逻辑，不引入 UI 库样式。

## 速查清单

在 Monorepo 里加新共享包时，对照检查：

- [ ] singleton 库 → `peerDependencies`
- [ ] 纯工具库 → `dependencies`
- [ ] workspace 内部包 → `dependencies: "workspace:*"`
- [ ] 没有用 app 的路径别名（`@/` 等）
- [ ] 需要宿主注入的 → 传参/工厂函数，不直接 import
- [ ] Vue 组件包 → `peerDependencies: { vue }` + `devDependencies: { vue }`
- [ ] `pnpm install` 后确认没有多版本 singleton 库
- [ ] 环境变量通过 config 包统一读取，不直接 `import.meta.env`
- [ ] CSS 在应用层统一 import
- [ ] Turborepo `dependsOn` 正确设置了构建顺序

---

这些经验来自一个真实项目的实践——从三个独立仓库的代码复制粘贴，到 9 个共享包、严格单向依赖拓扑的 Monorepo。希望对你有所帮助。
