import { promises as fs } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { isDay, isSlug, parseArticle, readArticles, readJson, serializeArticle, sha256, writeJson } from './content-lib.mjs';
import goldenGate from '../src/data/golden-gate-attraction.json' with { type: 'json' };

const DEFAULT_LOCALES = [
  ['en-US', '', 'English', 'ltr'], ['es', 'es', 'Español', 'ltr'], ['fr', 'fr', 'Français', 'ltr'],
  ['de', 'de', 'Deutsch', 'ltr'], ['pt-BR', 'pt-br', 'Português (Brasil)', 'ltr'],
  ['zh-Hans', 'zh-hans', '简体中文', 'ltr'], ['zh-Hant', 'zh-hant', '繁體中文', 'ltr'],
  ['ja', 'ja', '日本語', 'ltr'], ['ko', 'ko', '한국어', 'ltr'], ['it', 'it', 'Italiano', 'ltr'],
  ['ar', 'ar', 'العربية', 'rtl'], ['hi', 'hi', 'हिन्दी', 'ltr'],
].map(([code, route, label, dir], priority) => ({ code, path: route, label, dir, enabled: true, priority }));

const LOCALE_CODE = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/;
const TRANSLATION_ROOT = path.join('src', 'content', 'translations');
const PUBLICATION_STATUSES = new Set(['draft', 'review', 'published']);

export function translationLocales(registry) {
  const records = registry?.locales ?? registry;
  if (!Array.isArray(records)) return DEFAULT_LOCALES;
  const seen = new Set();
  const locales = records.map((record, priority) => {
    const value = { ...record, enabled: record.enabled !== false, priority: Number.isInteger(record.priority) ? record.priority : priority };
    if (!LOCALE_CODE.test(value.code ?? '') || typeof value.path !== 'string' || !/^[a-z0-9-]*$/.test(value.path) ||
        typeof value.label !== 'string' || !['ltr', 'rtl'].includes(value.dir) || seen.has(value.code)) {
      throw new Error(`Invalid or duplicate locale: ${value.code ?? '(missing)'}`);
    }
    seen.add(value.code);
    return value;
  });
  const defaultLocale = registry?.default ?? locales.find(locale => locale.path === '')?.code;
  if (!defaultLocale || !locales.some(locale => locale.code === defaultLocale && locale.path === '')) throw new Error('Locale registry needs a default locale with an empty path');
  if (!locales.some(locale => locale.enabled && locale.code !== defaultLocale)) throw new Error('Locale registry needs an enabled translated locale');
  return locales.sort((a, b) => a.priority - b.priority);
}

export async function readLocaleRegistry(root) {
  for (const file of ['src/data/locales.json', 'automation/locales.json']) {
    try { return translationLocales(await readJson(path.join(root, file))); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  return translationLocales(DEFAULT_LOCALES);
}

export function safeTranslationPath(locale, sourceSlug, routePath = locale.toLowerCase()) {
  if (!LOCALE_CODE.test(locale) || !isSlug(sourceSlug)) throw new Error('Translation needs a valid locale and source slug');
  if (typeof routePath !== 'string' || !/^[a-z0-9-]+$/.test(routePath)) throw new Error('Translation needs a safe locale route path');
  const route = routePath;
  return path.join(TRANSLATION_ROOT, route, `${sourceSlug}.md`);
}

export function translationDigest(data, body) {
  const editorial = { ...data };
  delete editorial.status;
  delete editorial.publishedAt;
  delete editorial.updatedAt;
  return sha256(JSON.stringify(editorial) + '\n' + body);
}

export function parseTranslation(raw, file = 'translation') {
  const article = parseArticle(raw, file);
  const { locale, sourceSlug, sourceDigest, status, title, description, updatedAt, photoAlt, photoCaption } = article.data;
  const supplementalDigest = article.data.supplementalDigest;
  if (!LOCALE_CODE.test(locale ?? '') || !isSlug(sourceSlug) || !/^[a-f0-9]{64}$/.test(sourceDigest ?? '') ||
      !/^[a-f0-9]{64}$/.test(supplementalDigest ?? '') || !PUBLICATION_STATUSES.has(status) ||
      typeof title !== 'string' || [...title.trim()].length < 4 || [...title].length > 140 ||
      typeof description !== 'string' || [...description.trim()].length < 20 || [...description].length > 300 || !isDay(updatedAt)) {
    throw new Error(`${file}: invalid translation metadata`);
  }
  if ((photoAlt !== undefined && (typeof photoAlt !== 'string' || photoAlt.trim().length < 1 || photoAlt.length > 300)) ||
      (photoCaption !== undefined && (typeof photoCaption !== 'string' || photoCaption.trim().length < 1 || photoCaption.length > 500))) {
    throw new Error(`${file}: invalid localized photo text`);
  }
  return { ...article, digest: translationDigest(article.data, article.body) };
}

async function walkTranslations(root) {
  const base = path.join(root, TRANSLATION_ROOT);
  const files = [];
  async function visit(dir) {
    let entries;
    try { entries = await fs.readdir(dir, { withFileTypes: true }); }
    catch (error) { if (error.code === 'ENOENT') return; throw error; }
    for (const entry of entries) {
      const target = path.join(dir, entry.name);
      if (entry.isDirectory()) await visit(target);
      else if (entry.isFile() && entry.name.endsWith('.md')) files.push(target);
    }
  }
  await visit(base);
  return files;
}

export async function readTranslations(root) {
  const files = await walkTranslations(root);
  return Promise.all(files.map(async file => parseTranslation(await fs.readFile(file, 'utf8'), path.relative(root, file))));
}

function articleLocaleKey(locale, slug) { return `${locale}:${slug}`; }

export function supplementalDigest(source) {
  const value = source.data.slug === goldenGate.slug
    ? goldenGate
    : { facts: source.data.facts ?? [], hero: source.data.hero ?? null };
  return sha256(JSON.stringify(value));
}

export async function translationPlan(root, { maxOriginals = 4, locales: localeInput } = {}) {
  if (!Number.isInteger(maxOriginals) || maxOriginals < 1 || maxOriginals > 50) throw new Error('maxOriginals must be between 1 and 50');
  const [articles, translations, locales] = await Promise.all([readArticles(root), readTranslations(root), localeInput ? translationLocales(localeInput) : readLocaleRegistry(root)]);
  const defaultLocale = locales.find(locale => locale.path === '');
  const enabled = locales.filter(locale => locale.enabled && locale.code !== defaultLocale.code);
  const byKey = new Map(translations.map(item => [articleLocaleKey(item.data.locale, item.data.sourceSlug), item]));
  const published = articles.filter(article => article.data.status === 'published');
  // Newest publication first, then oldest source update. This bounds each run by originals, not locale pairs.
  const ordered = [...published].sort((a, b) => String(b.data.publishedAt ?? b.data.updatedAt).localeCompare(String(a.data.publishedAt ?? a.data.updatedAt)) || a.data.slug.localeCompare(b.data.slug));
  const selected = ordered.slice(0, maxOriginals);
  const jobs = [];
  const complete = [];
  for (const article of selected) {
    const currentSupplementalDigest = supplementalDigest(article);
    const missing = [];
    for (const locale of enabled) {
      const translation = byKey.get(articleLocaleKey(locale.code, article.data.slug));
      if (!translation || translation.data.sourceDigest !== article.digest || translation.data.supplementalDigest !== currentSupplementalDigest || translation.data.status !== 'published') missing.push({
        locale: locale.code, localePath: locale.path, sourceSlug: article.data.slug, sourceDigest: article.digest,
        supplementalDigest: currentSupplementalDigest,
        reason: !translation ? 'missing' : translation.data.sourceDigest !== article.digest ? 'source-changed' : translation.data.supplementalDigest !== currentSupplementalDigest ? 'supplemental-changed' : 'unpublished',
      });
    }
    if (missing.length) jobs.push(...missing);
    else complete.push(article.data.slug);
  }
  return { maxOriginals, selected: selected.map(article => article.data.slug), jobs, complete, enabledLocales: enabled.map(locale => locale.code), totalPublished: published.length };
}

function validateTranslationText(draft, locale, { minimumH2 = 2 } = {}) {
  if (!draft || typeof draft !== 'object' || Object.keys(draft).some(key => !['title', 'description', 'body', 'photoAlt', 'photoCaption'].includes(key)) ||
      ['title', 'description', 'body'].some(key => typeof draft[key] !== 'string')) throw new Error('Translation draft must contain title, description and body strings');
  // Character-count rules must work for CJK and Arabic titles as well as
  // alphabetic scripts. The source article keeps its English-specific limits.
  if ([...draft.title.trim()].length < 4 || [...draft.title].length > 140) throw new Error('Translation title must be 4-140 characters');
  if ([...draft.description.trim()].length < 20 || [...draft.description].length > 300) throw new Error('Translation description must be 20-300 characters');
  if (draft.photoAlt !== undefined && (typeof draft.photoAlt !== 'string' || draft.photoAlt.trim().length < 1 || draft.photoAlt.length > 300)) throw new Error('Translation photoAlt must be 1-300 characters');
  if (draft.photoCaption !== undefined && (typeof draft.photoCaption !== 'string' || draft.photoCaption.trim().length < 1 || draft.photoCaption.length > 500)) throw new Error('Translation photoCaption must be 1-500 characters');
  const body = draft.body.trim();
  if (body.length < 600) throw new Error('Translation body is too short');
  if (/<script\b|<iframe\b|javascript:/i.test(body)) throw new Error('Translation body contains executable markup');
  if ((body.match(/^##\s+/gm) ?? []).length < minimumH2) throw new Error(`Translation body needs at least ${minimumH2} H2 sections`);
  if (locale === 'ar' && /[\u0600-\u06ff]/.test(body) === false) throw new Error('Arabic translation must contain Arabic script');
  return body;
}

export function translationFromDraft(source, locale, draft, now = new Date()) {
  if (!source || source.data.status !== 'published') throw new Error('Translations can only be created for published source articles');
  const body = validateTranslationText(draft, locale, { minimumH2: Math.max(2, (source.body.match(/^##\s+/gm) ?? []).length) });
  const data = {
    title: draft.title.trim(), description: draft.description.trim(),
    locale, sourceSlug: source.data.slug, sourceDigest: source.digest,
    // Supplemental attraction copy and registered facts are inherited from the source
    // until their own localized overlay is supplied. Keeping a separate fingerprint
    // lets the renderer invalidate only affected translations later.
    supplementalDigest: supplementalDigest(source),
    status: 'review',
    updatedAt: isoDate(now),
    ...(draft.photoAlt !== undefined ? { photoAlt: draft.photoAlt.trim() } : {}),
    ...(draft.photoCaption !== undefined ? { photoCaption: draft.photoCaption.trim() } : {}),
  };
  const article = parseArticle(serializeArticle(data, body), `${locale}/${source.data.slug}.md`);
  return { ...article, digest: translationDigest(article.data, article.body) };
}

function isoDate(date) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'UTC', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date); }

export async function saveTranslationDraft(root, locale, sourceSlug, draft, { now = new Date(), expectedSourceDigest } = {}) {
  const [articles, locales] = await Promise.all([readArticles(root), readLocaleRegistry(root)]);
  const source = articles.find(article => article.data.slug === sourceSlug && article.data.status === 'published');
  if (!source) throw new Error('Translation source must be a published article');
  const localeRecord = locales.find(record => record.code === locale && record.enabled && record.path !== '');
  if (!localeRecord) throw new Error(`Locale is not enabled for translation: ${locale}`);
  if (expectedSourceDigest && expectedSourceDigest !== source.digest) throw new Error('Source article changed since translation was planned');
  const translation = translationFromDraft(source, locale, draft, now);
  const file = path.join(root, safeTranslationPath(locale, sourceSlug, localeRecord.path));
  await fs.mkdir(path.dirname(file), { recursive: true });
  try { await fs.writeFile(file, translation.raw, { flag: 'wx' }); }
  catch (error) {
    if (error.code !== 'EEXIST') throw error;
    throw new Error('Translation already exists; re-plan before replacing it');
  }
  return { locale, sourceSlug, sourceDigest: source.digest, contentSha256: translation.digest, file: path.relative(root, file) };
}

export async function publishTranslations(root, { now = new Date(), locales: localeInput, max = Infinity, sourceCheck, sourceReport } = {}) {
  const [articles, translations, locales, sourceRegistry, storedReport] = await Promise.all([
    readArticles(root), readTranslations(root), localeInput ? translationLocales(localeInput) : readLocaleRegistry(root),
    readJson(path.join(root, 'automation/sources.json')).catch(error => error.code === 'ENOENT' ? null : Promise.reject(error)),
    readJson(path.join(root, 'automation/source-health.json')).catch(error => error.code === 'ENOENT' ? null : Promise.reject(error)),
  ]);
  const report = sourceReport ?? storedReport;
  const sourceBySlug = new Map(articles.filter(article => article.data.status === 'published').map(article => [article.data.slug, article]));
  const enabled = new Set(locales.filter(locale => locale.enabled && locale.path !== '').map(locale => locale.code));
  const results = [];
  for (const translation of translations.filter(item => item.data.status === 'review').sort((a, b) => a.file.localeCompare(b.file))) {
    if (results.filter(result => result.status === 'published').length >= max) break;
    const source = sourceBySlug.get(translation.data.sourceSlug);
    const errors = [];
    if (!source) errors.push('source article is not published');
    if (!enabled.has(translation.data.locale)) errors.push('locale is not enabled');
    if (source && translation.data.sourceDigest !== source.digest) errors.push('source article digest changed');
    if (source && translation.data.supplementalDigest !== supplementalDigest(source)) errors.push('source supplemental content changed');
    if (sourceRegistry) errors.push(...sourceGateErrors(source, sourceRegistry, report, now));
    if (typeof sourceCheck === 'function') {
      const check = await sourceCheck(source, translation);
      if (check !== true) errors.push(typeof check === 'string' ? check : 'source verification failed');
    }
    try { validateTranslationText({ title: translation.data.title, description: translation.data.description, body: translation.body, photoAlt: translation.data.photoAlt, photoCaption: translation.data.photoCaption }, translation.data.locale, { minimumH2: Math.max(2, (source?.body.match(/^##\s+/gm) ?? []).length) }); }
    catch (error) { errors.push(error.message); }
    if (errors.length) { results.push({ locale: translation.data.locale, sourceSlug: translation.data.sourceSlug, status: 'held', errors }); continue; }
    const data = { ...translation.data, status: 'published', updatedAt: isoDate(now) };
    const file = path.join(root, translation.file);
    await fs.writeFile(file, serializeArticle(data, translation.body, { preserveBody: true }));
    results.push({ locale: data.locale, sourceSlug: data.sourceSlug, status: 'published' });
  }
  return results;
}

function sourceGateErrors(source, registry, report, now) {
  const errors = [];
  const checked = Date.parse(report?.checkedAt);
  if (!Number.isFinite(checked) || checked > now.getTime() || now.getTime() - checked > 24 * 3600000) return ['official source report is missing or stale'];
  const sourceById = new Map((registry.sources ?? []).map(item => [item.id, item]));
  const reportById = new Map((report.sources ?? []).map(item => [item.id, item]));
  for (const id of source.data.sources ?? []) {
    const registered = sourceById.get(id);
    const observed = reportById.get(id);
    const observedAt = Date.parse(observed?.checkedAt);
    if (!registered || !observed || observed.status !== 'unchanged' || observed.contentHash !== registered.contentHash ||
        !Number.isFinite(observedAt) || observedAt > now.getTime() || now.getTime() - observedAt > 24 * 3600000) {
      errors.push(`official source requires fresh verification: ${id}`);
    }
  }
  const facts = new Set(source.data.facts ?? []);
  for (const conflict of report.conflicts ?? []) if (facts.has(conflict)) errors.push(`registered fact evidence requires fresh verification: ${conflict}`);
  return errors;
}

export async function validateTranslations(root, { now = new Date(), locales: localeInput } = {}) {
  const [articles, translations, locales] = await Promise.all([readArticles(root), readTranslations(root), localeInput ? translationLocales(localeInput) : readLocaleRegistry(root)]);
  const sourceBySlug = new Map(articles.map(article => [article.data.slug, article]));
  const localeByCode = new Map(locales.map(locale => [locale.code, locale]));
  const errors = [];
  const keys = new Set();
  for (const translation of translations) {
    const key = articleLocaleKey(translation.data.locale, translation.data.sourceSlug);
    if (keys.has(key)) errors.push(`${translation.file}: duplicate locale/source pair`);
    keys.add(key);
    const locale = localeByCode.get(translation.data.locale);
    const source = sourceBySlug.get(translation.data.sourceSlug);
    if (!locale || !locale.enabled || locale.path === '') errors.push(`${translation.file}: locale is not enabled`);
    if (!source || source.data.status !== 'published') errors.push(`${translation.file}: source is not published`);
    if (source && translation.data.sourceDigest !== source.digest) errors.push(`${translation.file}: source digest is stale`);
    if (source && translation.data.supplementalDigest !== supplementalDigest(source)) errors.push(`${translation.file}: supplemental content digest is stale`);
    if (translation.data.updatedAt > isoDate(now)) errors.push(`${translation.file}: updatedAt is in the future`);
    if (source) {
      try { validateTranslationText({ title: translation.data.title, description: translation.data.description, body: translation.body, photoAlt: translation.data.photoAlt, photoCaption: translation.data.photoCaption }, translation.data.locale, { minimumH2: Math.max(2, (source.body.match(/^##\s+/gm) ?? []).length) }); }
      catch (error) { errors.push(`${translation.file}: ${error.message}`); }
    }
  }
  return { translations: translations.length, errors };
}

/**
 * Run the deterministic part of the translation job. Model generation stays
 * outside this module and submits each controlled draft through saveTranslationDraft.
 * A run may still publish already-reviewed translations independently of the
 * English editorial ledger and daily article quota.
 */
export async function runTranslationPipeline(root, { now = new Date(), maxOriginals = 4, publish = false, max = Infinity, sourceReport } = {}) {
  const output = { checkedAt: now.toISOString(), plan: await translationPlan(root, { maxOriginals }), publications: [], errors: [] };
  if (publish) {
    try { output.publications = await publishTranslations(root, { now, max, sourceReport }); }
    catch (error) { output.errors.push(error.message); }
  }
  await writeJson(path.join(root, 'automation/reports/translations.json'), output);
  return output;
}

async function readStdin() {
  let input = '';
  process.stdin.setEncoding('utf8');
  for await (const chunk of process.stdin) { input += chunk; if (input.length > 120000) throw new Error('Translation payload exceeds the limit'); }
  return JSON.parse(input);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const root = process.cwd();
    const args = process.argv.slice(2);
    if (args.includes('--plan')) console.log(JSON.stringify(await runTranslationPipeline(root, { maxOriginals: args.includes('--max-originals') ? Number(args[args.indexOf('--max-originals') + 1]) : 4 }), null, 2));
    else if (args.includes('--validate')) {
      const result = await validateTranslations(root);
      console.log(JSON.stringify(result, null, 2));
      if (result.errors.length) process.exitCode = 1;
    } else if (args.includes('--save')) {
      const locale = args[args.indexOf('--save') + 1];
      const sourceSlug = args[args.indexOf('--save') + 2];
      console.log(JSON.stringify(await saveTranslationDraft(root, locale, sourceSlug, await readStdin()), null, 2));
    } else if (args.includes('--publish')) console.log(JSON.stringify(await runTranslationPipeline(root, { publish: true, max: args.includes('--max') ? Number(args[args.indexOf('--max') + 1]) : Infinity }), null, 2));
    else throw new Error('Use --plan, --save <locale> <source-slug>, --publish, or --validate');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
