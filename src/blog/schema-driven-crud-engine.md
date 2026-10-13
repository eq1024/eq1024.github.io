---
title: 配置驱动 CRUD——让 40 个列表页不再需要前端代码
date: 2026-07-25
description: 手写列表页的尽头是复制粘贴。我在重构一个仓储管理系统时设计了一套 JSON 驱动的配置化引擎——这篇文章聊聊设计思路和取舍。
tags:
  - 架构
  - 工程化
  - Vue
outline: true
---

一个仓储管理系统有 60+ 个业务模块。每个模块都需要列表页——筛选面板 + 数据表格 + 分页 + 新建/编辑表单 + 校验。旧版系统中，每个模块都有一份完整的样板代码：template 里写筛选条件，script 里写请求逻辑，再来一份表单。

手写 60 个列表页不是问题，**维护 60 份互相复制粘贴的列表页才是问题**。

## 问题：不是写，是改

旧版系统约 1,720 个 `.vue` 文件。新增一个列表页的典型流程：找类似的页面 → 复制粘贴 → 改字段名、改 API 路径、改表单校验 → 调试 → 上线。

三个问题：
1. **一致性无法保证**：A 页面的分页默认 10 条，B 页面可能写成了 20
2. **修改成本高**：加一个"导出"按钮要改 60 个文件
3. **非开发人员完全依赖前端**：产品经理想加一个筛选字段，要排期

## 方案：JSON Schema 驱动渲染

核心思路很简单，分三层：

```
DynamicListPage（路由层）
  → 携带 pageCode 请求后端 JSON Schema
  → 交给 ListPage 渲染

ListPage（渲染层）
  → 读取 Schema 中的 filterColumns 渲染筛选面板
  → 读取 columns 渲染表格列
  → 读取 formFields 传递给表单弹窗

CustomActionForm（表单层）
  → 根据 formFields 数组动态渲染表单
  → 支持 16+ 种字段类型
  → 条件显隐、远程选项、级联清空
```

### 一个典型的 Schema

```json
{
  "pageCode": "INVENTORY_LIST",
  "title": "库存管理",
  "filterColumns": [
    { "type": "input", "prop": "sku", "label": "SKU", "placeholder": "请输入" },
    { "type": "select", "prop": "warehouse_id", "label": "仓库", "remote": "/api/warehouses" },
    { "type": "date-range", "prop": "date_range", "label": "入库时间" }
  ],
  "tableColumns": [
    { "prop": "sku", "label": "SKU", "width": 140, "sortable": true },
    { "prop": "name", "label": "产品名称", "minWidth": 180 },
    { "prop": "quantity", "label": "库存数量", "type": "number" }
  ],
  "api": {
    "list": "/api/v1/inventory/list",
    "export": "/api/v1/inventory/export"
  }
}
```

后端下发这份 JSON，前端读完就知道要渲染什么——不需要为 INVENTORY_LIST 写任何前端代码。

## 表单引擎：16+ 种字段类型

表单比表格复杂得多。每种字段有自己的渲染逻辑、校验规则、交互行为。支持的类型：

文本 / 数字 / 下拉（单选/多选）/ 日期 / 日期范围 / 图片上传 / 文件上传 / 扫码输入 / 开关 / 单选组 / 多选组 / 级联选择 / 富文本 / 标签选择 / 自定义组件 / 仅展示文本

更关键的能力：

### 条件显隐

```json
{
  "prop": "reject_reason",
  "label": "驳回原因",
  "type": "textarea",
  "visible": { "dependsOn": "status", "when": "rejected" }
}
```

当 `status` 字段的值不为 `rejected` 时，这个字段不渲染。不需要写 `v-if`。

### 远程选项

```json
{
  "prop": "warehouse_id",
  "type": "select",
  "remote": "/api/warehouses?status=active"
}
```

下拉选项从后端动态获取，支持搜索、分页。

### 级联清空

```json
{
  "prop": "sub_category",
  "type": "select",
  "cascade": { "dependsOn": "category", "action": "clear-and-reload" }
}
```

当 `category` 变化时，`sub_category` 自动清空并重新拉取选项。手动处理这种逻辑：watch → if → clear → reload。Schema 化后：一行配置。

## FormDesigner：让非开发人员也能搭建表单

光有 JSON 还不够——谁来写 JSON？产品的字段需求变化频繁，让前端写 JSON 只是把问题从写模板转移到了写配置。

配套的 **FormDesigner** 是一个可视化表单设计器：

- 左侧：字段类型面板（拖拽或点击添加）
- 中间：实时预览
- 右侧：属性面板（配置校验规则、选项、显隐条件）
- 顶部：导出 JSON → 粘贴到后端配置 → 上线

产品经理或实施人员可以自己搭表单，前端不再介入 CRUD 页面的字段新增和修改。

## 不是银弹

配置驱动的边界在哪里？我们做了清晰的划分：

| 适合 Schema 化 | 仍需手写 |
|---|---|
| 标准列表页（筛选+表格+分页+CRUD） | 复杂交互页面（如拖拽可视化） |
| 标准表单（录入/编辑+校验+提交） | 高度定制化的数据展示（如看板） |
| 简单审批流 | 复杂工作流和多步骤操作 |

约 40+ 个标准列表页实现了零前端代码。剩下的需要手写。

关键取舍：**Schema 驱动不是让前端消失，而是让前端的时间花在有复杂度的地方**。与其手写第 41 个表格，不如去设计更好的共享包架构。

## 成果

- **40+ 个列表页**零前端代码
- 字段类型从旧版 6 种扩展到 **16+ 种**
- 非开发人员可以用 FormDesigner 自行搭建表单
- 新增加一个筛选字段：后端改 JSON → 前端即时生效，零代码部署

## 总结

这套引擎的设计思路是"设计框架，而不是只用框架"。Element Plus 提供了组件，但没有提供业务级别的抽象。在组件库之上，根据业务特征构建第二层抽象——这才是前端架构的价值所在。
