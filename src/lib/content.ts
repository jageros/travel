import { getCollection, type CollectionEntry } from 'astro:content';
import { isReviewPreview } from './site';
import topicRecords from '../data/topics.json';
import categoryLabels from '../data/destination-categories.json';
import goldenGate from '../data/golden-gate-attraction.json';
import editorial from '../../automation/editorial.json';

export type Article = CollectionEntry<'articles'>;
export type DestinationCategory = keyof typeof categoryLabels;
export const destinationCategories = categoryLabels;
export const topics = [...topicRecords].sort((a, b) => b.priority - a.priority);

export function getTopic(slug: string) {
  const topic = topics.find(record => record.slug === slug);
  if (!topic) throw new Error(`Unregistered topic: ${slug}`);
  return topic;
}

export const destinationTopic = getTopic('us-destinations');
export const sanFranciscoTopic = getTopic('san-francisco-without-a-car');

export function attractionHighlights(article: Article) {
  return article.data.slug === goldenGate.slug ? goldenGate : undefined;
}

export function destinationDetails(article: Article) {
  const special = attractionHighlights(article);
  if (special) return { ...special, category: special.category as DestinationCategory };
  const { title, description, type, topic, region, location, category, featured } = article.data;
  if (type !== 'destination' || topic !== destinationTopic.slug || !region || !location || !category) return undefined;
  return { title, reason: description, region, location, category, featured };
}

export function destinationPlace(details: { location: string; region: string }) {
  return details.location === details.region ? details.location : `${details.location}, ${details.region}`;
}

export function destinationArticles(articles: Article[]) {
  return articles.flatMap(article => {
    const details = destinationDetails(article);
    return details ? [{ article, details }] : [];
  }).sort((a, b) => Number(b.details.featured) - Number(a.details.featured) ||
    a.details.title.localeCompare(b.details.title, 'en-US'));
}

const publicationTimes = new Map(editorial.publications.map(({ slug, publishedAt }) => [slug, Date.parse(publishedAt)]));

export function recentDestinations<T extends { article: Article }>(destinations: T[]) {
  const publishedTime = ({ article }: T) => publicationTimes.get(article.data.slug) ??
    (article.data.publishedAt ? Date.parse(article.data.publishedAt) : 0);
  return destinations.filter(({ article }) => article.data.status === 'published')
    .sort((a, b) => publishedTime(b) - publishedTime(a) || a.article.data.slug.localeCompare(b.article.data.slug, 'en-US'));
}

export async function visibleArticles(): Promise<Article[]> {
  return (await getCollection('articles', ({data}) => data.status === 'published' || (isReviewPreview && data.status === 'review')))
    .sort((a,b) => a.data.title.localeCompare(b.data.title));
}
export function articleHref(article: Article): string {
  return `/${article.data.type === 'destination' ? 'destinations' : 'guides'}/${article.data.slug}/`;
}
export const formatDate = (date: string) => new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`));
