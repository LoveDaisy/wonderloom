import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Astro emits quoted HTML attributes. Check the generated site, not just source routes.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../dist');
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory()
    ? walk(join(dir, entry.name)) : join(dir, entry.name)))).flat();
}
const files = await walk(root);
const pages = files.filter((file) => file.endsWith('.html'));
assert(pages.length > 0, 'Build the site first');
const productionOrigin = 'https://wonderloom.space';
let checked = 0;
for (const file of pages) {
  const html = await readFile(file, 'utf8');
  const name = relative(root, file);
  assert.equal((html.match(/<h1(?:\s|>)/g) ?? []).length, 1, `${name}: expected exactly one h1`);
  assert(!html.includes('/Users/') && !html.includes('![['), `${name}: local path or wiki image leak`);
  assert(/<html[^>]*lang="zh-CN"/.test(html), `${name}: missing language`);
  const isPreview = name.startsWith('directions/');
  const isNotFound = name === '404.html';
  const route = name === 'index.html' ? '/' : `/${name.replace(/index\.html$/, '')}`;
  const expectedCanonical = new URL(route, productionOrigin).href;
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/);
  const ogUrl = html.match(/<meta property="og:url" content="([^"]+)"/);
  if (isPreview || isNotFound) {
    assert.match(html, /<meta name="robots" content="noindex, nofollow"/, `${name}: must be noindex`);
    assert.equal(canonical, null, `${name}: noindex page must not have a canonical URL`);
    assert.equal(ogUrl, null, `${name}: noindex page must not have og:url`);
  } else {
    assert.equal(canonical?.[1], expectedCanonical, `${name}: unexpected canonical URL`);
    assert.equal(ogUrl?.[1], expectedCanonical, `${name}: unexpected og:url`);
    assert(!/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/.test(html), `${name}: public page must be indexable`);
  }
  for (const image of html.matchAll(/<img\b[^>]*>/g)) {
    assert(/\balt="[^"]+"/.test(image[0]), `${name}: image needs alt text`);
    assert(/\bwidth="/.test(image[0]) && /\bheight="/.test(image[0]), `${name}: image needs dimensions`);
  }
  for (const match of html.matchAll(/\b(?:href|src)="([^"]*)"/g)) {
    const href = match[1].replaceAll('&amp;', '&');
    assert(href && href !== '#', `${name}: empty or placeholder link`);
    const url = new URL(href, `https://local.invalid${route}`);
    if (url.origin !== 'https://local.invalid' && url.origin !== productionOrigin) continue;
    const path = decodeURIComponent(url.pathname);
    const destination = join(root, path.endsWith('/') ? `${path}index.html` : path);
    assert((await stat(destination).catch(() => null))?.isFile(), `${name}: missing target ${path}`);
    if (url.hash && destination.endsWith('.html')) {
      const target = await readFile(destination, 'utf8');
      assert(target.includes(`id="${decodeURIComponent(url.hash.slice(1))}"`), `${name}: missing anchor ${url.hash}`);
    }
    checked++;
  }
}
const expectedContentPages = [
  'explore/index.html',
  'explore/topics/ice-halos/index.html',
  'explore/topics/spectral-rendering/index.html',
  'explore/topics/color-science/index.html',
  'explore/paths/understand-halos/index.html',
  'explore/paths/spectrum-to-colour/index.html',
  'writing/articles/drawing-light/index.html',
  'writing/articles/halo-introduction/index.html',
  'writing/articles/halo-direct-integration/index.html',
  'writing/articles/color-space-basics/index.html',
  'writing/articles/color-space-conversion/index.html',
  'writing/articles/spectral-rendering/index.html',
  'writing/articles/white-balance/index.html',
  'writing/articles/camera-colour/index.html',
  'projects/lumice-integral/index.html',
];
for (const page of expectedContentPages) {
  assert((await stat(join(root, page)).catch(() => null))?.isFile(), `missing content route ${page}`);
}
const explore = await readFile(join(root, 'explore/index.html'), 'utf8');
assert.match(explore, /本轮作品关系图/, 'explore: missing graph scope label');
assert.match(explore, /理解和重现冰晕/, 'explore: missing first reading path');
assert.match(explore, /从光谱到颜色/, 'explore: missing second reading path');
const guide = await readFile(join(root, 'writing/articles/color-space-basics/index.html'), 'utf8');
assert.match(guide, /本站提供编辑导读；完整文章仍发布在知乎。/, 'article guide: source boundary missing');
assert.match(guide, /https:\/\/zhuanlan\.zhihu\.com\/p\/24214731/, 'article guide: original source missing');
console.log(`Checked ${pages.length} pages and ${checked} local links/assets; headings, images and source boundaries passed.`);
