import { readFileSync } from 'node:fs';

const root = new URL('../src/styles/', import.meta.url);
const tokens = readFileSync(new URL('tokens.css', root), 'utf8');
const defined = new Set([...tokens.matchAll(/(--[a-z][a-z0-9-]*)\s*:/g)].map((match) => match[1]));
const layers = ['site-base.css', 'site-content.css', 'site-article.css', 'site-home.css'];
const errors = [];
const sharedGeometry = {
  'site-content.css': {
    '.research-page-intro': ['grid-template-columns', 'gap', 'padding'],
    '.nb-section': ['grid-template-columns', 'gap', 'padding'],
    '.nb-opening-copy > p': ['max-width'],
    '.writing-body': ['grid-template-columns', 'gap', 'padding-bottom'],
    '.writing-group + .writing-group': ['margin-top'],
    '.writing-group-header p': ['max-width'],
    '.series-chapters': ['max-width'],
    '.chapter-list a': ['grid-template-columns'],
    '.research-article-list li': ['grid-template-columns'],
    '.nb-path-steps': ['max-width'],
  },
  'site-article.css': {
    '.article-shell': ['width', 'padding'],
    '.article-shell > header': ['margin-bottom'],
    '.article-toc': ['margin'],
    '.article-pagination': ['margin-top'],
  },
};

for (const layer of layers) {
  const css = readFileSync(new URL(layer, root), 'utf8');
  for (const [index, line] of css.split('\n').entries()) {
    const location = `${layer}:${index + 1}`;
    for (const declaration of line.matchAll(/(?:^|[;{])\s*(font-size|font)\s*:\s*([^;}]+)/g)) {
      const [, property, value] = declaration;
      const usesRole = /var\(--type-[a-z0-9-]+\)/.test(value);
      if (!usesRole && !(property === 'font' && value.trim() === 'inherit')) {
        errors.push(`${location}: type size outside tokens.css: ${property}: ${value.trim()}`);
      }
    }
    if (/--(?:type|rail|content|article)-[a-z0-9-]+\s*:/.test(line)) {
      errors.push(`${location}: semantic role defined outside tokens.css`);
    }
    for (const match of line.matchAll(/var\((--(?:type|rail|content|article)-[a-z0-9-]+)\)/g)) {
      if (!defined.has(match[1])) errors.push(`${location}: undefined role ${match[1]}`);
    }
    if (/\b190px\b|clamp\(30px,\s*7vw,\s*105px\)/.test(line)) {
      errors.push(`${location}: shared rail geometry outside tokens.css`);
    }
  }
  for (const [selector, properties] of Object.entries(sharedGeometry[layer] || {})) {
    const rule = css.split('\n').find((line) => line.trimStart().startsWith(`${selector} {`));
    if (!rule) {
      errors.push(`${layer}: missing shared geometry rule ${selector}`);
      continue;
    }
    for (const property of properties) {
      const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const value = rule.match(new RegExp(`(?:^|[;{])\\s*${escaped}\\s*:\\s*([^;]+)`))?.[1];
      if (!value?.includes('var(--')) errors.push(`${layer}: ${selector} ${property} must use a semantic token`);
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Design tokens verified across ${layers.length} formal CSS layers.`);
}
