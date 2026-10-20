import { execFile } from 'node:child_process';
import { isDeepStrictEqual, promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { isDay, isSlug, isoDay, manualReleaseCount, readJson, validateRegistry } from './content-lib.mjs';

const exec = promisify(execFile);
const allowedUpdates = /^(?:src\/content\/articles\/[a-z0-9]+(?:-[a-z0-9]+)*\.md|automation\/(?:editorial|review-queue|source-health|sources)\.json)$/;
const sourceStatePaths = new Set(['automation/source-health.json', 'automation/sources.json', 'automation/review-queue.json']);
const hashPattern = /^[a-f0-9]{64}$/;
const queueStages = new Set(['source-check', 'fact-evidence', 'publish', 'draft', 'draft-preflight']);

function requireKeys(value, required, optional = []) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || required.some((key) => !Object.hasOwn(value, key)) || Object.keys(value).some((key) => !required.includes(key) && !optional.includes(key))) throw new Error('Unknown or incomplete source-state schema');
}

function safeText(value, max = 4096) {
  return typeof value === 'string' && value.length > 0 && value.length <= max && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value);
}

function checkedDay(value, now) {
  if (!isDay(value) || value > isoDay(now)) throw new Error('Invalid or future source-state day');
}

function checkedTimestamp(value, now, fresh = false) {
  const time = Date.parse(value);
  if (typeof value !== 'string' || !Number.isFinite(time) || new Date(time).toISOString() !== value || time > now.getTime() || (fresh && now.getTime() - time > 24 * 3600000)) throw new Error('Invalid, future or expired source-state timestamp');
  return time;
}

function strictRegistry(registry, now) {
  requireKeys(registry, ['version', 'allowedHosts', 'sources']);
  validateRegistry(registry);
  if (!registry.allowedHosts.length || registry.allowedHosts.some((host) => typeof host !== 'string') || new Set(registry.allowedHosts).size !== registry.allowedHosts.length || !registry.sources.length) throw new Error('Invalid source registry structure');
  for (const source of registry.sources) {
    requireKeys(source, ['id', 'url', 'title', 'publisher', 'checkedAt', 'facts'], ['contentHash']);
    if (!Array.isArray(source.facts) || !safeText(source.title) || !safeText(source.publisher)) throw new Error('Invalid source provenance');
    checkedDay(source.checkedAt, now);
    for (const fact of source.facts) {
      requireKeys(fact, ['id', 'statement', 'checkedAt'], ['dynamic', 'expiresAt', 'evidence']);
      if (!safeText(fact.statement, 20000) || (fact.dynamic !== undefined && typeof fact.dynamic !== 'boolean') || (fact.evidence !== undefined && typeof fact.evidence !== 'string')) throw new Error('Invalid fact structure');
      checkedDay(fact.checkedAt, now);
      if (fact.dynamic === true) {
        if (!isDay(fact.expiresAt) || fact.expiresAt <= fact.checkedAt) throw new Error('Invalid dynamic fact expiry');
      } else if (fact.expiresAt !== undefined) throw new Error('Static fact cannot have renewable expiry');
    }
  }
}

function strictHealth(report, registry, now, fresh) {
  requireKeys(report, ['checkedAt', 'sources', 'conflicts']);
  checkedTimestamp(report.checkedAt, now, fresh);
  if (!Array.isArray(report.sources) || !Array.isArray(report.conflicts)) throw new Error('Invalid health arrays');
  const registrySources = new Map(registry.sources.map((source) => [source.id, source]));
  const factIds = new Set(registry.sources.flatMap((source) => source.facts.map((fact) => fact.id)));
  const rows = new Map();
  for (const row of report.sources) {
    const failed = row.status === 'unavailable';
    requireKeys(row, ['id', 'status', 'checkedAt', failed ? 'error' : 'contentHash']);
    checkedTimestamp(row.checkedAt, now, fresh);
    if (row.checkedAt !== report.checkedAt || !registrySources.has(row.id) || rows.has(row.id)) throw new Error('Health must cover each registered source once at the report time');
    const source = registrySources.get(row.id);
    if (!['unchanged', 'changed', 'unavailable', 'baseline-missing'].includes(row.status)) throw new Error('Unknown source health status');
    if (failed) {
      if (!safeText(row.error)) throw new Error('Invalid source failure');
    } else {
      if (!hashPattern.test(row.contentHash)) throw new Error('Invalid observed source hash');
      if (row.status === 'unchanged' && row.contentHash !== source.contentHash) throw new Error('Unchanged source must match its approved baseline');
      if (row.status === 'changed' && (!source.contentHash || row.contentHash === source.contentHash)) throw new Error('Changed source must retain a distinct approved baseline');
      if (row.status === 'baseline-missing' && source.contentHash !== undefined) throw new Error('Existing baseline cannot become missing');
    }
    rows.set(row.id, row);
  }
  if (rows.size !== registrySources.size || new Set(report.conflicts).size !== report.conflicts.length || report.conflicts.some((id) => !factIds.has(id))) throw new Error('Unknown, duplicate or missing health IDs');
  return rows;
}

function strictQueue(queue, now) {
  if (!Array.isArray(queue) || queue.length > 200) throw new Error('Invalid review queue size');
  const entries = new Set();
  for (const item of queue) {
    requireKeys(item, ['slug', 'stage', 'errors', 'detectedAt']);
    if (!isSlug(item.slug) || !queueStages.has(item.stage) || !Array.isArray(item.errors) || !item.errors.length || item.errors.length > 100 || item.errors.some((error) => !safeText(error))) throw new Error('Invalid review queue entry');
    checkedTimestamp(item.detectedAt, now);
    const key = `${item.slug}:${item.stage}:${JSON.stringify(item.errors)}`;
    if (entries.has(key)) throw new Error('Duplicate review queue entry');
    entries.add(key);
  }
}

function withoutRenewableDates(registry) {
  return { ...registry, sources: registry.sources.map(({ checkedAt, facts, ...source }) => ({ ...source, facts: facts.map(({ checkedAt: factCheckedAt, ...fact }) => {
    const unchanged = { ...fact };
    if (fact.dynamic === true) delete unchanged.expiresAt;
    return unchanged;
  }) })) };
}

// This channel never approves articles or accepts a source's new baseline.
export async function classifySourceStateUpdate({ changed, run, readVersion = async (ref, file) => JSON.parse((await run('git', ['show', `${ref}:${file}`])).stdout), readChanges = async (base, head) => (await run('git', ['diff', '--raw', '--abbrev=40', '--no-renames', `${base}..${head}`, '--', ...sourceStatePaths])).stdout, baseRef = 'origin/main', headRef = 'HEAD', now = new Date() } = {}) {
  try {
    if (!Number.isFinite(now.getTime()) || !Array.isArray(changed) || !changed.includes('automation/source-health.json') || changed.some((file) => !sourceStatePaths.has(file))) throw new Error('Not a source-state-only update');
    const raw = await readChanges(baseRef, headRef);
    const paths = raw.trim().split(/\r?\n/).filter(Boolean).map((line) => {
      const match = /^:100644 100644 [a-f0-9]{40} [a-f0-9]{40} M\t(.+)$/.exec(line);
      if (!match || !sourceStatePaths.has(match[1])) throw new Error('Source state requires existing regular JSON files without mode changes');
      return match[1];
    });
    if (paths.length !== changed.length || new Set(paths).size !== paths.length || changed.some((file) => !paths.includes(file))) throw new Error('Source-state diff does not match its file list');
    const versions = await Promise.all([baseRef, headRef].map(async (ref) => ({ registry: await readVersion(ref, 'automation/sources.json'), health: await readVersion(ref, 'automation/source-health.json'), queue: await readVersion(ref, 'automation/review-queue.json') })));
    for (const version of versions) { strictRegistry(version.registry, now); strictQueue(version.queue, now); }
    const [base, head] = versions;
    strictHealth(base.health, base.registry, now, false);
    const rows = strictHealth(head.health, head.registry, now, true);
    if (Date.parse(head.health.checkedAt) < Date.parse(base.health.checkedAt)) throw new Error('Health report cannot move backwards');
    if (!isDeepStrictEqual(withoutRenewableDates(base.registry), withoutRenewableDates(head.registry))) throw new Error('Source baselines, IDs, URLs, evidence, statements and structure must remain unchanged');
    for (let i = 0; i < head.registry.sources.length; i += 1) {
      const source = head.registry.sources[i];
      const previous = base.registry.sources[i];
      const row = rows.get(source.id);
      const checkDay = isoDay(new Date(row.checkedAt));
      const unchanged = row.status === 'unchanged' && row.contentHash === source.contentHash;
      if (source.checkedAt < previous.checkedAt || (source.checkedAt !== previous.checkedAt && (!unchanged || source.checkedAt !== checkDay))) throw new Error('Source check renewal needs an unchanged matching baseline');
      for (let j = 0; j < source.facts.length; j += 1) {
        const fact = source.facts[j];
        const old = previous.facts[j];
        const renewed = fact.checkedAt !== old.checkedAt || fact.expiresAt !== old.expiresAt;
        if (!renewed) continue;
        if (fact.checkedAt < old.checkedAt || !unchanged || !safeText(fact.evidence) || head.health.conflicts.includes(fact.id) || fact.checkedAt !== checkDay || source.checkedAt !== checkDay) throw new Error('Fact renewal needs current unchanged evidence without conflicts');
        if (fact.dynamic === true) {
          const expected = isoDay(new Date(Date.parse(`${checkDay}T00:00:00Z`) + 7 * 86400000));
          if (fact.expiresAt !== expected || fact.expiresAt < old.expiresAt || fact.expiresAt <= isoDay(now)) throw new Error('Dynamic fact renewal must expire exactly seven days after its current check');
        }
      }
    }
    return { eligible: true, reason: 'Strict source health, unchanged provenance renewals and failure queue only' };
  } catch (error) { return { eligible: false, reason: error.message }; }
}

export async function openEditorialPullRequest({ root = process.cwd(), run = (command, args) => exec(command, args, { cwd: root, encoding: 'utf8' }), readVersion, readChanges, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), attempts = 60, delayMs = 10000, now = new Date() } = {}) {
  try { await run('git', ['diff', '--quiet', 'origin/main..HEAD']); return { status: 'unchanged' }; }
  catch (error) { if (error.code !== 1) throw error; }
  const changed = (await run('git', ['diff', '--name-only', 'origin/main..HEAD'])).stdout.trim().split(/\r?\n/).filter(Boolean);
  if (!changed.length || changed.some((file) => !allowedUpdates.test(file))) throw new Error('Editorial PR contains files outside the content/source-state allowlist; manual review is required');
  const sha = (await run('git', ['rev-parse', 'HEAD'])).stdout.trim();
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error('Cannot identify the exact editorial branch commit');
  const listOpen = async () => {
    const result = JSON.parse((await run('gh', ['pr', 'list', '--state', 'open', '--base', 'main', '--head', 'automation/editorial', '--limit', '2', '--json', 'number,headRefOid,url'])).stdout);
    if (!Array.isArray(result) || result.length > 1) throw new Error('Ambiguous editorial PR state');
    return result[0];
  };
  let pr = await listOpen();
  if (!pr) {
    await run('gh', ['pr', 'create', '--base', 'main', '--head', 'automation/editorial', '--title', 'Content and official-source review queue', '--body-file', '.github/editorial-pr.md']);
    pr = await listOpen();
  }
  if (!pr || !Number.isSafeInteger(pr.number) || pr.number <= 0 || pr.headRefOid !== sha) throw new Error('Editorial PR head changed; re-run checks before merging');

  const state = await readJson(path.join(root, 'automation/editorial.json'));
  if (state.version !== 1 || state.requiredManualApprovals !== 5 || typeof state.autoPublishEnabled !== 'boolean' || !Array.isArray(state.publications) || !Array.isArray(state.approvals)) throw new Error('Invalid editorial approval state; PR remains held for review');
  const manualCount = manualReleaseCount(state, { now });
  const stateFiles = changed.filter((file) => sourceStatePaths.has(file));
  const sourceState = stateFiles.length ? await classifySourceStateUpdate({ changed: stateFiles, run, readVersion, readChanges, headRef: sha, now }) : { eligible: true, reason: 'No source-state changes' };
  const healthOnly = stateFiles.length === changed.length && sourceState.eligible;
  const autoEligible = state.autoPublishEnabled === true && sourceState.eligible && (healthOnly || manualCount >= 5);
  const listRuns = async () => JSON.parse((await run('gh', ['run', 'list', '--workflow', 'ci.yml', '--event', 'workflow_dispatch', '--branch', 'automation/editorial', '--commit', sha, '--limit', '10', '--json', 'databaseId,status,conclusion,headSha'])).stdout);
  const priorRuns = new Set(autoEligible ? (await listRuns()).map((item) => item.databaseId) : []);
  // GITHUB_TOKEN pushes do not reliably start CI. workflow_dispatch is explicit.
  await run('gh', ['workflow', 'run', 'ci.yml', '--ref', 'automation/editorial']);
  if (!autoEligible) return { status: 'manual-review', number: pr.number, url: pr.url, sha, manualReleases: manualCount, sourceState: sourceState.reason };

  // Wait for a successful dispatched CI at this exact SHA even if the repository
  // has no required status checks; --auto alone may otherwise merge immediately.
  let passed = false;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const current = (await listRuns()).filter((item) => item.headSha === sha && !priorRuns.has(item.databaseId)).sort((a, b) => b.databaseId - a.databaseId)[0];
    if (current?.status === 'completed') {
      if (current.conclusion !== 'success') throw new Error(`Editorial CI did not pass for ${sha}; PR #${pr.number} remains held for review`);
      passed = true;
      break;
    }
    if (attempt + 1 < attempts) await sleep(delayMs);
  }
  if (!passed) throw new Error(`Timed out waiting for editorial CI at ${sha}; PR #${pr.number} remains held for review`);
  const checkedBase = (await run('git', ['rev-parse', 'origin/main'])).stdout.trim();
  const remoteBase = (await run('git', ['ls-remote', 'origin', 'refs/heads/main'])).stdout.trim();
  if (!/^[a-f0-9]{40}$/.test(checkedBase) || remoteBase !== `${checkedBase}\trefs/heads/main`) throw new Error('Main changed after checkout; refresh the editorial branch and rerun validation before merging');
  await run('gh', ['pr', 'merge', String(pr.number), '--auto', '--squash', '--match-head-commit', sha]);
  return { status: 'auto-merge-requested', number: pr.number, url: pr.url, sha, manualReleases: manualCount, mergeChannel: healthOnly ? 'source-state' : 'content' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log(JSON.stringify(await openEditorialPullRequest(), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
