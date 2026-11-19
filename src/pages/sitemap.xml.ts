import { visibleArticles, articleHref, attractionHighlights, destinationArticles, destinationTopic, topics } from '../lib/content';
import { SITE_URL,isIndexable } from '../lib/site';
const escapeXml=(text:string)=>text.replace(/[<>&"']/g,char=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[char]!));
export async function GET() {
  const articles=(await visibleArticles()).filter(article=>article.data.status==='published');
  const hasDestinations = destinationArticles(articles).length > 0;
  const activeTopics = topics.filter(topic => topic.slug === destinationTopic.slug
    ? hasDestinations
    : articles.some(article => article.data.topic === topic.slug));
  const paths = isIndexable ? [
    '/', '/about/', '/editorial-policy/',
    ...(articles.length ? ['/topics/'] : []),
    ...(articles.some(article => article.data.type === 'guide') ? ['/guides/'] : []),
    ...activeTopics.map(topic => topic.href),
  ] : [];
  const urls = [
    ...paths.map(path => ({ path, lastmod: '' })),
    ...(isIndexable ? articles.map(article => ({
      path: articleHref(article),
      lastmod: attractionHighlights(article)?.checkedAt ?? article.data.updatedAt,
    })) : []),
  ];
  const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(({path,lastmod})=>`<url><loc>${escapeXml(`${SITE_URL}${path}`)}</loc>${lastmod?`<lastmod>${lastmod}</lastmod>`:''}</url>`).join('')}</urlset>`;
  return new Response(xml,{headers:{'Content-Type':'application/xml; charset=utf-8'}});
}
