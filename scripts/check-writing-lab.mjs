import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import matter from 'gray-matter';
import { parseMarkdown, stripPublicationScaffolding } from './lib/writing-lab/convert.mjs';
import { visit } from 'unist-util-visit';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(join(root, 'src/generated/writing-lab/manifest.json'), 'utf8'));
const provenance = JSON.parse(await readFile(join(root, 'dist/writing-lab/source.json'), 'utf8'));
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
assert.match(manifest.sourceSha, /^[0-9a-f]{40}$/);
assert.equal(provenance.sourceSha, manifest.sourceSha, 'published provenance differs from generated manifest');
if (process.env.WRITING_LAB_SOURCE_SHA) assert.equal(manifest.sourceSha, process.env.WRITING_LAB_SOURCE_SHA);
assert(manifest.articles.length > 0, 'empty author corpus');
assert.equal(new Set(manifest.articles.map((a) => a.id)).size, manifest.articles.length, 'duplicate generated routes');
const math = (text) => { const values = []; visit(parseMarkdown(text), (node) => { if (node.type === 'math' || node.type === 'inlineMath') values.push([node.type, node.value]); }); return values; };
for (const article of manifest.articles) {
  assert.equal(article.sourceSha, manifest.sourceSha);
  const parsed = matter(await readFile(join(root, 'src/generated/writing-lab/articles', `${article.id}.md`), 'utf8'));
  for (const [key, value] of Object.entries(article)) assert.deepEqual(parsed.data[key], value, `${article.id}: metadata differs: ${key}`);
  const html = await readFile(join(root, 'dist/writing/articles', article.id, 'index.html'), 'utf8');
  assert(!html.includes('katex-error'), `${article.id}: math render error`);
  assert(html.includes(encodeURI(article.sourceUrl)) || html.includes(article.sourceUrl), `${article.id}: missing source link`);
  if (process.env.WRITING_LAB_SOURCE_DIR) {
    const source = await readFile(join(process.env.WRITING_LAB_SOURCE_DIR, article.sourcePath));
    assert.equal(digest(source), article.sourceDigest, `${article.id}: source digest mismatch`);
    assert.deepEqual(math(parsed.content), math(stripPublicationScaffolding(matter(source.toString()).content)), `${article.id}: math changed`);
  }
  for (const resource of article.resources) for (const path of new Set([resource.display, resource.original])) {
    const body = await readFile(join(root, 'dist', path));
    assert.equal(digest(body), resource.sha256, `${article.id}: asset digest mismatch`);
    assert.equal(body.length, resource.bytes, `${article.id}: asset size mismatch`);
  }
}
assert.equal(provenance.articleCount, manifest.articles.length);
assert.equal(provenance.resourceCount, new Set(manifest.articles.flatMap((a) => a.resources.map((r) => r.sha256))).size);
console.log(`Writing-Lab verified: ${provenance.articleCount} articles, ${provenance.resourceCount} assets, ${manifest.sourceSha}`);
