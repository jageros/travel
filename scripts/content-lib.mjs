import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parseDocument, stringify } from 'yaml';
import { fromMarkdown } from 'mdast-util-from-markdown';
import photos from '../src/data/photos.json' with { type: 'json' };

export const isoDay = (date = new Date()) => date.toISOString().slice(0, 10);
export const sha256 = (value) => createHash('sha256').update(value).digest('hex');
export const isSlug = (value) => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
export const isDay = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value;
export const supportedTopics = new Set(['san-francisco-without-a-car']);
export const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'));

export async function writeJson(file, data) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
}

export function parseArticle(raw, file = 'article') {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/.exec(raw);
  if (!match) throw new Error(`${file}: Markdown frontmatter required`);
  const document = parseDocument(match[1], { uniqueKeys: true, customTags: [], maxAliasCount: 0 });
  if (document.errors.length) throw new Error(`${file}: invalid YAML: ${document.errors[0].message}`);
  const data = document.toJS({ maxAliasCount: 0 });
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error(`${file}: frontmatter must be a mapping`);
  return { data, body: match[2], raw, file, digest: articleDigest(data, match[2]) };
}

// Editorial status and release dates can change after a reviewer approves the content.
export function articleDigest(data, body) {
  const editorial = { ...data };
  delete editorial.status;
  delete editorial.publishedAt;
  return sha256(JSON.stringify(editorial) + '\n' + body);
}

export function serializeArticle(data, body) {
  return `---\n${stringify(data, { lineWidth: 0, defaultStringType: 'QUOTE_DOUBLE' }).trimEnd()}\n---\n\n${body.trim()}\n`;
}

export async function readArticles(root) {
  const base = path.join(root, 'src/content/articles');
  let files;
  try { files = await fs.readdir(base, { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  const articles = [];
  for (const file of files) {
    if (!file.isFile() || !file.name.endsWith('.md')) continue;
    articles.push(parseArticle(await fs.readFile(path.join(base, file.name), 'utf8'), file.name));
  }
  return articles;
}

export function validateRegistry(registry) {
  if (registry.version !== 1 || !Array.isArray(registry.sources) || !Array.isArray(registry.allowedHosts)) throw new Error('Invalid source registry');
  const ids = new Set();
  const facts = new Set();
  for (const source of registry.sources) {
    if (!isSlug(source.id) || ids.has(source.id)) throw new Error(`Invalid or duplicate source ID: ${source.id}`);
    ids.add(source.id);
    assertOfficialUrl(source.url, registry.allowedHosts);
    if (!source.title || !source.publisher || !isDay(source.checkedAt)) throw new Error(`${source.id}: provenance is incomplete`);
    if (source.contentHash !== undefined && !/^[a-f0-9]{64}$/.test(source.contentHash)) throw new Error(`${source.id}: invalid approved source hash`);
    for (const fact of source.facts ?? []) {
      if (!isSlug(fact.id) || facts.has(fact.id) || !fact.statement || !isDay(fact.checkedAt)) throw new Error(`${source.id}: invalid or duplicate fact`);
      if (fact.dynamic && !isDay(fact.expiresAt)) throw new Error(`${fact.id}: dynamic fact needs expiresAt`);
      facts.add(fact.id);
    }
  }
}

export function assertOfficialUrl(value, allowedHosts) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !allowedHosts.includes(url.hostname)) throw new Error(`Unapproved official source URL: ${value}`);
  return url;
}

export function factMap(registry) {
  return new Map(registry.sources.flatMap((source) => (source.facts ?? []).map((fact) => [fact.id, { ...fact, sourceId: source.id }])));
}

const allowedFields = new Set(['title', 'description', 'slug', 'type', 'topic', 'status', 'author', 'publishedAt', 'updatedAt', 'checkedAt', 'primaryIntent', 'sources', 'facts', 'related', 'hero']);
const photoIds = new Set(photos.map((photo) => photo.id));
const dynamicClaimPattern = /\$\s*\d|\b(?:USD|dollars?)\s*\d|\b\d+(?:\.\d+)?\s*(?:dollars?|USD)\b|\b\d{1,2}:\d{2}\b|\b\d{1,2}\s*(?:a\.?m\.?|p\.?m\.?)\b|\b20\d{2}-\d{2}-\d{2}\b|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}\b/i;

export function validateMarkdownLinks(body, allowedHosts) {
  const errors = [];
  function visit(node) {
    if (['html', 'image', 'imageReference'].includes(node.type)) errors.push('Raw HTML and inline images are forbidden in Markdown');
    if (['link', 'definition'].includes(node.type)) {
      // Markdown parsing decodes entities and escapes before this URL check.
      const value = node.url;
      let valid = false;
      if (typeof value === 'string' && !/[\u0000-\u0020\u007f\\]/.test(value)) {
        if (value.startsWith('#')) valid = true;
        else if (value.startsWith('/') && !value.startsWith('//')) {
          try {
            const decoded = decodeURIComponent(value);
            valid = !/^\/[\/\\]/.test(decoded) && !/[\u0000-\u0020\u007f\\]/.test(decoded);
          } catch { valid = false; }
        } else {
          try { assertOfficialUrl(value, allowedHosts); valid = true; } catch { valid = false; }
        }
      }
      if (!valid) errors.push('Markdown links must use local paths, anchors, or approved official HTTPS hosts');
    }
    for (const child of node.children ?? []) visit(child);
  }
  visit(fromMarkdown(body));
  return [...new Set(errors)];
}

export function validateArticle(article, registry, { now = new Date(), publishing = false, sourceReport } = {}) {
  const { data, body } = article;
  const errors = [];
  for (const field of Object.keys(data)) if (!allowedFields.has(field)) errors.push(`Unknown frontmatter field: ${field}`);
  for (const key of ['title', 'description', 'primaryIntent']) if (typeof data[key] !== 'string' || !data[key].trim()) errors.push(`${key} is required`);
  for (const key of ['slug', 'topic']) if (!isSlug(data[key])) errors.push(`Invalid ${key}`);
  if (!supportedTopics.has(data.topic)) errors.push('Topic has no registered site landing page');
  if (!['guide', 'destination'].includes(data.type)) errors.push('Invalid article type');
  if (!['draft', 'review', 'published'].includes(data.status)) errors.push('Invalid article status');
  if (data.author !== 'editorial-team') errors.push('Unregistered author');
  for (const key of ['updatedAt', 'checkedAt']) if (!isDay(data[key]) || data[key] > isoDay(now)) errors.push(`Invalid ${key}`);
  if (data.status === 'published' && (!isDay(data.publishedAt) || data.publishedAt > isoDay(now))) errors.push('Published article needs a valid publishedAt');
  for (const key of ['sources', 'facts', 'related']) if (!Array.isArray(data[key]) || data[key].some((item) => !isSlug(item)) || new Set(data[key]).size !== data[key].length) errors.push(`${key} must contain unique IDs`);
  const sources = new Map(registry.sources.map((item) => [item.id, item]));
  const facts = factMap(registry);
  if (!data.sources?.length) errors.push('At least one official source is required');
  for (const id of data.sources ?? []) {
    const source = sources.get(id);
    if (!source) { errors.push(`Unknown source: ${id}`); continue; }
    if (!isDay(source.checkedAt) || source.checkedAt > isoDay(now)) errors.push(`Invalid source verification date: ${id}`);
    if (publishing && (Date.parse(isoDay(now)) - Date.parse(source.checkedAt)) / 86400000 > 30) errors.push(`Stale source: ${id}`);
    const current = sourceReport?.sources?.find((item) => item.id === id);
    if (publishing && sourceReport && current?.status !== 'unchanged') errors.push(`Source requires review: ${id} (${current?.status ?? 'missing'})`);
    if (publishing && sourceReport) {
      const checked = Date.parse(current?.checkedAt);
      if (!Number.isFinite(checked) || checked > now.getTime() || now.getTime() - checked > 24 * 3600000) errors.push(`Source health is not current: ${id}`);
      if (!/^[a-f0-9]{64}$/.test(source.contentHash ?? '') || current?.contentHash !== source.contentHash) errors.push(`Source health does not match the approved baseline: ${id}`);
    }
  }
  if (publishing && !data.facts?.length) errors.push('Publication requires a fact record');
  for (const id of data.facts ?? []) {
    const fact = facts.get(id);
    if (!fact) { errors.push(`Unknown fact: ${id}`); continue; }
    if (!isDay(fact.checkedAt) || fact.checkedAt > isoDay(now) || (fact.dynamic && !isDay(fact.expiresAt))) errors.push(`Invalid fact verification date: ${id}`);
    if (!data.sources?.includes(fact.sourceId)) errors.push(`Fact source not cited: ${id}`);
    if (publishing && (fact.dynamic && fact.expiresAt <= isoDay(now))) errors.push(`Expired fact: ${id}`);
    if (publishing && sourceReport?.conflicts?.includes(id)) errors.push(`Conflicting fact: ${id}`);
  }
  if (body.split(/\s+/).filter(Boolean).length < 350) errors.push('Article needs at least 350 words');
  if ((body.match(/^##\s+/gm) ?? []).length < 2) errors.push('Article needs at least two useful sections');
  if (/<\/?[A-Za-z!][^>]*>|\{\s*(?:import|export)|^\s*(?:import|export)\s/m.test(body)) errors.push('Raw HTML, MDX, and executable imports are forbidden');
  if (/!\[/.test(body)) errors.push('Inline images are forbidden; use the licensed local hero metadata');
  if (/(?:javascript|data|vbscript)\s*:|<script|on(?:click|error|load)\s*=/i.test(body)) errors.push('Executable content is forbidden');
  errors.push(...validateMarkdownLinks(body, registry.allowedHosts));
  for (const [field, value] of Object.entries({ title: data.title, description: data.description, body })) {
    if (typeof value === 'string' && dynamicClaimPattern.test(value)) errors.push(`Exact prices, clock times and dated claims belong in expiring registered facts (${field})`);
  }
  if (data.hero !== undefined) {
    const hero = data.hero;
    if (!hero || typeof hero !== 'object' || Array.isArray(hero)) errors.push('Hero must reference a registered photo or licensed local image');
    else if (Object.hasOwn(hero, 'photoId')) {
      if (Object.keys(hero).length !== 1 || typeof hero.photoId !== 'string' || !photoIds.has(hero.photoId)) errors.push('Hero photoId must reference a registered photo without legacy fields');
    } else if (Object.keys(hero).some((key) => !['src', 'alt', 'credit', 'license'].includes(key)) || !/^\/images\/[a-zA-Z0-9/_-]+\.(?:svg|png|webp|jpe?g|avif)$/.test(hero.src ?? '') || ['alt', 'credit', 'license'].some((key) => typeof hero[key] !== 'string' || !hero[key].trim())) errors.push('Hero must use a local image with alt, credit, and license');
  }
  return errors;
}

export function normalizedIntent(value = '') { return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim(); }

function shingles(body) {
  const words = body.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
  return new Set(words.slice(0, -4).map((_, index) => words.slice(index, index + 5).join(' ')));
}

export function findDuplicates(article, others) {
  const results = [];
  const a = shingles(article.body);
  for (const other of others) {
    if (other.file === article.file) continue;
    if (other.data.slug === article.data.slug || normalizedIntent(other.data.primaryIntent) === normalizedIntent(article.data.primaryIntent)) { results.push(other.data.slug); continue; }
    const b = shingles(other.body);
    const common = [...a].filter((word) => b.has(word)).length;
    if (common / Math.max(1, Math.min(a.size, b.size)) > 0.65) results.push(other.data.slug);
  }
  return results;
}

export function manualReleaseCount(state, { now = new Date() } = {}) {
  const verified = new Set();
  for (const publication of state.publications ?? []) {
    const published = Date.parse(publication.publishedAt);
    if (publication.manualApproval !== true || !isSlug(publication.slug) || !/^[a-f0-9]{64}$/.test(publication.contentSha256 ?? '') || !Number.isFinite(published) || published > now.getTime()) continue;
    const approved = (state.approvals ?? []).some((approval) => approval.slug === publication.slug && approval.contentSha256 === publication.contentSha256 && approval.reviewer && approval.reviewer === publication.reviewer && isDay(approval.reviewedAt) && approval.reviewedAt <= isoDay(new Date(published)));
    if (approved) verified.add(publication.slug);
  }
  return verified.size;
}

export function publicationDecision(article, state, { now = new Date(), manualOnly = false } = {}) {
  if (state.publications.some((item) => !Number.isFinite(Date.parse(item.publishedAt)) || Date.parse(item.publishedAt) > now.getTime())) return { allowed: false, reason: 'Invalid or future-dated publication ledger requires review' };
  const recent = state.publications.filter((item) => Date.parse(item.publishedAt) > now.getTime() - 7 * 86400000);
  if (recent.length >= 3) return { allowed: false, reason: 'Weekly publication cap reached (3 in rolling 7 days)' };
  const approval = state.approvals.find((item) => item.slug === article.data.slug && item.contentSha256 === article.digest && item.reviewer && isDay(item.reviewedAt) && item.reviewedAt <= isoDay(now));
  const reviewedPublications = manualReleaseCount(state, { now });
  if (reviewedPublications < state.requiredManualApprovals || manualOnly || state.autoPublishEnabled !== true) {
    return approval ? { allowed: true, manualApproval: true, approval } : { allowed: false, reason: 'Named editorial approval required for this exact content' };
  }
  return { allowed: true, manualApproval: Boolean(approval), approval };
}

export async function queueFailure(root, { slug, stage, errors }, now = new Date()) {
  const file = path.join(root, 'automation/review-queue.json');
  let queue = [];
  try { queue = await readJson(file); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const item = { slug: isSlug(slug) ? slug : 'pipeline', stage, errors, detectedAt: now.toISOString() };
  const key = (value) => `${value.slug}:${value.stage}:${JSON.stringify(value.errors)}`;
  const previous = queue.findIndex((value) => key(value) === key(item));
  if (previous >= 0) queue[previous] = item; else queue.push(item);
  await writeJson(file, queue.slice(-200));
}
