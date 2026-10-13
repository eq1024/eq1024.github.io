const fs = require("fs");
const markdownItAnchor = require("markdown-it-anchor");

module.exports = function (eleventyConfig) {
  // 复制静态资源
  eleventyConfig.addPassthroughCopy("src/styles.css");
  eleventyConfig.addPassthroughCopy("src/fonts");
  eleventyConfig.addPassthroughCopy("src/scripts");

  // Favicon、图标和 PWA assets
  eleventyConfig.addPassthroughCopy("src/*.{png,ico,json}");
  eleventyConfig.addPassthroughCopy("src/og-image.png");

  // 豆瓣存档的图片与搜索索引（由 scripts/sync-douban.mjs 同步进 src/douban-assets/）
  eleventyConfig.addPassthroughCopy("src/douban-assets");

  // 复制 Prism.js 资源
  eleventyConfig.addPassthroughCopy({
    "node_modules/prismjs/themes/prism-solarizedlight.css": "prism-light.css",
    "node_modules/prismjs/themes/prism-tomorrow.css": "prism-dark.css",
    "node_modules/prismjs/prism.js": "prism.js",
    "node_modules/prismjs/components/prism-jsx.min.js": "prism-jsx.js",
    "node_modules/prismjs/components/prism-typescript.min.js": "prism-typescript.js",
    "node_modules/prismjs/components/prism-tsx.min.js": "prism-tsx.js",
    "node_modules/prismjs/components/prism-bash.min.js": "prism-bash.js",
    "node_modules/prismjs/components/prism-json.min.js": "prism-json.js",
  });

  // 为 Markdown 标题自动添加 id
  eleventyConfig.amendLibrary("md", (md) =>
    md.use(markdownItAnchor, {
      level: [2, 3, 4],
      permalink: false,
      slugify: (text) => {
        // 保留中文、英文、数字和连字符
        return text
          .toString()
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9一-龥-]/g, "");
      },
    })
  );

  // 按标签筛选文章
  eleventyConfig.addFilter("selectByTag", (posts, tagName) => {
    if (!tagName) return posts;
    return posts.filter(post => {
      const tags = post.data.tags || [];
      return tags.includes(tagName);
    });
  });

  // 最新 3 篇文章（用于首页，排除标签页等非文章页面）
  eleventyConfig.addCollection("latestPosts", (collectionApi) => {
    return collectionApi.getFilteredByTag("posts")
      .filter(item => item.inputPath.endsWith('.md'))
      .reverse()
      .slice(0, 3);
  });

  // 收集所有标签及文章数
  eleventyConfig.addCollection("tagList", (collectionApi) => {
    const posts = collectionApi.getFilteredByTag("posts");
    const tagMap = new Map();
    for (const post of posts) {
      const tags = post.data.tags || [];
      for (const tag of tags) {
        // 跳过非字符串标签和 posts 自身标签
        if (typeof tag !== "string" || tag === "posts") continue;
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      }
    }
    return Array.from(tagMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  });

  // 日期格式化过滤器
  eleventyConfig.addFilter("readableDate", (dateObj) => {
    return new Date(dateObj).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  });

  // 日期简写过滤器（用于卡片）
  eleventyConfig.addFilter("shortDate", (dateObj) => {
    return new Date(dateObj).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  });

  // ISO 日期格式（用于 <time datetime>）
  eleventyConfig.addFilter("isoDate", (dateObj) => {
    const d = new Date(dateObj);
    return d.toISOString().split("T")[0];
  });

  // 截取摘要
  eleventyConfig.addFilter("excerpt", (content) => {
    if (!content) return "";
    return content.split("\n").slice(0, 2).join(" ").replace(/<[^>]+>/g, "").slice(0, 140) + "……";
  });

  // 从渲染后的内容中提取标题，自动生成大纲
  eleventyConfig.addFilter("outline", (content) => {
    const headingRegex = /<h([2-4])\s+id="([^"]+)"[^>]*>(.*?)<\/h[2-4]>/g;
    const headings = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      headings.push({
        level: parseInt(match[1], 10),
        id: match[2],
        text: match[3].replace(/<[^>]+>/g, "").trim(),
      });
    }

    if (headings.length === 0) return "";

    function buildTree(items) {
      const root = { level: 0, children: [] };
      const stack = [root];

      for (const item of items) {
        const node = { ...item, children: [] };

        while (stack.length > 1 && stack[stack.length - 1].level >= item.level) {
          stack.pop();
        }

        stack[stack.length - 1].children.push(node);
        stack.push(node);
      }

      return root.children;
    }

    function renderTree(nodes, isRoot = true) {
      if (nodes.length === 0) return "";

      const ulClass = isRoot ? "outline-list" : "outline-children";
      let html = `<ul class="${ulClass}">`;

      for (const node of nodes) {
        html += `<li class="outline-item"><a href="#${node.id}" class="outline-row"><span class="outline-title">${node.text}</span></a>`;
        if (node.children.length > 0) {
          html += renderTree(node.children, false);
        }
        html += "</li>";
      }

      html += "</ul>";
      return html;
    }

    const tree = buildTree(headings);
    const html = renderTree(tree);
    return `<div class="outline-box">目录</div>\n${html}`;
  });

  // ============================================================
  // 豆瓣存档（内容由 scripts/sync-douban.mjs 同步进 src/douban/）
  // ============================================================
  const MEDIUM_NAMES = { movie: '影视', book: '图书', game: '游戏', music: '音乐', drama: '舞台剧' };
  const MEDIUM_ORDER = ['movie', 'book', 'game', 'music', 'drama'];
  const STATUS_ORDER = ['wish', 'doing', 'done'];
  const VERB = {
    movie: { wish: '想看', doing: '在看', done: '看过' },
    book: { wish: '想读', doing: '在读', done: '读过' },
    music: { wish: '想听', doing: '在听', done: '听过' },
    game: { wish: '想玩', doing: '在玩', done: '玩过' },
    drama: { wish: '想看', doing: '在看', done: '看过' },
  };

  eleventyConfig.addFilter('mediumName', (medium) => MEDIUM_NAMES[medium] ?? medium);
  eleventyConfig.addFilter('statusVerb', (status, medium) => VERB[medium]?.[status] ?? status);

  /** YAML 会把裸日期解析成 Date 对象；这里统一还原成 YYYY-MM-DD 文本。 */
  const dateText = (value) => {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      const pad = (n) => String(n).padStart(2, '0');
      return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
    }
    return typeof value === 'string' ? value : '';
  };
  eleventyConfig.addFilter('dateOnly', (value) => dateText(value).slice(0, 10));

  /** 正文第一段（跳过「作品信息」这类小节与表格），用作列表摘要。 */
  const firstParagraph = (inputPath) => {
    try {
      const text = fs.readFileSync(inputPath, 'utf-8').replace(/^---\n[\s\S]*?\n---\n?/, '');
      const para = text
        .trim()
        .split(/\n\s*\n/)
        .map((p) => p.trim())
        .find((p) => p && !p.startsWith('#') && !p.startsWith('|')) ?? '';
      return para
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/[#>*_`]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 90);
    } catch {
      return '';
    }
  };

  let doubanMarksCache = null;
  const allMarks = (collectionApi) => {
    if (doubanMarksCache) return doubanMarksCache;
    doubanMarksCache = collectionApi
      .getAll()
      .filter((item) => item.data?.douban_kind === 'mark')
      .map((item) => {
        const d = item.data;
        return {
          url: item.url,
          title: d.title,
          medium: d.douban_medium,
          mediumName: MEDIUM_NAMES[d.douban_medium] ?? d.douban_medium,
          status: d.douban_status,
          verb: d.douban_verb ?? VERB[d.douban_medium]?.[d.douban_status] ?? '',
          rating: d.douban_rating ?? null,
          cover: d.douban_cover ?? null,
          aliases: d.douban_aliases ?? [],
          tags: d.douban_tags ?? [],
          deleted: Boolean(d.douban_upstream_deleted),
          dateRaw: dateText(d.douban_marked_at_raw),
          excerpt: firstParagraph(item.inputPath),
        };
      })
      .sort((a, b) => (String(a.dateRaw) < String(b.dateRaw) ? 1 : -1));
    return doubanMarksCache;
  };

  eleventyConfig.addCollection('doubanMarks', (api) => allMarks(api));

  /** 浏览页分桶：每个媒介 × 状态 × 分页各一页。 */
  eleventyConfig.addCollection('doubanBrowse', (api) => {
    const marks = allMarks(api);
    const PAGE = 96;
    const buckets = [];
    for (const medium of MEDIUM_ORDER) {
      const list = marks.filter((m) => m.medium === medium);
      if (!list.length) continue;
      const counts = { all: list.length };
      for (const status of STATUS_ORDER) counts[status] = list.filter((m) => m.status === status).length;
      for (const status of [null, ...STATUS_ORDER]) {
        const items = status ? list.filter((m) => m.status === status) : list;
        if (!items.length) continue;
        const pages = Math.ceil(items.length / PAGE);
        const base = `/douban/${medium}/${status ? `${status}/` : ''}`;
        for (let page = 1; page <= pages; page += 1) {
          buckets.push({
            medium,
            mediumName: MEDIUM_NAMES[medium] ?? medium,
            status,
            statusVerb: status ? VERB[medium][status] : '全部',
            counts,
            total: items.length,
            page,
            pages,
            baseUrl: base,
            url: page === 1 ? base : `${base}page/${page}/`,
            items: items.slice((page - 1) * PAGE, page * PAGE),
          });
        }
      }
    }
    return buckets;
  });

  eleventyConfig.addCollection('archiveStats', (api) => {
    const marks = allMarks(api);
    const byMedium = {};
    for (const m of marks) {
      if (!byMedium[m.medium]) byMedium[m.medium] = { total: 0, wish: 0, doing: 0, done: 0 };
      byMedium[m.medium].total += 1;
      if (byMedium[m.medium][m.status] != null) byMedium[m.medium][m.status] += 1;
    }
    const count = (kind) => api.getAll().filter((i) => i.data?.douban_kind === kind).length;
    const dates = marks.map((m) => m.dateRaw).filter(Boolean).sort();
    return {
      marks: marks.length,
      byMedium,
      firstYear: dates[0]?.slice(0, 4) ?? null,
      lastYear: dates[dates.length - 1]?.slice(0, 4) ?? null,
      notes: count('note'),
      doulists: count('doulist'),
      albums: count('album'),
      groupTopics: count('group_topic'),
      groupJoins: count('group_joins'),
      recentCovered: marks.filter((m) => m.cover).slice(0, 12),
    };
  });

  const shapePage = (item) => ({
    url: item.url,
    title: item.data.title,
    date: dateText(item.data.douban_published_at_raw) || dateText(item.data.date).slice(0, 10),
    excerpt: firstParagraph(item.inputPath),
    cover: item.data.douban_cover ?? null,
    count: item.data.douban_item_count ?? null,
    group: item.data.douban_group_name ?? null,
  });
  const doubanPages = (api, kind) => api.getAll().filter((i) => i.data?.douban_kind === kind).map(shapePage);
  eleventyConfig.addCollection('doubanNotes', (api) => doubanPages(api, 'note'));
  eleventyConfig.addCollection('doubanDoulists', (api) => doubanPages(api, 'doulist'));
  eleventyConfig.addCollection('doubanAlbums', (api) => doubanPages(api, 'album'));
  eleventyConfig.addCollection('doubanGroupTopics', (api) => doubanPages(api, 'group_topic'));

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    templateFormats: ["njk", "md", "html"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
