import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';

const explore = new URL('../../dist/explore/index.html', import.meta.url);
const series = new URL('../../dist/writing/ice-halos/index.html', import.meta.url);
const guide = new URL('../../dist/writing/articles/color-space-basics/index.html', import.meta.url);
const checker = new URL('../../scripts/check-site.mjs', import.meta.url);
const designChecker = new URL('../../scripts/check-design-tokens.mjs', import.meta.url);
const network = new URL('../../src/data/content-network.ts', import.meta.url);
const contentStyles = new URL('../../src/styles/site-loom-content.css', import.meta.url);

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

await mustReject(explore, /<li><a href="\/writing\/articles\/drawing-light\/" data-work="article:drawing-light"[^>]*>[\s\S]*?<\/a><\/li>/, /explore: understand-halos stations changed/);
await mustReject(explore, /<header class="cx-path cx-side-a">[\s\S]*?<\/header>/, /explore: visible reading path links changed/);
await mustReject(explore, /<section class="cx-topics\b[^>]*>[\s\S]*?<\/section>/, /explore: visible topic links changed/);
await mustReject(series, /<li><a href="\/writing\/articles\/halo-introduction\/"[\s\S]*?<\/a><\/li>/, /ice-halos: chapter coverage changed/);
await mustReject(guide, /本站提供编辑导读；完整文章仍发布在知乎。/, /article guide: source boundary missing/);

const originalNetwork = await readFile(network, 'utf8');
const originalExplore = await readFile(explore, 'utf8');
const omittedWork = /<li><a href="\/writing\/articles\/camera-colour\/" data-work="article:camera-colour"[^>]*>[\s\S]*?<\/a><\/li>/;
assert.equal((originalNetwork.match(/, 'article:camera-colour'\]/g) ?? []).length, 2, 'network fixture changed');
assert.match(originalExplore, omittedWork, 'rendered work fixture changed');
try {
  await writeFile(network, originalNetwork.replaceAll(", 'article:camera-colour']", ']'));
  await writeFile(explore, originalExplore.replace(omittedWork, ''));
  const result = spawnSync(process.execPath, [checker.pathname], { encoding: 'utf8' });
  assert.notEqual(result.status, 0, 'synchronized model/page omission was accepted');
  assert.match(result.stderr, /curated topic catalogue must retain eleven works/, 'synchronized omission failed for an unrelated reason');
} finally {
  await writeFile(network, originalNetwork);
  await writeFile(explore, originalExplore);
}

const originalCss = await readFile(contentStyles, 'utf8');
const acceptedType = 'font: var(--type-body)/var(--leading-body) var(--cy-song);';
assert(originalCss.includes(acceptedType), 'typography fixture changed');
try {
  await writeFile(contentStyles, originalCss.replace(acceptedType, 'font: 17px/1.9 var(--cy-song);'));
  const result = spawnSync(process.execPath, [designChecker.pathname], { encoding: 'utf8' });
  assert.notEqual(result.status, 0, 'untracked formal font size was accepted');
  assert.match(result.stderr, /font must use semantic typography tokens/, 'typography omission failed for an unrelated reason');
} finally {
  await writeFile(contentStyles, originalCss);
}

const baseline = spawnSync(process.execPath, [checker.pathname], { encoding: 'utf8' });
assert.equal(baseline.status, 0, `restored baseline failed: ${baseline.stderr}`);
const designBaseline = spawnSync(process.execPath, [designChecker.pathname], { encoding: 'utf8' });
assert.equal(designBaseline.status, 0, `restored design baseline failed: ${designBaseline.stderr}`);
console.log('Seven rendered-content and typography counterexamples rejected; source, styles and built pages restored.');
