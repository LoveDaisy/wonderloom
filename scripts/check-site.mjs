import assert from 'node:assert/strict';
import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

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
const networkSource = await readFile(resolve(dirname(fileURLToPath(import.meta.url)), '../src/data/content-network.ts'), 'utf8');
const networkModule = ts.transpileModule(networkSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { readingPaths, topics } = await import(`data:text/javascript;base64,${Buffer.from(networkModule).toString('base64')}`);
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
    assert(/<body\b[^>]*class="[^"]*\bsite\b[^"]*"/.test(html) && /<main id="main"/.test(html), `${name}: production page must use the shared site layout`);
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
const home = await readFile(join(root, 'index.html'), 'utf8');
assert.match(home, /id="home-title"/, 'home: personal opening missing');
assert.match(home, /一条光的线索/, 'home: light-led reading path missing');
assert.match(home, /冰晶让光绕出一条弧/, 'home: ice-crystal step missing');
assert.match(home, /让光路成为可以重看的图像/, 'home: Lumice step missing');
assert.match(home, /从光谱走到屏幕上的颜色/, 'home: spectral step missing');
assert.match(home, /颜色在两条不同的路上继续/, 'home: colour branches missing');
assert.match(home, /相机颜色校正处理相机响应与人眼结果的差异；白平衡处理照明条件下/, 'home: camera correction and white balance must remain distinct');
assert.match(home, /href="\/writing\/articles\/camera-colour\/"/, 'home: camera-colour route missing');
assert.match(home, /href="\/writing\/articles\/white-balance\/"/, 'home: white-balance route missing');
assert(!home.includes('2 亿光线') && !home.includes('220秒'), 'home: historical benchmark leaked into a generic homepage claim');
const explore = await readFile(join(root, 'explore/index.html'), 'utf8');
assert.equal(readingPaths.length, 2, 'explore: expected two curated reading paths');
assert.equal(topics.length, 3, 'explore: expected three curated topics');
// 2026-10-28 accepted 11-work inventory; review editorial changes independently of the rendering model.
const acceptedExploreWorks = [
  'article:drawing-light', 'article:halo-introduction', 'series:ice-halos',
  'project:lumice', 'article:halo-direct-integration', 'project:lumice-integral',
  'article:color-space-basics', 'article:color-space-conversion', 'article:spectral-rendering',
  'article:white-balance', 'article:camera-colour',
].sort();
// Topic membership is the curated 11-work inventory; path steps are a separate ordered projection.
const expectedWorks = [...new Set(topics.flatMap((topic) => topic.workIds))].sort();
assert.deepEqual(expectedWorks, acceptedExploreWorks, 'explore: curated work identities changed');
const workColumns = [...explore.matchAll(/<ol class="cx-column[^"]*">([\s\S]*?)<\/ol>/g)];
assert.equal(workColumns.length, readingPaths.length, 'explore: each reading path needs a visible column');
const workLinks = workColumns
  .flatMap(([, list]) => [...list.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*data-work="([^"]+)"/g)].map(([, href, id]) => ({ href, id })));
for (const [index, [, column]] of workColumns.entries()) {
  assert.deepEqual([...column.matchAll(/<a\b[^>]*data-work="([^"]+)"/g)].map(([, id]) => id), readingPaths[index].steps, `explore: ${readingPaths[index].id} stations changed`);
}
assert.deepEqual(workLinks.map(({ id }) => id).sort(), expectedWorks, 'explore: reachable work links must cover the curated topic catalogue');
for (const { href, id } of workLinks) {
  const [kind, slug] = id.split(':');
  const expected = kind === 'article' ? `/writing/articles/${slug}/` : kind === 'series' ? `/writing/${slug}/` : `/projects/${slug}/`;
  assert.equal(href, expected, `explore: ${id} must link to its formal route`);
}
const pathLinks = [...explore.matchAll(/<header class="cx-path[^"]*">([\s\S]*?)<\/header>/g)]
  .flatMap(([, header]) => [...header.matchAll(/<h2><a href="([^"]+)"/g)].map(([, href]) => href)).sort();
assert.deepEqual(pathLinks, readingPaths.map(({ id }) => `/explore/paths/${id}/`).sort(), 'explore: visible reading path links changed');
const topicSection = explore.match(/<section class="cx-topics\b[^"]*"[\s\S]*?<\/section>/)?.[0] ?? '';
const topicLinks = [...topicSection.matchAll(/<a href="([^"]+)"/g)].map(([, href]) => href).sort();
assert.deepEqual(topicLinks, topics.map(({ id }) => `/explore/topics/${id}/`).sort(), 'explore: visible topic links changed');
const guide = await readFile(join(root, 'writing/articles/color-space-basics/index.html'), 'utf8');
assert.match(guide, /<section class="loom-reading-guide" id="article-guide"/, 'article guide: former fragment target missing');
for (const projectId of ['lumice', 'lumice-integral']) {
  const project = await readFile(join(root, `projects/${projectId}/index.html`), 'utf8');
  for (const anchor of ['project-overview', 'project-resources']) {
    assert(project.includes(`id="${anchor}"`), `${projectId}: former fragment target ${anchor} missing`);
  }
}
assert.match(guide, /本站提供编辑导读；完整文章仍发布在知乎。/, 'article guide: source boundary missing');
assert.match(guide, /href="https:\/\/zhuanlan\.zhihu\.com\/p\/24214731"[^>]*>前往知乎阅读全文<\/a>/, 'article guide: original source link missing');
assert.equal((guide.match(/本站提供编辑导读；完整文章仍发布在知乎。/g) ?? []).length, 1, 'article guide: external reading notice must appear once');

const haloIntroduction = await readFile(join(root, 'writing/articles/halo-introduction/index.html'), 'utf8');
const haloDirectIntegration = await readFile(join(root, 'writing/articles/halo-direct-integration/index.html'), 'utf8');
for (const [name, html] of [['halo introduction', haloIntroduction], ['halo direct integration', haloDirectIntegration]]) {
  assert(!html.includes('完整文章仍发布在知乎'), `${name}: published full text must not claim to be only on Zhihu`);
  assert.match(html, /id="article-full"/, `${name}: local full text missing`);
  assert.match(html, /知乎发表版本/, `${name}: historical publication context missing`);
  assert.match(html, /<a href="[^"]+">查看作者源稿<\/a>/, `${name}: current source link missing`);
  assert(!html.includes('作者稿全文'), `${name}: redundant author-manuscript label leaked`);
  assert.match(html, /href="\/writing\/ice-halos\/#chapters">返回《现代冰晕研究漫谈》目录<\/a>/, `${name}: return-to-series link missing`);
}

const authorOnly = await readFile(join(root, 'writing/articles/halo-2/index.html'), 'utf8');
assert.match(authorOnly, /<meta name="description" content="《现代冰晕研究漫谈》第 2 篇：计算机遍历、搜索、优化。阅读全文。">/, 'author-only article: neutral metadata description missing');
assert(!authorOnly.includes('[[风起青萍之末'), 'author-only article: generated summary leaked into metadata');
assert(!authorOnly.match(/<header class="loom-reading-opening">[\s\S]*?<h1>[\s\S]*?<\/h1><p>/), 'author-only article: visible automatic summary must not precede the manuscript');
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
  const list = html.match(/<ol class="loom-thread-list">([\s\S]*?)<\/ol>/)?.[1] ?? '';
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
assert.match(halo, /id="article-full"/, 'author article: full text missing');
assert.match(halo, /本文目录/, 'author article: TOC missing');
assert.match(halo, /writing-lab-assets\/original\//, 'author article: original-image link missing');
assert(!/tags:|附：成稿前提纲存档/.test(halo), 'author article: conversion scaffolding leaked');

const iceHalos = await readFile(join(root, 'writing/ice-halos/index.html'), 'utf8');
const chapterSection = iceHalos.match(/<section[^>]*id="chapters"[\s\S]*?<\/section>/)?.[0] ?? '';
const relatedSection = iceHalos.match(/<section[^>]*id="related-works"[\s\S]*?<\/section>/)?.[0] ?? '';
assert.match(chapterSection, /id="chapters-title">顺着问题往下读<\/h2>/, 'ice halos: reading note and chapter heading missing');
assert.match(chapterSection, /11 篇文章/, 'ice halos: chapter count missing');
assert.match(chapterSection, /第 8\.1 篇 · 番外/, 'ice halos: supplement label is not natural');
assert(!chapterSection.includes('Lumice 项目介绍'), 'ice halos: Lumice must not duplicate the chapter directory tail');
assert.equal((relatedSection.match(/data-work-id="project:lumice"/g) ?? []).length, 1, 'ice halos: continuation must contain Lumice exactly once');
assert(!relatedSection.includes('article:halo-introduction') && !relatedSection.includes('article:halo-direct-integration'), 'ice halos: chapter links must not repeat in continuation');
assert.match(relatedSection, /冰晶光路、姿态与数值方法/, 'ice halos: Lumice relation lacks its concrete connection');

const writing = await readFile(join(root, 'writing/index.html'), 'utf8');
assert.match(writing, /导读与系列全文|把一个问题拆开，把理解慢慢写下来/, 'writing index: source-boundary copy missing');
assert.match(writing, /已写 11 篇/, 'writing index: author-feed count must use resolved chapters');
assert(!writing.includes('读导读 ↗'), 'writing index: entry action must not pre-judge publication state');
assert.match(writing, /开始阅读/, 'writing index: neutral reading action missing');
console.log('Chapter coverage, content-state rendering, series continuation and direct relationship context passed.');

for (const id of ['halo-8', 'halo-8-1', 'halo-9']) {
  const html = await readFile(join(root, `writing/articles/${id}/index.html`), 'utf8');
  const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
  assert.equal((description.match(/现代冰晕研究漫谈/g) ?? []).length, 1, `${id}: metadata must not repeat the series title`);
}
