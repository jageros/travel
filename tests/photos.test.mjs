import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import photos from '../src/data/photos.json' with { type: 'json' };
import { readArticles, readJson, validateArticle } from '../scripts/content-lib.mjs';
import { validatePhotoRegistry } from '../scripts/photo-lib.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const expectedIds = ['city-cable-car', 'golden-gate', 'bart-train', 'muni-streetcar', 'sfo-bart'];
const initialSlugs = ['san-francisco-without-a-car', 'sfo-to-fishermans-wharf-with-luggage', 'bart-vs-muni-clipper', 'is-muni-pass-worth-it', 'golden-gate-bridge-without-a-car'];
const destinationCovers = ['grand-canyon', 'yellowstone', 'yosemite', 'golden-gate', 'statue-of-liberty', 'national-mall', 'kennedy-space-center', 'balboa-park'];

test('registered local covers preserve initial images and have complete provenance and exact file hashes', async () => {
  for (const id of [...new Set([...expectedIds, ...destinationCovers])]) assert.ok(photos.some(photo => photo.id === id), id);
  assert.deepEqual(await validatePhotoRegistry(photos, { root }), []);
});

test('image validation rejects missing descriptions, altered bytes, unsafe sources and missing permission', async () => {
  const sample = photos[0];
  const invalid = { ...sample, alt: '', sha256: '0'.repeat(64), sourceUrl: 'https://localhost/photo', kind: 'official' };
  const errors = await validatePhotoRegistry([invalid], { root });
  assert.ok(errors.some(error => error.includes('alt is required')));
  assert.ok(errors.some(error => error.includes('local image SHA-256 does not match')));
  assert.ok(errors.some(error => error.includes('invalid image source')));
  const official = { ...sample, kind: 'official', sourceUrl: 'https://www.nasa.gov/image/', permissionNote: 'Fixture permission statement' };
  assert.deepEqual(await validatePhotoRegistry([official], { root }), []);
  assert.ok((await validatePhotoRegistry([{ ...official, permissionNote: '' }], { root })).some(error => error.includes('invalid image source')));
  const pexels = photos.find(photo => photo.id === 'balboa-park');
  assert.ok((await validatePhotoRegistry([{ ...pexels, originalUrl: 'https://images.pexels.com/photos/1/pexels-photo-1.jpeg' }], { root }))
    .some(error => error.includes('invalid image source')));
});

test('AI illustration requires the generation date, provider and prompt summary', async () => {
  const illustration = {
    ...photos[0],
    kind: 'illustration',
    generation: { generatedAt: '2026-10-20', provider: 'Fixture provider', promptSummary: 'A stitched map of mountains' },
  };
  assert.deepEqual(await validatePhotoRegistry([illustration], { root }), []);
  assert.ok((await validatePhotoRegistry([{ ...illustration, generation: { ...illustration.generation, promptSummary: '' } }], { root }))
    .some(error => error.includes('invalid image source')));
});

test('all five initial articles use registered photo IDs with no source overrides', async () => {
  const articles = await readArticles(root);
  const initial = articles.filter((article) => initialSlugs.includes(article.data.slug));
  assert.equal(initial.length, 5);
  for (const article of initial) {
    assert.deepEqual(Object.keys(article.data.hero ?? {}), ['photoId'], article.file);
    assert.ok(expectedIds.includes(article.data.hero.photoId), article.file);
  }
});

test('article validation rejects unknown photos and metadata mixing while retaining licensed legacy heroes', async () => {
  const original = (await readArticles(root)).find(article => article.data.slug === 'bart-vs-muni-clipper');
  const registry = await readJson(path.join(root, 'automation/sources.json'));
  const latestCheckedDay = [original.data.updatedAt, original.data.checkedAt, ...registry.sources.map((source) => source.checkedAt)].sort().at(-1);
  const now = new Date(`${latestCheckedDay}T12:00:00Z`);
  const errorsWithHero = (hero) => validateArticle({ ...original, data: { ...original.data, hero } }, registry, { now });
  for (const photo of photos) assert.deepEqual(errorsWithHero({ photoId: photo.id }), [], photo.id);
  assert.ok(errorsWithHero({ photoId: 'unregistered-photo' }).some((error) => error.includes('registered photo')));
  assert.ok(errorsWithHero({ photoId: photos[0].id, src: 'https://untrusted.example/photo.jpg' }).some((error) => error.includes('without legacy fields')));
  assert.ok(errorsWithHero({ photoId: photos[0].id, alt: 'Override' }).some((error) => error.includes('without legacy fields')));
  assert.deepEqual(errorsWithHero({ src: '/images/transit.svg', alt: 'Transit diagram', credit: 'Travel editorial team', license: 'CC0' }), []);
});
