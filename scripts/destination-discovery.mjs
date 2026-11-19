import { parse } from 'parse5';
import { assertOfficialUrl, isSlug, normalizedIntent } from './content-lib.mjs';
import { CANONICAL_SITE_URL } from '../src/lib/site-config.mjs';

const npsOrigin = 'https://www.nps.gov';
const stateCodes = {
  Alabama: 'al', Alaska: 'ak', Arizona: 'az', Arkansas: 'ar', California: 'ca',
  Colorado: 'co', Connecticut: 'ct', Delaware: 'de', Florida: 'fl', Georgia: 'ga',
  Hawaii: 'hi', Idaho: 'id', Illinois: 'il', Indiana: 'in', Iowa: 'ia',
  Kansas: 'ks', Kentucky: 'ky', Louisiana: 'la', Maine: 'me', Maryland: 'md',
  Massachusetts: 'ma', Michigan: 'mi', Minnesota: 'mn', Mississippi: 'ms', Missouri: 'mo',
  Montana: 'mt', Nebraska: 'ne', Nevada: 'nv', 'New Hampshire': 'nh', 'New Jersey': 'nj',
  'New Mexico': 'nm', 'New York': 'ny', 'North Carolina': 'nc', 'North Dakota': 'nd', Ohio: 'oh',
  Oklahoma: 'ok', Oregon: 'or', Pennsylvania: 'pa', 'Rhode Island': 'ri', 'South Carolina': 'sc',
  'South Dakota': 'sd', Tennessee: 'tn', Texas: 'tx', Utah: 'ut', Vermont: 'vt',
  Virginia: 'va', Washington: 'wa', 'West Virginia': 'wv', Wisconsin: 'wi', Wyoming: 'wy',
};
const target = 6;
const parkCodePattern = /^[a-z0-9]{4}$/;

export function destinationRefillStatus(topics, articles, publications = [], { canUse = () => true } = {}) {
  const reviewed = new Map(articles.filter(({ data }) => data.topic === 'us-destinations' &&
    data.type === 'destination' && data.status === 'review').map(article => [article.data.slug, article]));
  const published = new Set(publications.map(({ slug }) => slug));
  const ready = new Set();
  for (const topic of topics) {
    const article = reviewed.get(topic.slug);
    if (topic.topic === 'us-destinations' && topic.type === 'destination' && topic.status === 'ready' &&
        !published.has(topic.slug) && article && canUse(topic, article)) ready.add(topic.slug);
  }
  return { ready: ready.size, target, needed: Math.max(0, target - ready.size) };
}

function attr(node, name) {
  return node?.attrs?.find(item => item.name === name)?.value;
}

function hasClass(node, value) {
  return attr(node, 'class')?.split(/\s+/).includes(value);
}

function descendants(node, predicate) {
  if (!node) return [];
  return [
    ...(predicate(node) ? [node] : []),
    ...(node.childNodes ?? []).flatMap(child => descendants(child, predicate)),
  ];
}

function text(node) {
  return descendants(node, child => child.nodeName === '#text')
    .map(child => child.value).join('').replace(/\s+/g, ' ').trim();
}

function parkUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value, npsOrigin);
    // Older NPS links in the state index still spell out http://www.nps.gov.
    if (url.origin === 'http://www.nps.gov') url.protocol = 'https:';
    if (url.origin !== npsOrigin || url.username || url.password || url.search || url.hash) return null;
    return url;
  } catch {
    return null;
  }
}

function parkCategory(designation) {
  if (/^National Park(?: & Preserve)?$/i.test(designation)) return 'national-parks';
  if (/Historic|Memorial|Battlefield|Military/i.test(designation)) return 'history-culture';
  return 'landmarks';
}

function parseStateIndex(html, region, stateIndexUrl) {
  const stateCode = stateCodes[region].toUpperCase();
  const list = descendants(parse(html), node => node.tagName === 'ul' && attr(node, 'id') === 'list_parks')[0];
  if (!list) throw new Error('NPS state index has no park list');
  const candidates = [];
  for (const card of list.childNodes ?? []) {
    const parkCode = attr(card, 'id')?.match(/^asset_([a-z0-9]{4})$/)?.[1];
    if (card.tagName !== 'li' || !parkCode) continue;
    const description = descendants(card, node => hasClass(node, 'list_left'))[0];
    const heading = descendants(description, node => node.tagName === 'h3')[0];
    const link = descendants(heading, node => node.tagName === 'a')[0];
    const url = parkUrl(attr(link, 'href'));
    if (!url || ![`/${parkCode}/`, `/${parkCode}/index.htm`].includes(url.pathname)) continue;

    const subtitle = text(descendants(description, node => hasClass(node, 'list_left__subtitle'))[0]);
    const regionSuffix = subtitle.match(/(?:^|,\s*)([A-Z]{2}(?:\s*,\s*[A-Z]{2})*)$/);
    // A multi-state unit needs verified area-level metadata before it can be assigned to one state.
    if (regionSuffix?.[1] !== stateCode) continue;
    const locality = subtitle.slice(0, regionSuffix.index).trim();
    const stateSuffix = `, ${region}`;
    const place = locality.endsWith(stateSuffix) ? locality.slice(0, -stateSuffix.length).trim() : locality;
    const location = place && place.length <= 100 ? place : region;
    const designation = text(descendants(description, node => hasClass(node, 'list_left__kicker'))[0]);
    const name = text(link);
    const title = designation && !name.toLowerCase().endsWith(designation.toLowerCase()) ? `${name} ${designation}` : name;
    const slug = normalizedIntent(title.normalize('NFKD').replace(/\p{Mark}|['’]/gu, '')).replaceAll(' ', '-');
    const summary = text(descendants(description, node => node.tagName === 'p' &&
      !hasClass(node, 'list_left__subtitle') && !hasClass(node, 'list_left__kicker'))[0]).slice(0, 1200);
    if (!isSlug(slug) || !name || !summary) continue;

    const officialUrl = new URL(`/${parkCode}/index.htm`, npsOrigin).href;
    const links = new Set(descendants(card, node => node.tagName === 'a').map(node => parkUrl(attr(node, 'href'))?.href));
    const planningUrls = ['basicinfo', 'conditions', 'maps']
      .map(page => `${npsOrigin}/${parkCode}/planyourvisit/${page}.htm`).filter(link => links.has(link));
    const sourceUrls = [officialUrl, ...planningUrls];
    candidates.push({
      slug, title, designation, category: parkCategory(designation), region, location, parkCode,
      officialUrl, stateIndexUrl, sourceUrls, summary,
    });
  }
  return candidates.sort((a, b) => Number(b.category === 'national-parks') - Number(a.category === 'national-parks'));
}

async function stateIndex(region, sourceRegistry, fetcher) {
  if (!Object.hasOwn(stateCodes, region)) throw new Error('Unknown U.S. state');
  const url = `${npsOrigin}/state/${stateCodes[region]}/index.htm`;
  assertOfficialUrl(url, sourceRegistry.allowedHosts);
  const response = await fetcher(url, {
    redirect: 'error', signal: AbortSignal.timeout(20000),
    headers: { Accept: 'text/html', 'User-Agent': `CedarTripsSourceMonitor/1.0 (+${CANONICAL_SITE_URL}/editorial-policy/)` },
  });
  if (!response.ok) throw new Error(`NPS state index returned HTTP ${response.status}`);
  if (!/^text\/html(?:;|$)/i.test(response.headers.get('content-type') ?? '') || !response.body) {
    throw new Error('NPS state index did not return HTML');
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of response.body) {
    size += chunk.byteLength;
    if (size > 2_000_000) throw new Error('NPS state index exceeds 2 MB');
    chunks.push(chunk);
  }
  return parseStateIndex(Buffer.concat(chunks).toString('utf8'), region, url);
}

export async function lookupDiscoveredDestination({ region, parkCode, sourceRegistry, fetcher = fetch }) {
  if (typeof parkCode !== 'string' || !parkCodePattern.test(parkCode)) throw new Error('Invalid NPS park code');
  return (await stateIndex(region, sourceRegistry, fetcher)).find(candidate => candidate.parkCode === parkCode) ?? null;
}

export async function discoverDestinations({ topics, articles, publications = [], sourceRegistry, fetcher = fetch, limit = 12 }) {
  if (!Number.isSafeInteger(limit) || limit < 1) throw new Error('Discovery limit must be a positive integer');
  assertOfficialUrl(npsOrigin, sourceRegistry.allowedHosts);
  const covered = new Map();
  const existing = new Set(publications.map(({ slug }) => slug));
  for (const entry of [...topics, ...articles.map(({ data }) => data)]) {
    existing.add(entry.slug);
    if (entry.region) covered.set(entry.slug, entry.region);
  }
  const counts = new Map();
  for (const region of covered.values()) counts.set(region, (counts.get(region) ?? 0) + 1);
  const codes = new Set(sourceRegistry.sources.map(({ url }) => parkUrl(url)?.pathname.match(/^\/([a-z0-9]{4})(?:\/|$)/)?.[1]).filter(Boolean));
  const regions = Object.keys(stateCodes).sort((a, b) => (counts.get(a) ?? 0) - (counts.get(b) ?? 0) || a.localeCompare(b, 'en-US'));
  const candidates = [];
  const followups = [];
  const unavailable = [];
  for (let start = 0; start < regions.length && candidates.length < limit; start += 4) {
    const batch = regions.slice(start, start + 4);
    const indexes = await Promise.allSettled(batch.map(region => stateIndex(region, sourceRegistry, fetcher)));
    for (const [index, result] of indexes.entries()) {
      if (result.status === 'rejected') {
        unavailable.push({ region: batch[index], reason: result.reason.message });
        continue;
      }
      const [first, ...other] = result.value.filter(item => !existing.has(item.slug) && !codes.has(item.parkCode));
      if (!first || candidates.length === limit) continue;
      candidates.push(first);
      existing.add(first.slug);
      codes.add(first.parkCode);
      followups.push(...other);
    }
  }
  for (const item of followups) {
    if (candidates.length === limit) break;
    if (existing.has(item.slug) || codes.has(item.parkCode)) continue;
    candidates.push(item);
    existing.add(item.slug);
    codes.add(item.parkCode);
  }
  return { candidates, unavailable };
}
