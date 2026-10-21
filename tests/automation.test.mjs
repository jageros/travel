import assert from 'node:assert/strict';
import test from 'node:test';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { articleDigest, assertOfficialUrl, findDuplicates, manualReleaseCount, parseArticle, publicationDecision, readArticles, readJson, serializeArticle, sha256, validateArticle, writeJson } from '../scripts/content-lib.mjs';
import { checkSources, extractText, fetchOfficialText } from '../scripts/check-sources.mjs';
import { approveArticle, generateDraft, publishCandidates, runPipeline, topicPreflight } from '../scripts/content-pipeline.mjs';
import { importQueries } from '../scripts/import-gsc.mjs';

const now = new Date('2026-10-19T09:00:00.000Z');
const html = `<main>${'Official transit material with station access and public fare guidance. '.repeat(5)}</main>`;
const officialText = extractText(html);
const registry = () => ({ version: 1, allowedHosts: ['www.bart.gov'], sources: [{ id: 'official-transit', url: 'https://www.bart.gov/guide/airport/sfo', title: 'Official transit guide', publisher: 'BART', checkedAt: '2026-10-19', contentHash: sha256(officialText), facts: [{ id: 'station-fact', statement: 'Use the official station access instructions.', checkedAt: '2026-10-19', expiresAt: '2026-10-26', dynamic: true, evidence: 'station access' }] }] });
const report = () => ({ checkedAt: now.toISOString(), sources: [{ id: 'official-transit', status: 'unchanged', checkedAt: now.toISOString(), contentHash: sha256(officialText) }], conflicts: [] });
const data = (slug = 'airport-checklist') => ({ title: 'An airport arrival checklist', description: 'Compare practical arrival decisions before leaving home.', slug, type: 'guide', topic: 'san-francisco-without-a-car', status: 'review', author: 'editorial-team', updatedAt: '2026-10-19', checkedAt: '2026-10-19', primaryIntent: `How should I plan ${slug}?`, sources: ['official-transit'], facts: ['station-fact'], related: [] });
const body = (seed = 'luggage') => `## Plan your arrival\n\n${Array.from({ length: 190 }, (_, i) => `${seed}${i} decision${i}`).join(' ')}\n\n## Check the return\n\nReview your route and official service information before travel.`;
const article = (slug, seed) => parseArticle(serializeArticle(data(slug), body(seed)), `${slug ?? 'airport-checklist'}.md`);
const state = () => ({ version: 1, requiredManualApprovals: 5, autoPublishEnabled: true, approvals: [], publications: [] });
const sourceFetch = async () => new Response(html, { status: 200, headers: { 'content-type': 'text/html' } });

function reviewedHistory(size = 5) {
  const publications = Array.from({ length: size }, (_, i) => ({ slug: `approved-${i}`, publishedAt: '2026-10-01T00:00:00Z', contentSha256: sha256(`reviewed-${i}`), manualApproval: true, reviewer: 'human-editor' }));
  const approvals = publications.map((item) => ({ slug: item.slug, contentSha256: item.contentSha256, reviewer: item.reviewer, reviewedAt: '2026-09-30' }));
  return { publications, approvals };
}

async function fixture(t, articles = [article()]) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'travel-automation-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, 'src/content/articles'), { recursive: true });
  for (const value of articles) await fs.writeFile(path.join(root, 'src/content/articles', value.file), value.raw);
  await writeJson(path.join(root, 'automation/sources.json'), registry());
  await writeJson(path.join(root, 'automation/editorial.json'), state());
  await writeJson(path.join(root, 'automation/review-queue.json'), []);
  await writeJson(path.join(root, 'automation/topics.json'), { topics: [] });
  return root;
}

test('frontmatter is parsed with nested image metadata and rejects duplicate YAML keys and aliases', () => {
  const withHero = { ...data(), hero: { src: '/images/transit.svg', alt: 'Transit diagram', credit: 'Travel editorial team', license: 'CC0' } };
  assert.equal(validateArticle(parseArticle(serializeArticle(withHero, body())), registry(), { now }).length, 0);
  assert.throws(() => parseArticle('---\ntitle: x\ntitle: y\n---\nText'), /invalid YAML/);
  assert.throws(() => parseArticle('---\ntitle: &a x\nslug: *a\n---\nText'), /alias|Alias/);
});

test('source allowlist rejects credentials, alternate ports, HTTP, and private URLs', () => {
  for (const url of ['http://www.bart.gov/x', 'https://user:pass@www.bart.gov/x', 'https://www.bart.gov:8080/x', 'https://127.0.0.1/x', 'https://www.bart.gov.evil.example/x']) assert.throws(() => assertOfficialUrl(url, ['www.bart.gov']));
});

test('source redirects cannot escape the official-host allowlist', async () => {
  await assert.rejects(fetchOfficialText('https://www.bart.gov/x', ['www.bart.gov'], async () => new Response(null, { status: 302, headers: { location: 'https://localhost/private' } })), /Unapproved/);
});

test('source check detects changes, outage and missing evidence without changing provenance', async () => {
  const original = registry();
  const unchanged = await checkSources(original, { fetcher: sourceFetch, now });
  assert.equal(unchanged.report.sources[0].status, 'unchanged');
  const changed = await checkSources(original, { fetcher: async () => new Response(`<main>${'A revised public page. '.repeat(20)}</main>`, { headers: { 'content-type': 'text/html' } }), now });
  assert.equal(changed.report.sources[0].status, 'changed');
  assert.deepEqual(changed.report.conflicts, ['station-fact']);
  assert.equal(original.sources[0].contentHash, sha256(officialText));
  const failed = await checkSources(original, { fetcher: async () => { throw new Error('network unavailable'); }, now });
  assert.equal(failed.report.sources[0].status, 'unavailable');
});

test('baseline acceptance initializes only missing hashes and never accepts changed existing source', async () => {
  const initial = registry();
  delete initial.sources[0].contentHash;
  const missing = await checkSources(initial, { fetcher: sourceFetch, now });
  assert.equal(missing.report.sources[0].status, 'baseline-missing');
  const accepted = await checkSources(initial, { fetcher: sourceFetch, now, acceptBaseline: true });
  assert.equal(accepted.report.sources[0].status, 'unchanged');
  assert.equal(initial.sources[0].contentHash, sha256(officialText));
  const changed = await checkSources(initial, { fetcher: async () => new Response(`<main>${'Changed source page. '.repeat(20)}</main>`, { headers: { 'content-type': 'text/html' } }), now, acceptBaseline: true });
  assert.equal(changed.report.sources[0].status, 'changed');
});

test('unchanged source health cannot renew manual facts without evidence or bypass their expiry gate', async (t) => {
  const current = registry();
  const source = current.sources[0];
  const manualFact = source.facts[0];
  delete manualFact.evidence;
  manualFact.expiresAt = '2026-10-21';
  const verifiedManualFact = structuredClone(manualFact);
  source.facts.push({ ...manualFact, id: 'evidence-backed-control', evidence: 'station access' });
  const root = await fixture(t);
  await writeJson(path.join(root, 'automation/sources.json'), current);
  await approveArticle(root, 'airport-checklist', 'human-editor', { now, expectedSha256: article().digest });

  const beforeExpiry = new Date('2026-10-20T09:00:00Z');
  const first = await checkSources(current, { fetcher: sourceFetch, now: beforeExpiry });
  assert.equal(first.report.sources[0].status, 'unchanged');
  assert.equal(first.report.sources[0].contentHash, sha256(officialText));
  assert.equal(source.checkedAt, '2026-10-20');
  assert.deepEqual(manualFact, verifiedManualFact, 'a healthy unchanged source cannot reverify a manually checked fact');
  assert.equal(source.facts[1].checkedAt, '2026-10-20');
  assert.equal(source.facts[1].expiresAt, '2026-10-27', 'the evidence-backed control proves automatic renewal ran');
  assert.deepEqual(validateArticle(article(), current, { now: beforeExpiry, publishing: true, sourceReport: first.report }), []);

  const atExpiry = new Date('2026-10-21T00:00:00Z');
  const fresh = await checkSources(current, { fetcher: sourceFetch, now: atExpiry });
  assert.equal(fresh.report.sources[0].status, 'unchanged');
  assert.equal(fresh.report.sources[0].checkedAt, atExpiry.toISOString());
  assert.equal(source.checkedAt, '2026-10-21');
  assert.deepEqual(manualFact, verifiedManualFact, 'another fresh report must preserve the manual verification and expiry dates');
  const beforeArticle = (await readArticles(root))[0].raw;
  const beforeLedger = await fs.readFile(path.join(root, 'automation/editorial.json'), 'utf8');
  const [result] = await publishCandidates(root, current, fresh.report, { now: atExpiry });
  assert.equal(result.status, 'held');
  assert.deepEqual(result.errors, ['Expired fact: station-fact']);
  assert.equal((await readArticles(root))[0].raw, beforeArticle);
  assert.equal(await fs.readFile(path.join(root, 'automation/editorial.json'), 'utf8'), beforeLedger);
});

test('unsafe HTML, MDX, script links and remote images fail content quality gates', () => {
  for (const unsafe of ['<script>alert(1)</script>', '<iframe src="https://evil.example"></iframe>', '[link](javascript:alert)', 'import thing from "x"', '![image](https://evil.example/img.jpg)', '![image](//evil.example/img.jpg)', '![image][remote]\n[remote]: https://evil.example/img.jpg']) {
    assert.ok(validateArticle(parseArticle(serializeArticle(data(), `${body()}\n${unsafe}`)), registry(), { now }).length > 0, unsafe);
  }
});

test('exact money, clock times and dates must be isolated in expiring fact records', () => {
  for (const value of ['$999', '06:00 every day', '12 pm daily', 'USD 20', '20 dollars', 'October 19', '2026-10-19']) {
    assert.ok(validateArticle(parseArticle(serializeArticle(data(), `${body()}\n${value}`)), registry(), { now }).some((error) => error.startsWith('Exact prices')), value);
  }
  for (const field of ['title', 'description']) {
    const a = article();
    a.data[field] = '$999 at 06:00 every day';
    assert.ok(validateArticle(a, registry(), { now }).some((error) => error.includes(`(${field})`)));
  }
});

test('decoded inline and reference Markdown URLs reject script/entity obfuscation and unapproved destinations', () => {
  for (const value of [
    '[Open guide](java&#x73;cript:alert\\(1\\))',
    '[Open guide][bad]\n\n[bad]: java&#115;cript:alert(1)',
    '[Open guide](java&#x09;script:alert(1))',
    '[Open guide](//evil.example/path)',
    '[Open guide](/%2f%2fevil.example/path)',
    '[Open guide](https://evil.example/path)',
    '[Open guide](https://user:pass@www.bart.gov/path)',
    '[Open guide](https://www.bart.gov:8080/path)',
    '![image][remote]\n\n[remote]: https://www.bart.gov/path',
  ]) {
    const a = parseArticle(serializeArticle(data(), `${body()}\n\n${value}`));
    assert.ok(validateArticle(a, registry(), { now }).some((error) => /Markdown links|inline images/.test(error)), value);
  }
  const safe = parseArticle(serializeArticle(data(), `${body()}\n\n[Official](https://www.bart.gov/path) [Local](/guides/arrival/) [Section](#plan-your-arrival)`));
  assert.deepEqual(validateArticle(safe, registry(), { now }), []);
});

test('article dates must be real days, facts expire at the start of expiry day, and unknown topics fail', () => {
  const a = article();
  a.data.updatedAt = '2026-02-30';
  a.data.topic = 'unregistered-topic';
  const source = registry(); source.sources[0].facts[0].expiresAt = '2026-10-19';
  const errors = validateArticle(a, source, { now, publishing: true, sourceReport: report() });
  assert.ok(errors.some((error) => error.includes('updatedAt')));
  assert.ok(errors.some((error) => error.startsWith('Expired fact')));
  assert.ok(errors.some((error) => error.includes('registered site')));
});

test('expired facts, stale registry and conflicting evidence hold publication', () => {
  const current = registry();
  current.sources[0].facts[0].expiresAt = '2026-10-18';
  current.sources[0].checkedAt = '2026-08-01';
  const currentReport = report();
  currentReport.conflicts = ['station-fact'];
  const errors = validateArticle(article(), current, { now, publishing: true, sourceReport: currentReport });
  assert.ok(errors.some((error) => error.startsWith('Expired fact')));
  assert.ok(errors.some((error) => error.startsWith('Stale source')));
  assert.ok(errors.some((error) => error.startsWith('Conflicting fact')));
});

test('duplicate primary intent and near-identical content are detected', () => {
  const a = article('one', 'airport'), b = article('two', 'train');
  b.data.primaryIntent = a.data.primaryIntent;
  assert.deepEqual(findDuplicates(a, [b]), ['two']);
  const c = article('three', 'airport');
  assert.deepEqual(findDuplicates(a, [c]), ['three']);
  assert.deepEqual(findDuplicates(a, [article('four', 'bridge')]), []);
});

test('first five releases need named approval bound to exact content; later release can be automatic', () => {
  const a = article(), editorial = state();
  assert.equal(publicationDecision(a, editorial, { now }).allowed, false);
  editorial.approvals.push({ slug: a.data.slug, contentSha256: a.digest, reviewer: 'editor', reviewedAt: '2026-10-19' });
  assert.equal(publicationDecision(a, editorial, { now }).manualApproval, true);
  const changed = parseArticle(serializeArticle(a.data, `${a.body}\nNew content.`));
  assert.equal(publicationDecision(changed, editorial, { now }).allowed, false);
  Object.assign(editorial, reviewedHistory());
  assert.equal(publicationDecision(changed, editorial, { now }).allowed, true);
  editorial.autoPublishEnabled = false;
  assert.equal(publicationDecision(changed, editorial, { now }).allowed, false);
});

test('rolling seven-day cap applies to manually approved and automatic releases', () => {
  const editorial = state();
  editorial.publications = ['16', '17', '18'].map((day) => ({ publishedAt: `2026-10-${day}T09:00:00Z`, manualApproval: true }));
  const result = publicationDecision(article(), editorial, { now });
  assert.equal(result.allowed, false);
  assert.match(result.reason, /cap/);
  const a = article();
  editorial.approvals.push({ slug: a.data.slug, contentSha256: a.digest, reviewer: 'human-editor', reviewedAt: '2026-10-19' });
  assert.equal(publicationDecision(a, editorial, { now: new Date('2026-10-23T09:00:00Z') }).allowed, true, 'a release exactly seven days old leaves the rolling window');
});

test('only distinct past releases with matching named approval evidence unlock automation', () => {
  const editorial = { ...state(), ...reviewedHistory() };
  assert.equal(manualReleaseCount(editorial, { now }), 5);
  editorial.approvals.pop();
  assert.equal(manualReleaseCount(editorial, { now }), 4);
  assert.equal(publicationDecision(article(), editorial, { now }).allowed, false);
  editorial.publications.push(editorial.publications[0]);
  assert.equal(manualReleaseCount(editorial, { now }), 4, 'duplicate records cannot advance the gate');
  editorial.approvals[0].reviewedAt = '2026-10-20';
  assert.equal(manualReleaseCount(editorial, { now }), 3, 'a later approval cannot prove a prior release was reviewed');
  editorial.publications[0].publishedAt = '2027-10-19T09:00:00Z';
  assert.match(publicationDecision(article(), editorial, { now }).reason, /future-dated/);
});

test('approval and successful release preserve prose, record provenance, and never republish', async (t) => {
  const root = await fixture(t);
  await assert.rejects(approveArticle(root, 'airport-checklist', '--approve', { now }), /named reviewer/);
  await assert.rejects(approveArticle(root, 'airport-checklist', 'human-editor', { now }), /exact reviewed/);
  await assert.rejects(approveArticle(root, 'airport-checklist', 'human-editor', { now, expectedSha256: sha256('a different version') }), /no longer matches/);
  await approveArticle(root, 'airport-checklist', 'human-editor', { now, expectedSha256: article().digest });
  const result = await publishCandidates(root, registry(), report(), { now });
  assert.equal(result[0].status, 'published');
  const [published] = await readArticles(root);
  assert.equal(published.body.trim(), article().body.trim());
  assert.equal(published.data.publishedAt, '2026-10-19');
  const ledger = await readJson(path.join(root, 'automation/editorial.json'));
  assert.equal(ledger.publications[0].manualApproval, true);
  assert.equal(ledger.publications[0].contentSha256, articleDigest(published.data, published.body));
  assert.deepEqual(await publishCandidates(root, registry(), report(), { now }), []);
});

test('unavailable source holds release, writes failure queue, and leaves published file untouched', async (t) => {
  const existing = article('live-article', 'live');
  existing.data.status = 'published'; existing.data.publishedAt = '2026-10-01';
  existing.raw = serializeArticle(existing.data, existing.body);
  const root = await fixture(t, [article(), existing]);
  const before = await fs.readFile(path.join(root, 'src/content/articles/live-article.md'), 'utf8');
  await approveArticle(root, 'airport-checklist', 'human-editor', { now, expectedSha256: article().digest });
  const failedReport = report(); failedReport.sources[0].status = 'unavailable';
  const result = await publishCandidates(root, registry(), failedReport, { now });
  assert.equal(result[0].status, 'held');
  assert.equal(await fs.readFile(path.join(root, 'src/content/articles/live-article.md'), 'utf8'), before);
  assert.equal((await readJson(path.join(root, 'automation/review-queue.json')))[0].stage, 'publish');
});

test('publication refuses old health reports', async (t) => {
  const root = await fixture(t), old = report(); old.checkedAt = '2026-10-15T00:00:00Z';
  await assert.rejects(publishCandidates(root, registry(), old, { now }), /current source check/);
  old.checkedAt = 'not-a-date';
  await assert.rejects(publishCandidates(root, registry(), old, { now }), /current source check/);
});

test('fresh report envelopes cannot hide stale individual source checks or another baseline hash', async (t) => {
  const root = await fixture(t);
  await approveArticle(root, 'airport-checklist', 'human-editor', { now, expectedSha256: article().digest });
  const stale = report();
  stale.sources[0].checkedAt = new Date(now.getTime() - 24 * 3600000 - 1).toISOString();
  assert.ok((await publishCandidates(root, registry(), stale, { now }))[0].errors.some((error) => error.startsWith('Source health is not current')));
  const wrong = report(); wrong.sources[0].contentHash = sha256('another official page revision');
  assert.ok((await publishCandidates(root, registry(), wrong, { now }))[0].errors.some((error) => error.includes('approved baseline')));
  const future = report(); future.sources[0].checkedAt = new Date(now.getTime() + 1).toISOString();
  assert.ok((await publishCandidates(root, registry(), future, { now }))[0].errors.some((error) => error.startsWith('Source health is not current')));
  assert.equal((await readArticles(root))[0].data.status, 'review');
});

test('monitoring without credentials writes source-health and review queue without approving or publishing', async (t) => {
  const root = await fixture(t);
  const initial = registry(); delete initial.sources[0].contentHash;
  await writeJson(path.join(root, 'automation/sources.json'), initial);
  const beforeLedger = await fs.readFile(path.join(root, 'automation/editorial.json'), 'utf8');
  const beforeArticle = (await readArticles(root))[0].raw;
  const result = await runPipeline(root, { now, env: {}, fetcher: async (url) => { assert.equal(new URL(url).hostname, 'www.bart.gov'); return sourceFetch(); } });
  assert.deepEqual(result.generated, []);
  assert.deepEqual(result.publications, []);
  assert.equal((await readJson(path.join(root, 'automation/source-health.json'))).sources[0].status, 'baseline-missing');
  assert.equal((await readJson(path.join(root, 'automation/sources.json'))).sources[0].contentHash, undefined);
  assert.equal(await fs.readFile(path.join(root, 'automation/editorial.json'), 'utf8'), beforeLedger);
  assert.equal((await readArticles(root))[0].raw, beforeArticle);
  assert.equal((await readJson(path.join(root, 'automation/review-queue.json')))[0].stage, 'source-check');
});

test('an unavailable ready brief does not starve the next independent source-covered brief', async (t) => {
  const root = await fixture(t, []);
  const common = { type: 'guide', topic: 'san-francisco-without-a-car', status: 'ready', brief: 'Compare independent travel decisions', sources: ['official-transit'], facts: ['station-fact'], related: [] };
  await writeJson(path.join(root, 'automation/topics.json'), { topics: [
    { ...common, slug: 'source-held', primaryIntent: 'A first independent problem', sources: ['unregistered-source'] },
    { ...common, slug: 'source-covered', primaryIntent: 'A second independent problem' },
  ] });
  let paidCalls = 0;
  const fetcher = async (url) => {
    if (!String(url).includes('api.openai.com')) return sourceFetch();
    paidCalls += 1;
    return Response.json({ choices: [{ message: { content: JSON.stringify({ title: 'Independent arrival decisions', description: 'A useful comparison guide.', body: body('second') }) } }] });
  };
  const result = await runPipeline(root, { draft: true, now, fetcher, env: { DRAFT_API_KEY: 'fixture', DRAFT_MODEL: 'fixture' } });
  assert.deepEqual(result.generated, ['source-covered']);
  assert.equal(result.heldDrafts[0].slug, 'source-held');
  assert.equal(paidCalls, 1);
});

test('duplicate-intent preflight prevents a model request and records the hold', async (t) => {
  const root = await fixture(t);
  const topic = { slug: 'another-title', topic: 'san-francisco-without-a-car', status: 'ready', primaryIntent: article().data.primaryIntent, brief: 'An overlapping intent', sources: ['official-transit'], facts: ['station-fact'], related: [] };
  assert.ok(topicPreflight(topic, registry(), report(), [article()], { now }).some((error) => error.includes('already covered')));
  await writeJson(path.join(root, 'automation/topics.json'), { topics: [topic] });
  const result = await runPipeline(root, { draft: true, now, env: { DRAFT_API_KEY: 'fixture', DRAFT_MODEL: 'fixture' }, fetcher: async (url) => { assert.equal(new URL(url).hostname, 'www.bart.gov'); return sourceFetch(); } });
  assert.deepEqual(result.generated, []);
  assert.equal(result.heldDrafts.length, 1);
  assert.equal((await readArticles(root)).length, 1);
});

test('model cannot choose filenames, metadata, scripts or arbitrary API endpoints', async () => {
  const topic = { slug: 'new-draft', topic: 'san-francisco-without-a-car', primaryIntent: 'How can I plan an arrival?', brief: 'Planning', sources: ['official-transit'], facts: ['station-fact'] };
  const texts = new Map([['official-transit', officialText]]);
  const env = { DRAFT_API_KEY: 'test-not-a-real-key', DRAFT_MODEL: 'fixture-model' };
  let called = false;
  const fetcher = async (_url, options) => {
    called = true;
    const request = JSON.parse(options.body);
    assert.match(request.messages[0].content, /untrusted data/);
    return Response.json({ choices: [{ message: { content: JSON.stringify({ title: 'Useful travel planning', description: 'A comparison guide.', body: body('new') }) } }] });
  };
  const generated = await generateDraft(topic, registry(), texts, { fetcher, env, now });
  assert.equal(called, true);
  assert.equal(generated.data.slug, 'new-draft');
  assert.equal(generated.data.status, 'review');
  await assert.rejects(generateDraft(topic, registry(), texts, { fetcher, env: { ...env, DRAFT_API_BASE_URL: 'http://localhost' }, now }), /approved HTTPS/);
  await assert.rejects(generateDraft(topic, registry(), texts, { fetcher: async () => Response.json({ choices: [{ message: { content: '{"title":"x","description":"x","body":"x","filename":"../../bad.js"}' } }] }), env, now }), /controlled response shape/);
});

test('pipeline safely generates a review draft then holds it at manual gate', async (t) => {
  const root = await fixture(t, []);
  await writeJson(path.join(root, 'automation/topics.json'), { topics: [{ slug: 'new-arrival', type: 'guide', topic: 'san-francisco-without-a-car', status: 'ready', primaryIntent: 'How should an airport arrival be planned?', brief: 'Compare arrival planning choices', sources: ['official-transit'], facts: ['station-fact'], related: [] }] });
  const fetcher = async (url) => String(url).includes('api.openai.com') ? Response.json({ choices: [{ message: { content: JSON.stringify({ title: 'Arrival planning guide', description: 'Plan the airport arrival.', body: body('arrival') }) } }] }) : sourceFetch();
  const result = await runPipeline(root, { draft: true, publish: true, now, fetcher, env: { DRAFT_API_KEY: 'fixture', DRAFT_MODEL: 'fixture' } });
  assert.deepEqual(result.generated, ['new-arrival']);
  assert.equal(result.publications[0].status, 'held');
  assert.equal((await readArticles(root))[0].data.status, 'review');
});

test('model failure and duplicate draft do not overwrite existing content', async (t) => {
  const root = await fixture(t);
  await writeJson(path.join(root, 'automation/topics.json'), { topics: [{ slug: 'another-guide', topic: 'san-francisco-without-a-car', status: 'ready', primaryIntent: 'Different intent', brief: 'Compare', sources: ['official-transit'], facts: ['station-fact'] }] });
  const before = await fs.readFile(path.join(root, 'src/content/articles/airport-checklist.md'), 'utf8');
  const fetcher = async (url) => String(url).includes('api.openai.com') ? Response.json({ choices: [{ message: { content: JSON.stringify({ title: 'Duplicate guide', description: 'Duplicate', body: body() }) } }] }) : sourceFetch();
  const result = await runPipeline(root, { draft: true, now, fetcher, env: { DRAFT_API_KEY: 'fixture', DRAFT_MODEL: 'fixture' } });
  assert.match(result.errors[0], /Duplicate/);
  assert.equal((await readArticles(root)).length, 1);
  assert.equal(await fs.readFile(path.join(root, 'src/content/articles/airport-checklist.md'), 'utf8'), before);
});

test('Search Console CSV handles quoted fields and imports actual metrics without publication', () => {
  const rows = importQueries('Top queries,Clicks,Impressions,CTR,Position\n"SFO, luggage",3,"1,234",1%,8.4\nMuni pass,2,200,1%,12.1');
  assert.equal(rows[0].query, 'SFO, luggage');
  assert.equal(rows[0].impressions, 1234);
  assert.equal(rows[0].status, 'needs-editorial-assessment');
  assert.throws(() => importQueries('query,clicks,impressions\nx,bad,3'), /Invalid/);
});
