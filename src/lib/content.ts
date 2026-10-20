import { getCollection, type CollectionEntry } from 'astro:content';
import { home } from '../data/home';
import { relations, readingPaths, topics, type WorkId } from '../data/content-network';
import { contentSources, sourceById, type SourceRecord } from '../data/content-sources';
import { sourceEvidence } from '../data/source-evidence';
import { compareChapters, chapterToSourceId } from '../data/article-identities.js';

export type WorkKind = '文章' | '系列' | '项目';
export type CatalogueWork = { id: WorkId; kind: WorkKind; title: string; summary: string; href: string; topics: string[] };

export function seriesUrl(entry: CollectionEntry<'series'>) { return `/writing/${entry.id}/`; }
export function articleUrl(entry: CollectionEntry<'articles'> | CollectionEntry<'authorArticles'> | string) { return `/writing/articles/${typeof entry === 'string' ? entry : entry.id}/`; }
export function projectUrl(entry: CollectionEntry<'projects'>) { return `/projects/${entry.id}/`; }

export const topicUrl = (id: string) => `/explore/topics/${id}/`;
export const readingPathUrl = (id: string) => `/explore/paths/${id}/`;
export const workTopics = (id: WorkId) => topics.filter(topic => topic.workIds.includes(id));
export const workPaths = (id: WorkId) => readingPaths.filter(path => path.steps.includes(id));

export function requireEntry<T>(entries: Map<string, T>, id: string, context: string): T {
  const entry = entries.get(id);
  if (!entry) throw new Error(`${context}: missing content reference "${id}"`);
  return entry;
}

export function requireSource(id: string, context = 'Content') { return requireEntry(sourceById, id, context); }
export function sourceTitle(id: string, context?: string) { return requireSource(id, context).title; }
export function sourceUrl(id: string, context?: string) { return requireSource(id, context).url; }

export function chapterLabel(chapter: string) {
  return chapter === '8.1' ? '第 8.1 篇 · 番外' : `第 ${chapter} 篇`;
}

export function authorArticleDescription(entry: CollectionEntry<'authorArticles'>) {
  const title = entry.data.title.replace(/^现代冰晕研究漫谈\([^)]*\):\s*/, '');
  return `《现代冰晕研究漫谈》${chapterLabel(entry.data.chapter)}：${title}。阅读全文。`;
}

function validateSources() {
  if (new Set(contentSources.map((source) => source.id)).size !== contentSources.length) throw new Error('Content sources: duplicate source ID');
  const evidenceById = new Map(sourceEvidence.map((evidence) => [evidence.sourceId, evidence]));
  if (evidenceById.size !== sourceEvidence.length || evidenceById.size !== contentSources.length) throw new Error('Content sources: evidence must cover every source exactly once');
  for (const source of contentSources) {
    const evidence = requireEntry(evidenceById, source.id, 'Content sources evidence');
    if (evidence.title !== source.title || evidence.url !== source.url) throw new Error(`Content sources: evidence mismatch for "${source.id}"`);
  }
}

function validateNetwork(worksById: Map<WorkId, CatalogueWork>) {
  const validateWorkIds = (ids: WorkId[], context: string) => {
    if (ids.length === 0) throw new Error(`${context}: empty work list`);
    if (new Set(ids).size !== ids.length) throw new Error(`${context}: duplicate work reference`);
    for (const id of ids) requireEntry(worksById, id, context);
  };
  if (new Set(topics.map((topic) => topic.id)).size !== topics.length) throw new Error('Topics: duplicate ID');
  for (const topic of topics) validateWorkIds(topic.workIds, `Topic ${topic.id}`);
  if (new Set(readingPaths.map((path) => path.id)).size !== readingPaths.length) throw new Error('Reading paths: duplicate ID');
  for (const path of readingPaths) validateWorkIds(path.steps, `Reading path ${path.id}`);
  for (const relation of relations) {
    requireEntry(worksById, relation.from, 'Relation source');
    requireEntry(worksById, relation.to, 'Relation target');
    if (!relation.explanation.trim()) throw new Error('Relation: missing explanation');
    if (relation.from === relation.to) throw new Error(`Relation ${relation.from}: cannot reference itself`);
  }
}

export function relatedRelations(workId: WorkId) { return relations.filter((relation) => relation.from === workId || relation.to === workId); }

export async function getCatalogue() {
  const [series, projects, articles, authorArticles] = await Promise.all([getCollection('series'), getCollection('projects'), getCollection('articles'), getCollection('authorArticles')]);
  validateSources();
  const seriesById = new Map(series.map((entry) => [entry.id, entry]));
  const projectsById = new Map(projects.map((entry) => [entry.id, entry]));
  const articlesById = new Map(articles.map((entry) => [entry.id, entry]));
  const authorArticlesById = new Map(authorArticles.map((entry) => [entry.id, entry]));
  for (const entry of series) {
    const labels = entry.data.chapters.map((chapter) => chapter.label);
    if (new Set(labels).size !== labels.length) throw new Error(`Duplicate chapter labels in ${entry.id}`);
    if (entry.data.authorFeed) {
      if (entry.id !== 'ice-halos') throw new Error(`Series ${entry.id}: unknown author feed`);
      if (!authorArticles.length) throw new Error('Ice halos: author feed is empty');
    } else for (const chapter of entry.data.chapters) requireSource(chapter.sourceId, entry.id);
    for (const ref of entry.data.relatedProjects) requireEntry(projectsById, ref.id, entry.id);
  }
  for (const entry of projects) for (const ref of entry.data.relatedSeries) requireEntry(seriesById, ref.id, entry.id);
  if (new Set(articles.map(entry => entry.data.sourceId)).size !== articles.length) throw new Error('Articles: duplicate source ID');
  for (const entry of articles) requireSource(entry.data.sourceId, entry.id);
  const authorByRoute = new Map(authorArticles.map((entry) => [entry.id, entry]));
  for (const author of authorArticles) {
    if (author.data.historicalUrl && author.data.historicalSourceId !== chapterToSourceId(author.data.chapter)) throw new Error(`Author article ${author.id}: historical identity mismatch`);
    if (author.data.historicalSourceId && requireSource(author.data.historicalSourceId, author.id).url !== author.data.historicalUrl) throw new Error(`Author article ${author.id}: historical source mismatch`);
  }
  const works = [
    ...articles.filter((entry) => !authorByRoute.has(entry.id)).map<CatalogueWork>((entry) => ({ id: `article:${entry.id}` as WorkId, kind: '文章', title: sourceTitle(entry.data.sourceId, entry.id), summary: entry.data.summary, href: articleUrl(entry), topics: workTopics(`article:${entry.id}` as WorkId).map(topic => topic.id) })),
    ...authorArticles.map<CatalogueWork>((entry) => ({ id: `article:${entry.id}` as WorkId, kind: '文章', title: entry.data.title, summary: articles.find((guide) => guide.id === entry.id)?.data.summary ?? authorArticleDescription(entry), href: articleUrl(entry), topics: workTopics(`article:${entry.id}` as WorkId).map(topic => topic.id) })),
    ...series.map<CatalogueWork>((entry) => ({ id: `series:${entry.id}`, kind: '系列', title: entry.data.title, summary: entry.data.summary, href: seriesUrl(entry), topics: workTopics(`series:${entry.id}`).map(topic => topic.id) })),
    ...projects.map<CatalogueWork>((entry) => ({ id: `project:${entry.id}`, kind: '项目', title: entry.data.title, summary: entry.data.summary, href: projectUrl(entry), topics: workTopics(`project:${entry.id}`).map(topic => topic.id) })),
  ];
  const worksById = new Map(works.map((work) => [work.id, work]));
  validateNetwork(worksById);
  return {
    series, projects, articles, authorArticles, works, worksById, seriesById, projectsById, articlesById, authorArticlesById,
    specimens: home.specimens.map((item) => ({ ...item, entry: requireEntry(seriesById, item.id, 'Home specimens') })),
    featured: home.featured.map((id) => requireEntry(seriesById, id, 'Home featured')),
    reading: home.reading.map((id) => requireEntry(seriesById, id, 'Home reading')),
    homePaths: home.paths.map(id => requireEntry(new Map(readingPaths.map(path => [path.id, path])), id, 'Home paths')),
    featuredProjects: home.projects.map((id) => requireEntry(projectsById, id, 'Home projects')),
  };
}

export function seriesChapters(entry: CollectionEntry<'series'>, authorArticles: CollectionEntry<'authorArticles'>[], articles: CollectionEntry<'articles'>[]) {
  if (entry.data.authorFeed) {
    return authorArticles.slice().sort((left, right) => compareChapters(left.data.chapter, right.data.chapter)).map((author) => ({
      label: author.data.chapter, chapterLabel: chapterLabel(author.data.chapter),
      title: author.data.title, href: articleUrl(author), internal: true,
    }));
  }
  return entry.data.chapters.map((chapter) => ({ ...resolveSourceChapter(chapter, entry.id, articles), chapterLabel: chapterLabel(chapter.label) }));
}

export function resolveSourceChapter(chapter: { label: string; sourceId: string }, context: string, articles: CollectionEntry<'articles'>[]): SourceRecord & { label: string; href: string; internal: boolean } {
  const source = requireSource(chapter.sourceId, context);
  const guide = articles.find(entry => entry.data.sourceId === chapter.sourceId);
  return { ...source, label: chapter.label, href: guide ? articleUrl(guide) : source.url, internal: !!guide };
}
