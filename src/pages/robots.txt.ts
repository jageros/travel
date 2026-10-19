import { SITE_URL, isIndexable } from '../lib/site';
export function GET() {
  // Crawlers must be able to read noindex metadata on review/launch pages.
  return new Response(`User-agent: *\nAllow: /\n${isIndexable?`Sitemap: ${SITE_URL}/sitemap.xml\n`:''}`,{headers:{'Content-Type':'text/plain; charset=utf-8'}});
}
