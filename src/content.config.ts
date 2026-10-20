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
    chapters: z.array(z.object({ label: z.string(), sourceId })).default([]),
    authorFeed: z.boolean().default(false),
  }).superRefine((value, context) => {
    if (value.authorFeed === (value.chapters.length > 0)) context.addIssue({ code: 'custom', message: 'Series must use exactly one chapter source' });
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

const authorArticles = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/generated/writing-lab/articles' }),
  schema: z.object({
    id: z.string(), chapter: z.string().regex(/^\d+(?:\.\d+)?$/), title: z.string(), sourceId: z.string(), sourcePath: z.string(),
    sourceUrl: publicUrl, sourceSha: z.string().regex(/^[0-9a-f]{40}$/), summary: z.string(),
    resources: z.array(z.object({ original: z.string(), display: z.string(), sha256: z.string().length(64), width: z.number().int().positive(), height: z.number().int().positive(), type: z.string() })),
  }),
});

export const collections = { series, projects, articles, authorArticles };
