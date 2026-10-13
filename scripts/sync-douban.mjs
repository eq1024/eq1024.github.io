#!/usr/bin/env node
/**
 * 豆瓣存档同步：doubak 生成器 → 个人站内容树。
 *
 * 用法（二选一）：
 *   npm run douban:sync -- --from <已生成的 md 目录>
 *   npm run douban:sync -- --canonical <canonical 目录> --bundle <bundle 目录> [--generator <doubak-site-generator 目录>]
 *
 * 无痛原则：同步之后，存档就是站点里的普通内容文件——
 * `git add && git commit && git push`，CI 照常发布，没有任何特殊步骤。
 *
 * 产出：
 *   src/douban/**            作品 / 日记 / 评论 / 豆列 / 相册 / 小组（含 douban_* front matter）
 *   src/douban-assets/**     封面、上传图、搜索索引（passthrough 发布）
 *
 * 同步时做的变换（只做必要的最小改动）：
 *   1. `/covers/`、`/uploads/` 前缀 → `/douban-assets/covers|uploads/`（front matter 与正文都改）
 *   2. `tags:` → `douban_tags:`（用户写的豆瓣标签保留，但不让它们进入站点自身的标签系统）
 *   3. 跳过生成器自带的展示页（`_index`、状态筛选页、搜索页）——那些页面由本站模板自己实现
 */

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync } from 'node:fs';
import os from 'node:os';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE = resolve(HERE, '..');
const CONTENT = join(SITE, 'src', 'douban');
const ASSETS = join(SITE, 'src', 'douban-assets');

/** 保留的内容类型（其余是 doubak 自带主题的展示页，本站在模板里自己实现）。 */
const KINDS = new Set(['mark', 'note', 'review', 'doulist', 'album', 'group_topic', 'group_joins']);

/** 每次同步前清掉的生成目录（douban.json 目录数据不在其中，会被保留）。 */
const KIND_DIRS = ['movie', 'book', 'music', 'game', 'drama', 'note', 'review', 'doulist', 'album', 'group', 'broadcast'];

const argv = process.argv.slice(2);
const arg = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : null;
};

const usage = () => {
  console.error(`用法：
  npm run douban:sync -- --from <已生成的 md 目录>
  npm run douban:sync -- --canonical <canonical 目录> --bundle <bundle 目录> [--generator <doubak-site-generator 目录>]

说明：--from 直接同步 doubak 的 md 产物；--canonical/--bundle 会先调用生成器现场产出。
生成器默认找个人站的同级目录 ../doubak-site-generator，也可用环境变量 DOUBAK_GENERATOR 指定。`);
  process.exit(2);
};

const die = (msg) => {
  console.error(`\n[douban:sync] ${msg}`);
  process.exit(1);
};

// ── 1. 拿到待同步的 md 目录
let source = arg('--from');
let tempDir = null;

if (source) {
  source = resolve(source);
} else {
  const canonical = arg('--canonical');
  const bundle = arg('--bundle');
  if (!canonical || !bundle) usage();

  const generator = resolve(arg('--generator') ?? process.env.DOUBAK_GENERATOR ?? join(SITE, '..', 'doubak-site-generator'));
  const genBin = join(generator, 'bin', 'generate.js');
  if (!existsSync(genBin)) {
    die(`找不到 doubak 生成器：${genBin}\n用 --generator <目录> 或环境变量 DOUBAK_GENERATOR 指定。`);
  }

  tempDir = mkdtempSync(join(os.tmpdir(), 'doubak-md-'));
  console.log(`[douban:sync] 调用 doubak 生成器 → ${tempDir}`);
  const r = spawnSync(process.execPath, [genBin, '--no-theme', resolve(canonical), resolve(bundle), tempDir], {
    stdio: 'inherit',
  });
  if (r.status !== 0) die('doubak 生成失败，仓库内容一个字都没动。');
  source = tempDir;
}

if (!existsSync(join(source, 'content'))) {
  die(`${source} 里没有 content/ 目录，看起来不是 doubak 的 md 产物。`);
}

// ── 2. 清空上一次同步的内容（只动生成目录）
for (const dir of KIND_DIRS) rmSync(join(CONTENT, dir), { recursive: true, force: true });
rmSync(ASSETS, { recursive: true, force: true });
mkdirSync(ASSETS, { recursive: true });
mkdirSync(CONTENT, { recursive: true });

// ── 3. 逐文件同步 + 最小变换
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap(
  (e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]),
);

/**
 * @param {string} text @param {string|null} injectKind 生成器漏写 douban_kind 时补上（豆列页就没有）
 */
const transform = (text, injectKind = null) => {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) return text;
  let fm = m[1]
    .replace(/^tags:/m, 'douban_tags:')
    .replaceAll('"/covers/', '"/douban-assets/covers/')
    .replaceAll('"/uploads/', '"/douban-assets/uploads/')
    // 裸日期（2026-06-09）会被 YAML 解析成 Date 对象；加引号保住字符串语义
    .replace(/^(\s*[A-Za-z_][A-Za-z0-9_]*:\s*)(\d{4}-\d{2}-\d{2})(\s*)$/gm, '$1"$2"$3');
  if (injectKind) fm = `douban_kind: ${injectKind}\n${fm}`;
  const body = m[2]
    .replaceAll('](/covers/', '](/douban-assets/covers/')
    .replaceAll('](/uploads/', '](/douban-assets/uploads/');
  return `---\n${fm}\n---\n${body}`;
};

const kept = {};
const skipped = {};
const contentRoot = join(source, 'content');

for (const file of walk(contentRoot)) {
  if (!file.toLowerCase().endsWith('.md')) continue;
  const text = readFileSync(file, 'utf8');
  const rel = relative(contentRoot, file);
  let kind = /^douban_kind:\s*(\S+)\s*$/m.exec(text)?.[1] ?? null;
  // 生成器的豆列页没有 douban_kind（它的 Hugo 主题按目录识别）；这里按路径补全。
  if (!kind && rel.replaceAll('\\', '/').startsWith('doulist/')) kind = 'doulist';

  if (!kind || !KINDS.has(kind)) {
    const label = kind ?? '(无 douban_kind)';
    skipped[label] = (skipped[label] ?? 0) + 1;
    continue;
  }

  const out = join(CONTENT, rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, transform(text, kind === 'doulist' && !/^douban_kind:/m.test(text) ? 'doulist' : null), 'utf8');
  kept[kind] = (kept[kind] ?? 0) + 1;
}

// ── 4. 图片与搜索索引
let assetCount = 0;
const copyDir = (from, to) => {
  const src = join(source, from);
  if (!existsSync(src)) return;
  cpSync(src, join(ASSETS, to), { recursive: true });
  for (const f of walk(join(ASSETS, to))) if (statSync(f).isFile()) assetCount += 1;
};
copyDir('static/covers', 'covers');
copyDir('static/uploads', 'uploads');

const searchIndex = join(source, 'static', 'search-index.js');
if (existsSync(searchIndex)) {
  cpSync(searchIndex, join(ASSETS, 'search-index.js'));
}

// ── 5. 目录数据（layout 与模板引擎），只在第一次生成
const dirData = join(CONTENT, 'douban.json');
if (!existsSync(dirData)) {
  writeFileSync(dirData, `${JSON.stringify({ layout: 'douban-item.njk', templateEngineOverride: 'md' }, null, 2)}\n`, 'utf8');
}

// ── 6. 汇总
const summary = (o) => Object.entries(o).map(([k, v]) => `${k} ${v}`).join(' · ') || '无';
console.log(`\n[douban:sync] 内容：${summary(kept)}`);
if (Object.keys(skipped).length) {
  console.log(`[douban:sync] 跳过（由本站模板负责）：${summary(skipped)}`);
  if (skipped.broadcast_month) {
    console.log('[douban:sync] ⚠ 检测到广播月度页，但本站尚未实现广播视图，本次未同步。');
  }
}
console.log(`[douban:sync] 资源：${assetCount} 个文件 → src/douban-assets/`);
console.log('[douban:sync] 完成。接下来的动作就是普通内容流程：git add / commit / push。');

if (tempDir) rmSync(tempDir, { recursive: true, force: true });
