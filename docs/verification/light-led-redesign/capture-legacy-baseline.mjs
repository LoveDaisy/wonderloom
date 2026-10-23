// Run against a server started from the unchanged base commit (8365dbc).
// Usage: node capture-legacy-baseline.mjs http://127.0.0.1:4321
import { mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const skill = process.env.TASTE_SKILL_DIR || join(homedir(), '.codex/skills/design-taste-frontend');
const { Browser } = await import(pathToFileURL(join(skill, 'scripts/lib/cdp.mjs')).href);
const base = (process.argv[2] || 'http://127.0.0.1:4321').replace(/\/$/, '');
const out = join(here, 'baseline/legacy');
mkdirSync(out, { recursive: true });
const cases = [
  ['home', '/directions/research/notebook/home/'],
  ['writing', '/directions/research/notebook/writing/'],
  ['explore', '/directions/research/notebook/explore/'],
];
const viewports = [[1440, 900], [768, 1024], [390, 844]];
const report = { sourceCommit: '8365dbcbcdeb1522ffa0656132a16285ee966da1', base, cases: [] };
const browser = await Browser.launch();
try {
  for (const [name, route] of cases) for (const [width, height] of viewports) {
    const page = await browser.newPage({ width, height, mobile: width <= 390 });
    await page.goto(base + route, { settleMs: 500 });
    const metrics = await page.eval(() => ({
      title: document.title,
      bodyClass: document.body.className,
      paper: getComputedStyle(document.documentElement).getPropertyValue('--paper').trim(),
      ink: getComputedStyle(document.documentElement).getPropertyValue('--ink').trim(),
      nbPageSize: getComputedStyle(document.querySelector('.notebook')).getPropertyValue('--nb-page-size').trim(),
      h1: document.querySelector('h1')?.textContent.trim(),
      styles: [...document.querySelectorAll('link[rel="stylesheet"], script[type="module"][src^="/src/styles/"]')].map((node) => new URL(node.href || node.src).pathname),
    }));
    if (!metrics.h1) throw new Error(`Baseline route did not render: ${route} at ${width}px`);
    const file = `${name}-${width}x${height}.jpg`;
    await page.screenshot({ path: join(out, file), quality: 78 });
    report.cases.push({ name, route, width, height, file, ...metrics });
    await page.close();
  }
  writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
} finally {
  await browser.close();
}
console.log(JSON.stringify({ captures: report.cases.length, sourceCommit: report.sourceCommit }));
process.exit(0);
