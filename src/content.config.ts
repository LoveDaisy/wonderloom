import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { mediaIds } from './data/media';

const publicUrl = z.url().refine((value) => new URL(value).protocol === 'https:', 'Use an HTTPS public source');
const mediaId = z.enum(mediaIds);

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
    chapters: z.array(z.object({
      label: z.string(),
      title: z.string(),
      url: publicUrl,
    })).min(1),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    summary: z.string(),
    media: mediaId,
    relatedSeries: z.array(reference('series')).default([]),
    links: z.array(z.object({ label: z.string(), url: publicUrl })).min(1),
  }),
});

export const collections = { series, projects };
