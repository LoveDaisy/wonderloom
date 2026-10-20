// Stable public identities for author manuscripts.  The chapter number is the
// durable key; a manuscript title or its directory name is deliberately not.
export const compatibilityRoutes = new Map([
  ['0', 'halo-introduction'],
  ['6', 'halo-direct-integration'],
]);

export function chapterToRouteId(chapter) {
  if (!/^\d+(?:\.\d+)?$/.test(chapter)) throw new Error(`Invalid halo chapter "${chapter}"`);
  return compatibilityRoutes.get(chapter) ?? `halo-${chapter.replace('.', '-')}`;
}

export function chapterToSourceId(chapter) {
  return `halo-${chapter.replace('.', '-')}`;
}

export function compareChapters(left, right) {
  const a = left.split('.').map(Number);
  const b = right.split('.').map(Number);
  return (a[0] - b[0]) || ((a[1] ?? -1) - (b[1] ?? -1));
}

export const seriesAliases = new Map([
  ['Halo Notes', '/writing/ice-halos/'],
  ['现代冰晕研究漫谈', '/writing/ice-halos/'],
]);
