import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../src/styles/', import.meta.url);
const read = (name) => readFileSync(new URL(name, root), 'utf8');
const tokens = read('tokens.css');
const layers = ['site-base.css', 'site-article.css', 'site-loom.css', 'site-loom-content.css'];
const styles = layers.map(read);
const defined = new Set([...tokens.matchAll(/(--[a-z][a-z0-9-]*)\s*:/g)].map((match) => match[1]));
const palette = {
  '--cy-paper': '#f1eee7',
  '--cy-ink': '#1a2230',
  '--cy-prussian': '#1d3a5c',
  '--cy-prussian-ink': '#234a73',
  '--cy-vermilion': '#b5412f',
};
for (const [name, value] of Object.entries(palette)) {
  assert.match(tokens, new RegExp(`^\\s*${name}:\\s*${value};`, 'mi'), `${name}: formal palette changed`);
}
for (const [name, source] of Object.entries({ '--paper': '--cy-paper', '--ink': '--cy-ink', '--muted': '--cy-muted', '--accent': '--cy-vermilion', '--link': '--cy-prussian-ink', '--line': '--cy-line', '--line-light': '--cy-line-soft', '--serif': '--cy-song', '--sans': '--cy-sans', '--mono': '--cy-mono' })) {
  assert(tokens.includes(`${name}: var(${source});`), `${name}: duplicate material authority`);
}
for (const style of styles) {
  const file = layers[styles.indexOf(style)];
  for (const match of style.matchAll(/var\((--(?:cy|type|leading|rail|content|article)-[a-z0-9-]+)\)/g)) {
    assert(defined.has(match[1]), `${file}: undefined token ${match[1]}`);
  }
  assert(!/\.theme-cyanotype\b/.test(style), `${file}: obsolete theme scope`);
}
assert(!/\.theme-cyanotype\b/.test(tokens), 'tokens: obsolete theme scope');
for (const [prefix, roles] of [
  ['type', ['section', 'entry', 'reading', 'body', 'ui', 'caption', 'note', 'brand', 'seal', 'seal-mobile']],
  ['leading', ['heading', 'body', 'reading', 'ui', 'caption', 'note']],
]) {
  for (const name of [...defined].filter((token) => token.startsWith(`--${prefix}-`))) {
    assert(roles.includes(name.slice(prefix.length + 3)), `tokens: unreviewed ${prefix} role ${name}`);
    assert(styles.some((css) => css.includes(`var(${name})`)), `tokens: unused ${prefix} role ${name}`);
  }
  for (const role of roles) assert(defined.has(`--${prefix}-${role}`), `tokens: missing ${prefix} role ${role}`);
}
for (const [index, css] of styles.entries()) {
  assert(!/font(?:-weight)?\s*:\s*(?:500|700)\b/.test(css), `${layers[index]}: undocumented font weight`);
}
assert(tokens.includes('--type-reading: 17.5px;') && tokens.includes('--leading-reading: 1.92;'), 'author reading rhythm changed');
assert(/\.article-prose\s*\{[^}]*font-size: var\(--type-reading\); line-height: var\(--leading-reading\)/.test(read('site-article.css')), 'author reading type changed');
assert(/\.loom-reading-layout\s*\{[^}]*minmax\(0, 700px\)/.test(read('site-loom-content.css')), 'reading axis exceeds 700px');
assert(!/site-home\.css|site-content\.css|cyanotype\.css/.test(read('site.css')), 'obsolete formal style entry');
console.log(`Design tokens verified across ${layers.length} formal CSS layers.`);
