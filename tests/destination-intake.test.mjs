import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import sharp from 'sharp';
import { enqueueDestination, planDestinationIntake, researchDestination } from '../scripts/destination-intake.mjs';
import { extractText } from '../scripts/check-sources.mjs';
import { readArticles, readJson, serializeArticle, sha256, writeJson } from '../scripts/content-lib.mjs';
import { validatePhotoRegistry } from '../scripts/photo-lib.mjs';

const now = new Date('2026-11-19T11:00:00Z');
const day = '2026-11-19';
const slug = 'acadia-national-park';
const sourceFile = 'automation/sources.json';
const topicFile = 'automation/topics.json';
const photosFile = 'src/data/photos.json';
const articleFile = `src/content/articles/${slug}.md`;
const coverFile = `src/assets/photos/${slug}.jpg`;
const stateUrl = 'https://www.nps.gov/state/me/index.htm';
const overviewUrl = 'https://www.nps.gov/acad/index.htm';
const visitUrl = 'https://www.nps.gov/acad/planyourvisit/index.htm';
const commonsTitle = 'File:Acadia National Park coast fixture.jpg';
const originalUrl = 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Acadia_National_Park_coast_fixture.jpg';
const sourceUrl = 'https://commons.wikimedia.org/wiki/File:Acadia_National_Park_coast_fixture.jpg';
const width = 1300;
const height = 800;
const original = await sharp({ create: { width, height, channels: 3, background: '#537391' } }).jpeg().toBuffer();
const originalSha1 = createHash('sha1').update(original).digest('hex');

const stateHtml = '<main><ul id="list_parks"><li id="asset_acad"><div class="list_left"><p class="list_left__kicker">National Park</p><h3><a href="/acad/">Acadia</a></h3><p class="list_left__subtitle">Bar Harbor, Maine, ME</p><p>The park protects the high rocky shoreline and historic carriage roads.</p></div><a href="http://www.nps.gov/acad/planyourvisit/basicinfo.htm">Basic Information</a></li></ul></main>';
const overviewHtml = '<main>Acadia National Park protects rocky Atlantic headlands. Interior ponds and old carriage roads offer distinct landscape views, so check the official map for the actual route before visiting.</main>';
const visitHtml = '<main>Check changing road access on the visitor information page. Visitors should use the official map to assess their chosen stop and leave time for the return drive or shuttle if available.</main>';
const oldSource = {
  id: 'existing-overview', url: 'https://www.nps.gov/romo/index.htm', title: 'Existing park', publisher: 'National Park Service',
  checkedAt: day, contentHash: sha256('existing normalized evidence'),
  facts: [{ id: 'existing-fact', statement: 'Compare the park access points on the official map.', checkedAt: day }],
};

function draftBody(seed) {
  const headings = ['Why this place is worth visiting', 'What to see', 'Who it suits', 'What to check before going'];
  return headings.map((section, index) => `## ${section}\n\n${Array.from({ length: 94 }, (_, token) => `${seed}detail${index}word${token}`).join(' ')}`).join('\n\n');
}

function proposal() {
  return {
    region: 'Maine', parkCode: 'acad',
    primaryIntent: 'Which coast and carriage road areas should a first time visitor compare?',
    brief: 'Compare one short coastal outing with an interior carriage road stop, including the access decisions to check before travel.',
    facts: [
      { source: 'overview', statement: 'Acadia protects rocky headlands along the Atlantic.', evidence: 'Acadia National Park protects rocky Atlantic headlands.', dynamic: false },
      { source: 'visit', statement: 'Use the visitor information page to check changing road access.', evidence: 'Check changing road access on the visitor information page.', dynamic: true },
    ],
    draft: {
      title: 'Acadia National Park',
      description: 'Compare a coastal viewpoint and an interior stop while planning an Acadia visit.',
      body: draftBody('acadiacoast'),
    },
    photo: { commonsTitle, alt: 'Granite ledges over blue water on the coast', caption: 'Granite ledges on the Acadia coast.' },
  };
}

function fetchFixture({ license = 'CC BY-SA 4.0', originalHook, overviewRedirect, unrelatedPhoto = false } = {}) {
  const calls = [];
  const name = unrelatedPhoto ? 'Unrelated beach fixture.jpg' : commonsTitle.slice(5);
  const fileTitle = `File:${name}`;
  const basename = name.replaceAll(' ', '_');
  const fileUrl = `https://upload.wikimedia.org/wikipedia/commons/8/8c/${basename}`;
  const html = body => new Response(body, { headers: { 'Content-Type': 'text/html' } });
  const fetcher = async (input, options) => {
    const url = new URL(input);
    calls.push(url.href);
    if (url.href === stateUrl) return html(stateHtml);
    if (url.href === overviewUrl) {
      if (overviewRedirect) return new Response(null, { status: 302, headers: { location: overviewRedirect } });
      return html(overviewHtml);
    }
    if (url.href === visitUrl) return html(visitHtml);
    if (url.hostname === 'commons.wikimedia.org') {
      assert.equal(url.pathname, '/w/api.php');
      assert.equal(url.searchParams.get('titles'), fileTitle);
      assert.equal(options.redirect, 'error');
      return Response.json({ query: { pages: [{
        title: fileTitle, ns: 6, imagerepository: 'local',
        imageinfo: [{
          width, height, mime: 'image/jpeg', mediatype: 'BITMAP', size: original.length, sha1: originalSha1,
          url: fileUrl, descriptionurl: `https://commons.wikimedia.org/wiki/File:${basename}`,
          extmetadata: {
            Artist: { value: 'Fixture Photographer' },
            ImageDescription: { value: 'Granite ledges near the shore.' },
            Categories: { value: unrelatedPhoto ? 'Photographs of rocky shores' : 'Acadia National Park|Photographs of rocky shores' },
            LicenseShortName: { value: license },
            LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0/' },
          },
        }],
      }] } });
    }
    if (url.href === fileUrl) {
      await originalHook?.();
      return new Response(original, { headers: { 'Content-Type': 'image/jpeg' } });
    }
    throw new Error(`Unexpected request ${url.href}`);
  };
  return { fetcher, calls };
}

async function fixture(t, { stocked = false } = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cedar-destination-intake-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await Promise.all(['automation', 'src/content/articles', 'src/assets/photos', 'src/data']
    .map(folder => fs.mkdir(path.join(root, folder), { recursive: true })));
  await writeJson(path.join(root, sourceFile), {
    version: 1, allowedHosts: ['www.nps.gov', 'www.bart.gov'], sources: [oldSource],
  });

  const defaultArticle = {
    title: 'Previously published guide', description: 'A previously published and unrelated guide for testing.',
    slug: 'prior-guide', type: 'guide', topic: 'san-francisco-without-a-car', status: 'published',
    author: 'editorial-team', updatedAt: day, checkedAt: day, publishedAt: day,
    primaryIntent: 'Which transfer route can I check for this previously published guide?',
    sources: [oldSource.id], facts: ['existing-fact'], related: [],
  };
  await fs.writeFile(path.join(root, 'src/content/articles/prior-guide.md'), serializeArticle(defaultArticle, draftBody('oldguide')));
  const [existing] = await readArticles(root);
  await writeJson(path.join(root, 'automation/editorial.json'), {
    version: 1, requiredManualApprovals: 0, fullyAutomatic: true,
    autoPublishEnabled: true, approvals: [], publications: [{
      slug: existing.data.slug, publishedAt: now.toISOString(), contentSha256: existing.digest, manualApproval: false,
    }],
  });
  await writeJson(path.join(root, 'automation/source-health.json'), {
    checkedAt: now.toISOString(), conflicts: [],
    sources: [{ id: oldSource.id, checkedAt: now.toISOString(), status: 'unchanged', contentHash: oldSource.contentHash }],
  });
  const topics = [];
  if (stocked) {
    for (let i = 0; i < 6; i++) {
      const entry = `prior-attraction-${i}`;
      const brief = {
        ...defaultArticle, slug: entry, type: 'destination', topic: 'us-destinations', status: 'review',
        region: 'Colorado', location: 'Estes Park', category: 'national-parks', featured: false,
        hero: { photoId: 'prior-cover' }, primaryIntent: `What is an independent plan for test attraction ${i}?`,
      };
      delete brief.publishedAt;
      await fs.writeFile(path.join(root, `src/content/articles/${entry}.md`), serializeArticle(brief, draftBody(`attraction${i}`)));
      topics.push({ ...brief, status: 'ready' });
    }
  }
  await writeJson(path.join(root, topicFile), { version: 1, topics });
  await writeJson(path.join(root, photosFile), stocked ? [{ id: 'prior-cover' }] : []);
  return root;
}

async function snapshot(root, prefix = '') {
  const entries = [];
  for (const file of await fs.readdir(path.join(root, prefix), { withFileTypes: true })) {
    const key = path.join(prefix, file.name);
    if (file.isDirectory()) entries.push(...await snapshot(root, key));
    else if (file.isFile()) entries.push([key, await fs.readFile(path.join(root, key))]);
  }
  return new Map(entries);
}

test('accepted intake adds exactly its review article, verified JPEG and three catalog entries', async (t) => {
  const root = await fixture(t);
  const before = await snapshot(root);
  const { fetcher, calls } = fetchFixture();
  const result = await enqueueDestination(root, proposal(), { now, fetcher });
  assert.equal(result.status, 'review');
  assert.equal(result.slug, slug);
  assert.equal(result.articleFile, articleFile);
  assert.equal(result.photoFile, coverFile);
  assert.equal(result.license, 'CC-BY-SA-4.0');
  assert.equal(calls.length, 5);
  const after = await snapshot(root);
  assert.ok([...before.keys()].every(file => after.has(file)));
  const changed = [...after].filter(([file, bytes]) => !bytes.equals(before.get(file) ?? Buffer.alloc(0))).map(([file]) => file);
  assert.deepEqual(changed.sort(), [articleFile, coverFile, sourceFile, topicFile, photosFile].sort());

  const [registry, queue, photos, articles] = await Promise.all([
    readJson(path.join(root, sourceFile)), readJson(path.join(root, topicFile)),
    readJson(path.join(root, photosFile)), readArticles(root),
  ]);
  assert.deepEqual(registry.sources[0], oldSource);
  assert.equal(registry.sources[1].contentHash, sha256(extractText(overviewHtml)));
  assert.equal(registry.sources[2].contentHash, sha256(extractText(visitHtml)));
  assert.equal(registry.sources[2].facts[0].expiresAt, '2026-11-26');
  const prepared = articles.find(({ data }) => data.slug === slug);
  assert.equal(prepared.data.status, 'review');
  assert.equal(prepared.data.publishedAt, undefined);
  assert.equal(prepared.data.location, 'Bar Harbor');
  assert.deepEqual(prepared.data.sources, result.sources);
  assert.equal(queue.topics[0].status, 'ready');
  assert.deepEqual(queue.topics[0].hero, { photoId: slug });
  assert.equal(photos[0].sourceUrl, sourceUrl);
  assert.equal(photos[0].originalSha1, originalSha1);
  assert.equal(photos[0].sha256, sha256(after.get(coverFile)));
  assert.deepEqual(await validatePhotoRegistry(photos, { root }), []);
});

test('mismatched official evidence and unacceptable licenses leave every file untouched', async (t) => {
  const root = await fixture(t);
  const before = await snapshot(root);
  const unsupportedEvidence = proposal();
  unsupportedEvidence.facts[0].evidence = 'This phrase is missing from the official capture.';
  const evidence = fetchFixture();
  await assert.rejects(enqueueDestination(root, unsupportedEvidence, { now, fetcher: evidence.fetcher }), /Registered evidence not found/);
  assert.ok(evidence.calls.every(url => new URL(url).hostname === 'www.nps.gov'));
  assert.deepEqual(await snapshot(root), before);

  const photo = fetchFixture({ license: 'CC BY-NC 4.0' });
  await assert.rejects(enqueueDestination(root, proposal(), { now, fetcher: photo.fetcher }), /verified author, license, and reuse rights/);
  assert.ok(!photo.calls.includes(originalUrl));
  assert.deepEqual(await snapshot(root), before);
});

test('official redirects cannot leave the chosen park, even for globally allowed hosts', async (t) => {
  const root = await fixture(t);
  const before = await snapshot(root);
  for (const destination of ['https://www.nps.gov/romo/index.htm', 'https://www.bart.gov/guide/index.htm']) {
    const { fetcher, calls } = fetchFixture({ overviewRedirect: destination });
    await assert.rejects(enqueueDestination(root, proposal(), { now, fetcher }), /NPS source must remain within the selected park/);
    assert.ok(calls.includes(overviewUrl));
    assert.ok(!calls.includes(destination));
    assert.deepEqual(await snapshot(root), before);
  }
});

test('a verified license for a different subject cannot supply the destination cover', async (t) => {
  const root = await fixture(t);
  const before = await snapshot(root);
  const payload = proposal();
  payload.photo.commonsTitle = 'File:Unrelated beach fixture.jpg';
  const { fetcher } = fetchFixture({ unrelatedPhoto: true });
  await assert.rejects(enqueueDestination(root, payload, { now, fetcher }), /does not identify this destination/);
  assert.deepEqual(await snapshot(root), before);
});

test('a concurrent source registry edit survives intake and leaves every other file untouched', async (t) => {
  const root = await fixture(t);
  const expected = await snapshot(root);
  const edited = Buffer.concat([expected.get(sourceFile), Buffer.from('\n')]);
  expected.set(sourceFile, edited);
  const { fetcher } = fetchFixture({ originalHook: () => fs.writeFile(path.join(root, sourceFile), edited) });
  await assert.rejects(enqueueDestination(root, proposal(), { now, fetcher }), /changed during verification/);
  assert.deepEqual(await snapshot(root), expected);
});

test('an existing cover asset rolls back an article already written by this intake', async (t) => {
  const root = await fixture(t);
  await fs.writeFile(path.join(root, coverFile), 'unregistered file from another process');
  const before = await snapshot(root);
  const { fetcher } = fetchFixture();
  await assert.rejects(enqueueDestination(root, proposal(), { now, fetcher }), { code: 'EEXIST' });
  assert.deepEqual(await snapshot(root), before);
});

test('a saturated destination review queue makes no official or Commons requests', async (t) => {
  const root = await fixture(t, { stocked: true });
  const before = await snapshot(root);
  const options = { now, fetcher: async () => assert.fail('saturated queue attempted network') };
  assert.deepEqual(await planDestinationIntake(root, options), {
    ready: 6, target: 6, needed: 0, candidates: [], unavailable: [],
  });
  await assert.rejects(researchDestination(root, 'Maine', 'acad', options), /already meets its target/);
  await assert.rejects(enqueueDestination(root, proposal(), options), /already meets its target/);
  assert.deepEqual(await snapshot(root), before);
});
