// Local, dependency-free browser audit. Requires Node 22, Chrome and design-taste-frontend.
// Usage: node verify-browser.mjs http://127.0.0.1:4323
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const skill = process.env.TASTE_SKILL_DIR || join(homedir(), '.codex/skills/design-taste-frontend');
const { Browser } = await import(pathToFileURL(join(skill, 'scripts/lib/cdp.mjs')).href);
const base = (process.argv[2] || 'http://127.0.0.1:4323').replace(/\/$/, '');
const out = join(here, 'final/browser-matrix');
mkdirSync(out, { recursive: true });
const legacyBaseline = JSON.parse(readFileSync(join(here, 'baseline/legacy/report.json'), 'utf8'));

const threeWidths = [[1440, 900], [768, 1024], [390, 844]];
const cases = [
  ['home', '/', [[1440, 900], [1024, 768], [768, 1024], [390, 844], [320, 844]]],
  ['writing', '/writing/', threeWidths],
  ['series', '/writing/ice-halos/', threeWidths],
  ['guide-only', '/writing/articles/color-space-basics/', threeWidths],
  ['author-only', '/writing/articles/halo-2/', threeWidths],
  ['guide-and-author', '/writing/articles/halo-direct-integration/', threeWidths],
  ['long-article', '/writing/articles/halo-8/', threeWidths],
  ['explore', '/explore/', threeWidths],
  ['topic', '/explore/topics/ice-halos/', threeWidths],
  ['path', '/explore/paths/understand-halos/', threeWidths],
  ['projects', '/projects/', threeWidths],
  ['project', '/projects/lumice/', threeWidths],
  ['about', '/about/', threeWidths],
  ['not-found', '/this-page-does-not-exist/', threeWidths],
  ['legacy-home', '/directions/research/notebook/home/', threeWidths],
  ['legacy-writing', '/directions/research/notebook/writing/', threeWidths],
  ['legacy-explore', '/directions/research/notebook/explore/', threeWidths],
];

const legacyLayout = readFileSync(join(here, '../../../src/layouts/ResearchLayout.astro'), 'utf8');
const legacyEntry = readFileSync(join(here, '../../../src/styles/directions-legacy.css'), 'utf8');
const legacyImports = [...legacyEntry.matchAll(/@import\s+['"]([^'"]+)['"]/g)].map((match) => match[1]);
const legacyImportGraph = {
  layoutUsesLegacyOnly: legacyLayout.includes("import '../styles/directions-legacy.css'") && !legacyLayout.includes("import '../styles/site.css'"),
  imports: legacyImports,
  isolated: legacyImports.length === 3 && legacyImports.every((path) => path.startsWith('./directions-legacy-') || path === './research-editions.css'),
};

async function key(page, name, code, virtualKey) {
  for (const type of ['keyDown', 'keyUp']) {
    await page.send('Input.dispatchKeyEvent', { type, key: name, code, windowsVirtualKeyCode: virtualKey, nativeVirtualKeyCode: virtualKey });
  }
}

async function keyboardCheck(page) {
  const steps = [];
  for (let index = 0; index < 3; index++) {
    await key(page, 'Tab', 'Tab', 9);
    steps.push(await page.eval(() => {
      const el = document.activeElement;
      const box = el?.getBoundingClientRect();
      return { tag: el?.tagName, text: el?.textContent?.trim(), href: el?.getAttribute('href'), focusVisible: el?.matches(':focus-visible'), outline: el ? getComputedStyle(el).outlineStyle : null, inViewport: !!box && box.top >= 0 && box.left >= 0 && box.bottom <= innerHeight && box.right <= innerWidth };
    }));
  }
  await key(page, 'Enter', 'Enter', 13);
  const result = await page.eval(() => ({ path: location.pathname, hash: location.hash }));
  return { steps, enterResult: result };
}

const browser = await Browser.launch();
const report = { at: new Date().toISOString(), base, cases: [], firstScreenResources: null, legacyImportGraph, states: {} };
try {
  for (const [name, route, viewports] of cases) {
    for (const [width, height] of viewports) {
      const page = await browser.newPage({ width, height, mobile: width <= 390 });
      if (name === 'home' && width === 1440) {
        await page.send('Network.enable');
        await page.send('Network.setCacheDisabled', { cacheDisabled: true });
        await page.send('Network.clearBrowserCache');
      }
      const load = await page.goto(base + route, { settleMs: 500 });
      if (name === 'home' && width === 1440) {
        report.firstScreenResources = await page.eval(() => {
          const resources = performance.getEntriesByType('resource').map((entry) => ({
            url: new URL(entry.name).pathname,
            kind: entry.initiatorType,
            transfer: entry.transferSize,
            encoded: entry.encodedBodySize,
          }));
          return { resources, transfer: resources.reduce((sum, entry) => sum + entry.transfer, 0), duplicateUrls: resources.map((r) => r.url).filter((url, i, all) => all.indexOf(url) !== i) };
        });
      }
      const metrics = await page.eval(async () => {
        const images = [...document.images];
        await Promise.all(images.map(async (image) => {
          image.loading = 'eager';
          try { await image.decode(); } catch {}
        }));
        const navTargets = [...document.querySelectorAll('.site-nav a')].map((a) => ({ label: a.textContent.trim(), height: Math.round(a.getBoundingClientRect().height) }));
        const legacyRail = document.querySelector('.research-page-intro .nb-opening-margin .nb-rail-title');
        const formula = document.querySelector('.katex-display');
        const table = document.querySelector('.article-prose table');
        const prose = document.querySelector('.article-prose');
        const topicTitles = [...document.querySelectorAll('.nb-topic-works h3')];
        return {
          title: document.title,
          viewportWidth: innerWidth,
          pageScrollWidth: document.documentElement.scrollWidth,
          scrollX,
          h1: [...document.querySelectorAll('h1')].map((h) => h.textContent.trim()),
          horizontalOverflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
          brokenImages: images.filter((image) => !image.naturalWidth).map((image) => image.src),
          imageCount: images.length,
          linkCount: document.querySelectorAll('a[href]').length,
          navTargets,
          legacyRail: legacyRail?.textContent.trim() || null,
          formulaCount: document.querySelectorAll('.katex-display').length,
          tableCount: document.querySelectorAll('table').length,
          formulaOverflow: formula ? getComputedStyle(formula).overflowX : null,
          tableOverflow: table ? getComputedStyle(table).overflowX : null,
          clippedProse: prose ? [...prose.querySelectorAll('p')].filter((p) => p.getBoundingClientRect().right > innerWidth + 1 || p.getBoundingClientRect().left < -1).length : 0,
          narrowTopicTitles: topicTitles.filter((h) => h.getBoundingClientRect().width < 100).length,
          lightStops: document.querySelectorAll('.light-path-stop').length,
          automaticAnimations: [...document.querySelectorAll('*')].filter((el) => getComputedStyle(el).animationName !== 'none').length,
          legacyStyles: [...document.querySelectorAll('link[rel="stylesheet"]')].map((link) => new URL(link.href).pathname),
          legacyTokens: document.body.classList.contains('research-edition') ? {
            bodyClass: document.body.className,
            paper: getComputedStyle(document.documentElement).getPropertyValue('--paper').trim(),
            ink: getComputedStyle(document.documentElement).getPropertyValue('--ink').trim(),
            nbPageSize: getComputedStyle(document.querySelector('.notebook')).getPropertyValue('--nb-page-size').trim(),
          } : null,
        };
      });
      const file = `${name}-${width}x${height}.jpg`;
      await page.screenshot({ path: join(out, file), quality: 78 });
      if (name === 'home' && (width === 1440 || width === 390)) {
        await page.screenshot({ path: join(out, `home-full-${width}.jpg`), quality: 76, fullPage: true });
      }
      if (name === 'long-article' && width === 390) {
        const hasFormula = await page.eval(() => {
          const target = document.querySelector('.katex-display');
          target?.scrollIntoView({ block: 'center' });
          return Boolean(target);
        });
        if (hasFormula) await page.screenshot({ path: join(out, 'long-article-formula-390.jpg'), quality: 80 });
        // The formula capture scrolls far down the article; start the keyboard
        // sequence from a fresh navigation, as a visitor opening this route does.
        await page.goto(base + route, { settleMs: 100 });
      }
      const keyboard = name.startsWith('legacy-') ? null : await keyboardCheck(page);
      if (keyboard && (name === 'home' || name === 'long-article') && width === 390) {
        await page.screenshot({ path: join(out, `${name}-keyboard-390.jpg`), quality: 78 });
      }
      report.cases.push({ name, route, width, height, load, file, ...metrics, keyboard, consoleErrors: page.consoleErrors });
      await page.close();
    }
  }
  const noJs = await browser.newPage({ width: 390, height: 844, mobile: true });
  await noJs.send('Emulation.setScriptExecutionDisabled', { value: true });
  await noJs.goto(base + '/', { settleMs: 300 });
  report.states.noJs = await noJs.eval(() => ({ h1: document.querySelector('h1')?.textContent.trim(), stops: document.querySelectorAll('.light-path-stop').length, links: document.querySelectorAll('.light-path-stop a[href]').length, overflow: document.documentElement.scrollWidth - innerWidth }));
  await noJs.screenshot({ path: join(out, 'home-no-js-390.jpg'), quality: 78 });
  await noJs.close();
  const reduced = await browser.newPage({ width: 390, height: 844, mobile: true, reducedMotion: true });
  await reduced.goto(base + '/', { settleMs: 300 });
  report.states.reducedMotion = await reduced.eval(() => ({ preference: matchMedia('(prefers-reduced-motion: reduce)').matches, visibleStops: [...document.querySelectorAll('.light-path-stop')].filter((el) => getComputedStyle(el).opacity !== '0').length }));
  await reduced.screenshot({ path: join(out, 'home-reduced-motion-390.jpg'), quality: 78 });
  await reduced.close();
  report.states.notFoundHttpStatus = (await fetch(base + '/this-page-does-not-exist/')).status;
  writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
} finally {
  await browser.close();
}

const failures = report.cases.filter((item) => {
  const common = item.h1.length !== 1 || item.horizontalOverflow > 0 || item.clippedProse > 0 || item.narrowTopicTitles > 0 || item.brokenImages.length || item.consoleErrors.length || (item.width <= 390 && item.navTargets.some((target) => target.height < 44));
  if (item.name.startsWith('legacy-')) {
    const tokens = item.legacyTokens;
    const before = legacyBaseline.cases.find((entry) => entry.name === item.name.slice(7) && entry.width === item.width);
    return common || !before || tokens.bodyClass !== before.bodyClass || tokens.paper !== before.paper || tokens.ink !== before.ink || tokens.nbPageSize !== before.nbPageSize || item.h1[0] !== before.h1 || item.legacyStyles.length !== 1 || !item.legacyStyles[0].includes('ResearchLayout');
  }
  const steps = item.keyboard?.steps || [];
  return common || steps.length !== 3 || steps.some((step) => step.tag !== 'A' || !step.focusVisible || step.outline === 'none' || !step.inViewport) || steps[0].href !== '#main' || steps[1].href !== '/' || steps[2].href !== '/' || item.keyboard.enterResult.path !== '/';
});
if (!legacyImportGraph.layoutUsesLegacyOnly || !legacyImportGraph.isolated) failures.push({ name: 'legacy-import-graph' });
if (report.states.noJs.stops !== 4 || report.states.notFoundHttpStatus !== 404) failures.push({ name: 'state-check' });
console.log(JSON.stringify({ captures: report.cases.length, firstScreenTransfer: report.firstScreenResources.transfer, failures: failures.map((item) => `${item.name}:${item.width ?? ''}`) }));
if (failures.length) process.exitCode = 1;
// CDP's pending navigation timeout timers can otherwise keep Node alive after Chrome closes.
process.exit(process.exitCode || 0);
