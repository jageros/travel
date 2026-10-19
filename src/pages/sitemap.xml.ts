import { visibleArticles,articleHref,topic } from '../lib/content';
import { SITE_URL,isIndexable } from '../lib/site';
const escapeXml=(text:string)=>text.replace(/[<>&"']/g,char=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[char]!));
export async function GET() {
  const articles=(await visibleArticles()).filter(article=>article.data.status==='published');
  const paths=isIndexable?['/','/about/','/editorial-policy/',...(articles.length?['/topics/','/guides/',`/topics/${topic.slug}/`]:[])]:[];
  const urls=[...paths.map(path=>({path,lastmod:''})),...(isIndexable?articles.map(article=>({path:articleHref(article),lastmod:article.data.updatedAt})):[])];
  const xml=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(({path,lastmod})=>`<url><loc>${escapeXml(`${SITE_URL}${path}`)}</loc>${lastmod?`<lastmod>${lastmod}</lastmod>`:''}</url>`).join('')}</urlset>`;
  return new Response(xml,{headers:{'Content-Type':'application/xml; charset=utf-8'}});
}
