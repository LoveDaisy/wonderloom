import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const project = new URL('../../', import.meta.url);
const fixture = await mkdtemp(join(tmpdir(), 'wonderloom-site-negative-'));
const original = (path) => new URL(path, project);
const copyFile = (path) => cp(original(path), join(fixture, path));
const explore = join(fixture, 'dist/explore/index.html');
const series = join(fixture, 'dist/writing/ice-halos/index.html');
const guide = join(fixture, 'dist/writing/articles/color-space-basics/index.html');
const network = join(fixture, 'src/data/content-network.ts');
const contentStyles = join(fixture, 'src/styles/site-loom-content.css');
const checker = join(fixture, 'scripts/check-site.mjs');
const designChecker = join(fixture, 'scripts/check-design-tokens.mjs');

function check(script) { return spawnSync(process.execPath, [script], { encoding: 'utf8' }); }
async function mustReject(file, pattern, message) {
  const baseline = await readFile(file, 'utf8');
  assert.match(baseline, pattern, `fixture missing: ${message}`);
  try {
    await writeFile(file, baseline.replace(pattern, ''));
    const result = check(checker);
    assert.notEqual(result.status, 0, `${message}: checker accepted missing rendered content`);
    assert.match(result.stderr, message, `${message}: failed for an unrelated reason`);
  } finally {
    await writeFile(file, baseline);
  }
}

try {
  await mkdir(join(fixture, 'scripts'), { recursive: true });
  await mkdir(join(fixture, 'src/data'), { recursive: true });
  await mkdir(join(fixture, 'src/styles'), { recursive: true });
  await cp(original('dist'), join(fixture, 'dist'), { recursive: true });
  await symlink(original('node_modules').pathname, join(fixture, 'node_modules'), 'dir');
  await Promise.all([
    'scripts/check-site.mjs', 'scripts/check-design-tokens.mjs', 'src/data/content-network.ts',
    'src/styles/tokens.css', 'src/styles/site.css', 'src/styles/site-base.css',
    'src/styles/site-article.css', 'src/styles/site-loom.css', 'src/styles/site-loom-content.css',
  ].map(copyFile));

  await mustReject(explore, /<li><a href="\/writing\/articles\/drawing-light\/" data-work="article:drawing-light"[^>]*>[\s\S]*?<\/a><\/li>/, /explore: understand-halos stations changed/);
  await mustReject(explore, /<header class="cx-path cx-side-a">[\s\S]*?<\/header>/, /explore: visible reading path links changed/);
  await mustReject(explore, /<section class="cx-topics\b[^>]*>[\s\S]*?<\/section>/, /explore: visible topic links changed/);
  await mustReject(series, /<li><a href="\/writing\/articles\/halo-introduction\/"[\s\S]*?<\/a><\/li>/, /ice-halos: chapter coverage changed/);
  await mustReject(guide, / id="article-guide"/, /article guide: former fragment target missing/);
  await mustReject(guide, /本站提供编辑导读；完整文章仍发布在知乎。/, /article guide: source boundary missing/);

  const retiredRoute = join(fixture, 'dist/directions/research/notebook/language/index.html');
  await mkdir(join(fixture, 'dist/directions/research/notebook/language'), { recursive: true });
  try {
    await cp(join(fixture, 'dist/about/index.html'), retiredRoute);
    const result = check(checker);
    assert.notEqual(result.status, 0, 'retired route was accepted');
    assert.match(result.stderr, /retired route remains: directions\/research\/notebook\/language\/index\.html/, 'retired route failed for an unrelated reason');
    assert.equal(check(original('scripts/check-site.mjs').pathname).status, 0, 'parallel production check observed fixture mutation');
  } finally {
    await rm(join(fixture, 'dist/directions'), { recursive: true, force: true });
  }

  const baselineNetwork = await readFile(network, 'utf8');
  const baselineExplore = await readFile(explore, 'utf8');
  const renderedWork = /<li><a href="\/writing\/articles\/camera-colour\/" data-work="article:camera-colour"[^>]*>[\s\S]*?<\/a><\/li>/;
  assert.equal((baselineNetwork.match(/, 'article:camera-colour'\]/g) ?? []).length, 2, 'network fixture changed');
  assert.match(baselineExplore, renderedWork, 'rendered work fixture changed');
  try {
    await writeFile(network, baselineNetwork.replaceAll(", 'article:camera-colour']", ']'));
    await writeFile(explore, baselineExplore.replace(renderedWork, ''));
    const result = check(checker);
    assert.notEqual(result.status, 0, 'synchronized model/page omission was accepted');
    assert.match(result.stderr, /curated work identities changed/, 'synchronized omission failed for an unrelated reason');
    assert.equal(check(original('scripts/check-site.mjs').pathname).status, 0, 'parallel production check observed fixture mutation');
  } finally {
    await writeFile(network, baselineNetwork);
    await writeFile(explore, baselineExplore);
  }
  try {
    await writeFile(network, baselineNetwork.replaceAll(", 'article:camera-colour']", ", 'article:halo-1']"));
    await writeFile(explore, baselineExplore.replace(renderedWork, (work) => work.replaceAll('camera-colour', 'halo-1')));
    const result = check(checker);
    assert.notEqual(result.status, 0, 'equal-count work substitution was accepted');
    assert.match(result.stderr, /curated work identities changed/, 'work substitution failed for an unrelated reason');
  } finally {
    await writeFile(network, baselineNetwork);
    await writeFile(explore, baselineExplore);
  }

  const baselineCss = await readFile(contentStyles, 'utf8');
  const acceptedType = 'font: var(--type-body)/var(--leading-body) var(--cy-song);';
  assert(baselineCss.includes(acceptedType), 'typography fixture changed');
  try {
    await writeFile(contentStyles, baselineCss.replace(acceptedType, 'font: 17px/1.9 var(--cy-song);'));
    const result = check(designChecker);
    assert.notEqual(result.status, 0, 'untracked formal font size was accepted');
    assert.match(result.stderr, /font must use semantic typography tokens/, 'typography omission failed for an unrelated reason');
  } finally {
    await writeFile(contentStyles, baselineCss);
  }

  const terminated = spawnSync(process.execPath, ['-e', 'require("fs").writeFileSync(process.argv[1], "fixture interrupted"); process.kill(process.pid, "SIGTERM")', contentStyles]);
  assert.equal(terminated.signal, 'SIGTERM', 'abnormal-exit probe did not terminate');
  assert.equal(await readFile(original('src/data/content-network.ts'), 'utf8'), baselineNetwork, 'production model changed');
  assert.equal(await readFile(original('src/styles/site-loom-content.css'), 'utf8'), baselineCss, 'production CSS changed');
  assert.equal(await readFile(original('dist/explore/index.html'), 'utf8'), baselineExplore, 'production HTML changed');
  await writeFile(contentStyles, baselineCss);
  assert.equal(check(checker).status, 0, 'restored fixture failed site check');
  assert.equal(check(designChecker).status, 0, 'restored fixture failed design check');
  console.log('Ten isolated counterexamples rejected; production sources and build output remained unchanged.');
} finally {
  await rm(fixture, { recursive: true, force: true });
}
