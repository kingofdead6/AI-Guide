/**
 * Copies the academy content built by the website into the app's assets, so lessons work offline.
 *
 *   cd client && npm run content        # (re)builds client/src/generated
 *   node mobile/tool/sync_content.mjs   # copies it into mobile/assets
 *
 * Produces:
 *   assets/content/...        catalog, lessons, quizzes, exercises, glossary, projects, pages
 *   assets/web/lesson.css     KaTeX (fonts inlined) + the website's lesson styles
 *   assets/web/widgets.js     the website's interactive lesson widgets, bundled for the WebView
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MOBILE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLIENT = path.resolve(MOBILE, '../client');
const GEN = path.join(CLIENT, 'src/generated');
const OUT = path.join(MOBILE, 'assets/content');
const WEB = path.join(MOBILE, 'assets/web');

if (!fs.existsSync(path.join(GEN, 'catalog.json'))) {
  console.error('client/src/generated is missing. Run `npm run content` in client/ first.');
  process.exit(1);
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(WEB, { recursive: true });

const copyDir = (from, to, filter = () => true) => {
  fs.mkdirSync(to, { recursive: true });
  let n = 0;
  for (const f of fs.readdirSync(from)) {
    const src = path.join(from, f);
    if (fs.statSync(src).isDirectory()) n += copyDir(src, path.join(to, f), filter);
    else if (filter(f)) {
      fs.copyFileSync(src, path.join(to, f));
      n++;
    }
  }
  return n;
};
const files = copyDir(GEN, OUT, (f) => !f.startsWith('search'));

// KaTeX stylesheet with the woff2 fonts embedded, then the site's lesson styles.
const katexDir = path.join(CLIENT, 'node_modules/katex/dist');
let katex = fs.readFileSync(path.join(katexDir, 'katex.min.css'), 'utf8');
katex = katex.replace(/src:url\(fonts\/([^)]+?)\.woff2\) format\("woff2"\)[^;}]*/g, (_, name) => {
  const b64 = fs.readFileSync(path.join(katexDir, 'fonts', `${name}.woff2`)).toString('base64');
  return `src:url(data:font/woff2;base64,${b64}) format("woff2")`;
});
const content = fs.readFileSync(path.join(CLIENT, 'src/styles/content.css'), 'utf8');
fs.writeFileSync(path.join(WEB, 'lesson.css'), `${katex}\n${content}`);

// Interactive widgets: bundle the site's module as a global the WebView can call.
const esbuild = path.join(CLIENT, 'node_modules/esbuild/bin/esbuild');
execFileSync(process.execPath, [esbuild, path.join(CLIENT, 'src/widgets/widgets.ts'), '--bundle', '--format=iife', '--global-name=AIGWidgets', '--minify', `--outfile=${path.join(WEB, 'widgets.js')}`], {
  stdio: 'inherit',
});

const size = (p) => (fs.statSync(p).size / 1024).toFixed(0) + ' KB';
console.log(`Copied ${files} content files. lesson.css ${size(path.join(WEB, 'lesson.css'))}, widgets.js ${size(path.join(WEB, 'widgets.js'))}.`);
