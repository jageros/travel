import { getCollection, type CollectionEntry } from 'astro:content';
import { isReviewPreview } from './site';
export type Article = CollectionEntry<'articles'>;
export const topic = {
  slug: 'san-francisco-without-a-car',
  title: 'San Francisco without a car',
  description: 'Make sense of airport connections, transit tickets and the last leg to the places you want to visit.',
  region: 'California'
};
export async function visibleArticles(): Promise<Article[]> {
  return (await getCollection('articles', ({data}) => data.status === 'published' || (isReviewPreview && data.status === 'review')))
    .sort((a,b) => a.data.title.localeCompare(b.data.title));
}
export function articleHref(article: Article): string {
  return `/${article.data.type === 'destination' ? 'destinations' : 'guides'}/${article.data.slug}/`;
}
export const formatDate = (date: string) => new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
