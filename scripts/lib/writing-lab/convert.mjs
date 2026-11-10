import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';

// Parse for source ranges only. Never stringify the author's Markdown.
export const parseMarkdown = (text) => unified().use(remarkParse).use(remarkMath).use(remarkGfm).parse(text);
export function applyEdits(text, edits) {
  let boundary = text.length;
  for (const { start, end, value = '' } of edits.sort((a, b) => b.start - a.start)) {
    if (end > boundary || start > end) throw new Error('Overlapping manuscript edits');
    text = text.slice(0, start) + value + text.slice(end);
    boundary = start;
  }
  return text;
}
const plain = (node) => node.value ?? (node.children ?? []).map(plain).join('');
const range = (node, value = '') => ({ start: node.position.start.offset, end: node.position.end.offset, value });
export function stripPublicationScaffolding(markdown) {
  const tree = parseMarkdown(markdown), edits = [];
  const archive = tree.children.find((n) => n.type === 'heading' && n.depth === 2 && plain(n).trim() === '附：成稿前提纲存档');
  const limit = archive?.position.start.offset ?? markdown.length;
  if (archive) edits.push({ start: limit, end: markdown.length });
  const title = tree.children.find((n) => n.type === 'heading' && n.depth === 1);
  if (title && title.position.start.offset < limit) edits.push(range(title));
  for (const node of tree.children.slice(0, 3)) if (node.type === 'paragraph' && /^tags:\s*/.test(plain(node)) && node.position.start.offset < limit) edits.push(range(node));
  visit(tree, 'html', (node) => {
    if (node.position.start.offset < limit && /^<!--[^]*-->$/.test(node.value.trim())) edits.push(range(node));
  });
  return applyEdits(markdown, edits).trim() + '\n';
}
export function rewriteLinks(markdown, resolveWiki, resolveExternal) {
  const tree = parseMarkdown(markdown), edits = [];
  visit(tree, (node, _index, parent) => {
    if (node.type === 'link' || node.type === 'definition') {
      const replacement = resolveExternal(node.url);
      if (replacement) {
        const raw = markdown.slice(node.position.start.offset, node.position.end.offset);
        // Replace only the destination, keeping label, title and formatting bytes.
        const start = node.type === 'definition' ? raw.indexOf(':') + 1 : raw.lastIndexOf('](') + 2;
        const position = raw.indexOf(node.url, start);
        if (position < 0) throw new Error(`Cannot locate link destination: ${node.url}`);
        edits.push({ start: node.position.start.offset + position, end: node.position.start.offset + position + node.url.length, value: replacement });
      }
    }
    if (node.type !== 'text' || ['link', 'image', 'linkReference'].includes(parent?.type)) return;
    const raw = markdown.slice(node.position.start.offset, node.position.end.offset);
    for (const match of raw.matchAll(/(!?)\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g)) {
      if (match.index && raw[match.index - 1] === '\\') continue;
      const [full, embed, target, alias] = match;
      if (embed) throw new Error(`Unsupported wiki image; use Markdown image syntax: ${target}`);
      const resolved = resolveWiki(target.trim());
      const label = alias ?? target;
      edits.push({ start: node.position.start.offset + match.index, end: node.position.start.offset + match.index + full.length, value: resolved ? `[${label}](${resolved})` : label });
    }
  });
  return applyEdits(markdown, edits);
}
export const escapeHtml = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
// remark-math only recognizes flow-math `$$` fences standing alone on their
// line. Manuscripts in the Obsidian/Zhihu convention share the line with the
// formula (`$$x$$`, or a fence line ending in `.$$`), which makes the parser
// drop the opening line as fence meta and swallow the following prose into one
// math node. Stand every top-level `$$`-delimited block on its own display
// fences; TeX bytes stay untouched. An unpaired `$$` on a line is a flow fence
// sharing its line with the formula; a balanced pair stays inline math unless
// the whole line is `$$formula$$`, which reads as display. Indented code (4+
// spaces), blockquotes and fenced code are never rewritten. Idempotent on
// already-canonical input.
export function normalizeMathFences(markdown) {
  let codeFence = null;
  return markdown.split('\n').map((line) => {
    if (codeFence !== null) {
      if (new RegExp(`^ {0,3}${codeFence[0]}{${codeFence.length},}\\s*$`).test(line)) codeFence = null;
      return line;
    }
    if (/^ {4,}/.test(line)) return line;
    const opener = line.match(/^ {0,3}(`{3,}|~{3,})/);
    if (opener) { codeFence = opener[1]; return line; }
    if (/^ {0,3}>/.test(line)) return line;
    const indent = line.match(/^ */)[0];
    const body = line.trim();
    if (body === '$$' || !body.includes('$$')) return line;
    const fenceCount = (body.match(/\$\$/g) ?? []).length;
    if (fenceCount === 1 && body.startsWith('$$')) return `${indent}$$\n${body.slice(2)}`;
    if (fenceCount === 1 && body.endsWith('$$')) return `${indent}${body.slice(0, -2)}\n${indent}$$`;
    if (fenceCount === 2 && body.startsWith('$$') && body.endsWith('$$')) return `${indent}$$\n${body.slice(2, -2)}\n${indent}$$`;
    return line;
  }).join('\n');
}
