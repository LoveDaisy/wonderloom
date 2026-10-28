import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';

const explore = new URL('../../dist/explore/index.html', import.meta.url);
const series = new URL('../../dist/writing/ice-halos/index.html', import.meta.url);
const guide = new URL('../../dist/writing/articles/color-space-basics/index.html', import.meta.url);
const checker = new URL('../../scripts/check-site.mjs', import.meta.url);

async function mustReject(file, pattern, message) {
  const original = await readFile(file, 'utf8');
  assert.match(original, pattern, `fixture missing: ${message}`);
  const changed = original.replace(pattern, '');
  try {
    await writeFile(file, changed);
    const result = spawnSync(process.execPath, [checker.pathname], { encoding: 'utf8' });
    assert.notEqual(result.status, 0, `${message}: checker accepted missing rendered content`);
    assert.match(result.stderr, message, `${message}: failed for an unrelated reason`);
  } finally {
    await writeFile(file, original);
  }
}

await mustReject(explore, /<li><a href="\/writing\/articles\/drawing-light\/" data-work="article:drawing-light"[^>]*>[\s\S]*?<\/a><\/li>/, /explore: reachable work links must cover the content model/);
await mustReject(explore, /<header class="cx-path cx-side-a">[\s\S]*?<\/header>/, /explore: visible reading path links changed/);
await mustReject(explore, /<section class="cx-topics\b[^>]*>[\s\S]*?<\/section>/, /explore: visible topic links changed/);
await mustReject(series, /<li><a href="\/writing\/articles\/halo-introduction\/"[\s\S]*?<\/a><\/li>/, /ice-halos: chapter coverage changed/);
await mustReject(guide, /本站提供编辑导读；完整文章仍发布在知乎。/, /article guide: source boundary missing/);
const baseline = spawnSync(process.execPath, [checker.pathname], { encoding: 'utf8' });
assert.equal(baseline.status, 0, `restored baseline failed: ${baseline.stderr}`);
console.log('Five rendered-content counterexamples rejected; built pages restored and baseline passed.');
