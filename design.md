# EQ1024 · Design System — Field Manual V2.0

> Cold gunmetal + industrial safety orange. Hard edges. No radius. Drafting-sheet discipline.

---

## 1. Design Philosophy

本站视觉语言源自**工程制图 / 技术图纸（Technical Schematic）**：

- **图纸纪律**：所有区块以 1px 实线分隔，如同制图图纸上的图框线。没有圆角、没有阴影、没有渐变装饰。
- **冷调工业感**：深枪灰底色 + 工业安全橙作为唯一强调色，克制且高对比。
- **数据即装饰**：编号（01/02/03）、坐标标注、参数面板、规格印章——信息本身就是视觉元素。
- **中文优先排版**：正文以中文阅读体验为第一优先级，英文标签作为辅助节奏。

关键词：**Hard / Cold / Precise / Industrial / No-nonsense**

---

## 2. Color System

### 2.1 Dark Theme（默认）

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#0b0d10` | 页面底色 |
| `--bg-alt` | `#0e1116` | 交替区块背景（ledger、footer） |
| `--surface` | `#12161c` | 卡片/代码块/内嵌面板 |
| `--card` | `#131820` | 独立卡片（spec sheet、matrix cell） |
| `--border` | `#222a34` | 常规分隔线 |
| `--border-light` | `#2e3846` | 强调边框（图框、标题块） |
| `--grid` | `rgba(148,170,195,0.055)` | 蓝图网格细线 |
| `--grid-strong` | `rgba(148,170,195,0.10)` | 蓝图网格主线 |
| `--t-caption` | `#5c6672` | 最弱文字（标签、坐标） |
| `--t-muted` | `#7f8a96` | 次要辅助文字 |
| `--t-secondary` | `#a9b3bf` | 正文 |
| `--t-primary` | `#d4dbe3` | 强调正文 |
| `--t-bright` | `#f2f5f9` | 标题/最亮文字 |
| `--accent` | `#ff5c1a` | 工业安全橙——唯一强调色 |
| `--accent-dim` | `rgba(255,92,26,0.28)` | 橙色弱化（光晕、下划线） |
| `--accent-ghost` | `rgba(255,92,26,0.06)` | 橙色悬停底色 |
| `--on-accent` | `#0b0d10` | 橙色上的文字 |
| `--ok` | `#3ddc84` | 状态绿（Deployed、Online） |

### 2.2 Light Theme — Blueprint Paper

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#edeff1` | 浅灰纸底 |
| `--bg-alt` | `#e7eaec` | 交替区块 |
| `--surface` / `--card` | `#ffffff` | 白色面板 |
| `--border` | `#c9ced3` | 分隔线 |
| `--border-light` | `#b4bbc2` | 强调边框 |
| `--t-bright` | `#0a0d11` | 标题 |
| `--accent` | `#e04a0c` | 略深的橙（保证浅色对比度） |
| `--ok` | `#0e9e5c` | 状态绿 |

### 2.3 用色规则

- 强调色**只用于**：编号、关键词高亮、交互状态、状态指示、CTA 按钮。
- 正文层级通过 5 级灰度（caption → muted → secondary → primary → bright）区分，不依赖颜色。
- 悬停反馈统一使用 `accent-ghost` 底色 + `accent` 文字/边框。
- 禁止使用其他彩色（除 `--ok` 绿色状态指示外）。

---

## 3. Typography

### 3.1 Font Stack

| Role | Family | Fallback | Usage |
|------|--------|----------|-------|
| Display | **Anton** | Arial Narrow, sans-serif | 大标题、编号、参数数值 |
| Body | **OPPO Sans 4.0** | PingFang SC, Microsoft YaHei, system | 正文、段落 |
| Mono | **Maple Mono** | SF Mono, Cascadia Code, Fira Code | 标签、编号、代码、元数据 |

所有字体自托管为 WOFF2，通过 `font-display: swap` 加载。构建时按实际使用字符做子集化。

### 3.2 Type Scale

| Element | Font | Size | Weight | Tracking | Case |
|---------|------|------|--------|----------|------|
| Hero Title | Anton | `clamp(4.6rem, 15vw, 12.5rem)` | 400 | 0.005em | UPPER |
| Section Title | Anton | `clamp(1.6rem, 3.2vw, 2.4rem)` | 400 | 0.01em | UPPER |
| Page Heading | Anton | `clamp(2rem, 4vw, 3rem)` | 400 | 0.01em | UPPER |
| Post Title | Anton | `clamp(1.8rem, 3.6vw, 2.8rem)` | 400 | 0.01em | UPPER |
| Spec Name | Anton | `clamp(1.15rem, 2.4vw, 1.6rem)` | 400 | 0.02em | UPPER |
| Body | OPPO Sans | 0.95rem / 16px base | 400 | — | — |
| Prose | OPPO Sans | 0.94–0.96rem | 400 | — | — |
| Mono Label | Maple Mono | 0.58–0.72rem | 500–700 | 0.06–0.28em | UPPER |
| Caption | Maple Mono | 0.58–0.62rem | 400 | 0.14–0.3em | UPPER |

### 3.3 排版规则

- 行高：正文 `1.75–1.85`，标题 `1.08–1.2`，Hero 标题 `0.86`（紧凑冲击力）。
- 中文正文最大宽度 `640px`（`.prose`），阅读舒适。
- `em` 标签在正文中渲染为橙色（`font-style: normal`），用于关键词强调。
- `strong` 提升一级灰度（secondary → primary），不加粗到突兀。
- 所有 Mono 文字默认 `text-transform: uppercase` + 宽 letter-spacing。

---

## 4. Spacing & Layout

### 4.1 Core Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--max` | `1180px` | 内容最大宽度 |
| `--narrow` | `760px` | 窄内容（about 等） |
| `--gap` | `clamp(84px, 11vh, 120px)` | 区块间距参考 |
| Container padding | `clamp(20px, 4.5vw, 48px)` | 左右安全边距 |
| Section padding | `clamp(64px, 9vh, 96px)` top/bottom | 区块内上下留白 |

### 4.2 Layout Patterns

- **Section（`.sec`）**：以 `border-top: 1px solid var(--border)` 起始，内含编号头部 + 标题 + 内容。
- **Grid 布局**：About 使用 `300px + 1fr` 双栏；Spec Sheet 使用 `1fr 1fr` 四格；Matrix 使用 `auto-fill, minmax(300px, 1fr)` 自适应。
- **Record Table**：5 列网格 `92px 168px 1.1fr 1.7fr 150px`，移动端折叠。
- **Post Layout**：单栏 `minmax(0, 1fr)` + 可选 200px 侧边栏（outline）。

### 4.3 间距节奏

- 使用 `clamp()` 做响应式间距，避免固定断点跳变。
- 区块头部（`.sec__head`）与标题间距：`clamp(36px, 5vh, 56px)`。
- 标题与内容间距：`clamp(30px, 4vh, 44px)`。
- 卡片间距：`clamp(30px, 4vh, 44px)`。

---

## 5. Component Patterns

### 5.1 Section Header（`.sec__head`）

```
[编号]  [名称]  ———————————————————— [方块]
 01    PROFILE
```

- 编号：Mono 0.72rem，accent 色，`letter-spacing: 0.1em`
- 名称：Mono 0.72rem，bright 色，`letter-spacing: 0.28em`，UPPER
- 横线：`flex: 1`，1px border 色，右端 5×5px 方块装饰

### 5.2 Buttons（`.btn`）

- 方形，无圆角，1px border
- Mono 0.72rem，700 weight，`letter-spacing: 0.14em`，UPPER
- Default：transparent bg + border-light + secondary 文字
- Hover：accent border + accent 文字 + accent-ghost bg
- Primary（`.btn--primary`）：accent 实底 + on-accent 文字；hover 反转为 bright 底

### 5.3 Tags（`.tag`）

- Mono 0.58rem，border 1px，surface bg
- 无圆角，`padding: 3px 8px`
- 用于技术栈标签、文章分类

### 5.4 Spec Sheet（`.spec`）

工程规格书样式的项目卡片：
- 头部：编号方块（accent 底）+ 项目名 + 状态印章（绿色 DEPLOYED）
- 主体：2×2 网格（Problem / Solution / Key Decisions / Field Notes）
- 底部：指标数据（Anton 数值 + Mono 标签）+ 技术栈 tags
- 每个 cell 左上角有 7×7px accent 方块作为标签前缀

### 5.5 Matrix Cell（`.matrix__cell`）

技能矩阵单元：
- 1px gap 模拟网格线（父容器 bg 为 border 色）
- 标签行：accent 色分类名 + 灰色等级标注（CAT-A / CAT-B / CAT-S）
- Hover：accent-ghost 底色

### 5.6 Record Row（`.record__row`）

职业经历表格行：
- REV 编号（Anton，bordered box）
- 日期（Mono）+ 角色 + 描述 + 标签
- Hover：accent-ghost 底色 + REV 方块反转为 accent 底

### 5.7 Directive Banner（`.directive`）

AI 工作流声明：
- 45° 条纹边框（repeating-linear-gradient）
- 左侧 4px accent 实线
- 内部 card 底色

### 5.8 Navigation（`.nav`）

- 固定顶部，54px 高
- 滚动 >30px 后：毛玻璃背景（`backdrop-filter: blur(14px)`）+ 底部 border
- 链接：Mono 0.66rem，UPPER，编号前缀为 accent 色
- 主题切换按钮在最右，以 border-left 分隔

### 5.9 Footer（`.footer`）

- 与 Section 相同的头部格式（END / Sign-Off）
- Motto 用 Anton 大字
- 技术栈声明行（Mono caption 级）
- 签核行：grid 布局，模拟图纸签核栏

---

## 6. Motion & Interaction

### 6.1 原则

- **Hard snap-in**：所有动画使用 `cubic-bezier(0.16, 1, 0.3, 1)`（快入慢出），无弹性。
- **尊重 `prefers-reduced-motion`**：全局禁用动画/过渡。
- 动画仅用于引导注意力，不做装饰性循环动画（ledger 除外）。

### 6.2 Scroll Reveal（`.reveal`）

- 初始：`opacity: 0; translateY(14px)`
- 进入视口：`opacity: 1; translateY(0)`
- 时长 0.5s，延迟梯度 `.r1`(+60ms) / `.r2`(+120ms) / `.r3`(+180ms)

### 6.3 Custom Cursor

- 仅 `pointer: fine` 设备启用
- CAD 十字准星风格：6px 实心点（instant follow）+ 30px 取景框（lerp 0.16 trailing）
- 悬停交互元素：取景框旋转 45° + 放大 1.35×（lock-on 效果）
- 离开窗口：隐藏

### 6.4 Hero Wireframe

- Canvas 渲染 4D 超立方体（tesseract）线框
- 位于 Hero 右侧 52% 区域
- `prefers-reduced-motion` 时隐藏
- 移动端全宽 + 降低透明度

### 6.5 Ledger Marquee

- 无限水平滚动，36s 线性循环
- 内容翻倍实现无缝衔接
- `prefers-reduced-motion` 时静止

### 6.6 Micro-interactions

- 链接 hover：color 过渡 0.2s
- 按钮 hover：bg + color + border 过渡 0.18s
- 雷达脉冲（`.hero__meta-cursor`）：1.8s ping 动画
- 状态点（`.hero__status-dot`）：2.2s ping + 绿色光晕
- Scroll cue：2.4s 横线缩放动画

---

## 7. Decorative Elements

### 7.1 Blueprint Grid（Hero）

- 细线 36px 间距 + 主线 180px 间距
- 使用 `--grid` / `--grid-strong` 透明度
- Light theme 降低到 0.55 opacity

### 7.2 Registration Cross（Hero Title）

- 标题右上角的十字准线（::before + ::after）
- 1px accent 线，16px 长

### 7.3 Sheet Metadata

- Hero 四角的图纸元信息（DWG NO. / SCALE / REV）
- Mono 0.6rem，caption 色，UPPER
- 两侧垂直坐标文字（`writing-mode: vertical-rl`）

### 7.4 Section Rule Endpoint

- 每个 section header 横线右端有 5×5px 方块（`--border-light`）

### 7.5 Cell Label Marker

- Spec sheet / Matrix 标签前的 7×7px accent 方块

---

## 8. Responsive Strategy

| Breakpoint | Changes |
|------------|---------|
| `≤1200px` | Post sidebar 隐藏，单栏布局 |
| `≤1020px` | Record table 折叠为 2 列（REV + 内容堆叠） |
| `≤900px` | Hero 坐标文字隐藏；wireframe 全宽半透明 |
| `≤860px` | About grid 单栏 |
| `≤760px` | Spec grid 单栏；spec stack 不再右对齐 |
| `≤640px` | 基础字号降至 15px；nav 链接紧凑；brand version 隐藏 |
| `≤600px` | Hero params 单栏；Record 完全单栏 |
| `≤560px` | Spec stamp 隐藏；spec head 编号缩小 |

原则：
- 使用 `clamp()` 做流体排版，减少硬断点。
- 移动端优先保证内容可读性，装饰元素逐步移除。
- 触摸设备不显示自定义光标。

---

## 9. Accessibility

- 所有装饰元素标记 `aria-hidden="true"`
- 导航使用 `<nav aria-label>`
- 自定义光标仅在 `pointer: fine` 时激活，不影响键盘/触屏
- `:focus-visible` 提供 2px accent outline + 3px offset
- `::selection` 使用 accent 底 + on-accent 文字
- 完整的 `prefers-reduced-motion` 支持
- 颜色对比度：正文（secondary on bg）≥ 7:1；caption 级文字仅用于非关键信息
- 语义化 HTML：`<article>`, `<time>`, `<dl>`, `<nav>`, `<main>`, `<footer>`

---

## 10. Code Style Conventions

### CSS

- 单文件 `styles.css`，无预处理器
- BEM-like 命名：`.block__element--modifier`
- 区块注释分隔：`/* === SECTION NAME === */`
- 所有颜色通过 CSS custom properties 引用，禁止硬编码
- 媒体查询就近放置在组件之后
- 使用 `clamp()` 优先于固定值 + 断点

### HTML / Nunjucks

- 语义标签优先
- 装饰元素一律 `aria-hidden="true"`
- 组件 class 与 CSS 一一对应
- 数据通过 `_data/site.json` 集中管理

### JavaScript

- 无框架，原生 ES5-compatible IIFE
- 功能内联在 `base.njk` 的 `<script>` 中（除 hero-wireframe）
- 使用 `requestAnimationFrame` 节流滚动事件
- 被动事件监听（`{ passive: true }`）

---

## 11. Content Voice

- 中文为主，技术术语保留英文
- 语气：工程师对工程师，直接、具体、有数据
- 避免：营销话术、空洞形容词、emoji
- 偏好：量化结果（−92% 文件、10× 构建速度）、具体决策理由、真实约束描述
- 标题格式：中文描述 — *English Label*（如 "成长路径 — *从实习生到独立架构*"）
- 编号系统贯穿全站：01 Profile / 02 Record / 03 Systems / 04 Inventory

---

## 12. File & Asset Conventions

| Asset | Format | Notes |
|-------|--------|-------|
| Fonts | WOFF2 | 自托管，构建时子集化 |
| Icons | 无图标库 | 使用文字符号（↗ ↑ ■ + //）和 CSS 绘制 |
| Images | PNG | 仅 favicon / OG image / PWA icons |
| Code highlight | Prism.js | Solarized Light + Tomorrow Dark |
| JS | Vanilla | 无构建步骤，无 bundler |

---

*Drawn by hand. No design tool. No component library. One CSS file.*
