# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

A personal homepage and blog built with Eleventy (11ty). V2.0 "Field Manual" redesign — technical schematic aesthetics inspired by engineering drawings. Cold gunmetal grey + industrial safety orange palette, hard edges, zero rounding. The site uses Markdown for content, Nunjucks for layouts, and hand-written CSS. Designed with Chinese typography as the primary language.

## Tech Stack

- **Static Site Generator**: [Eleventy (11ty)](https://www.11ty.dev/) v2.x
- **Templates**: Nunjucks (`.njk`)
- **Content**: Markdown (`.md`) with `markdown-it` + `markdown-it-anchor`
- **Styling**: Hand-written CSS in `src/styles.css` — no preprocessor, no framework
- **Code Highlighting**: Prism.js with Solarized Light (light theme) and Tomorrow (dark theme)
- **Fonts**: Custom subset fonts — Anton (display), OPPO Sans (body), Maple Mono (code). Self-hosted as WOFF2.
- **Deployment**: Cloudflare Pages

## Common Commands

```bash
# Install dependencies
npm install

# Start dev server with hot reload
npm run dev

# Build for production (cleans _site, builds fonts, runs eleventy)
npm run build

# Rebuild subset fonts from fonts-source/
npm run build:fonts

# Clean _site output
npm run clean
```

## Project Structure

```
.eleventy.js          # Eleventy configuration, filters, collections, passthrough copies
TODO.md               # Prioritized task/audit list
src/
  _includes/
    base.njk          # Root layout: <html>, <head>, nav, footer, theme toggle, Prism, custom cursor, script bundle
    post.njk          # Article layout: title, meta, prose content, optional sticky outline sidebar
    page.njk          # Generic page layout (used by about.md)
  _data/site.json     # Site metadata: title, description, author, lang, nav links
  blog/
    blog.json         # Default front matter for posts (tags: ["posts"], layout: post.njk)
    tags.njk          # Tag archive page with pagination
    *.md              # 33 Markdown blog posts (4 new, 29 legacy with old- prefix)
  blog.njk            # Blog listing page with pagination (8 per page) and tag filtering
  index.njk           # Homepage: Hero → Ledger → Profile → Service Record → Systems → Inventory
  about.md            # About page (uses page.njk layout)
  styles.css          # Single stylesheet — CSS variables, prose, layout, dark mode, all components
  scripts/
    hero-wireframe.js # 4D hypercube wireframe on <canvas>
  fonts/              # Generated subset fonts (do not edit manually)
fonts-source/         # Original font source files (tracked in git for Cloudflare build)
scripts/build-fonts.js# Font subsetting script (reads fonts-source/, scans src/ for used characters)
_site/                # Build output (gitignored)
```

## Architecture Notes

### Template Inheritance

Content flows through templates in this hierarchy:

```
Markdown / Nunjucks page
    ↓
  post.njk / page.njk / index.njk / blog.njk
    ↓
  base.njk
```

- `base.njk` renders the HTML shell: `<head>` with meta tags, OG tags, favicons, PWA manifest, font preloads, theme stylesheets; `<body>` with custom cursor elements, `nav` (sticky header), `<main>` content slot, `footer`, Prism scripts, and the full inline script bundle.
- `post.njk` renders the article header, `.prose` content, and a sticky outline sidebar when `outline: true` is set in front matter.
- `page.njk` wraps content in `.page-content.container` — used by the about page.
- `index.njk` is a flat page (no layout nesting beyond base) with 6 sections: Hero, Ledger marquee, Profile, Service Record, Systems, Inventory.

### Content Pipeline

- Eleventy reads from `src/` and outputs to `_site/`.
- Markdown is processed with `markdown-it` plus `markdown-it-anchor`, which auto-generates `id` attributes on `h2/h3/h4` headings with a Chinese-aware slug function.
- The `outline` Nunjucks filter scans rendered HTML for headings, builds a nested tree, and emits `<ul>` markup for the sidebar.
- Blog posts use the `posts` tag (applied automatically by being in `src/blog/`). The `collections.posts` collection powers the blog listing and pagination.
- Static assets are copied via `addPassthroughCopy` in `.eleventy.js`.

### Styling

- All styles live in `src/styles.css` (~3000+ lines). No CSS preprocessor.
- CSS custom properties on `:root` for the light theme, overridden on `[data-theme="dark"]` for dark mode.
- Dark mode is the default (`<html data-theme="dark">`).
- The `.prose` class handles all typography for Markdown content (headings, paragraphs, lists, code blocks, tables, blockquotes).
- Key design tokens: `--bg` (dark: `#0b0d10`), `--surface` (dark: `#11161a`), `--text` (dark: `#cdd6db`), `--accent` (industrial orange `#ff6b35`).

### Code Highlighting

- Prism.js is loaded from `node_modules/prismjs` and copied to `_site/` during build.
- Light theme: `prism-solarizedlight.css`; Dark theme: `prism-tomorrow.css`.
- Supported languages: JSX, TypeScript, TSX, Bash, JSON (plus default languages).
- At runtime, code blocks inside `.prose` are wrapped with a `.code-block` div containing a toolbar with Copy and Fullscreen buttons (inline script in `base.njk`).

### Custom Cursor

- Only activates on fine-pointing devices (hides on touch/mobile).
- A CAD-style crosshair: a small dot + trailing reticle with lerp smoothing.
- Enlarges on interactive elements (`a`, `button`, `input`, etc.) via `.cursor--active`.
- Respects `prefers-reduced-motion`.

### Scroll Behavior

- Smooth scroll for anchor links (respects `prefers-reduced-motion`).
- Nav bar gets `.nav--onscroll` class after 30px of scroll for background transition.
- `.reveal` elements animate in on scroll (intersection observer-style via scroll listener).
- Blog post outline sidebar highlights the current section on scroll.

### Font Subsetting

- `scripts/build-fonts.js` collects all unique characters from `src/`, subsets the source fonts in `fonts-source/`, and outputs to `src/fonts/`.
- `.ttf` source files → `fontmin` (subset) → `wawoff2` (compress to WOFF2).
- `.woff2` source files are copied as-is.
- `npm run build:fonts` runs this; `npm run build` runs it automatically before Eleventy.
- `src/fonts/` is generated — never edit files there directly.

### Homepage Sections

The homepage (`index.njk`) is a single-page layout with these sections:

1. **Hero** — 4D hypercube wireframe on `<canvas>`, title "EQ1024", key specs (Vue/React/Cross-Platform/AI-Native), stats panel, action buttons
2. **Ledger** — Infinite marquee of tech keywords (duplicated track for seamless loop)
3. **01 Profile** — Operator file panel (designation, service years, stack, status) + bio paragraphs
4. **02 Service Record** — Career timeline as a table (R1–R4 rows with date, role, details, tags)
5. **03 Systems** — Project spec sheets: BMS Monorepo, ServicePioneer RN app, Self Repair platform
6. **04 Inventory** — Skills matrix (6 categories: Frontend, Cross-Platform, Architecture, Data & State, Infra, AI Workflow) + AI-native directive callout

## Key Files

| File | Purpose |
|------|---------|
| `.eleventy.js` | Eleventy config, passthrough copies, custom filters (`readableDate`, `shortDate`, `excerpt`, `outline`, `selectByTag`), `tagList` collection |
| `src/_data/site.json` | Site title, description, author, language (`zh-CN`), nav links |
| `src/_includes/base.njk` | Root layout — the entire HTML shell with all inline scripts |
| `src/_includes/post.njk` | Article layout and optional outline sidebar |
| `src/styles.css` | All visual styles — CSS variables, layout, prose, components, dark mode |
| `src/index.njk` | Homepage with all 4 major sections |
| `src/blog.njk` | Blog listing with pagination + tag filter chips |
| `src/blog/blog.json` | Default front matter for all posts (tags, layout) |
| `src/blog/tags.njk` | Tag archive page — filtered posts per tag |
| `scripts/build-fonts.js` | Font subsetting and WOFF2 compression |
| `src/scripts/hero-wireframe.js` | 4D hypercube canvas renderer |
| `TODO.md` | Prioritized task list from site audit |

### 豆瓣存档（Douban Archive）

- 内容由 `scripts/sync-douban.mjs` 从 doubak 生成器的 Markdown 产物同步进 `src/douban/`（**生成内容，勿手改**，重新同步即覆盖）+ `src/douban-assets/`（封面/上传图/搜索索引，passthrough 发布）。
- 命令：`npm run douban:sync -- --from <md 目录>` 或 `npm run douban:sync -- --canonical <目录> --bundle <目录>`（生成器默认取同级 `../doubak-site-generator`）。
- 模板：`src/douban.njk`（存档首页）、`src/douban-list.njk`（媒介×状态×分页，数据来自 `collections.doubanBrowse`）、`src/douban-search.njk`（本地全文扫描）、`src/_includes/douban-item.njk`（条目页，按 `douban_kind` 分支）。
- `.eleventy.js` 里新增：`doubanMarks` / `doubanBrowse` / `archiveStats` / `doubanNotes` / `doubanDoulists` / `doubanAlbums` / `doubanGroupTopics` 集合，`mediumName` / `statusVerb` / `dateOnly` 过滤器，`src/douban-assets` passthrough。
- 样式在 `styles.css` 末尾的 `DOUBAN ARCHIVE — Field Archive` 段落；评分是五枚直角方块（未评分不画空块），状态用文字符号 ◇/▶/■。

## Development Notes

- **Adding a blog post:** Create a `.md` file in `src/blog/` with front matter: `title`, `date`, `description`, `tags` (array), and optionally `outline: true`. The `posts` tag is applied automatically.
- **Changing styles:** Edit `src/styles.css` only. There is no CSS preprocessor — all styles are in one file. Use the existing CSS variable system for colors.
- **Changing layout:** Edit the Nunjucks files in `src/_includes/`.
- **Adding a static page:** Create a `.md` or `.njk` file in `src/`, set `layout: page.njk` (or `base.njk` for full control).
- **Site metadata:** Edit `src/_data/site.json` for title, description, nav links, etc.
- **Fonts:** Source files go in `fonts-source/`. Run `npm run build:fonts` to regenerate subsets. The generated `src/fonts/` is tracked in git.
- **Cloudflare Pages:** Build command is `npm run build`, output directory is `_site`.
- **Dark mode:** Default theme is dark. Theme preference is persisted in `localStorage`. The toggle button switches `data-theme` on `<html>` and swaps the active Prism stylesheet.
