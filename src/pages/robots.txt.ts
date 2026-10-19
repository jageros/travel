import { SITE_URL, isIndexable } from '../lib/site';
export function GET() {
  return new Response(`User-agent: *\n${isIndexable ? 'Allow: /' : 'Disallow: /'}\nSitemap: ${SITE_URL}/sitemap.xml\n`,{headers:{'Content-Type':'text/plain; charset=utf-8'}});
}
