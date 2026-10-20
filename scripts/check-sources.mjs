import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { assertOfficialUrl, isoDay, queueFailure, readJson, sha256, validateRegistry, writeJson } from './content-lib.mjs';
import {CANONICAL_SITE_URL} from '../src/lib/site-config.mjs';

export function extractText(html) {
  return html.replace(/<(script|style|nav|footer|header)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&(?:nbsp|amp|quot|apos|lt|gt);/g, ' ')
    .replace(/\s+/g, ' ').trim();
}

export async function fetchOfficialText(url, allowedHosts, fetcher = fetch, redirects = 0) {
  assertOfficialUrl(url, allowedHosts);
  const response = await fetcher(url, { redirect: 'manual', signal: AbortSignal.timeout(20000), headers: { 'User-Agent': `CedarTripsSourceMonitor/1.0 (+${CANONICAL_SITE_URL}/editorial-policy/)`, Accept: 'text/html,text/plain' } });
  if (response.status >= 300 && response.status < 400) {
    if (redirects >= 3 || !response.headers.get('location')) throw new Error('Source redirect limit exceeded');
    return fetchOfficialText(new URL(response.headers.get('location'), url).href, allowedHosts, fetcher, redirects + 1);
  }
  if (!response.ok) throw new Error(`Official source returned HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') ?? '';
  if (!/text\/(?:html|plain)/i.test(contentType)) throw new Error('Source is not readable HTML or text');
  if (Number(response.headers.get('content-length') ?? 0) > 2_000_000) throw new Error('Source exceeds 2 MB limit');
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > 2_000_000) { await reader.cancel(); throw new Error('Source exceeds 2 MB limit'); }
    chunks.push(value);
  }
  const text = extractText(Buffer.concat(chunks).toString('utf8'));
  if (text.length < 100) throw new Error('Source appears empty or blocked');
  return text;
}

export async function checkSources(registry, { fetcher = fetch, now = new Date(), acceptBaseline = false } = {}) {
  validateRegistry(registry);
  const sources = [];
  const texts = new Map();
  const conflicts = [];
  for (const source of registry.sources) {
    try {
      const text = await fetchOfficialText(source.url, registry.allowedHosts, fetcher);
      texts.set(source.id, text);
      const hash = sha256(text);
      let status = !source.contentHash ? 'baseline-missing' : source.contentHash === hash ? 'unchanged' : 'changed';
      if (acceptBaseline && !source.contentHash) {
        source.contentHash = hash;
        status = 'unchanged';
      }
      // Evidence disappearance is a deterministic review trigger, not a semantic fact check.
      for (const fact of source.facts ?? []) {
        if (fact.evidence && !text.toLowerCase().includes(fact.evidence.toLowerCase())) conflicts.push(fact.id);
      }
      // Only an already approved, byte-equivalent normalized baseline can renew dates.
      // A new baseline still needs an editor's initial fact verification.
      if (status === 'unchanged' && source.contentHash === hash && !acceptBaseline) {
        source.checkedAt = isoDay(now);
        for (const fact of source.facts ?? []) {
          if (!fact.evidence || conflicts.includes(fact.id)) continue;
          fact.checkedAt = isoDay(now);
          if (fact.dynamic) fact.expiresAt = isoDay(new Date(now.getTime() + 7 * 86400000));
        }
      }
      sources.push({ id: source.id, status, checkedAt: now.toISOString(), contentHash: hash });
    } catch (error) {
      sources.push({ id: source.id, status: 'unavailable', checkedAt: now.toISOString(), error: error.message });
    }
  }
  return { report: { checkedAt: now.toISOString(), sources, conflicts }, texts };
}

export async function runSourceCheck(root, options = {}) {
  const file = path.join(root, 'automation/sources.json');
  const registry = await readJson(file);
  const result = await checkSources(registry, options);
  await writeJson(path.join(root, 'automation/source-health.json'), result.report);
  await writeJson(file, registry);
  for (const source of result.report.sources) {
    if (source.status !== 'unchanged') await queueFailure(root, { slug: 'source-monitor', stage: 'source-check', errors: [`${source.id}: ${source.status}${source.error ? ` (${source.error})` : ''}`] }, options.now);
  }
  for (const id of result.report.conflicts) await queueFailure(root, { slug: 'source-monitor', stage: 'fact-evidence', errors: [`${id}: registered evidence was not found in the current source`] }, options.now);
  await writeJson(path.join(root, 'automation/reports/source-check.json'), result.report);
  return { ...result, registry };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = await runSourceCheck(process.cwd(), { acceptBaseline: process.argv.includes('--accept-baseline') });
  console.log(`Checked ${result.report.sources.length} official sources on ${isoDay()}; ${result.report.sources.filter((source) => source.status !== 'unchanged').length} need review.`);
  if (result.report.sources.some((source) => source.status !== 'unchanged') || result.report.conflicts.length) process.exitCode = 2;
}
