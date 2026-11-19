import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import sharp from 'sharp';
import { prepareCommonsPhoto, searchCommonsPhotos } from '../scripts/commons-photo.mjs';
import { validatePhotoRegistry } from '../scripts/photo-lib.mjs';

const width = 2600;
const height = 1500;
const original = await sharp({ create: { width, height, channels: 3, background: '#537391' } }).jpeg().toBuffer();
const originalSha1 = createHash('sha1').update(original).digest('hex');
const commonsTitle = 'File:Acadia Coast fixture.jpg';
const originalUrl = 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Acadia_Coast_fixture.jpg';
const sourceUrl = 'https://commons.wikimedia.org/wiki/File:Acadia_Coast_fixture.jpg';
const thumbnailUrl = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8c/Acadia_Coast_fixture.jpg/640px-Acadia_Coast_fixture.jpg';
const proposal = { id: 'acadia-coast', commonsTitle, title: 'Acadia Coast', alt: 'Granite ledges over a blue sea', caption: 'A view of the Acadia coast.' };

function page(overrides = {}, metadata = {}) {
  const values = {
    ObjectName: { value: 'Acadia Coast fixture' },
    Artist: { value: '<a href="//commons.wikimedia.org/wiki/User:Test">Ren&eacute;e &amp; Kai</a><script>skip</script>' },
    Attribution: { value: 'Ren&eacute;e &amp; Kai, Coastal Parks Collection' },
    ImageDescription: { value: 'Granite ledges near the shore.' },
    Categories: { value: 'Acadia National Park|Photographs of rocky shores' },
    LicenseShortName: { value: 'CC BY-SA 4.0' },
    LicenseUrl: { value: 'http://creativecommons.org/licenses/by-sa/4.0/deed.en' },
    Restrictions: { value: '' },
    ...metadata,
  };
  return {
    title: commonsTitle, ns: 6, imagerepository: 'local', index: 2,
    imageinfo: [{
      width, height, mime: 'image/jpeg', mediatype: 'BITMAP', size: original.length,
      sha1: originalSha1, url: `${originalUrl}?utm_source=commons.wikimedia.org`,
      descriptionurl: sourceUrl, thumburl: `${thumbnailUrl}?utm_source=commons.wikimedia.org`,
      extmetadata: values, ...overrides,
    }],
  };
}

function fixture(fetchCalls, pages, bytes = original) {
  return (input, options) => {
    const url = new URL(input);
    fetchCalls.push(url.href);
    assert.equal(options.redirect, 'error');
    assert.match(options.headers['Api-User-Agent'], /cedartrips\.com/);
    if (url.hostname === 'commons.wikimedia.org') {
      assert.equal(url.pathname, '/w/api.php');
      assert.equal(url.searchParams.get('prop'), 'imageinfo');
      return Response.json({ query: { pages } });
    }
    assert.equal(url.href, originalUrl);
    return new Response(bytes, { headers: { 'Content-Type': 'image/jpeg' } });
  };
}

test('Commons intake verifies author, reusable rights and original bytes, then saves a bounded JPEG record', async (t) => {
  const calls = [];
  const result = await prepareCommonsPhoto(proposal, {
    now: new Date('2026-11-19T11:00:00Z'), fetcher: fixture(calls, [page()]),
  });
  assert.equal(new URL(calls[0]).searchParams.get('titles'), commonsTitle);
  assert.equal(calls[1], originalUrl);
  assert.equal(result.record.sourceTitle, commonsTitle);
  assert.equal(result.record.sourceUrl, sourceUrl);
  assert.equal(result.record.author, 'Renée & Kai');
  assert.equal(result.record.license, 'CC-BY-SA-4.0');
  assert.equal(result.record.licenseUrl, 'https://creativecommons.org/licenses/by-sa/4.0/');
  assert.equal(result.record.originalSha1, originalSha1);
  assert.equal(result.record.width, 2400);
  assert.equal(result.record.checkedAt, '2026-11-19');
  assert.deepEqual(result.metadata.categories, ['Acadia National Park', 'Photographs of rocky shores']);
  assert.equal(result.metadata.description, 'Granite ledges near the shore.');
  assert.equal((await sharp(result.bytes).metadata()).height, result.record.height);
  assert.match(result.record.permissionNote, /resized/);
  assert.match(result.record.permissionNote, /Renée & Kai, Coastal Parks Collection/);

  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cedar-commons-test-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const folder = path.join(root, 'src/assets/photos');
  await fs.mkdir(folder, { recursive: true });
  await fs.writeFile(path.join(folder, result.record.file), result.bytes);
  assert.deepEqual(await validatePhotoRegistry([result.record], { root }), []);
});

test('Commons search returns licensed photos with stripped tracking and no original downloads', async () => {
  const calls = [];
  const cc0 = page({}, {
    LicenseShortName: { value: 'CC0' },
    LicenseUrl: { value: 'http://creativecommons.org/publicdomain/zero/1.0/deed.en' },
  });
  const results = await searchCommonsPhotos('Acadia Maine', {
    fetcher: fixture(calls, [
      page({ url: 'https://not-commons.example/wikipedia/commons/8/8c/Acadia_Coast_fixture.jpg' }),
      cc0,
      page({}, { Categories: { value: 'AI-generated images' } }),
    ]),
  });
  const url = new URL(calls[0]);
  assert.equal(url.searchParams.get('gsrnamespace'), '6');
  assert.match(url.searchParams.get('gsrsearch'), /Acadia Maine/);
  assert.equal(calls.length, 1);
  assert.equal(results.length, 1);
  assert.equal(results[0].thumbnailUrl, thumbnailUrl);
  assert.equal(results[0].licenseUrl, 'https://creativecommons.org/publicdomain/zero/1.0/');
});

test('Commons rejects unclear permissions before downloading an original', async () => {
  const badRecords = [
    page({}, { LicenseShortName: { value: 'CC BY-NC 4.0' } }),
    page({}, { LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/3.0/' } }),
    page({}, { LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0/?wrong' } }),
    page({}, { Artist: { value: 'Unknown author' } }),
    page({}, { Restrictions: { value: 'personality rights' } }),
    page({ url: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Other_file.jpg' }),
    page({ width: 17_000, height: 17_000 }),
    page({ mediatype: 'DRAWING' }),
  ];
  for (const bad of badRecords) {
    const calls = [];
    await assert.rejects(prepareCommonsPhoto(proposal, { fetcher: fixture(calls, [bad]) }), /requires a matching JPEG/);
    assert.equal(calls.length, 1);
  }
});

test('Commons intake fails closed on altered, mislabeled or oversized original bytes', async () => {
  const altered = Buffer.from(original);
  altered[5] ^= 0xff;
  await assert.rejects(prepareCommonsPhoto(proposal, {
    fetcher: fixture([], [page()], altered),
  }), /published SHA-1/);
  await assert.rejects(prepareCommonsPhoto(proposal, {
    fetcher: fixture([], [page({ width: 2500 })]),
  }), /registered JPEG dimensions/);
  await assert.rejects(prepareCommonsPhoto(proposal, {
    fetcher: fixture([], [page({ size: 17_000_000 })]),
  }), /requires a matching JPEG/);
});
