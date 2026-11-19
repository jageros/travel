import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { parseArticle, serializeArticle, writeJson } from '../scripts/content-lib.mjs';
import { publishTranslations, readTranslations, saveTranslationDraft, translationFromDraft, translationLocales, translationPlan, validateTranslations } from '../scripts/translation-pipeline.mjs';

const now = new Date('2026-11-19T09:00:00.000Z');
const sourceBody = `## Why this place is worth visiting\n\n${'A practical planning detail for this destination. '.repeat(18)}\n\n## What to see\n\nReview the official visitor information before you travel.`;
const translationBody = `## Pourquoi ce lieu mérite une visite\n\n${'Un conseil pratique pour préparer cette destination. '.repeat(18)}\n\n## À voir\n\nConsultez les informations officielles avant votre départ.`;
const source = parseArticle(serializeArticle({
  title: 'A destination worth visiting', description: 'A practical overview of highlights and planning details for a visit.',
  slug: 'sample-park', type: 'destination', topic: 'us-destinations', status: 'published', author: 'editorial-team',
  publishedAt: '2026-11-18', updatedAt: '2026-11-18', checkedAt: '2026-11-18', primaryIntent: 'How should I plan a visit?',
  sources: ['official-park'], facts: [], region: 'Arizona', location: 'Sample Park', category: 'national-parks', featured: true,
  hero: { photoId: 'sample-park' },
}, sourceBody), 'sample-park.md');

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'travel-translations-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, 'src/content/articles'), { recursive: true });
  await fs.writeFile(path.join(root, 'src/content/articles/sample-park.md'), source.raw);
  await writeJson(path.join(root, 'automation/locales.json'), {
    version: 1, default: 'en-US', locales: [
      { code: 'en-US', path: '', label: 'English', dir: 'ltr', enabled: true },
      { code: 'fr', path: 'fr', label: 'Français', dir: 'ltr', enabled: true },
      { code: 'ar', path: 'ar', label: 'العربية', dir: 'rtl', enabled: true },
    ],
  });
  return root;
}

test('locale registry validates route paths, directions and default locale', () => {
  const records = translationLocales({ default: 'en-US', locales: [
    { code: 'en-US', path: '', label: 'English', dir: 'ltr' },
    { code: 'ar', path: 'ar', label: 'العربية', dir: 'rtl' },
  ] });
  assert.equal(records.find(record => record.code === 'ar').dir, 'rtl');
  assert.throws(() => translationLocales({ default: 'fr', locales: [{ code: 'en-US', path: '', label: 'English', dir: 'ltr' }] }), /default locale/);
  assert.throws(() => translationLocales({ default: 'en-US', locales: [{ code: 'en-US', path: '', label: 'English', dir: 'ltr' }, { code: 'ar', path: 'AR', label: 'Arabic', dir: 'rtl' }] }), /Invalid/);
});

test('translation planning selects at most four originals and returns stale or missing locale pairs', async t => {
  const root = await fixture(t);
  const plan = await translationPlan(root, { maxOriginals: 4 });
  assert.deepEqual(plan.selected, ['sample-park']);
  assert.equal(plan.jobs.length, 2);
  assert.deepEqual(plan.jobs.map(job => job.locale), ['fr', 'ar']);
  assert.equal(plan.jobs[0].sourceDigest, source.digest);
});

test('save and publish keeps source digest, independent status and English ledger untouched', async t => {
  const root = await fixture(t);
  const saved = await saveTranslationDraft(root, 'fr', 'sample-park', {
    title: 'Une destination à découvrir', description: 'Un aperçu pratique des points forts et de la préparation de la visite.', body: translationBody,
  }, { now, expectedSourceDigest: source.digest });
  assert.equal(saved.locale, 'fr');
  const translations = await readTranslations(root);
  assert.equal(translations[0].data.status, 'review');
  assert.equal(translations[0].data.sourceDigest, source.digest);
  assert.match(translations[0].data.supplementalDigest, /^[a-f0-9]{64}$/);
  assert.deepEqual(await publishTranslations(root, { now }), [{ locale: 'fr', sourceSlug: 'sample-park', status: 'published' }]);
  const result = await validateTranslations(root, { now });
  assert.deepEqual(result.errors, []);
  assert.equal((await readTranslations(root))[0].data.status, 'published');
});

test('Arabic drafts require Arabic script and stale sources are held and requeued', async t => {
  const root = await fixture(t);
  assert.throws(() => translationFromDraft(source, 'ar', {
    title: 'An Arabic title', description: 'A sufficiently long description for an Arabic translation.', body: translationBody.replace(/[À-ÿ\u00a0-\uffff]/g, 'Latin'),
  }, now), /Arabic script/);
  const saved = await saveTranslationDraft(root, 'ar', 'sample-park', {
    title: 'وجهة تستحق الزيارة', description: 'نظرة عملية على أبرز المعالم وكيفية التخطيط للزيارة.', body: `## لماذا تستحق الزيارة\n\n${'تفصيل عملي يساعد على التخطيط لهذه الوجهة. '.repeat(20)}\n\n## ما الذي يمكن رؤيته\n\nتحقق من المعلومات الرسمية قبل السفر.`,
  }, { now });
  assert.equal(saved.locale, 'ar');
  await fs.writeFile(path.join(root, 'src/content/articles/sample-park.md'), source.raw.replace('A destination worth visiting', 'A changed destination worth visiting'));
  const held = await publishTranslations(root, { now });
  assert.equal(held[0].status, 'held');
  assert.match(held[0].errors.join(' '), /digest changed/);
  assert.equal((await validateTranslations(root, { now })).errors.length, 1);
});

test('publication requires a fresh unchanged official-source report when a registry is present', async t => {
  const root = await fixture(t);
  await writeJson(path.join(root, 'automation/sources.json'), {
    version: 1, allowedHosts: ['www.example.gov'], sources: [{ id: 'official-park', url: 'https://www.example.gov/park', title: 'Park', publisher: 'Official', checkedAt: '2026-11-19', contentHash: 'a'.repeat(64), facts: [] }],
  });
  await writeJson(path.join(root, 'automation/source-health.json'), {
    checkedAt: '2026-11-18T08:00:00.000Z', sources: [{ id: 'official-park', status: 'unchanged', checkedAt: '2026-11-18T08:00:00.000Z', contentHash: 'a'.repeat(64) }], conflicts: [],
  });
  await saveTranslationDraft(root, 'fr', 'sample-park', {
    title: 'Une destination à découvrir', description: 'Un aperçu pratique des points forts et de la préparation de la visite.', body: translationBody,
  }, { now });
  const held = await publishTranslations(root, { now });
  assert.equal(held[0].status, 'held');
  assert.match(held[0].errors.join(' '), /source report is missing or stale/);
  await writeJson(path.join(root, 'automation/source-health.json'), {
    checkedAt: now.toISOString(), sources: [{ id: 'official-park', status: 'unchanged', checkedAt: now.toISOString(), contentHash: 'a'.repeat(64) }], conflicts: [],
  });
  assert.deepEqual(await publishTranslations(root, { now }), [{ locale: 'fr', sourceSlug: 'sample-park', status: 'published' }]);
});

