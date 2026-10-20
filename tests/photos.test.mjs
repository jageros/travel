import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import photos from '../src/data/photos.json' with { type: 'json' };
import { isDay, readArticles, readJson, validateArticle } from '../scripts/content-lib.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const expectedIds = ['city-cable-car', 'golden-gate', 'bart-train', 'muni-streetcar', 'sfo-bart'];
const initialSlugs = ['san-francisco-without-a-car', 'sfo-to-fishermans-wharf-with-luggage', 'bart-vs-muni-clipper', 'is-muni-pass-worth-it', 'golden-gate-bridge-without-a-car'];
const allowedLicenses = new Map([
  ['CC0-1.0', '/publicdomain/zero/1.0/'],
  ['CC-BY-4.0', '/licenses/by/4.0/'],
  ['CC-BY-3.0', '/licenses/by/3.0/'],
  ['CC-BY-2.0', '/licenses/by/2.0/'],
  ['CC-BY-SA-4.0', '/licenses/by-sa/4.0/'],
]);

test('photo registry includes the five initial editorial photos with complete provenance', () => {
  assert.ok(Array.isArray(photos));
  for (const id of expectedIds) assert.ok(photos.some((photo) => photo.id === id), id);
  assert.equal(new Set(photos.map((photo) => photo.id)).size, photos.length);
  assert.equal(new Set(photos.map((photo) => photo.file)).size, photos.length);
  for (const photo of photos) {
    assert.match(photo.file, /^[a-z0-9]+(?:-[a-z0-9]+)*\.jpe?g$/, photo.id);
    assert.equal(typeof photo.title, 'string');
    assert.ok(photo.title.trim(), photo.id);
    assert.equal(typeof photo.author, 'string');
    assert.ok(photo.author.trim(), photo.id);
    assert.ok(isDay(photo.checkedAt), photo.id);
    const source = new URL(photo.sourceUrl);
    assert.equal(source.protocol, 'https:', photo.id);
    assert.equal(source.hostname, 'commons.wikimedia.org', photo.id);
    assert.equal(source.username + source.password + source.port, '', photo.id);
    assert.ok(source.pathname.startsWith('/wiki/File:'), photo.id);
    const licensePath = allowedLicenses.get(photo.license);
    assert.ok(licensePath, `${photo.id}: unsupported license ${photo.license}`);
    const licenseUrl = new URL(photo.licenseUrl);
    assert.equal(licenseUrl.protocol, 'https:', photo.id);
    assert.equal(licenseUrl.hostname, 'creativecommons.org', photo.id);
    assert.equal(licenseUrl.username + licenseUrl.password + licenseUrl.port, '', photo.id);
    assert.equal(licenseUrl.pathname, licensePath, photo.id);
  }
});

test('each original JPEG is present and matches its reviewed SHA-256', async () => {
  for (const photo of photos) {
    const bytes = await fs.readFile(path.join(root, 'src/assets/photos', photo.file));
    assert.ok(bytes.length > 1000, photo.id);
    assert.deepEqual([...bytes.subarray(0, 3)], [0xff, 0xd8, 0xff], `${photo.id}: original must be JPEG`);
    assert.match(photo.sha256, /^[a-f0-9]{64}$/, photo.id);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), photo.sha256, photo.id);
  }
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
  const [original] = await readArticles(root);
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
