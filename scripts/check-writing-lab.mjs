import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(join(root, 'src/generated/writing-lab/manifest.json'), 'utf8'));
assert.match(manifest.sourceSha, /^[0-9a-f]{40}$/);
assert.equal(new Set(manifest.articles.map((article) => article.id)).size, manifest.articles.length, 'duplicate generated routes');
assert.equal(new Set(manifest.articles.map((article) => article.sourceSha)).size, 1, 'generated articles must use one source SHA');
for (const article of manifest.articles) {
  assert.equal(article.sourceSha, manifest.sourceSha, `${article.id}: mismatched source SHA`);
  const markdown = await readFile(join(root, 'src/generated/writing-lab/articles', `${article.id}.md`), 'utf8');
  assert(!/^tags:/m.test(markdown) && !/附：成稿前提纲存档/.test(markdown) && !/<!--/.test(markdown), `${article.id}: publication scaffolding leaked`);
  for (const resource of article.resources) {
    for (const path of [resource.display, resource.original]) assert((await stat(join(root, 'public', path)))?.isFile(), `${article.id}: missing ${path}`);
  }
}
assert(manifest.articles.length >= 11, 'expected current published corpus');
console.log(`Writing-Lab manifest passed: ${manifest.articles.length} articles, ${new Set(manifest.articles.flatMap((article) => article.resources.map((resource) => resource.sha256))).size} assets, ${manifest.sourceSha}`);
