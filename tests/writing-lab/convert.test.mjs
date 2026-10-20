import assert from 'node:assert/strict';
import test from 'node:test';
import { chapterToRouteId, compareChapters } from '../../src/data/article-identities.js';
import { rewriteLinks, stripPublicationScaffolding, parseMarkdown } from '../../scripts/lib/writing-lab/convert.mjs';

test('chapter identity keeps established routes and makes decimal chapters stable', () => {
  assert.equal(chapterToRouteId('0'), 'halo-introduction');
  assert.equal(chapterToRouteId('6'), 'halo-direct-integration');
  assert.equal(chapterToRouteId('8.1'), 'halo-8-1');
  assert.throws(() => chapterToRouteId('chapter-eight'));
  assert.deepEqual(['8.1', '9', '2', '8'].sort(compareChapters), ['2', '8', '8.1', '9']);
});

test('publication conversion removes only defined scaffolding', () => {
  const source = '# 标题\n\ntags: [[halo]]\n\n保留这一段。\n\n## 附：成稿前提纲存档\n\n删除这一段。\n';
  assert.equal(stripPublicationScaffolding(source), '保留这一段。\n');
});

test('wikilinks and known historical links resolve without changing unknown text', () => {
  const converted = rewriteLinks('去 [[已知|这里]]，也去 [[术语]]。 [旧文](https://example.test/old)', (target) => target === '已知' ? '/known/' : undefined, (url) => url === 'https://example.test/old' ? '/old/' : undefined);
  assert.match(converted, /\[这里\]\(\/known\/\)/);
  assert.match(converted, /术语/);
  assert.match(converted, /\[旧文\]\(\/old\/\)/);
});

import { mkdtemp, mkdir, writeFile, readFile, rm, access, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { syncWritingLab, validateAssetBytes, resolveHistoricalSource } from '../../scripts/sync-writing-lab.mjs';
import { parseMainRef, isCurrent, freshnessGate } from '../../scripts/check-deployment.mjs';
import { seriesAliases } from '../../src/data/article-identities.js';

test('math, tables, code and unrelated prose retain exact bytes', () => {
  const body = '\n矩阵 $\\begin{pmatrix}a & b\\\\c & d\\end{pmatrix}$，$x_i \\times y_j$。\n\n$$\nA_{ij}=\\frac{1}{2}\n$$\n\n| A | B |\n|---|---|\n| 1 | 2 |\n\n`[[known]]`\n\n~~~md\n[[known]]\n~~~\n';
  assert.equal(rewriteLinks(body, () => '/known/', () => undefined), body);
  assert.equal(stripPublicationScaffolding('# Title\n\ntags: [[tag]]\n' + body), body.trim() + '\n');
  assert.equal(rewriteLinks('<!-- [[known]] -->\n\n[link [[known]]](https://example.test)', () => '/known/', () => undefined), '<!-- [[known]] -->\n\n[link [[known]]](https://example.test)');
  assert.equal(rewriteLinks('[[Halo Notes]]', (name) => seriesAliases.get(name), () => undefined), '[Halo Notes](/writing/ice-halos/)');
});

test('strict ref parser and deployment convergence cover stale, reordered and rewritten refs', async () => {
  const a = 'a'.repeat(40), b = 'b'.repeat(40), c = 'c'.repeat(40);
  assert.equal(parseMainRef(`${a}\trefs/heads/main\n`), a);
  for (const invalid of ['', `${a}\trefs/heads/other`, `${a}\trefs/heads/main\n${b}\trefs/heads/main`, 'garbage']) assert.throws(() => parseMainRef(invalid));
  const A = { website: a, source: a }, B = { website: a, source: b };
  assert.equal(isCurrent(A, A), true); assert.equal(isCurrent(A, B), false); assert.equal(isCurrent(B, B), true);
  assert.equal(isCurrent(A, { website: b, source: a }), false);
  assert.equal(isCurrent({ website: a, source: c }, { website: a, source: c }), true); // rewritten current head
  let requests = 0;
  const request = async (_url, options) => { requests++; assert.equal(JSON.parse(options.body).ref, 'main'); return { ok: true }; };
  for (const candidate of [A, B, A]) await freshnessGate({ candidate, current: B, token: 'test-only', request });
  assert.equal(requests, 2); // B published, late A is skipped and restores latest pending B
  await freshnessGate({ candidate: A, current: B, token: 'test-only', request }); // main advanced after final gate
  assert.equal(requests, 3);
  await freshnessGate({ candidate: B, current: B, refresh: true, token: 'test-only', request });
  assert.equal(requests, 4);
  await assert.rejects(freshnessGate({ candidate: A, current: B, token: 'test-only', request: async () => ({ ok: false, status: 403 }) }), /403/);
  assert.throws(() => isCurrent(A, { website: '', source: b }));
});

test('asset identity checks reject pointers, tampering and invalid LFS metadata', () => {
  const bytes = Buffer.from('actual image bytes'), digest = createHash('sha256').update(bytes).digest('hex');
  const pointer = Buffer.from(`version https://git-lfs.github.com/spec/v1\noid sha256:${digest}\nsize ${bytes.length}\n`);
  validateAssetBytes(bytes, pointer); validateAssetBytes(bytes, bytes);
  assert.throws(() => validateAssetBytes(pointer, pointer), /pointer/);
  assert.throws(() => validateAssetBytes(Buffer.from('other'), pointer), /mismatch/);
  assert.throws(() => validateAssetBytes(bytes, Buffer.from(pointer.toString().replace(`size ${bytes.length}`, 'size 999'))), /mismatch/);
  assert.throws(() => validateAssetBytes(bytes, Buffer.from('other')), /committed/);
});

test('clean snapshots generate deterministically, accept future articles, and fail without stale output', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'wonderloom-fixture-')), source = join(directory, 'source'), output = join(directory, 'output');
  const run = (args) => execFileSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'commit.gpgsign=false', ...args], { cwd: source, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const body = '# 新章节\n\n保留 $x_i$。\n\n[[Halo Notes]] 与 [[color-space-basics]]。\n\n![图](img/test.png)\n图片后仍有 $z_i$。\n';
  const document = (status = 'published') => `---\ntype: directors-cut\nstatus: ${status}\n---\n${body}`;
  const file = join(source, '10-future', '新章节.md');
  try {
    await mkdir(join(source, '10-future/img'), { recursive: true });
    await writeFile(file, document());
    await writeFile(join(source, '10-future/img/test.png'), Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jS1cAAAAASUVORK5CYII=', 'base64'));
    await mkdir(join(source, '11-draft')); await writeFile(join(source, '11-draft/draft.md'), document('draft'));
    run(['init', '-q']); run(['config', 'user.email', 'test@example.test']); run(['config', 'user.name', 'Test']);
    const commit = () => { run(['add', '.']); run(['commit', '-qm', 'fixture']); };
    commit();
    const sha = run(['rev-parse', 'HEAD']);
    const first = await syncWritingLab({ sourceDirectory: source, expectedSha: sha, outputRoot: output });
    assert.equal(first.articles.length, 1); assert.equal(first.articles[0].id, 'halo-10'); assert.equal(first.articles[0].historicalSourceId, undefined);
    const generated = join(output, 'src/generated/writing-lab/articles/halo-10.md');
    const text = await readFile(generated, 'utf8');
    const flatten = (n) => [n, ...(n.children ?? []).flatMap(flatten)];
    assert.equal(flatten(parseMarkdown(text.split('---\n').slice(2).join('---\n'))).filter((n) => n.type === 'inlineMath').length, 2);
    assert.match(text, /\$x_i\$/); assert.match(text, /\/writing\/ice-halos\//); assert.match(text, /\/writing\/articles\/color-space-basics\//);
    const manifestPath = join(output, 'src/generated/writing-lab/manifest.json');
    const before = await readFile(manifestPath, 'utf8');
    await syncWritingLab({ sourceDirectory: source, expectedSha: sha, outputRoot: output });
    assert.equal(await readFile(manifestPath, 'utf8'), before); assert.equal(await readFile(generated, 'utf8'), text);
    await assert.rejects(syncWritingLab({ sourceDirectory: source, expectedSha: 'f'.repeat(40), outputRoot: output }), /SHA mismatch/);
    await assert.rejects(access(manifestPath));
    await writeFile(join(source, '.gitignore'), '10-future/img/ignored.png\n');
    await writeFile(join(source, '10-future/img/ignored.png'), Buffer.from('ignored'));
    await writeFile(file, document().replace('img/test.png', 'img/ignored.png')); commit();
    await assert.rejects(syncWritingLab({ sourceDirectory: source, outputRoot: output }), /Untracked/);
    await assert.rejects(access(generated));
    await symlink(join(source, '10-future/img'), join(source, '10-future/alias'));
    await writeFile(file, document().replace('img/test.png', 'alias/test.png')); commit();
    await assert.rejects(syncWritingLab({ sourceDirectory: source, outputRoot: output }), /symlinked/);
    await writeFile(file, document()); commit();
    await syncWritingLab({ sourceDirectory: source, outputRoot: output });
    await writeFile(file, document() + '\n## 附：成稿前提纲存档\n内部草稿。\n'); commit();
    await syncWritingLab({ sourceDirectory: source, outputRoot: output });
    assert(!((await readFile(generated, 'utf8')).includes('内部草稿')));
  } finally { await rm(directory, { recursive: true, force: true }); }
});


test('declared historical URLs must match their chapter; future URL-free manuscripts remain valid', () => {
  assert.equal(resolveHistoricalSource('10', undefined), undefined);
  assert.equal(resolveHistoricalSource('0', 'https://zhuanlan.zhihu.com/p/461810067').id, 'halo-0');
  assert.throws(() => resolveHistoricalSource('0', 'https://example.test/wrong'), /Historical URL/);
  assert.throws(() => resolveHistoricalSource('6', 'https://zhuanlan.zhihu.com/p/461810067'), /Historical URL/);
  assert.throws(() => resolveHistoricalSource('10', 'https://zhuanlan.zhihu.com/p/461810067'), /Historical URL/);
  assert.throws(() => resolveHistoricalSource('0', null), /Historical URL/);
});
