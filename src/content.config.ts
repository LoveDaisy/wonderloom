import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { mediaIds } from './data/media';
import { sourceIds } from './data/content-sources';

const publicUrl = z.url().refine((value) => new URL(value).protocol === 'https:', 'Use an HTTPS public source');
const mediaId = z.enum(mediaIds);
const sourceId = z.enum(sourceIds);

const series = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/series' }),
  schema: z.object({
    title: z.string(),
    question: z.string(),
    summary: z.string(),
    topic: z.string(),
    media: mediaId,
    readingNote: z.string(),
    relatedProjects: z.array(reference('projects')).default([]),
    chapters: z.array(z.object({ label: z.string(), sourceId })).min(1),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    kind: z.enum(['本地软件', '研究代码']).default('本地软件'),
    summary: z.string(),
    media: mediaId,
    relatedSeries: z.array(reference('series')).default([]),
    links: z.array(z.object({ label: z.string(), url: publicUrl })).min(1),
  }),
});

const articles = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/articles' }),
  schema: z.object({
    sourceId,
    summary: z.string(),
  }),
});

export const collections = { series, projects, articles };
