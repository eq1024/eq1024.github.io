const fs = require('fs');
const path = require('path');
const Fontmin = require('fontmin');
const wawoff2 = require('wawoff2');
const glob = require('glob');

const rootDir = path.join(__dirname, '..');
const srcDir = path.join(rootDir, 'src');
const sourceDir = path.join(rootDir, 'fonts-source');
const outputDir = path.join(srcDir, 'fonts');

// 收集 src 下所有文本文件中的字符
function collectChars() {
  const files = glob.sync('**/*.{md,njk,html,css,js}', { cwd: srcDir });
  const seen = new Set();

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(srcDir, file), 'utf-8');
      for (const char of content) {
        seen.add(char);
      }
    } catch (err) {
      console.warn('Skip', file, err.message);
    }
  }

  return [...seen].sort().join('');
}

// 从 ttf 中提取子集并压缩为 woff2
async function subsetTtf(inputPath, outputPath, chars) {
  return new Promise((resolve, reject) => {
    const fontmin = new Fontmin().src(inputPath).use(Fontmin.glyph({ text: chars }));

    fontmin.run(async (err, files) => {
      if (err) return reject(err);

      const ttfFile = files.find((f) => path.extname(f.path) === '.ttf');
      if (!ttfFile) {
        return reject(new Error('Fontmin did not produce a TTF file.'));
      }

      try {
        const woff2Buffer = await wawoff2.compress(ttfFile.contents);
        fs.writeFileSync(outputPath, woff2Buffer);
        console.log(`  ↳ ${outputPath} (${(woff2Buffer.length / 1024).toFixed(2)} KB)`);
        resolve();
      } catch (compressErr) {
        reject(compressErr);
      }
    });
  });
}

// 直接复制 woff2 文件
function copyWoff2(inputPath, outputPath) {
  fs.copyFileSync(inputPath, outputPath);
  const stats = fs.statSync(outputPath);
  console.log(`  ↳ ${outputPath} (${(stats.size / 1024).toFixed(2)} KB)`);
}

async function main() {
  if (!fs.existsSync(sourceDir)) {
    console.log('No fonts-source directory found, skipping font build.');
    return;
  }

  const sourceFiles = fs.readdirSync(sourceDir).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return ext === '.ttf' || ext === '.woff2';
  });

  if (sourceFiles.length === 0) {
    console.log('No font source files found in fonts-source/, skipping font build.');
    return;
  }

  const chars = collectChars();
  console.log(`Collected ${chars.length} unique characters.`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const file of sourceFiles) {
    const inputPath = path.join(sourceDir, file);
    const ext = path.extname(file).toLowerCase();
    const baseName = path.basename(file, ext);

    if (ext === '.ttf') {
      const cleanName = baseName
        .replace(/\s+/g, '')
        .replace(/([a-zA-Z])(\d)/g, '$1-$2');
      const outputPath = path.join(outputDir, `${cleanName}-subset.woff2`);
      await subsetTtf(inputPath, outputPath, chars);
    } else if (ext === '.woff2') {
      const outputName = baseName.replace(/\.ttf$/, '') + '.woff2';
      const outputPath = path.join(outputDir, outputName);
      copyWoff2(inputPath, outputPath);
    } else {
      console.warn(`Unsupported font format: ${file}`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
