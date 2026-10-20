import { cp, lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import matter from 'gray-matter';
import { imageSize } from 'image-size';
import { chapterToRouteId, chapterToSourceId, compareChapters } from '../src/data/article-identities.js';
import { rewriteLinks, stripPublicationScaffolding } from './lib/writing-lab/convert.mjs';

const projectRoot = resolve(new URL('..', import.meta.url).pathname);
const generatedRoot = join(projectRoot, 'src/generated/writing-lab');
const publicRoot = join(projectRoot, 'public/writing-lab-assets');
const sourceUrl = 'https://github.com/LoveDaisy/ice_halo_notes';
const pointerHeader = 'version https://git-lfs.github.com/spec/v1';

function run(command, args, cwd) { return execFileSync(command, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim(); }
async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory() && !entry.name.startsWith('.') ? walk(join(directory, entry.name)) : []));
  return entries.filter((entry) => entry.isFile() && entry.name.endsWith('.md')).map((entry) => join(directory, entry.name)).concat(nested.flat());
}
function yaml(value) { return String(value).replace(/"/g, '\\"'); }
function chapterFrom(file, frontmatter) {
  const match = String(frontmatter.published ?? '').match(/漫谈\((\d+(?:\.\d+)?)/) ?? basename(dirname(file)).match(/^(\d+(?:\.\d+)?)/);
  if (!match) throw new Error(`Published manuscript lacks a chapter number: ${file}`);
  return match[1];
}
function firstH1(markdown, file) {
  const title = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (!title) throw new Error(`Published manuscript lacks a H1: ${file}`);
  return title;
}
function summary(markdown) {
  const paragraph = markdown.split(/\n\s*\n/).map((item) => item.trim()).find((item) => item && !item.startsWith('#') && !item.startsWith('![') && !item.startsWith('tags:'));
  return (paragraph ?? '作者稿全文。').replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, '$2$1').replace(/\[(.*?)\]\([^)]*\)/g, '$1').replace(/\$+/g, '').slice(0, 180);
}
function assertInside(root, candidate) {
  const path = resolve(root, candidate);
  if (!path.startsWith(`${root}/`)) throw new Error(`Asset escapes manuscript directory: ${candidate}`);
  return path;
}
async function collectAsset(article, node, tempPublic) {
  if (!node.url) throw new Error(`Image node has no URL in ${article.file}: ${JSON.stringify(node)}`);
  const source = assertInside(dirname(article.file), node.url);
  const stat = await lstat(source).catch(() => { throw new Error(`Missing article asset: ${source}`); });
  if (!stat.isFile()) throw new Error(`Article asset is not a file: ${source}`);
  const body = await readFile(source);
  if (body.subarray(0, 64).toString('utf8').startsWith(pointerHeader)) throw new Error(`LFS pointer used as an image: ${source}`);
  const hash = createHash('sha256').update(body).digest('hex');
  const extension = extname(source).toLowerCase();
  const info = imageSize(body);
  if (!info.width || !info.height) throw new Error(`Cannot read image dimensions: ${source}`);
  const original = `original/${hash}${extension}`;
  const display = `display/${hash}${extension}`;
  for (const target of [original, display]) {
    const output = join(tempPublic, target);
    await mkdir(dirname(output), { recursive: true });
    await cp(source, output);
  }
  node.type = 'html';
  node.value = `<figure><img src="/writing-lab-assets/${display}" alt="${String(node.alt ?? '').replace(/"/g, '&quot;')}" width="${info.width}" height="${info.height}" loading="lazy" decoding="async" /><figcaption>${String(node.alt ?? '')} · <a href="/writing-lab-assets/${original}">查看原图</a></figcaption></figure>`;
  delete node.url;
  delete node.alt;
  return { original: `/writing-lab-assets/${original}`, display: `/writing-lab-assets/${display}`, sha256: hash, width: info.width, height: info.height, type: info.type };
}
async function main() {
  let source = process.env.WRITING_LAB_SOURCE_DIR;
  let temporarySource;
  if (source) {
    source = resolve(source);
    if (run('git', ['status', '--porcelain'], source)) throw new Error('WRITING_LAB_SOURCE_DIR must be a clean, read-only checkout');
  } else {
    temporarySource = await mkdtemp(join(tmpdir(), 'wonderloom-writing-lab-'));
    run('git', ['clone', '--depth', '1', sourceUrl, temporarySource], projectRoot);
    source = temporarySource;
  }
  const sourceSha = run('git', ['rev-parse', 'HEAD'], source);
  const files = await walk(source);
  const candidates = [];
  for (const file of files) {
    const raw = await readFile(file, 'utf8');
    const parsed = matter(raw);
    if (parsed.data.type !== 'directors-cut' || parsed.data.status !== 'published') continue;
    const chapter = chapterFrom(file, parsed.data);
    candidates.push({ file, raw: parsed.content, frontmatter: parsed.data, chapter, id: chapterToRouteId(chapter), sourceId: chapterToSourceId(chapter), title: firstH1(parsed.content, file) });
  }
  candidates.sort((a, b) => compareChapters(a.chapter, b.chapter));
  if (!candidates.length) throw new Error('No published directors-cut manuscripts found');
  for (const key of ['chapter', 'id']) if (new Set(candidates.map((article) => article[key])).size !== candidates.length) throw new Error(`Duplicate author article ${key}`);
  const wiki = new Map(); const historic = new Map();
  for (const article of candidates) {
    wiki.set(basename(article.file, '.md'), `/writing/articles/${article.id}/`);
    wiki.set(article.title, `/writing/articles/${article.id}/`);
    wiki.set(String(article.frontmatter.published ?? '').replace(/^\[\[|\]\]$/g, ''), `/writing/articles/${article.id}/`);
    if (article.frontmatter.url) historic.set(article.frontmatter.url, `/writing/articles/${article.id}/`);
  }
  await mkdir(dirname(generatedRoot), { recursive: true });
  await mkdir(dirname(publicRoot), { recursive: true });
  const tempGenerated = await mkdtemp(join(dirname(generatedRoot), '.writing-lab-'));
  const tempPublic = await mkdtemp(join(dirname(publicRoot), '.writing-lab-assets-'));
  const manifest = { sourceRepository: sourceUrl, sourceBranch: 'main', sourceSha, generatedAt: new Date().toISOString(), articles: [] };
  try {
    await mkdir(join(tempGenerated, 'articles'), { recursive: true });
    for (const article of candidates) {
      let output = stripPublicationScaffolding(rewriteLinks(article.raw, (target) => wiki.get(target), (url) => historic.get(url)));
      const processor = (await import('unified')).unified().use((await import('remark-parse')).default);
      const tree = processor.parse(output);
      const resources = [];
      const { visit } = await import('unist-util-visit');
      const imageNodes = [];
      visit(tree, 'image', (node) => imageNodes.push(node));
      for (const image of imageNodes) if (image.type === 'image') resources.push(await collectAsset(article, image, tempPublic));
      output = (await import('unified')).unified().use((await import('remark-stringify')).default).stringify(tree);
      const sourcePath = relative(source, article.file);
      const record = { id: article.id, chapter: article.chapter, title: article.title, sourceId: article.sourceId, sourcePath, sourceUrl: `${sourceUrl}/blob/${sourceSha}/${encodeURIComponent(sourcePath).replace(/%2F/g, '/')}`, sourceSha, historicalUrl: article.frontmatter.url ?? null, summary: summary(article.raw), resources };
      manifest.articles.push(record);
      await writeFile(join(tempGenerated, 'articles', `${article.id}.md`), `---\nid: "${article.id}"\nchapter: "${article.chapter}"\ntitle: "${yaml(article.title)}"\nsourceId: "${article.sourceId}"\nsourcePath: "${yaml(sourcePath)}"\nsourceUrl: "${record.sourceUrl}"\nsourceSha: "${sourceSha}"\nsummary: "${yaml(record.summary)}"\nresources: ${JSON.stringify(resources)}\n---\n${output}`);
    }
    await writeFile(join(tempGenerated, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
    await writeFile(join(tempPublic, 'source.json'), `${JSON.stringify({ sourceRepository: sourceUrl, sourceSha, articleCount: manifest.articles.length, resourceCount: new Set(manifest.articles.flatMap((article) => article.resources.map((resource) => resource.sha256))).size }, null, 2)}\n`);
    await rm(generatedRoot, { recursive: true, force: true }); await rm(publicRoot, { recursive: true, force: true });
    await rename(tempGenerated, generatedRoot); await rename(tempPublic, publicRoot);
    console.log(`Writing-Lab sync: ${sourceSha} · ${manifest.articles.length} articles · ${new Set(manifest.articles.flatMap((article) => article.resources.map((resource) => resource.sha256))).size} assets`);
  } catch (error) { await rm(tempGenerated, { recursive: true, force: true }); await rm(tempPublic, { recursive: true, force: true }); throw error; }
  if (temporarySource) await rm(temporarySource, { recursive: true, force: true });
}
main().catch((error) => { console.error(`Writing-Lab sync failed: ${error.stack ?? error.message}`); process.exitCode = 1; });
