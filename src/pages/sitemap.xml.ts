import { getCollection } from 'astro:content';
import { visibleArticles, articleHref, attractionHighlights, destinationArticles, destinationTopic, topics } from '../lib/content';
import { SITE_URL, isIndexable } from '../lib/site';
import { defaultLocale, localePath, locales, sourceArticleDigest, sourceSupplementalDigest } from '../lib/i18n.mjs';

const escapeXml = (text: string) => text.replace(/[<>&"']/g, char => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[char]!));
const localizedPublicPaths = ['/', '/destinations/', '/guides/', '/topics/', '/topics/san-francisco-without-a-car/', '/about/', '/editorial-policy/', '/photo-credits/', '/contact/', '/advertising/', '/privacy/'];

export async function GET() {
  const articles = (await visibleArticles()).filter(article => article.data.status === 'published');
  const translations = isIndexable ? await getCollection('translations', ({ data }) => data.status === 'published') : [];
  const hasDestinations = destinationArticles(articles).length > 0;
  const activeTopics = topics.filter(topic => topic.slug === destinationTopic.slug ? hasDestinations : articles.some(article => article.data.topic === topic.slug));
  const paths = isIndexable ? ['/', '/about/', '/editorial-policy/', ...(articles.length ? ['/topics/'] : []), ...(articles.some(article => article.data.type === 'guide') ? ['/guides/'] : []), ...activeTopics.map(topic => topic.href)] : [];
  const urls: Array<{ path: string; lastmod: string }> = [
    ...paths.map(path => ({ path, lastmod: '' })),
    ...(isIndexable ? articles.map(article => ({ path: articleHref(article), lastmod: attractionHighlights(article)?.checkedAt ?? article.data.updatedAt })) : []),
  ];
  const groups = new Map<string, Array<{ hreflang: string; href: string }>>();
  const addGroup = (key: string, path: string, locale: typeof defaultLocale) => {
    const list = groups.get(key) ?? [];
    const href = localePath(locale.code, path);
    if (!list.some(item => item.hreflang === locale.hreflang && item.href === href)) list.push({ hreflang: locale.hreflang, href });
    groups.set(key, list);
  };
  if (isIndexable) {
    for (const locale of locales) {
      for (const path of localizedPublicPaths) {
        const localizedPath = localePath(locale.code, path);
        if (!urls.some(item => item.path === localizedPath)) urls.push({ path: localizedPath, lastmod: '' });
        addGroup(`public:${path}`, path, locale);
      }
    }
    const sourceBySlug = new Map(articles.map(article => [article.data.slug, article]));
    for (const translation of translations) {
      const source = sourceBySlug.get(translation.data.sourceSlug);
      const locale = locales.find(item => item.code === translation.data.locale);
      if (!source || !locale || translation.data.sourceDigest !== sourceArticleDigest(source) || translation.data.supplementalDigest !== sourceSupplementalDigest(source)) continue;
      const path = articleHref(source);
      urls.push({ path: localePath(locale.code, path), lastmod: translation.data.updatedAt });
      addGroup(`article:${source.data.slug}`, path, defaultLocale);
      addGroup(`article:${source.data.slug}`, path, locale);
    }
    for (const article of articles) addGroup(`article:${article.data.slug}`, articleHref(article), defaultLocale);
  }
  const alternatesFor = (path: string) => [...groups.values()].find(list => list.some(item => item.href === path)) ?? [];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls.map(({ path, lastmod }) => {
    const alternates = alternatesFor(path);
    const english = alternates.find(item => item.hreflang === defaultLocale.hreflang);
    const alternateLinks = [...alternates, ...(english ? [{ ...english, hreflang: 'x-default' }] : [])].map(item => `<xhtml:link rel="alternate" hreflang="${escapeXml(item.hreflang)}" href="${escapeXml(`${SITE_URL}${item.href}`)}"/>`).join('');
    return `<url><loc>${escapeXml(`${SITE_URL}${path}`)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}${alternateLinks}</url>`;
  }).join('')}</urlset>`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
