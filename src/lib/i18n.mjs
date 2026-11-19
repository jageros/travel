import localeRecords from '../data/locales.json' with { type: 'json' };
import uiLabels from '../data/ui-labels.json' with { type: 'json' };
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseDocument } from 'yaml';
import goldenGate from '../data/golden-gate-attraction.json' with { type: 'json' };

/** @typedef {{ code: string, path: string, hreflang: string, label: string, dir: 'ltr'|'rtl' }} Locale */
/** @type {ReadonlyArray<Locale>} */
export const locales = Object.freeze(localeRecords.map((locale) => Object.freeze({ ...locale, dir: /** @type {'ltr'|'rtl'} */ (locale.dir) })));
const unprefixedLocale = locales.find((locale) => locale.path === '');
if (!unprefixedLocale) throw new Error('The locale registry needs an unprefixed default locale');
/** @type {Locale} */
export const defaultLocale = unprefixedLocale;
export const localeCodes = Object.freeze(locales.map(({ code }) => code));
export const localePaths = Object.freeze(locales.map(({ path }) => path).filter(Boolean));
const byCode = new Map(locales.map((locale) => [locale.code, locale]));
const byPath = new Map(locales.map((locale) => [locale.path, locale]));

export function getLocale(code) {
  return byCode.get(code);
}

export function isLocale(code) {
  return byCode.has(code);
}

export function getLocaleFromPath(path) {
  const segment = String(path).replace(/^\/+/, '').split('/')[0] || '';
  return byPath.get(segment) ?? defaultLocale;
}

export function localePath(code, path = '/') {
  const locale = typeof code === 'string' ? getLocale(code) : code;
  if (!locale) throw new Error(`Unsupported locale: ${code}`);
  const cleanPath = `/${String(path).replace(/^\/+/, '')}`.replace(/\/+/g, '/');
  if (locale.path === '') return cleanPath === '/' ? '/' : `${cleanPath.replace(/\/$/, '')}/`;
  if (cleanPath === '/') return `/${locale.path}/`;
  return `/${locale.path}${cleanPath.endsWith('/') ? cleanPath : `${cleanPath}/`}`;
}

export function stripLocale(path) {
  const clean = `/${String(path).replace(/^\/+/, '')}`;
  const locale = getLocaleFromPath(clean);
  if (!locale || locale.path === '') return { locale: defaultLocale, path: clean };
  const remainder = clean.slice(`/${locale.path}`.length) || '/';
  return { locale, path: remainder.startsWith('/') ? remainder : `/${remainder}` };
}

export function localeLabels(code) {
  const locale = typeof code === 'string' ? getLocale(code) : code;
  if (!locale) throw new Error(`Unsupported locale: ${code}`);
  return uiLabels[locale.code] ?? uiLabels[defaultLocale.code];
}

export function localeUrl(siteUrl, code, path = '/') {
  return new URL(localePath(code, path), siteUrl).href;
}

export { uiLabels };

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

/** Fingerprints used to decide whether a localized derivative still matches its English source. */
export function sourceArticleDigest(article) {
  const sourceFiles = [article.filePath, path.join(process.cwd(), 'src/content/articles', `${article.data.slug}.md`)].filter(Boolean);
  for (const sourceFile of sourceFiles) {
    try {
      const raw = readFileSync(sourceFile, 'utf8');
      const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(raw);
      if (match) {
        const document = parseDocument(match[1], { uniqueKeys: true, customTags: [], maxAliasCount: 0 });
        const data = document.toJS({ maxAliasCount: 0 });
        delete data.status;
        delete data.publishedAt;
        return digest(JSON.stringify(data) + '\n' + match[2]);
      }
    } catch { /* Try the next source path or use the collection fallback. */ }
  }
  const data = { ...article.data };
  delete data.status;
  delete data.publishedAt;
  return digest(JSON.stringify(data) + '\n' + (article.body ?? ''));
}

export function sourceSupplementalDigest(article) {
  const value = article.data.slug === goldenGate.slug
    ? goldenGate
    : { facts: article.data.facts ?? [], hero: article.data.hero ?? null };
  return digest(JSON.stringify(value));
}
