import { createHash } from 'node:crypto';
import { parseFragment } from 'parse5';
import sharp from 'sharp';
import { isoDay, isSlug, sha256 } from './content-lib.mjs';
import { creativeCommonsLicenseUrl } from './photo-lib.mjs';
import { CANONICAL_SITE_URL } from '../src/lib/site-config.mjs';

const commons = 'commons.wikimedia.org';
const upload = 'upload.wikimedia.org';
const timeLimit = 25000;
const maxImageBytes = 16_000_000;
const maxImagePixels = 60_000_000;
const userAgent = `CedarTripsPhotoIntake/1.0 (+${CANONICAL_SITE_URL}/editorial-policy/)`;
const fileTitle = /^File:[^/\\\u0000-\u001f\u007f]{3,250}\.jpe?g$/iu;
const excludedMedia = /\b(?:AI[- ]generated|artificial intelligence[- ]generated|computer[- ]generated|generative AI|illustrations?|paintings?|engravings?|drawings?|renderings?|maps? of|personality rights|copyright violations?|license review needed)\b/i;

function plainText(html) {
  if (typeof html !== 'string' || html.length > 50_000) return '';
  function textContent(node) {
    if (['script', 'style', 'template'].includes(node.tagName)) return '';
    if (node.nodeName === '#text') return node.value;
    return (node.childNodes ?? []).map(textContent).join(' ');
  }
  return textContent(parseFragment(html)).replace(/[\u0000-\u001f\u007f\s]+/gu, ' ').trim();
}

function siteUrl(value, host) {
  try {
    const url = new URL(value);
    if (url.origin !== `https://${host}` || url.username || url.password) return null;
    // Wikimedia may append UTM parameters to API-derived media links.
    url.search = '';
    url.hash = '';
    return url;
  } catch {
    return null;
  }
}

function normalizeTitle(value) {
  return value.replaceAll('_', ' ').normalize('NFC').replace(/\s+/gu, ' ').trim();
}

function matchesFilePath(pathname, title, thumbnail) {
  try {
    const parts = decodeURIComponent(pathname).split('/');
    const prefix = thumbnail ? ['', 'wikipedia', 'commons', 'thumb'] : ['', 'wikipedia', 'commons'];
    if (parts.length !== prefix.length + (thumbnail ? 4 : 3) ||
      prefix.some((part, i) => parts[i] !== part)) return false;
    const [group, groupPair, name] = parts.slice(prefix.length);
    return /^[a-f0-9]{2}$/.test(groupPair) && group === groupPair[0] &&
      normalizeTitle(`File:${name}`) === normalizeTitle(title);
  } catch {
    return false;
  }
}

function licensedReuse(metadata) {
  const label = plainText(metadata.LicenseShortName?.value);
  const license = /^CC0(?: 1\.0)?$/i.test(label) ? 'CC0-1.0' : label.replace(/^CC (BY(?:-SA)?) (\d\.\d)$/i, (_, kind, version) => `CC-${kind.toUpperCase()}-${version}`);
  const licenseUrl = creativeCommonsLicenseUrl(license);
  const supplied = plainText(metadata.LicenseUrl?.value);
  if (!licenseUrl) return null;
  // Commons may link to a localized deed for the same exact license and version.
  const canonical = supplied.replace(/^http:\/\//, 'https://').replace(/\/deed\.[a-z-]+\/?$/i, '/').replace(/\/?$/, '/');
  return canonical === licenseUrl ? { license, licenseUrl } : null;
}

function acceptableDimensions(width, height) {
  return Number.isSafeInteger(width) && Number.isSafeInteger(height) &&
    width >= 1200 && height >= 650 && width >= height && width <= height * 4 && width * height <= maxImagePixels;
}

function verifiedMetadata(page) {
  const item = page?.imageinfo?.[0];
  if (page?.ns !== 6 || page.imagerepository !== 'local' || typeof page.title !== 'string' || !fileTitle.test(page.title) ||
    item?.mime !== 'image/jpeg' || item.mediatype !== 'BITMAP' ||
    !acceptableDimensions(item.width, item.height) || !/^[a-f0-9]{40}$/.test(item.sha1) ||
    !Number.isSafeInteger(item.size) || item.size <= 0 || item.size > maxImageBytes) return null;

  const original = siteUrl(item.url, upload);
  const source = siteUrl(item.descriptionurl, commons);
  if (!original || !source || !matchesFilePath(original.pathname, page.title, false)) return null;
  try {
    if (!source.pathname.startsWith('/wiki/File:') ||
      normalizeTitle(decodeURIComponent(source.pathname.slice('/wiki/'.length))) !== normalizeTitle(page.title)) return null;
  } catch {
    return null;
  }

  const metadata = item.extmetadata ?? {};
  const reuse = licensedReuse(metadata);
  const author = plainText(metadata.Artist?.value);
  const attribution = plainText(metadata.Attribution?.value);
  const description = plainText(metadata.ImageDescription?.value);
  const categories = plainText(metadata.Categories?.value).split('|').map(value => value.trim()).filter(Boolean);
  const restrictions = metadata.Restrictions?.value;
  if (!reuse || !author || author.length > 300 || /^(?:unknown(?: author)?|anonymous|own work|not provided)$/i.test(author) ||
    attribution.length > 600 || (metadata.Attribution?.value && !attribution) ||
    (restrictions !== undefined && restrictions !== '') || excludedMedia.test(`${page.title} ${description} ${categories.join(' ')}`)) return null;

  const thumb = siteUrl(item.thumburl, 'thumb.wikimedia.org') ?? siteUrl(item.thumburl, upload);
  return {
    commonsTitle: page.title,
    title: plainText(metadata.ObjectName?.value).slice(0, 180) || page.title.slice(5, page.title.lastIndexOf('.')),
    author, attribution, description: description.slice(0, 350), categories: categories.slice(0, 24), ...reuse,
    sourceUrl: source.href, originalUrl: original.href,
    ...(thumb && matchesFilePath(thumb.pathname, page.title, true) ? { thumbnailUrl: thumb.href } : {}),
    width: item.width, height: item.height, size: item.size, originalSha1: item.sha1,
  };
}

async function requestBytes(url, { fetcher, maxBytes, accept }) {
  const response = await fetcher(url, {
    redirect: 'error', signal: AbortSignal.timeout(timeLimit),
    headers: { 'User-Agent': userAgent, 'Api-User-Agent': userAgent, Accept: accept },
  });
  if (!response.ok) throw new Error(`Wikimedia returned HTTP ${response.status}`);
  if (response.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== accept) {
    throw new Error('Wikimedia returned an unexpected content type');
  }
  if (Number(response.headers.get('content-length')) > maxBytes) throw new Error('Wikimedia response exceeds the size limit');
  if (!response.body) throw new Error('Wikimedia returned an empty response');
  const reader = response.body.getReader();
  const chunks = [];
  let length = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > maxBytes) {
      await reader.cancel();
      throw new Error('Wikimedia response exceeds the size limit');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks, length);
}

async function queryCommons(params, fetcher) {
  const url = new URL(`https://${commons}/w/api.php`);
  url.search = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', maxlag: '5',
    prop: 'imageinfo', iiprop: 'url|size|sha1|mime|mediatype|extmetadata',
    iiurlwidth: '640', iiextmetadatalanguage: 'en',
    iiextmetadatafilter: 'ObjectName|ImageDescription|Artist|Attribution|LicenseShortName|LicenseUrl|Categories|Restrictions',
    ...params,
  });
  const bytes = await requestBytes(url, { fetcher, maxBytes: 2_000_000, accept: 'application/json' });
  const data = JSON.parse(bytes.toString('utf8'));
  if (data.error) throw new Error('Wikimedia Commons rejected the metadata request');
  return Array.isArray(data.query?.pages) ? data.query.pages : [];
}

export async function searchCommonsPhotos(query, { fetcher = fetch, limit = 6 } = {}) {
  if (typeof query !== 'string' || !query.trim() || query.length > 160 || /[\u0000-\u001f\u007f]/u.test(query) ||
    !Number.isInteger(limit) || limit < 1 || limit > 12) throw new Error('Invalid Commons photo search');
  const pages = await queryCommons({
    generator: 'search', gsrnamespace: '6', gsrlimit: '24',
    gsrsearch: `${query.trim()} filetype:bitmap`,
  }, fetcher);
  return pages.sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
    .map(verifiedMetadata).filter(Boolean).slice(0, limit);
}

function validDescription(value, maxLength) {
  return typeof value === 'string' && value.trim() &&
    value.length <= maxLength && !/[<>\u0000-\u001f\u007f]/u.test(value);
}

export async function prepareCommonsPhoto({ id, commonsTitle, title, alt, caption }, { fetcher = fetch, now = new Date() } = {}) {
  if (!isSlug(id) || typeof commonsTitle !== 'string' || !fileTitle.test(commonsTitle) || !validDescription(title, 180) ||
    !validDescription(alt, 240) || !validDescription(caption, 280)) throw new Error('Invalid Commons photo proposal');
  const pages = await queryCommons({ titles: commonsTitle }, fetcher);
  const candidate = pages.length === 1 ? verifiedMetadata(pages[0]) : null;
  if (!candidate || normalizeTitle(candidate.commonsTitle) !== normalizeTitle(commonsTitle)) {
    throw new Error('Commons photo requires a matching JPEG with verified author, license, and reuse rights');
  }
  const original = await requestBytes(candidate.originalUrl, { fetcher, maxBytes: maxImageBytes, accept: 'image/jpeg' });
  if (original.length !== candidate.size ||
    createHash('sha1').update(original).digest('hex') !== candidate.originalSha1) {
    throw new Error('Commons original bytes do not match the published SHA-1 and size');
  }
  const image = sharp(original, { limitInputPixels: maxImagePixels });
  const metadata = await image.metadata();
  if (metadata.format !== 'jpeg' || metadata.width !== candidate.width || metadata.height !== candidate.height ||
    !acceptableDimensions(metadata.autoOrient.width, metadata.autoOrient.height)) {
    throw new Error('Decoded Commons photo does not match the registered JPEG dimensions');
  }
  const { data: bytes, info } = await image.autoOrient()
    .resize({ width: 2400, height: 1600, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85, mozjpeg: true }).toBuffer({ resolveWithObject: true });
  const adaptation = 'Source JPEG oriented, resized, and recompressed. Display crops may differ from the source.';
  return {
    bytes,
    metadata: { description: candidate.description, categories: candidate.categories },
    record: {
      id, kind: 'photo', author: candidate.author, license: candidate.license, licenseUrl: candidate.licenseUrl,
      title: title.trim(), alt: alt.trim(), caption: caption.trim(), file: `${id}.jpg`,
      sourceUrl: candidate.sourceUrl, originalUrl: candidate.originalUrl, sourceTitle: candidate.commonsTitle,
      checkedAt: isoDay(now), width: info.width, height: info.height, originalSha1: candidate.originalSha1, sha256: sha256(bytes),
      permissionNote: candidate.attribution ? `${adaptation} The Commons credit line is “${candidate.attribution}”.` : adaptation,
    },
  };
}
