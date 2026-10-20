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
