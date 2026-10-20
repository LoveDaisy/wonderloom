import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { visit } from 'unist-util-visit';

const outlineHeading = '附：成稿前提纲存档';

function plainText(node) {
  if (node.type === 'text' || node.type === 'inlineCode') return node.value;
  return (node.children ?? []).map(plainText).join('');
}

export function stripPublicationScaffolding(markdown) {
  const tree = unified().use(remarkParse).parse(markdown);
  const children = tree.children;
  const firstHeading = children.findIndex((node) => node.type === 'heading' && node.depth === 1);
  if (firstHeading >= 0) children.splice(firstHeading, 1);
  const tags = children.findIndex((node) => node.type === 'paragraph' && /^tags:\s*/.test(plainText(node)));
  if (tags >= 0 && tags < 3) children.splice(tags, 1);
  const archive = children.findIndex((node) => node.type === 'heading' && plainText(node).trim() === outlineHeading);
  if (archive >= 0) children.splice(archive);
  visit(tree, 'html', (node, index, parent) => {
    if (index !== undefined && parent && /^<!--[\s\S]*?-->$/.test(node.value.trim())) parent.children.splice(index, 1);
  });
  return unified().use(remarkStringify).stringify(tree).trim() + '\n';
}

export function rewriteLinks(markdown, resolveWiki, resolveExternal) {
  let fenced = false;
  const linked = markdown.split('\n').map((line) => {
    if (/^\s*```/.test(line)) { fenced = !fenced; return line; }
    if (fenced) return line;
    return line.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_all, target, alias) => {
      const resolved = resolveWiki(target.trim());
      return resolved ? `[${alias ?? target}](${resolved})` : (alias ?? target);
    });
  }).join('\n');
  const tree = unified().use(remarkParse).parse(linked);
  visit(tree, 'link', (node) => {
    const replacement = resolveExternal(node.url);
    if (replacement) node.url = replacement;
  });
  return unified().use(remarkStringify).stringify(tree).trim() + '\n';
}
