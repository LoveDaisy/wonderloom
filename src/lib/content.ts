import { getCollection, type CollectionEntry } from 'astro:content';
import { home } from '../data/home';

export function seriesUrl(entry: CollectionEntry<'series'>) {
  return `/writing/${entry.id}/`;
}

export function projectUrl(entry: CollectionEntry<'projects'>) {
  return `/projects/${entry.id}/`;
}

export function requireEntry<T>(entries: Map<string, T>, id: string, context: string): T {
  const entry = entries.get(id);
  if (!entry) throw new Error(`${context}: missing content reference "${id}"`);
  return entry;
}

export async function getCatalogue() {
  const [series, projects] = await Promise.all([getCollection('series'), getCollection('projects')]);
  const seriesById = new Map(series.map((entry) => [entry.id, entry]));
  const projectsById = new Map(projects.map((entry) => [entry.id, entry]));

  for (const entry of series) {
    const labels = entry.data.chapters.map((chapter) => chapter.label);
    if (new Set(labels).size !== labels.length) throw new Error(`Duplicate chapter labels in ${entry.id}`);
    for (const ref of entry.data.relatedProjects) requireEntry(projectsById, ref.id, entry.id);
  }
  for (const entry of projects) {
    for (const ref of entry.data.relatedSeries) requireEntry(seriesById, ref.id, entry.id);
  }

  return {
    series,
    projects,
    seriesById,
    projectsById,
    specimens: home.specimens.map((item) => ({ ...item, entry: requireEntry(seriesById, item.id, 'Home specimens') })),
    featured: home.featured.map((id) => requireEntry(seriesById, id, 'Home featured')),
    reading: home.reading.map((id) => requireEntry(seriesById, id, 'Home reading')),
    featuredProjects: home.projects.map((id) => requireEntry(projectsById, id, 'Home projects')),
  };
}
