import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { prepareCommonsPhoto, searchCommonsPhotos } from './commons-photo.mjs';
import { fetchOfficialText } from './check-sources.mjs';
import { articleFromDraft, draftMatchesBrief } from './content-pipeline.mjs';
import { findDuplicates, isSlug, isoDay, normalizedIntent, readArticles, sha256, validateArticle, validateRegistry } from './content-lib.mjs';
import { destinationRefillStatus, discoverDestinations, lookupDiscoveredDestination } from './destination-discovery.mjs';

const sourceFile = 'automation/sources.json';
const queueFile = 'automation/topics.json';
const photosFile = 'src/data/photos.json';
const ledgerFile = 'automation/editorial.json';
const healthFile = 'automation/source-health.json';
const inputFiles = [sourceFile, queueFile, photosFile, ledgerFile, healthFile];
const reportsDir = 'automation/reports';
const publisher = 'National Park Service';
const transientConnections = new Set(['EAI_AGAIN', 'ECONNRESET', 'ETIMEDOUT', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_SOCKET']);

async function fetchForIntake(url, options) {
  try {
    return await fetch(url, options);
  } catch (error) {
    // Retry a connection failure once, within the original timeout. HTTP refusals are returned unchanged.
    if (!options?.signal?.aborted && transientConnections.has(error.cause?.code)) return fetch(url, options);
    throw error;
  }
}

function plain(value, field, min, max) {
  if (typeof value !== 'string' || value.length < min || value.length > max || value !== value.trim() || /[<>\u0000-\u001f\u007f]/.test(value)) {
    throw new Error(`Invalid ${field}`);
  }
  return value;
}

function articleSnapshot(articles) {
  return articles.map(({ file, data, digest }) => [file, data.status, digest]).sort(([a], [b]) => a.localeCompare(b));
}

async function readIntakeState(root, now) {
  const [files, articles] = await Promise.all([
    Promise.all(inputFiles.map(file => fs.readFile(path.join(root, file), 'utf8'))),
    readArticles(root),
  ]);
  const [sourceRegistry, queue, photos, ledger, health] = files.map(file => JSON.parse(file));
  validateRegistry(sourceRegistry);
  if (!Array.isArray(queue.topics) || !Array.isArray(photos) || !Array.isArray(ledger.publications) ||
      !Array.isArray(health.sources) || !Array.isArray(health.conflicts)) throw new Error('Invalid destination intake state');
  const registeredPhotoIds = new Set(photos.map(photo => photo.id));
  const sourcesById = new Map(sourceRegistry.sources.map(source => [source.id, source]));
  const knownHealth = new Map(health.sources.map(source => [source.id, source]));
  const current = timestamp => Number.isFinite(Date.parse(timestamp)) &&
    Date.parse(timestamp) <= now.getTime() && now.getTime() - Date.parse(timestamp) <= 24 * 3600000;
  const status = destinationRefillStatus(queue.topics, articles, ledger.publications, {
    canUse(topic, article) {
      if (!draftMatchesBrief(article, topic) || findDuplicates(article, articles).length ||
          validateArticle(article, sourceRegistry, { now, publishing: true, registeredPhotoIds }).length) return false;
      return topic.sources.every(id => {
        const row = knownHealth.get(id);
        // New registrations already passed a fresh capture in this intake, before the next full monitor.
        return !row || !current(health.checkedAt) || !current(row.checkedAt) ||
          (row.status === 'unchanged' && row.contentHash === sourcesById.get(id)?.contentHash &&
            !(sourcesById.get(id)?.facts ?? []).some(fact => topic.facts.includes(fact.id) && health.conflicts.includes(fact.id)));
      });
    },
  });
  return { files, articles, sourceRegistry, queue, photos, ledger, status };
}

export async function planDestinationIntake(root, { now = new Date(), fetcher = fetchForIntake } = {}) {
  const state = await readIntakeState(root, now);
  if (!state.status.needed) return { ...state.status, candidates: [], unavailable: [] };
  const result = await discoverDestinations({
    topics: state.queue.topics, articles: state.articles, publications: state.ledger.publications,
    sourceRegistry: state.sourceRegistry, fetcher,
  });
  return { ...state.status, ...result };
}

async function lookupAvailablePark(state, region, parkCode, fetcher) {
  if (!state.status.needed) throw new Error('The destination review queue already meets its target');
  const park = await lookupDiscoveredDestination({ region, parkCode, sourceRegistry: state.sourceRegistry, fetcher });
  if (!park || !isSlug(park.slug) || park.slug.length > 100) throw new Error('No matching park on the official NPS state index');
  const existing = [...state.queue.topics, ...state.articles.map(({ data }) => data), ...state.ledger.publications];
  if (existing.some(({ slug }) => slug === park.slug) ||
      state.sourceRegistry.sources.some(({ url }) => {
        const official = new URL(url);
        return official.hostname === 'www.nps.gov' && official.pathname.split('/')[1] === parkCode;
      })) throw new Error('This park already has editorial coverage or registered sources');
  return park;
}

async function fetchParkSources(park, allowedHosts, fetcher, { highlights = true } = {}) {
  const parkPath = `/${park.parkCode}/`;
  const prefix = `https://www.nps.gov${parkPath}planyourvisit/`;
  const fetchParkPage = (value, options) => {
    const url = new URL(value);
    if (url.origin !== 'https://www.nps.gov' || !url.pathname.startsWith(parkPath)) {
      throw new Error('NPS source must remain within the selected park');
    }
    return fetcher(url, options);
  };
  const read = async (id, url) => ({
    id, url, text: await fetchOfficialText(url, allowedHosts, fetchParkPage),
  });
  const readHighlights = async () => {
    for (const page of ['placestogo.htm', 'things2do.htm']) {
      try { return await read('highlights', prefix + page); }
      catch (error) {
        if (error.message !== 'Official source returned HTTP 404') throw error;
      }
    }
    return null;
  };
  const captures = await Promise.all([
    read('overview', park.officialUrl),
    read('visit', prefix + 'index.htm'),
    highlights ? readHighlights() : null,
  ]);
  return captures.filter(Boolean);
}

function matchesParkPhoto(park, { commonsTitle, description = '', categories = [] }) {
  const text = ` ${normalizedIntent([commonsTitle, description, ...categories].join(' '))} `;
  const name = normalizedIntent(park.title);
  const designation = normalizedIntent(park.designation);
  const shorter = name.endsWith(` ${designation}`) ? name.slice(0, -designation.length).trim() : '';
  return text.includes(` ${name} `) || (shorter.includes(' ') && text.includes(` ${shorter} `));
}

export async function researchDestination(root, region, parkCode, { now = new Date(), fetcher = fetchForIntake } = {}) {
  const state = await readIntakeState(root, now);
  const park = await lookupAvailablePark(state, region, parkCode, fetcher);
  const [sources, photos] = await Promise.all([
    fetchParkSources(park, state.sourceRegistry.allowedHosts, fetcher),
    searchCommonsPhotos(park.title, { fetcher, limit: 8 }),
  ]);
  return {
    park,
    sources: sources.map(({ id, url, text }) => ({ id, url, untrustedSourceText: text.slice(0, 16000) })),
    photos: photos.filter(photo => matchesParkPhoto(park, photo)),
  };
}

function buildSourceRecords(park, captures, facts, now) {
  if (!Array.isArray(facts) || facts.length < 2 || facts.length > 8 ||
      !['overview', 'visit'].every(id => facts.some(fact => fact?.source === id))) {
    throw new Error('Supply verified facts from both the official overview and visitor information');
  }
  const known = new Map(captures.map(capture => [capture.id, capture]));
  for (const fact of facts) {
    if (!known.has(fact?.source) || typeof fact.dynamic !== 'boolean') throw new Error('Fact must use a captured source and declare whether it expires');
    plain(fact.statement, 'fact statement', 15, 320);
    plain(fact.evidence, 'fact evidence', 16, 260);
    if (!known.get(fact.source).text.includes(fact.evidence)) throw new Error(`Registered evidence not found in ${fact.source}`);
  }
  const checkedAt = isoDay(now);
  return captures.filter(capture => facts.some(fact => fact.source === capture.id)).map(capture => {
    const id = `${park.slug}-${capture.id}`;
    const labels = { overview: 'overview', visit: 'visitor information', highlights: 'highlights' };
    return {
      id, url: capture.url, title: `${park.title} ${labels[capture.id]}`, publisher, checkedAt, contentHash: sha256(capture.text),
      facts: facts.filter(fact => fact.source === capture.id).map((fact, index) => ({
        id: `${id}-fact-${index + 1}`, statement: fact.statement, evidence: fact.evidence, checkedAt, dynamic: fact.dynamic,
        ...(fact.dynamic ? { expiresAt: isoDay(new Date(now.getTime() + 7 * 86400000)) } : {}),
      })),
    };
  });
}

async function saveIntake(root, state, updated, additions) {
  const reports = path.join(root, reportsDir);
  await fs.mkdir(reports, { recursive: true });
  const lock = path.join(reports, 'destination-intake.lock');
  await fs.mkdir(lock);
  const written = [];
  const replaced = [];
  try {
    const [files, articles] = await Promise.all([
      Promise.all(inputFiles.map(file => fs.readFile(path.join(root, file), 'utf8'))),
      readArticles(root),
    ]);
    if (files.some((value, index) => value !== state.files[index]) ||
        JSON.stringify(articleSnapshot(articles)) !== JSON.stringify(articleSnapshot(state.articles))) {
      throw new Error('Intake registries, ledger or articles changed during verification; replan from the current checkout');
    }
    for (const [index, [file, contents]] of additions.entries()) {
      const temporary = path.join(lock, `addition-${index}`);
      await fs.writeFile(temporary, contents);
      await fs.link(temporary, path.join(root, file));
      written.push(file);
    }
    for (const [index, [file, value]] of updated.entries()) {
      const temporary = path.join(lock, `${index}.json`);
      await fs.writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`);
      await fs.rename(temporary, path.join(root, file));
      replaced.push(file);
    }
  } catch (error) {
    const restoration = await Promise.allSettled([
      ...replaced.map(file => fs.writeFile(path.join(root, file), state.files[inputFiles.indexOf(file)])),
      ...written.map(file => fs.unlink(path.join(root, file))),
    ]);
    const failures = restoration.filter(result => result.status === 'rejected').map(result => result.reason);
    if (failures.length) throw new AggregateError([error, ...failures], 'Destination intake could not fully restore local files');
    throw error;
  } finally {
    await fs.rm(lock, { recursive: true, force: true });
  }
}

export async function enqueueDestination(root, proposal, { now = new Date(), fetcher = fetchForIntake } = {}) {
  if (!proposal || typeof proposal !== 'object' || Array.isArray(proposal) || !proposal.photo) throw new Error('Expected a destination proposal with a Commons photo');
  const primaryIntent = plain(proposal.primaryIntent, 'primary intent', 10, 180);
  const brief = plain(proposal.brief, 'editorial brief', 20, 1000);
  const alt = plain(proposal.photo.alt, 'photo alternative text', 10, 180);
  const caption = plain(proposal.photo.caption, 'photo caption', 10, 240);
  const state = await readIntakeState(root, now);
  const park = await lookupAvailablePark(state, proposal.region, proposal.parkCode, fetcher);
  if (state.queue.topics.some(topic => normalizedIntent(topic.primaryIntent) === normalizedIntent(primaryIntent))) {
    throw new Error('Another brief already covers the proposed intent');
  }
  const location = proposal.location === undefined ? park.location : plain(proposal.location, 'location', 2, 100);
  if (proposal.category !== undefined && proposal.category !== park.category) throw new Error('Category must match the official designation');
  const captures = await fetchParkSources(park, state.sourceRegistry.allowedHosts, fetcher, {
    highlights: Array.isArray(proposal.facts) && proposal.facts.some(fact => fact?.source === 'highlights'),
  });
  if (location !== park.location && !captures.some(source => source.text.includes(location))) throw new Error('Location is absent from the official captures');
  const sourceRecords = buildSourceRecords(park, captures, proposal.facts, now);
  const registry = { ...state.sourceRegistry, sources: [...state.sourceRegistry.sources, ...sourceRecords] };
  validateRegistry(registry);

  // Build and validate the review copy before downloading an original.
  const topic = {
    slug: park.slug, type: 'destination', topic: 'us-destinations', status: 'ready', primaryIntent, brief,
    sources: sourceRecords.map(source => source.id), facts: sourceRecords.flatMap(source => source.facts.map(fact => fact.id)),
    related: [], region: park.region, location, category: park.category, featured: false, hero: { photoId: park.slug },
    queryAliases: [park.title], priority: 0,
  };
  const article = articleFromDraft(topic, proposal.draft, now);
  plain(article.data.title, 'article title', 10, 120);
  plain(article.data.description, 'article description', 40, 220);
  const report = {
    checkedAt: now.toISOString(), conflicts: [],
    sources: sourceRecords.map(source => ({ id: source.id, status: 'unchanged', checkedAt: now.toISOString(), contentHash: source.contentHash })),
  };
  const problems = validateArticle(article, registry, {
    now, publishing: true, sourceReport: report, registeredPhotoIds: new Set([park.slug]),
  });
  const duplicates = findDuplicates(article, state.articles);
  if (duplicates.length) problems.push(`Duplicate intent or content: ${duplicates.join(', ')}`);
  if (problems.length) throw new Error(problems.join('; '));

  const { record, bytes, metadata } = await prepareCommonsPhoto({
    id: park.slug, commonsTitle: proposal.photo.commonsTitle, title: park.title, alt, caption,
  }, { now, fetcher });
  if (!matchesParkPhoto(park, { commonsTitle: record.sourceTitle, ...metadata })) {
    throw new Error('Commons file metadata does not identify this destination');
  }
  if (state.photos.some(photo => photo.id === record.id || photo.file === record.file ||
      photo.originalSha1 === record.originalSha1 || photo.sourceUrl === record.sourceUrl)) throw new Error('Photo is already registered');
  const articleFile = `src/content/articles/${article.file}`;
  const photoFile = `src/assets/photos/${record.file}`;
  await saveIntake(root, state, [
    [sourceFile, registry],
    [photosFile, [...state.photos, record]],
    [queueFile, { ...state.queue, topics: [...state.queue.topics, topic] }],
  ], [[articleFile, article.raw], [photoFile, bytes]]);
  return { slug: park.slug, status: 'review', articleFile, photoFile, photoSource: record.sourceUrl, license: record.license, sources: topic.sources };
}

async function inspectPhoto(root, commonsTitle) {
  const { record, bytes } = await prepareCommonsPhoto({
    id: 'candidate', commonsTitle, title: 'Candidate cover', alt: 'Candidate cover', caption: 'Candidate cover',
  }, { fetcher: fetchForIntake });
  const directory = path.join(root, reportsDir, 'destination-previews');
  await fs.mkdir(directory, { recursive: true });
  const file = path.join(directory, `${record.originalSha1}.jpg`);
  await fs.writeFile(file, bytes);
  return { file, source: record.sourceUrl, author: record.author, license: record.license };
}

async function readProposal() {
  process.stdin.setEncoding('utf8');
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
    if (input.length > 80000) throw new Error('Destination proposal exceeds the limit');
  }
  return JSON.parse(input);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [command, ...args] = process.argv.slice(2);
  const root = process.cwd();
  try {
    let result;
    if (command === '--plan' && args.length === 0) result = await planDestinationIntake(root);
    else if (command === '--research' && args.length === 2) result = await researchDestination(root, ...args);
    else if (command === '--preview-photo' && args.length === 1) result = await inspectPhoto(root, args[0]);
    else if (command === '--enqueue' && args.length === 0) result = await enqueueDestination(root, await readProposal());
    else throw new Error('Use --plan, --research STATE PARK_CODE, --preview-photo COMMONS_FILE, or --enqueue with JSON input');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
