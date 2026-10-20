import { lstat, mkdir, mkdtemp, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import matter from 'gray-matter';
import { parseMainRef } from './check-deployment.mjs';
import { imageSize } from 'image-size';
import { visit } from 'unist-util-visit';
import { slug } from 'github-slugger';
import { chapterToRouteId, chapterToSourceId, compareChapters, seriesAliases } from '../src/data/article-identities.js';
import { contentSources } from '../src/data/content-sources.ts';
import { applyEdits, escapeHtml, parseMarkdown, rewriteLinks, stripPublicationScaffolding } from './lib/writing-lab/convert.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const generatedRoot = join(projectRoot, 'src/generated/writing-lab');
const publicRoot = join(projectRoot, 'public/writing-lab-assets');
const provenanceRoot = join(projectRoot, 'public/writing-lab');
const sourceUrl = 'https://github.com/LoveDaisy/ice_halo_notes';
const pointerHeader = 'version https://git-lfs.github.com/spec/v1';
const hash = (body) => createHash('sha256').update(body).digest('hex');
const git = (args, cwd, encoding = 'utf8') => execFileSync('git', ['-c', 'core.hooksPath=/dev/null', ...args], { cwd, encoding, maxBuffer: 64 * 1024 * 1024, timeout: 120000, env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_LFS_SKIP_SMUDGE: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
export function validateAssetBytes(body, committed) {
  if (body.subarray(0, 64).toString().startsWith(pointerHeader)) throw new Error('LFS pointer used as an image');
  if (committed.subarray(0, 64).toString().startsWith(pointerHeader)) {
    const text = committed.toString();
    const oid = text.match(/^oid sha256:([0-9a-f]{64})$/m)?.[1];
    const size = text.match(/^size (\d+)$/m)?.[1];
    if (!oid || !size || Number(size) !== body.length || oid !== hash(body)) throw new Error('LFS OID or size mismatch');
  } else if (!body.equals(committed)) throw new Error('Image differs from committed blob');
}
export function resolveHistoricalSource(chapter, url) {
  if (url === undefined) return undefined;
  const expected = contentSources.find((record) => record.id === chapterToSourceId(chapter));
  if (!expected || expected.url !== url) throw new Error(`Historical URL does not match chapter ${chapter}`);
  return expected;
}
function chapterFrom(file, data) {
  const match = basename(dirname(file)).match(/^(\d+(?:\.\d+)?)-/);
  if (!match) throw new Error(`Published manuscript lacks chapter directory: ${file}`);
  const chapter = match[1].split('.').map(Number).join('.');
  const published = String(data.published ?? '').match(/漫谈\((\d+(?:\.\d+)?)/)?.[1];
  if (published && published !== chapter) throw new Error(`Chapter conflicts with published identity: ${file}`);
  return chapter;
}
async function safeFile(root, path, tracked) {
  const absolute = resolve(root, path), canonical = await realpath(absolute);
  if (!absolute.startsWith(`${root}/`) || canonical !== absolute || !tracked.has(relative(root, absolute)) || !(await lstat(absolute)).isFile()) throw new Error(`Untracked, symlinked or escaping source file: ${path}`);
  return absolute;
}
export async function syncWritingLab({ sourceDirectory = process.env.WRITING_LAB_SOURCE_DIR, expectedSha = process.env.WRITING_LAB_SOURCE_SHA, outputRoot = projectRoot } = {}) {
  const roots = outputRoot === projectRoot ? [generatedRoot, publicRoot, provenanceRoot] : [join(outputRoot, 'src/generated/writing-lab'), join(outputRoot, 'public/writing-lab-assets'), join(outputRoot, 'public/writing-lab')];
  let temporarySource, stage;
  // Failed runs cannot leave an apparently valid previous generated snapshot.
  for (const root of roots) { await rm(root, { recursive: true, force: true }); await rm(`${root}.staging`, { recursive: true, force: true }); }
  try {
    let source = sourceDirectory;
    if (!source) {
      expectedSha = parseMainRef(git(['ls-remote', '--refs', sourceUrl, 'refs/heads/main'], projectRoot));
      temporarySource = await mkdtemp(join(tmpdir(), 'wonderloom-writing-lab-'));
      git(['init', '-q', temporarySource], projectRoot);
      git(['remote', 'add', 'origin', sourceUrl], temporarySource);
      git(['fetch', '--depth=1', 'origin', expectedSha], temporarySource);
      git(['checkout', '--detach', expectedSha], temporarySource);
      source = temporarySource;
    }
    source = await realpath(resolve(source));
    if (git(['status', '--porcelain'], source).trim()) throw new Error('WRITING_LAB_SOURCE_DIR must be a clean checkout');
    const sourceSha = git(['rev-parse', 'HEAD'], source).trim();
    if (!/^[0-9a-f]{40}$/.test(sourceSha) || (expectedSha && sourceSha !== expectedSha)) throw new Error('Source SHA mismatch');
    const entries = git(['ls-tree', '-r', '-z', sourceSha], source).split('\0').filter(Boolean).map((row) => { const [header, path] = row.split('\t'); return { path, mode: header.split(' ')[0] }; });
    const tracked = new Set(entries.filter((e) => e.mode === '100644' || e.mode === '100755').map((e) => e.path));
    const candidates = [];
    for (const path of [...tracked].filter((p) => p.endsWith('.md')).sort()) {
      const file = await safeFile(source, path, tracked);
      const bytes = await readFile(file), committed = git(['show', `${sourceSha}:${path}`], source, null);
      if (!bytes.equals(committed)) throw new Error(`Manuscript differs from committed blob: ${path}`);
      const parsed = matter(bytes.toString());
      if (parsed.data.type !== 'directors-cut' || parsed.data.status !== 'published') continue;
      const chapter = chapterFrom(file, parsed.data), title = parsed.content.match(/^#\s+(.+)$/m)?.[1]?.trim();
      if (!title) throw new Error(`Published manuscript lacks H1: ${path}`);
      const historic = resolveHistoricalSource(chapter, parsed.data.url);
      candidates.push({ file, path, raw: parsed.content, data: parsed.data, chapter, id: chapterToRouteId(chapter), title, historicalSourceId: historic?.id });
    }
    candidates.sort((a, b) => compareChapters(a.chapter, b.chapter));
    if (!candidates.length) throw new Error('No published directors-cut manuscripts');
    if (new Set(candidates.map((a) => a.id)).size !== candidates.length) throw new Error('Duplicate author route');
    const wiki = new Map(seriesAliases), historic = new Map();
    const { readdir } = await import('node:fs/promises');
    for (const name of (await readdir(join(projectRoot, 'src/content/articles'))).filter((p) => p.endsWith('.md'))) {
      const guide = matter(await readFile(join(projectRoot, 'src/content/articles', name), 'utf8'));
      const record = contentSources.find((s) => s.id === guide.data.sourceId);
      if (record) { const route = `/writing/articles/${basename(name, '.md')}/`; wiki.set(record.title, route); wiki.set(basename(name, '.md'), route); historic.set(record.url, route); }
    }
    for (const article of candidates) {
      const route = `/writing/articles/${article.id}/`;
      for (const alias of [basename(article.file, '.md'), article.title, article.path.replace(/\.md$/, ''), String(article.data.published ?? '').replace(/^\[\[|\]\]$/g, '')]) if (alias) wiki.set(alias, route);
      if (article.data.url) historic.set(article.data.url, route);
    }
    const resolveWiki = (target) => { const [name, fragment] = target.split('#'); const route = wiki.get(name.replace(/\.md$/, '')); return route ? route + (fragment ? `#${slug(fragment)}` : '') : undefined; };
    const resolveExternal = (url) => { const [base, fragment] = url.split('#'); const route = historic.get(base); return route ? route + (fragment ? `#${fragment}` : '') : undefined; };
    stage = await mkdtemp(join(tmpdir(), 'wonderloom-publication-'));
    const stageRoots = ['generated', 'assets', 'provenance'].map((p) => join(stage, p));
    await mkdir(join(stageRoots[0], 'articles'), { recursive: true });
    await mkdir(join(stageRoots[2]), { recursive: true });
    const manifest = { sourceRepository: sourceUrl, sourceBranch: expectedSha ? 'main' : 'local-checkout', sourceSha, articles: [] };
    for (const article of candidates) {
      let output = rewriteLinks(stripPublicationScaffolding(article.raw), resolveWiki, resolveExternal);
      const tree = parseMarkdown(output), images = [], edits = [], resources = [];
      visit(tree, 'image', (node) => { images.push(node); });
      visit(tree, 'imageReference', () => { throw new Error('Reference images require explicit conversion support'); });
      visit(tree, 'html', (node) => { if (/<(?:img|video|audio|iframe)\b/i.test(node.value)) throw new Error('Embedded media must use Markdown images'); });
      for (const node of images) {
        if (/^[a-z]+:|^\/\//i.test(node.url)) throw new Error(`External article image must be imported to the source repository: ${node.url}`);
        const assetPath = relative(source, resolve(dirname(article.file), decodeURIComponent(node.url)));
        const file = await safeFile(source, assetPath, tracked);
        const committed = git(['show', `${sourceSha}:${assetPath}`], source, null);
        let body = await readFile(file);
        if (temporarySource && committed.toString().startsWith(pointerHeader)) {
          body = execFileSync('git', ['-c', 'core.hooksPath=/dev/null', 'lfs', 'smudge', '--', assetPath], { cwd: source, input: committed, maxBuffer: 64 * 1024 * 1024, timeout: 120000, env: { ...process.env, GIT_LFS_SKIP_SMUDGE: '0', GIT_TERMINAL_PROMPT: '0' }, stdio: ['pipe', 'pipe', 'pipe'] });
        }
        validateAssetBytes(body, committed);
        const sha256 = hash(body), extension = extname(file).toLowerCase(), info = imageSize(body);
        if (!info.width || !info.height) throw new Error(`Invalid image dimensions: ${assetPath}`);
        const path = `original/${sha256}${extension}`;
        await mkdir(dirname(join(stageRoots[1], path)), { recursive: true });
        await writeFile(join(stageRoots[1], path), body);
        const url = `/writing-lab-assets/${path}`;
        resources.push({ sourcePath: assetPath, original: url, display: url, sha256, bytes: body.length, width: info.width, height: info.height, type: info.type });
        edits.push({ start: node.position.start.offset, end: node.position.end.offset, value: `\n\n<figure><img src="${url}" alt="${escapeHtml(node.alt ?? '')}" width="${info.width}" height="${info.height}" loading="lazy" decoding="async" /><figcaption>${node.alt ? `${escapeHtml(node.alt)} · ` : ''}<a href="${url}">查看原图</a></figcaption></figure>\n\n` });
      }
      output = applyEdits(output, edits);
      const textNode = parseMarkdown(stripPublicationScaffolding(article.raw)).children.find((n) => n.type === 'paragraph');
      const getText = (n) => n.value ?? (n.children ?? []).map(getText).join('');
      const summary = textNode ? getText(textNode).slice(0, 180) : '作者稿全文。';
      const record = { id: article.id, chapter: article.chapter, title: article.title, historicalSourceId: article.historicalSourceId, historicalUrl: article.data.url, sourcePath: article.path, sourceDigest: hash(git(['show', `${sourceSha}:${article.path}`], source, null)), sourceUrl: `${sourceUrl}/blob/${sourceSha}/${article.path.split('/').map(encodeURIComponent).join('/')}`, sourceSha, summary, resources };
      manifest.articles.push(record);
      // JSON string values are valid YAML scalars and escape newlines/backslashes correctly.
      const frontmatter = Object.entries(record).filter(([, value]) => value !== undefined).map(([key, value]) => `${key}: ${JSON.stringify(value)}`).join('\n');
      await writeFile(join(stageRoots[0], 'articles', `${article.id}.md`), `---\n${frontmatter}\n---\n${output}`);
    }
    await writeFile(join(stageRoots[0], 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
    const provenance = { sourceRepository: sourceUrl, sourceSha, articleCount: manifest.articles.length, resourceCount: new Set(manifest.articles.flatMap((a) => a.resources.map((r) => r.sha256))).size };
    await writeFile(join(stageRoots[2], 'source.json'), JSON.stringify(provenance, null, 2) + '\n');
    await mkdir(stageRoots[1], { recursive: true });
    // Stage under each destination filesystem before atomic directory rename.
    const { cp } = await import('node:fs/promises');
    for (let index = 0; index < roots.length; index++) { await mkdir(dirname(roots[index]), { recursive: true }); await cp(stageRoots[index], `${roots[index]}.staging`, { recursive: true }); await rename(`${roots[index]}.staging`, roots[index]); }
    console.log(`Writing-Lab sync: ${sourceSha} · ${provenance.articleCount} articles · ${provenance.resourceCount} assets`);
    return manifest;
  } catch (error) {
    for (const root of roots) { await rm(root, { recursive: true, force: true }); await rm(`${root}.staging`, { recursive: true, force: true }); }
    throw error;
  } finally { if (stage) await rm(stage, { recursive: true, force: true }); if (temporarySource) await rm(temporarySource, { recursive: true, force: true }); }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) syncWritingLab().catch((error) => { console.error(`Writing-Lab sync failed: ${error.message}`); process.exitCode = 1; });
