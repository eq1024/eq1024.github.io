# EQ1024 · Frontend Engineer — V2.0

Personal homepage and blog. V2.0 "Field Manual" redesign — technical schematic aesthetics inspired by engineering drawings. Cold gunmetal grey + industrial safety orange, hard edges, zero rounding.

**Live at:** [your-domain.pages.dev](https://your-domain.pages.dev)

## Tech Stack

- **[Eleventy (11ty)](https://www.11ty.dev/)** v2 — static site generator
- **Nunjucks** — templating (`src/_includes/`)
- **Markdown** — content authoring (`src/blog/`)
- **Hand-written CSS** — single file, no preprocessor (`src/styles.css`)
- **Prism.js** — code syntax highlighting (Solarized Light / Tomorrow dark)
- **Custom subset fonts** — Anton + OPPO Sans + Maple Mono, self-hosted
- **Cloudflare Pages** — hosting + CI/CD

## Quick Start

```bash
# Install dependencies
npm install

# Dev server with hot reload
npm run dev

# Production build
npm run build
```

`npm run build` cleans `_site/`, rebuilds subset fonts, then runs Eleventy.

## Project Structure

```
.eleventy.js            # Eleventy config, filters, passthrough copies
src/
  _includes/
    base.njk            # Root layout: HTML shell, nav, footer, scripts
    post.njk            # Article layout with optional outline sidebar
    page.njk            # Generic page layout
  _data/site.json       # Site metadata (title, author, nav, lang)
  blog/
    blog.json           # Default front matter for all posts
    tags.njk            # Tag archive page
    *.md                # Blog posts (33 total)
  blog.njk              # Blog listing with pagination + tag filtering
  index.njk             # Homepage (hero, ledger, profile, record, systems, inventory)
  about.md              # About page
  styles.css            # All styles — CSS variables, prose, layout, dark mode
  scripts/
    hero-wireframe.js   # 4D hypercube wireframe on <canvas>
  fonts/                # Generated subset fonts (do not edit)
fonts-source/           # Original font source files
scripts/build-fonts.js  # Font subsetting automation
_site/                  # Build output (gitignored)
```

## Writing a Blog Post

Create a `.md` file in `src/blog/` with front matter:

```markdown
---
title: 文章标题
date: 2026-07-30
description: 文章摘要
tags:
  - 架构
  - 工程化
outline: true    # optional: enables sticky outline sidebar
---

正文内容。
```

Posts are automatically collected via the `posts` tag. Tags are used for filtering on `/blog/`.

## 豆瓣存档（Douban Archive）

站点的第五个板块（`/douban/`）：从本地 **豆备（Doubak）** 档案生成的个人豆瓣记录——
标记、日记、评论、豆列、相册与小组话题，带评分、短评与出处，全部资产本地化（零外部请求）。

内容不是手写的，而是从 [doubak-site-generator](https://github.com/Doubak/doubak-site-generator)
的 Markdown 产物同步而来；同步之后就是**普通内容文件**，流程和博客文章一样：`git add && git commit && git push`。

```sh
# 更新存档（二选一）：
npm run douban:sync -- --from <doubak 生成的 md 目录>
npm run douban:sync -- --canonical <canonical 目录> --bundle <bundle 目录>

# 生成器默认取同级目录 ../doubak-site-generator，可用 --generator 或 DOUBAK_GENERATOR 覆盖。
```

同步会做的变换（都在 `scripts/sync-douban.mjs` 里，可就地改）：

- 图片前缀 `/covers|/uploads` → `/douban-assets/covers|uploads`
- `tags` → `douban_tags`（用户的豆瓣标签保留，但不进入站点自身的标签系统）
- 跳过 doubak 自带主题的展示页（`_index`、状态筛选页、搜索页）——本站用自己的模板实现
- 裸日期加引号（防止 YAML 把 `2026-06-09` 解析成 Date 对象）

产出与对应模板：

| 位置 | 内容 |
|---|---|
| `src/douban/**` | 同步来的内容（**勿手改**；重新同步会覆盖） |
| `src/douban-assets/**` | 封面、上传图与搜索索引（passthrough 发布） |
| `src/douban.njk` | 存档首页 `/douban/` |
| `src/douban-list.njk` | 媒介 × 状态 × 分页的浏览页（`collections.doubanBrowse` 分桶） |
| `src/douban-search.njk` | 全文搜索页 `/douban/search/`（本地全量扫描，无索引服务） |
| `src/_includes/douban-item.njk` | 条目档案页（按 `douban_kind` 分支渲染） |

改版式时动模板与 `styles.css` 末尾的 `DOUBAN ARCHIVE` 段落即可，不要动 `src/douban/` 里的生成内容。

## Deployment

Configured for Cloudflare Pages:

- **Build command:** `npm run build`
- **Output directory:** `_site`

Push to `main` and Cloudflare Pages deploys automatically.

## License

MIT
