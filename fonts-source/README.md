# 字体源文件

这个目录用于放置原始字体源文件。

## 说明

- 原始字体文件体积较大，默认不会被提交到 Git。
- 构建网站时，`scripts/build-fonts.js` 会自动从这个目录读取字体源文件，提取网站中实际用到的字符，生成压缩后的子集字体，输出到 `src/fonts/`。
- Eleventy 构建时会将 `src/fonts/` 复制到 `_site/fonts/`。

## 支持的格式

- `.ttf`：会通过 `fontmin` 提取字符子集，并压缩为 `.woff2`
- `.woff2`：会直接复制到 `src/fonts/`

## 当前使用的字体

- `OPPO Sans 4.0.ttf` → 输出为 `src/fonts/OPPOSans-4.0-subset.woff2`
- `MapleMono-Regular.ttf.woff2` → 输出为 `src/fonts/MapleMono-Regular.woff2`

## 本地开发

将字体源文件放入此目录后，运行：

```bash
npm run build
```

即可自动生成子集字体并构建网站。

## 部署到 Cloudflare Pages

字体源文件（`.ttf` / `.woff2`）已经保留在 Git 中，因此 Cloudflare Pages 等构建环境可以直接获取并自动生成分拆字体。

如果你不想把原始字体提交到 Git，请改用以下方式：

1. **手动上传到 Cloudflare Pages 构建环境**：通过 Cloudflare Pages 控制台上传字体源文件到构建环境中。
2. **使用 Cloudflare R2 / 外部存储**：在构建命令中增加下载步骤。
3. **修改 `.gitignore`**：取消对 `fonts-source/*.ttf` 和 `fonts-source/*.woff2` 的跟踪。

请根据你的部署方式选择合适的方法。
