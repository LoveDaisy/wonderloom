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
  if (!isPreview) {
    assert.match(html, /<body class="notebook"/, `${name}: production page must use the shared notebook design`);
    assert(!/href="\/directions\//.test(html), `${name}: production navigation must not enter a design study`);
    assert(!/class="[^"]*(?:work-card-grid|detail-grid|project-detail-grid|guide-layout|relation-map-canvas)/.test(html), `${name}: legacy layout remains`);
  }
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
  'writing/articles/halo-1/index.html',
  'writing/articles/halo-8-1/index.html',
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
assert.match(explore, /作品之间/, 'explore: missing relationship section');
assert.match(explore, /data-connections/, 'explore: missing interactive work relations');
assert.equal((explore.match(/data-work-select=/g) ?? []).length, 11, 'explore: work selector coverage changed');
assert.match(explore, /理解和重现冰晕/, 'explore: missing first reading path');
assert.match(explore, /从光谱到颜色/, 'explore: missing second reading path');
const guide = await readFile(join(root, 'writing/articles/color-space-basics/index.html'), 'utf8');
assert.match(guide, /本站提供编辑导读；完整文章仍发布在知乎。/, 'article guide: source boundary missing');
assert.match(guide, /https:\/\/zhuanlan\.zhihu\.com\/p\/24214731/, 'article guide: original source missing');
console.log(`Checked ${pages.length} pages and ${checked} local links/assets; headings, images and source boundaries passed.`);

// The author feed owns every published halo chapter. Other series retain their
// historical external-source boundary.
const chapterSources = {
  'ice-halos': ['461810067', '462717356', '469793197', '485848284', '512594144', '516883186', '536772578', '2082646907952821740', '2084963224814990674', '2087212931775837732', '2087225407133304432'],
  calendar: ['16466051322', '17112174047', '17647963472', '20913174233', '22831021105'],
  mountains: ['666675246'],
};
for (const [seriesId, sources] of Object.entries(chapterSources)) {
  const html = await readFile(join(root, `writing/${seriesId}/index.html`), 'utf8');
  const list = html.match(/<ol class="chapter-list">([\s\S]*?)<\/ol>/)?.[1] ?? '';
  const targets = [...list.matchAll(/<a href="([^"]+)"/g)].map(match => match[1]);
  assert.equal(targets.length, sources.length, `${seriesId}: chapter coverage changed`);
  for (let index = 0; index < sources.length; index++) {
    const id = sources[index];
    const internal = { '461810067': 'halo-introduction', '462717356': 'halo-1', '469793197': 'halo-2', '485848284': 'halo-3', '512594144': 'halo-4', '516883186': 'halo-5', '536772578': 'halo-direct-integration', '2082646907952821740': 'halo-7', '2084963224814990674': 'halo-8', '2087212931775837732': 'halo-8-1', '2087225407133304432': 'halo-9' }[id];
    assert.equal(targets[index], seriesId === 'ice-halos' ? `/writing/articles/${internal}/` : `https://zhuanlan.zhihu.com/p/${id}`, `${seriesId}: chapter ${index} source changed`);
  }
}
const basics = await readFile(join(root, 'writing/articles/color-space-basics/index.html'), 'utf8');
const neighbourIds = [...basics.matchAll(/data-work-id="([^"]+)"/g)].map(match => match[1]);
assert.deepEqual(neighbourIds.sort(), ['article:color-space-basics', 'article:color-space-conversion'], 'local context must contain only the current work and direct neighbours');
for (const href of ['/explore/topics/spectral-rendering/', '/explore/topics/color-science/', '/explore/paths/spectrum-to-colour/']) {
  assert(basics.includes(`href="${href}"`), `guide context missing ${href}`);
}
const halo = await readFile(join(root, 'writing/articles/halo-8/index.html'), 'utf8');
assert.match(halo, /作者稿全文/, 'author article: full-text marker missing');
assert.match(halo, /本文目录/, 'author article: TOC missing');
assert.match(halo, /writing-lab-assets\/original\//, 'author article: original-image link missing');
assert(!/tags:|附：成稿前提纲存档/.test(halo), 'author article: conversion scaffolding leaked');
console.log('Chapter coverage, author-feed rendering and direct relationship context passed.');
