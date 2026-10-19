import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string().min(10).max(120), description: z.string().min(40).max(220),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    type: z.enum(['guide', 'destination']), topic: z.literal('san-francisco-without-a-car'),
    status: z.enum(['draft', 'review', 'published']), author: z.literal('editorial-team'),
    publishedAt: isoDate.optional(), updatedAt: isoDate, checkedAt: isoDate,
    primaryIntent: z.string().min(10), sources: z.array(z.string()).min(1),
    facts: z.array(z.string()).default([]), related: z.array(z.string()).default([]),
    hero: z.object({src: z.string().startsWith('/images/'), alt: z.string(), credit: z.string(), license: z.string()}).optional()
  })
});
export const collections = { articles };
