import { getCollection, type CollectionEntry } from 'astro:content';
import { home } from '../data/home';
import { relations, readingPaths, topics, type WorkId } from '../data/content-network';
import { contentSources, sourceById, type SourceRecord } from '../data/content-sources';
import { sourceEvidence } from '../data/source-evidence';

export type WorkKind = '文章' | '系列' | '项目';
export type CatalogueWork = { id: WorkId; kind: WorkKind; title: string; summary: string; href: string; topics: string[] };

export function seriesUrl(entry: CollectionEntry<'series'>) { return `/writing/${entry.id}/`; }
export function articleUrl(entry: CollectionEntry<'articles'> | string) { return `/writing/articles/${typeof entry === 'string' ? entry : entry.id}/`; }
export function projectUrl(entry: CollectionEntry<'projects'>) { return `/projects/${entry.id}/`; }

export function requireEntry<T>(entries: Map<string, T>, id: string, context: string): T {
  const entry = entries.get(id);
  if (!entry) throw new Error(`${context}: missing content reference "${id}"`);
  return entry;
}

export function requireSource(id: string, context = 'Content') { return requireEntry(sourceById, id, context); }
export function sourceTitle(id: string, context?: string) { return requireSource(id, context).title; }
export function sourceUrl(id: string, context?: string) { return requireSource(id, context).url; }

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
    if (relation.from === relation.to) throw new Error(`Relation ${relation.from}: cannot reference itself`);
  }
}

export function relatedRelations(workId: WorkId) { return relations.filter((relation) => relation.from === workId || relation.to === workId); }

export async function getCatalogue() {
  const [series, projects, articles] = await Promise.all([getCollection('series'), getCollection('projects'), getCollection('articles')]);
  validateSources();
  const seriesById = new Map(series.map((entry) => [entry.id, entry]));
  const projectsById = new Map(projects.map((entry) => [entry.id, entry]));
  const articlesById = new Map(articles.map((entry) => [entry.id, entry]));
  for (const entry of series) {
    const labels = entry.data.chapters.map((chapter) => chapter.label);
    if (new Set(labels).size !== labels.length) throw new Error(`Duplicate chapter labels in ${entry.id}`);
    for (const chapter of entry.data.chapters) requireSource(chapter.sourceId, entry.id);
    for (const ref of entry.data.relatedProjects) requireEntry(projectsById, ref.id, entry.id);
  }
  for (const entry of projects) for (const ref of entry.data.relatedSeries) requireEntry(seriesById, ref.id, entry.id);
  for (const entry of articles) requireSource(entry.data.sourceId, entry.id);
  const works = [
    ...articles.map<CatalogueWork>((entry) => ({ id: `article:${entry.id}`, kind: '文章', title: sourceTitle(entry.data.sourceId, entry.id), summary: entry.data.summary, href: articleUrl(entry), topics: entry.data.topics })),
    ...series.map<CatalogueWork>((entry) => ({ id: `series:${entry.id}`, kind: '系列', title: entry.data.title, summary: entry.data.summary, href: seriesUrl(entry), topics: [] })),
    ...projects.map<CatalogueWork>((entry) => ({ id: `project:${entry.id}`, kind: '项目', title: entry.data.title, summary: entry.data.summary, href: projectUrl(entry), topics: [] })),
  ];
  const worksById = new Map(works.map((work) => [work.id, work]));
  validateNetwork(worksById);
  return {
    series, projects, articles, works, worksById, seriesById, projectsById, articlesById,
    specimens: home.specimens.map((item) => ({ ...item, entry: requireEntry(seriesById, item.id, 'Home specimens') })),
    featured: home.featured.map((id) => requireEntry(seriesById, id, 'Home featured')),
    reading: home.reading.map((id) => requireEntry(seriesById, id, 'Home reading')),
    featuredProjects: home.projects.map((id) => requireEntry(projectsById, id, 'Home projects')),
  };
}

export function resolveSourceChapter(chapter: { label: string; sourceId: string }, context: string): SourceRecord & { label: string } {
  return { ...requireSource(chapter.sourceId, context), label: chapter.label };
}
