import assert from 'node:assert/strict';
import test from 'node:test';
import { chapterToRouteId, compareChapters } from '../../src/data/article-identities.js';
import { rewriteLinks, stripPublicationScaffolding } from '../../scripts/lib/writing-lab/convert.mjs';

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
