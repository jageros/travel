import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import topics from './data/topics.json';
import categories from './data/destination-categories.json';
import regions from './data/us-regions.json';
import locales from './data/locales.json';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string().min(10).max(120), description: z.string().min(40).max(220),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    type: z.enum(['guide', 'destination']), topic: z.string().refine((slug) => topics.some((topic) => topic.slug === slug), 'Unknown topic'),
    status: z.enum(['draft', 'review', 'published']), author: z.literal('editorial-team'),
    publishedAt: isoDate.optional(), updatedAt: isoDate, checkedAt: isoDate,
    primaryIntent: z.string().min(10), sources: z.array(z.string()).min(1),
    facts: z.array(z.string()).default([]), related: z.array(z.string()).default([]),
    region: z.string().refine((region) => regions.includes(region), 'Unknown U.S. region').optional(),
    location: z.string().trim().min(1).max(100).optional(),
    category: z.enum(Object.keys(categories) as (keyof typeof categories)[]).optional(),
    featured: z.boolean().optional(),
    hero: z.union([
      z.object({ photoId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) }).strict(),
      z.object({src: z.string().startsWith('/images/'), alt: z.string(), credit: z.string(), license: z.string()}).strict()
    ]).optional()
  }).superRefine((article, context) => {
    if (article.topic !== 'us-destinations') return;
    const required = { type: article.type === 'destination', region: article.region, location: article.location,
      category: article.category, featured: article.featured !== undefined, hero: article.hero && 'photoId' in article.hero };
    for (const [field, present] of Object.entries(required)) {
      if (!present) context.addIssue({ code: 'custom', path: [field], message: `A U.S. destination needs valid ${field} metadata` });
    }
  })
});
const localeCodes = locales.map((locale) => locale.code) as [string, ...string[]];
const translations = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/translations' }),
  schema: z.object({
    locale: z.enum(localeCodes),
    sourceSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
    author: z.literal('editorial-team').optional(),
    sourceDigest: z.string().regex(/^[a-f0-9]{64}$/),
    supplementalDigest: z.string().regex(/^[a-f0-9]{64}$/),
    status: z.enum(['draft', 'review', 'published']),
    publishedAt: isoDate.optional(),
    updatedAt: isoDate,
    title: z.string().min(4).max(140),
    description: z.string().min(20).max(300),
    photoAlt: z.string().trim().min(1).max(300).optional(),
    photoCaption: z.string().trim().min(1).max(500).optional()
  }).strict()
});
export const collections = { articles, translations };
