import assert from 'node:assert/strict';
import test from 'node:test';
import { factMap, isSlug, normalizedIntent, readArticles, readJson } from '../scripts/content-lib.mjs';
import { topicPreflight } from '../scripts/content-pipeline.mjs';

const launchSlugs = [
  'grand-canyon', 'yellowstone', 'yosemite', 'golden-gate-bridge-without-a-car',
  'statue-of-liberty', 'national-mall', 'kennedy-space-center', 'balboa-park',
];

test('follow-up briefs have distinct stable IDs and ready briefs have registered fact coverage', async () => {
  const queue = await readJson(new URL('../automation/topics.json', import.meta.url));
  const registry = await readJson(new URL('../automation/sources.json', import.meta.url));
  const articles = await readArticles(process.cwd());
  const facts = factMap(registry);
  const sourceIds = new Set(registry.sources.map((source) => source.id));
  assert.equal(new Set(queue.topics.map((topic) => topic.slug)).size, queue.topics.length);
  assert.equal(new Set(queue.topics.map((topic) => normalizedIntent(topic.primaryIntent))).size, queue.topics.length);
  for (const topic of queue.topics) {
    assert.ok(isSlug(topic.slug), topic.slug);
    assert.equal(typeof topic.primaryIntent, 'string', topic.slug);
    assert.ok(topic.primaryIntent.trim(), topic.slug);
    assert.equal(typeof topic.brief, 'string', topic.slug);
    assert.ok(topic.brief.trim(), topic.slug);
    if (topic.status === 'ready') {
      assert.ok(topic.sources.length > 0 && topic.sources.every((id) => sourceIds.has(id)), topic.slug);
      assert.ok(topic.facts.length > 0 && topic.facts.every((id) => facts.has(id) && topic.sources.includes(facts.get(id).sourceId)), topic.slug);
      assert.equal(topic.sourceGaps?.length ?? 0, 0, `${topic.slug}: unresolved source gaps cannot be ready`);
      assert.ok(!articles.some((article) => article.data.slug !== topic.slug && normalizedIntent(article.data.primaryIntent) === normalizedIntent(topic.primaryIntent)), `${topic.slug}: already covered intent`);
    } else if (topic.status.startsWith('needs-')) {
      assert.ok(topic.reviewNote?.trim() || topic.sourceGaps?.some((gap) => gap.trim()), `${topic.slug}: explain the hold`);
    }
  }
});

test('a ready label cannot bypass explicitly unresolved source gaps', async () => {
  const queue = await readJson(new URL('../automation/topics.json', import.meta.url));
  const registry = await readJson(new URL('../automation/sources.json', import.meta.url));
  const sample = queue.topics[0] ?? { slug: 'pending-brief', topic: 'san-francisco-without-a-car', primaryIntent: 'A pending reader task', brief: 'A source-backed planning task', sources: [], facts: [] };
  const report = { sources: [], conflicts: [] };
  assert.ok(topicPreflight({ ...sample, status: 'ready', sourceGaps: ['An official fact still needs verification'] }, registry, report).some((error) => error.includes('Declared source gaps')));
});

test('the eight launch attractions have registered source baselines and matching destination content', async () => {
  const [queue, registry, articles, goldenGate, ledger] = await Promise.all([
    readJson(new URL('../automation/topics.json', import.meta.url)),
    readJson(new URL('../automation/sources.json', import.meta.url)),
    readArticles(process.cwd()),
    readJson(new URL('../src/data/golden-gate-attraction.json', import.meta.url)),
    readJson(new URL('../automation/editorial.json', import.meta.url)),
  ]);
  const facts = factMap(registry);
  const sources = new Map(registry.sources.map((source) => [source.id, source]));
  const categories = new Set();

  for (const slug of launchSlugs) {
    const brief = queue.topics.find((topic) => topic.slug === slug);
    const article = articles.find((entry) => entry.data.slug === slug);
    assert.ok(brief && article, `${slug}: launch brief and article are required`);
    assert.equal(brief.topic, 'us-destinations');
    assert.equal(article.data.type, 'destination');
    assert.ok(brief.priority > 0 && brief.queryAliases.length > 0, slug);
    assert.equal(brief.featured, true);
    assert.deepEqual(brief.hero, article.data.hero);
    categories.add(brief.category);

    for (const id of brief.sources) {
      const source = sources.get(id);
      assert.ok(source, `${slug}: missing source ${id}`);
      assert.match(source.contentHash, /^[a-f0-9]{64}$/, id);
      assert.ok(registry.allowedHosts.includes(new URL(source.url).hostname), id);
    }
    assert.ok(brief.facts.some((id) => facts.get(id)?.dynamic && facts.get(id).expiresAt), slug);
    for (const id of brief.facts) assert.ok(facts.get(id)?.evidence?.trim(), id);

    const details = slug === goldenGate.slug ? goldenGate : article.data;
    for (const field of ['region', 'location', 'category', 'featured']) assert.equal(details[field], brief[field], `${slug}: ${field}`);
    if (slug === goldenGate.slug) {
      assert.equal(article.data.topic, 'san-francisco-without-a-car');
      assert.equal(article.digest, ledger.publications.find((release) => release.slug === slug)?.contentSha256);
      assert.ok(goldenGate.sources.every((id) => brief.sources.includes(id)));
    } else {
      for (const field of ['topic', 'primaryIntent', 'sources', 'facts', 'related']) assert.deepEqual(article.data[field], brief[field], `${slug}: ${field}`);
    }
  }

  assert.deepEqual(categories, new Set(['national-parks', 'landmarks', 'history-culture', 'science-space', 'urban-parks']));
});
