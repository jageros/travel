import assert from 'node:assert/strict';
import test from 'node:test';
import { factMap, isSlug, normalizedIntent, readArticles, readJson } from '../scripts/content-lib.mjs';
import { topicPreflight } from '../scripts/content-pipeline.mjs';

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
