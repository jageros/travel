import assert from 'node:assert/strict';
import test from 'node:test';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { parse } from 'yaml';
import { classifySourceStateUpdate, createEditorialRunner, openEditorialPullRequest, pushEditorialBranch } from '../scripts/editorial-pr.mjs';
import { sha256, writeJson } from '../scripts/content-lib.mjs';

const exec = promisify(execFile);
const head = 'a'.repeat(40);
const now = new Date('2026-10-19T09:00:00Z');

async function setup(t, manualCount = 0, autoPublishEnabled = true) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cedar-workflow-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const publications = Array.from({ length: manualCount }, (_, i) => ({ slug: `reviewed-${i}`, publishedAt: '2026-10-01T00:00:00Z', contentSha256: sha256(`reviewed-${i}`), manualApproval: true, reviewer: 'editor' }));
  const approvals = publications.map((item) => ({ slug: item.slug, contentSha256: item.contentSha256, reviewer: 'editor', reviewedAt: '2026-09-30' }));
  await writeJson(path.join(root, 'automation/editorial.json'), { version: 1, requiredManualApprovals: 5, autoPublishEnabled, publications, approvals });
  return root;
}

function fakeRunner({ existing = false, changed = ['src/content/articles/new-guide.md'], noDiff = false, conclusion = 'success', pending = false, prHead = head } = {}) {
  const calls = [];
  let open = existing;
  let dispatched = false;
  const run = async (command, args) => {
    calls.push({ command, args });
    if (command === 'git' && args[0] === 'diff' && args[1] === '--quiet') {
      if (noDiff) return { stdout: '' };
      throw Object.assign(new Error('Content differs'), { code: 1 });
    }
    if (command === 'git' && args[1] === '--name-only') return { stdout: changed.join('\n') };
    if (command === 'git' && args[0] === 'rev-parse') return { stdout: `${head}\n` };
    if (command === 'git' && args[0] === 'ls-remote') return { stdout: `${head}\trefs/heads/main\n` };
    if (command === 'gh' && args[0] === 'pr' && args[1] === 'list') {
      assert.ok(args.includes('open'), 'only open PRs can be reused');
      return { stdout: JSON.stringify(open ? [{ number: 42, headRefOid: prHead, url: 'https://github.com/jageros/travel/pull/42' }] : []) };
    }
    if (command === 'gh' && args[0] === 'pr' && args[1] === 'create') { open = true; return { stdout: 'https://github.com/jageros/travel/pull/42\n' }; }
    if (command === 'gh' && args[0] === 'workflow' && args[1] === 'run') { dispatched = true; return { stdout: '' }; }
    if (command === 'gh' && args[0] === 'run' && args[1] === 'list') {
      assert.ok(args.includes(head), 'dispatched CI must match the exact head SHA');
      return { stdout: JSON.stringify([{ databaseId: dispatched ? 101 : 100, headSha: head, status: pending ? 'in_progress' : 'completed', conclusion: pending ? null : conclusion }]) };
    }
    if (command === 'gh' && args[0] === 'pr' && args[1] === 'merge') return { stdout: '' };
    throw new Error(`Unexpected command: ${command} ${args.join(' ')}`);
  };
  return { run, calls };
}

test('a new content PR is created after the prior branch PR was merged or closed', async (t) => {
  const root = await setup(t);
  const runner = fakeRunner();
  const result = await openEditorialPullRequest({ root, run: runner.run, now });
  assert.equal(result.status, 'manual-review');
  assert.equal(runner.calls.filter((call) => call.args[0] === 'pr' && call.args[1] === 'create').length, 1);
  assert.ok(runner.calls.some((call) => call.args.join(' ') === 'workflow run ci.yml --ref automation/editorial'));
  assert.ok(!runner.calls.some((call) => call.args.includes('merge')));
});

test('an unchanged branch causes no empty PR or duplicate CI dispatch', async (t) => {
  const root = await setup(t);
  const runner = fakeRunner({ noDiff: true });
  assert.equal((await openEditorialPullRequest({ root, run: runner.run, now })).status, 'unchanged');
  assert.equal(runner.calls.length, 1);
});

test('five verified releases require successful exact-SHA CI before auto-merge is requested', async (t) => {
  const root = await setup(t, 5);
  const runner = fakeRunner({ existing: true });
  assert.equal((await openEditorialPullRequest({ root, run: runner.run, now })).status, 'auto-merge-requested');
  const merge = runner.calls.find((call) => call.args[0] === 'pr' && call.args[1] === 'merge');
  assert.deepEqual(merge.args, ['pr', 'merge', '42', '--auto', '--squash', '--match-head-commit', head]);
  assert.ok(runner.calls.findIndex((call) => call.args[0] === 'run') < runner.calls.indexOf(merge));
});

test('failed or missing CI, changed PR head and unexpected executable files cannot auto-merge', async (t) => {
  const root = await setup(t, 5);
  for (const options of [{ conclusion: 'failure' }, { pending: true }, { prHead: 'b'.repeat(40) }, { changed: ['scripts/content-pipeline.mjs'] }]) {
    const runner = fakeRunner(options);
    await assert.rejects(openEditorialPullRequest({ root, run: runner.run, now, attempts: 2, delayMs: 0, sleep: async () => {} }), /held|head changed|allowlist/);
    assert.ok(!runner.calls.some((call) => call.args[0] === 'pr' && call.args[1] === 'merge'));
  }
});

test('a stale CI run at the same SHA cannot satisfy or fail a new dispatch', async (t) => {
  const root = await setup(t, 5);
  const runner = fakeRunner({ existing: true });
  let reads = 0;
  const run = async (command, args) => {
    if (command === 'gh' && args[0] === 'run' && args[1] === 'list') {
      reads += 1;
      const previous = { databaseId: 90, headSha: head, status: 'completed', conclusion: 'failure' };
      const current = { databaseId: 91, headSha: head, status: reads < 3 ? 'in_progress' : 'completed', conclusion: reads < 3 ? null : 'success' };
      return { stdout: JSON.stringify(reads === 1 ? [previous] : [previous, current]) };
    }
    return runner.run(command, args);
  };
  assert.equal((await openEditorialPullRequest({ root, run, now, attempts: 3, delayMs: 0, sleep: async () => {} })).status, 'auto-merge-requested');
  assert.equal(reads, 3);
});

test('disabling automatic publication also prevents source-state PR auto-merge', async (t) => {
  const root = await setup(t, 5, false);
  const runner = fakeRunner({ existing: true });
  assert.equal((await openEditorialPullRequest({ root, run: runner.run, now })).status, 'manual-review');
  assert.ok(!runner.calls.some((call) => call.args[0] === 'pr' && call.args[1] === 'merge'));
});

test('an Actions dispatch permission failure leaves a reviewable PR and never requests merge', async (t) => {
  const root = await setup(t, 5);
  const runner = fakeRunner();
  const run = async (command, args) => {
    if (command === 'gh' && args[0] === 'workflow') throw new Error('HTTP 403: Actions workflow dispatch permission is disabled');
    return runner.run(command, args);
  };
  await assert.rejects(openEditorialPullRequest({ root, run, now }), /403/);
  assert.ok(runner.calls.some((call) => call.args[0] === 'pr' && call.args[1] === 'create'));
  assert.ok(!runner.calls.some((call) => call.args[0] === 'pr' && call.args[1] === 'merge'));
});

test('manual dispatch defaults to monitor-only while scheduled releases stay gated without model credentials', async (t) => {
  const root = await setup(t);
  const workflow = parse(await fs.readFile(new URL('../.github/workflows/editorial.yml', import.meta.url), 'utf8'));
  assert.equal(workflow.on.workflow_dispatch.inputs.publish_approved.default, false);
  const step = workflow.jobs.editorial.steps.find((item) => item.id === 'pipeline');
  const bin = path.join(root, 'bin'); await fs.mkdir(bin);
  await fs.writeFile(path.join(bin, 'date'), '#!/bin/sh\nprintf "1\\n"\n', { mode: 0o755 });
  await fs.writeFile(path.join(bin, 'node'), '#!/bin/sh\nprintf "%s\\n" "$@" > "$CALLS_FILE"\n', { mode: 0o755 });
  for (const [env, expected] of [
    [{ EVENT_NAME: 'workflow_dispatch' }, []],
    [{ EVENT_NAME: 'workflow_dispatch', REQUEST_PUBLISH: 'true' }, ['--publish']],
    [{ EVENT_NAME: 'schedule' }, ['--publish']],
    [{ EVENT_NAME: 'schedule', DRAFT_API_KEY: 'test-fixture', DRAFT_MODEL: 'fixture' }, ['--draft', '--publish']],
    [{ EVENT_NAME: 'workflow_dispatch', REQUEST_DRAFT: 'true', DRAFT_API_KEY: 'test-fixture', DRAFT_MODEL: 'fixture' }, ['--draft']],
  ]) {
    const log = path.join(root, 'args.txt');
    await exec('bash', ['-c', step.run], { env: { PATH: `${bin}:${process.env.PATH}`, CALLS_FILE: log, DRAFT_API_KEY: '', DRAFT_MODEL: '', REQUEST_DRAFT: '', REQUEST_PUBLISH: '', ...env } });
    assert.deepEqual((await fs.readFile(log, 'utf8')).trim().split('\n'), ['scripts/content-pipeline.mjs', ...expected]);
  }
});

test('missing source baselines require an explicit manual request after official-source review', async () => {
  const workflow = parse(await fs.readFile(new URL('../.github/workflows/editorial.yml', import.meta.url), 'utf8'));
  const input = workflow.on.workflow_dispatch.inputs.accept_missing_baselines;
  assert.equal(input.type, 'boolean');
  assert.equal(input.default, false);
  assert.match(input.description, /official-source review/);
  const steps = workflow.jobs.editorial.steps;
  const captures = steps.filter((step) => step.run?.includes('--accept-baseline'));
  assert.equal(captures.length, 1);
  const capture = captures[0];
  assert.equal(capture.if, "github.event_name == 'workflow_dispatch' && inputs.accept_missing_baselines == true");
  assert.equal(capture['continue-on-error'], true);
  assert.equal(capture.env.BASELINE_REVIEWER, '${{ github.actor }}');
  assert.match(capture.run, /node scripts\/check-sources\.mjs --accept-baseline/);
  assert.ok(steps.indexOf(capture) < steps.findIndex((step) => step.id === 'pipeline'));
  assert.ok(!steps.find((step) => step.id === 'pipeline').run.includes('--accept-baseline'));
});

function sourceStateFixture() {
  const changed = ['automation/source-health.json', 'automation/sources.json', 'automation/review-queue.json'];
  const approvedHash = sha256('Verified official station text');
  const base = {
    registry: { version: 1, allowedHosts: ['www.bart.gov'], sources: [{ id: 'bart-sfo', url: 'https://www.bart.gov/guide/airport/sfo', title: 'SFO airport', publisher: 'BART', checkedAt: '2026-10-18', contentHash: approvedHash, facts: [{ id: 'bart-station', statement: 'The airport has a station.', checkedAt: '2026-10-18', dynamic: true, expiresAt: '2026-10-25', evidence: 'station' }] }] },
    health: { checkedAt: '2026-10-18T09:00:00.000Z', sources: [{ id: 'bart-sfo', status: 'unchanged', checkedAt: '2026-10-18T09:00:00.000Z', contentHash: approvedHash }], conflicts: [] },
    queue: [],
  };
  const latest = structuredClone(base);
  latest.registry.sources[0].checkedAt = '2026-10-19';
  latest.registry.sources[0].facts[0].checkedAt = '2026-10-19';
  latest.registry.sources[0].facts[0].expiresAt = '2026-10-26';
  latest.health.checkedAt = now.toISOString();
  latest.health.sources[0].checkedAt = now.toISOString();
  latest.queue.push({ slug: 'remaining-guide', stage: 'publish', errors: ['Weekly publication cap reached (3 in rolling 7 days)'], detectedAt: now.toISOString() });
  const readVersion = async (ref, file) => {
    assert.ok(ref === 'origin/main' || ref === 'HEAD' || ref === head, 'read only the base or snapshotted head');
    const key = { 'automation/sources.json': 'registry', 'automation/source-health.json': 'health', 'automation/review-queue.json': 'queue' }[file];
    assert.ok(key);
    return structuredClone((ref === 'origin/main' ? base : latest)[key]);
  };
  const readChanges = async () => changed.map((file) => `:100644 100644 ${'b'.repeat(40)} ${'c'.repeat(40)} M\t${file}`).join('\n');
  return { changed, base, latest, readVersion, readChanges };
}

test('strict health renewals and non-authorizing failure queue can merge before five releases', async (t) => {
  const fixture = sourceStateFixture();
  assert.equal((await classifySourceStateUpdate({ ...fixture, now })).eligible, true);
  const root = await setup(t, 3);
  const runner = fakeRunner({ changed: fixture.changed });
  const result = await openEditorialPullRequest({ root, run: runner.run, ...fixture, now });
  assert.equal(result.status, 'auto-merge-requested');
  assert.equal(result.mergeChannel, 'source-state');
  assert.equal(result.manualReleases, 3);
  assert.deepEqual(runner.calls.find((call) => call.args[0] === 'pr' && call.args[1] === 'merge').args, ['pr', 'merge', '42', '--auto', '--squash', '--match-head-commit', head]);
});

test('the default classifier reads committed base and exact head JSON rather than working files', async (t) => {
  const root = await setup(t, 0);
  const fixture = sourceStateFixture();
  const runner = fakeRunner({ changed: fixture.changed });
  const snapshots = [];
  const run = async (command, args) => {
    if (command === 'git' && args[0] === 'show') {
      snapshots.push(args[1]);
      const separator = args[1].indexOf(':');
      return { stdout: JSON.stringify(await fixture.readVersion(args[1].slice(0, separator), args[1].slice(separator + 1))) };
    }
    if (command === 'git' && args[0] === 'diff' && args[1] === '--raw') {
      assert.ok(args.includes(`origin/main..${head}`));
      return { stdout: await fixture.readChanges() };
    }
    return runner.run(command, args);
  };
  assert.equal((await openEditorialPullRequest({ root, run, now })).mergeChannel, 'source-state');
  assert.equal(snapshots.length, 6);
  assert.ok(snapshots.every((value) => value.startsWith('origin/main:') || value.startsWith(`${head}:`)));
});

test('health channel still stops on disabled automation or unsuccessful current-SHA CI', async (t) => {
  const fixture = sourceStateFixture();
  const disabled = await setup(t, 0, false);
  const runner = fakeRunner({ changed: fixture.changed });
  assert.equal((await openEditorialPullRequest({ root: disabled, run: runner.run, ...fixture, now })).status, 'manual-review');
  assert.ok(!runner.calls.some((call) => call.args[0] === 'pr' && call.args[1] === 'merge'));
  const enabled = await setup(t, 0);
  const failing = fakeRunner({ changed: fixture.changed, conclusion: 'failure' });
  await assert.rejects(openEditorialPullRequest({ root: enabled, run: failing.run, ...fixture, now, attempts: 1 }), /CI did not pass/);
  assert.ok(!failing.calls.some((call) => call.args[0] === 'pr' && call.args[1] === 'merge'));
});

test('a newer remote main after validation holds automatic health merging', async (t) => {
  const root = await setup(t, 0);
  const fixture = sourceStateFixture();
  const runner = fakeRunner({ changed: fixture.changed });
  const run = async (command, args) => command === 'git' && args[0] === 'ls-remote' ? { stdout: `${'d'.repeat(40)}\trefs/heads/main\n` } : runner.run(command, args);
  await assert.rejects(openEditorialPullRequest({ root, run, ...fixture, now }), /Main changed/);
  assert.ok(!runner.calls.some((call) => call.args[0] === 'pr' && call.args[1] === 'merge'));
});

test('changed, unavailable and conflicting sources can suppress claims without renewing them', async () => {
  for (const status of ['changed', 'unavailable', 'unchanged']) {
    const fixture = sourceStateFixture();
    fixture.latest.registry = structuredClone(fixture.base.registry);
    const row = fixture.latest.health.sources[0];
    row.status = status;
    if (status === 'changed') row.contentHash = sha256('Changed official page');
    if (status === 'unavailable') { delete row.contentHash; row.error = 'Official source returned HTTP 503'; }
    if (status === 'unchanged') fixture.latest.health.conflicts = ['bart-station'];
    assert.equal((await classifySourceStateUpdate({ ...fixture, now })).eligible, true, status);
  }
});

test('sensitive source, provenance, date, health and queue mutations stay held', async () => {
  const cases = [
    ['baseline', (f) => { f.latest.registry.sources[0].contentHash = sha256('New unreviewed baseline'); f.latest.health.sources[0].contentHash = f.latest.registry.sources[0].contentHash; }],
    ['URL', (f) => { f.latest.registry.sources[0].url = 'https://www.bart.gov/other'; }],
    ['statement', (f) => { f.latest.registry.sources[0].facts[0].statement = 'A different claim.'; }],
    ['evidence', (f) => { f.latest.registry.sources[0].facts[0].evidence = 'Different evidence'; }],
    ['initial baseline acceptance', (f) => { delete f.base.registry.sources[0].contentHash; f.base.health.sources[0].status = 'baseline-missing'; }],
    ['root schema', (f) => { f.latest.registry.approved = true; }],
    ['source schema', (f) => { f.latest.registry.sources[0].approved = true; }],
    ['fact schema', (f) => { f.latest.registry.sources[0].facts[0].verified = true; }],
    ['source removal', (f) => { f.latest.registry.sources = []; }],
    ['fact removal', (f) => { f.latest.registry.sources[0].facts = []; }],
    ['future source day', (f) => { f.latest.registry.sources[0].checkedAt = '2026-10-20'; }],
    ['backwards source day', (f) => { f.latest.registry.sources[0].checkedAt = '2026-10-17'; }],
    ['future fact day', (f) => { f.latest.registry.sources[0].facts[0].checkedAt = '2026-10-20'; }],
    ['backwards fact day', (f) => { f.latest.registry.sources[0].facts[0].checkedAt = '2026-10-17'; }],
    ['overlong expiry', (f) => { f.latest.registry.sources[0].facts[0].expiresAt = '2026-10-27'; }],
    ['expired renewal', (f) => { f.latest.registry.sources[0].facts[0].expiresAt = '2026-10-19'; }],
    ['invalid day', (f) => { f.latest.registry.sources[0].facts[0].checkedAt = '2026-02-31'; }],
    ['no evidence', (f) => { delete f.base.registry.sources[0].facts[0].evidence; delete f.latest.registry.sources[0].facts[0].evidence; }],
    ['conflicting renewal', (f) => { f.latest.health.conflicts = ['bart-station']; }],
    ['changed renewal', (f) => { f.latest.health.sources[0].status = 'changed'; f.latest.health.sources[0].contentHash = sha256('Different source text'); }],
    ['unavailable renewal', (f) => { f.latest.health.sources[0] = { id: 'bart-sfo', status: 'unavailable', error: 'Network failed', checkedAt: now.toISOString() }; }],
    ['wrong observed hash', (f) => { f.latest.health.sources[0].contentHash = sha256('Not approved'); }],
    ['stale report', (f) => { f.latest.health.checkedAt = '2026-10-18T08:59:59.000Z'; f.latest.health.sources[0].checkedAt = f.latest.health.checkedAt; }],
    ['future report', (f) => { f.latest.health.checkedAt = '2026-10-19T09:00:01.000Z'; f.latest.health.sources[0].checkedAt = f.latest.health.checkedAt; }],
    ['invalid report', (f) => { f.latest.health.checkedAt = 'not-a-date'; }],
    ['stale individual row', (f) => { f.latest.health.sources[0].checkedAt = '2026-10-18T08:59:59.000Z'; }],
    ['unknown health field', (f) => { f.latest.health.sources[0].verified = true; }],
    ['unknown report field', (f) => { f.latest.health.verified = true; }],
    ['unknown source', (f) => { f.latest.health.sources[0].id = 'unknown'; }],
    ['duplicate source', (f) => { f.latest.health.sources.push(structuredClone(f.latest.health.sources[0])); }],
    ['missing source report', (f) => { f.latest.health.sources = []; }],
    ['unknown conflict', (f) => { f.latest.health.conflicts = ['unknown-fact']; }],
    ['queue authorization field', (f) => { f.latest.queue[0].approved = true; }],
    ['queue unknown stage', (f) => { f.latest.queue[0].stage = 'publish-approved'; }],
    ['queue errors shape', (f) => { f.latest.queue[0].errors = [{ approved: true }]; }],
    ['queue future time', (f) => { f.latest.queue[0].detectedAt = '2026-10-20T09:00:00.000Z'; }],
    ['queue cap', (f) => { f.latest.queue = Array.from({ length: 201 }, (_, i) => ({ ...f.latest.queue[0], slug: `held-${i}` })); }],
  ];
  for (const [label, mutate] of cases) {
    const fixture = sourceStateFixture(); mutate(fixture);
    assert.equal((await classifySourceStateUpdate({ ...fixture, now })).eligible, false, label);
  }
});

test('source channel refuses article, ledger, file creation, deletion and mode changes', async () => {
  for (const file of ['automation/editorial.json', 'src/content/articles/guide.md', 'scripts/check-sources.mjs']) {
    const fixture = sourceStateFixture(); fixture.changed.push(file);
    assert.equal((await classifySourceStateUpdate({ ...fixture, now })).eligible, false, file);
  }
  for (const [oldMode, newMode, status] of [['100644', '120000', 'M'], ['100644', '100755', 'M'], ['000000', '100644', 'A'], ['100644', '000000', 'D']]) {
    const fixture = sourceStateFixture();
    fixture.readChanges = async () => fixture.changed.map((file) => `:${oldMode} ${newMode} ${'b'.repeat(40)} ${'c'.repeat(40)} ${status}\t${file}`).join('\n');
    assert.equal((await classifySourceStateUpdate({ ...fixture, now })).eligible, false, `${oldMode} ${newMode} ${status}`);
  }
});

test('five releases cannot bypass sensitive sources in health-only or mixed content PRs', async (t) => {
  const root = await setup(t, 5);
  for (const mixed of [false, true]) {
    const fixture = sourceStateFixture();
    fixture.latest.registry.sources[0].facts[0].statement = 'An unreviewed replacement claim.';
    const changed = [...fixture.changed, ...(mixed ? ['src/content/articles/guide.md'] : [])];
    const runner = fakeRunner({ changed });
    const result = await openEditorialPullRequest({ root, run: runner.run, ...fixture, now });
    assert.equal(result.status, 'manual-review');
    assert.ok(!runner.calls.some((call) => call.args[0] === 'pr' && call.args[1] === 'merge'));
  }
});

test('mixed content and strict provenance renewals still require five verified releases', async (t) => {
  for (const count of [3, 5]) {
    const root = await setup(t, count);
    const fixture = sourceStateFixture();
    const runner = fakeRunner({ changed: [...fixture.changed, 'src/content/articles/guide.md'] });
    const result = await openEditorialPullRequest({ root, run: runner.run, ...fixture, now });
    assert.equal(result.status, count === 5 ? 'auto-merge-requested' : 'manual-review');
    if (count === 5) assert.equal(result.mergeChannel, 'content');
  }
});

test('App credentials are used only for branch pushes and PR creation or edits', async (t) => {
  const root = await setup(t, 5);
  const fixture = fakeRunner();
  const env = { GH_TOKEN: 'workflow-fixture-token', GITHUB_TOKEN: 'unused-alias', EDITORIAL_APP_TOKEN: 'app-fixture-token', EDITORIAL_APP_PRIVATE_KEY: 'fixture-not-a-private-key' };
  const calls = [];
  const run = createEditorialRunner({ root, env, execute: async (command, args, options) => {
    calls.push({ command, args, env: options.env });
    return fixture.run(command, args);
  } });
  const result = await openEditorialPullRequest({ root, env, run, now });
  assert.equal(result.prAuthMode, 'github-app');
  assert.equal(result.status, 'auto-merge-requested');
  for (const call of calls) {
    assert.ok(!Object.hasOwn(call.env, 'EDITORIAL_APP_TOKEN'));
    assert.ok(!Object.hasOwn(call.env, 'EDITORIAL_APP_PRIVATE_KEY'));
    assert.ok(!Object.hasOwn(call.env, 'GITHUB_TOKEN'));
    assert.ok(!call.args.some((arg) => arg.includes('fixture-token')));
    if (call.command === 'gh') assert.equal(call.env.GH_TOKEN, call.args[0] === 'pr' && call.args[1] === 'create' ? env.EDITORIAL_APP_TOKEN : env.GH_TOKEN);
  }
  assert.ok(calls.some((call) => call.args[0] === 'pr' && call.args[1] === 'create'));
  assert.ok(calls.some((call) => call.args[0] === 'workflow'));
  assert.ok(calls.some((call) => call.args[0] === 'run'));
  assert.ok(calls.some((call) => call.args[0] === 'pr' && call.args[1] === 'merge'));
  const authCalls = [];
  const writer = createEditorialRunner({ env, execute: async (command, args, options) => { authCalls.push({ command, args, env: options.env }); return { stdout: '' }; } });
  await writer('git', ['push', 'origin', 'HEAD:automation/editorial']);
  await writer('gh', ['pr', 'edit', '42', '--title', 'Content queue']);
  assert.equal(authCalls[1].env.GH_TOKEN, env.EDITORIAL_APP_TOKEN);
  assert.equal(Buffer.from(authCalls[0].env.GIT_CONFIG_VALUE_1.split(' ').at(-1), 'base64').toString(), `x-access-token:${env.EDITORIAL_APP_TOKEN}`);
  assert.equal(authCalls[0].env.GIT_CONFIG_KEY_0, 'credential.helper');
  assert.equal(authCalls[0].env.GIT_CONFIG_VALUE_0, '');
  assert.equal(authCalls[0].env.GIT_TRACE_CURL, '0');
  assert.ok(!Object.hasOwn(authCalls[0].env, 'GH_TOKEN'));
});

test('missing App configuration falls back explicitly while App never replaces the CI or merge credential', async (t) => {
  const root = await setup(t);
  const fixture = fakeRunner();
  const env = { GH_TOKEN: 'workflow-fixture-token' };
  const calls = [];
  const run = createEditorialRunner({ root, env, execute: async (command, args, options) => { calls.push({ command, args, env: options.env }); return fixture.run(command, args); } });
  assert.equal((await openEditorialPullRequest({ root, env, run, now })).prAuthMode, 'github-token-human-workflow-approval');
  assert.ok(calls.filter((call) => call.command === 'gh').every((call) => call.env.GH_TOKEN === env.GH_TOKEN));
  let writes = 0;
  const fallback = createEditorialRunner({ env, execute: async (_command, _args, options) => {
    writes += 1;
    assert.equal(Buffer.from(options.env.GIT_CONFIG_VALUE_1.split(' ').at(-1), 'base64').toString(), `x-access-token:${env.GH_TOKEN}`);
    return { stdout: '' };
  } });
  await fallback('git', ['push', 'origin', 'HEAD:automation/editorial']);
  assert.equal(writes, 1);
  const appOnly = createEditorialRunner({ env: { EDITORIAL_APP_TOKEN: 'app-fixture-token' }, execute: async () => { throw new Error('must not execute'); } });
  await assert.rejects(appOnly('gh', ['workflow', 'run', 'ci.yml']), /workflow credential/);
  await assert.rejects(appOnly('gh', ['run', 'list']), /workflow credential/);
  await assert.rejects(appOnly('gh', ['pr', 'merge', '42', '--auto']), /workflow credential/);
  const malformed = createEditorialRunner({ env: { GH_TOKEN: 'valid-fixture', EDITORIAL_APP_TOKEN: 'invalid\ntoken' }, execute: async () => { throw new Error('must not execute'); } });
  await assert.rejects(malformed('git', ['push', 'origin', 'HEAD:automation/editorial']), /workflow credential/);
});

test('the push command restricts branch and content paths before using any write credential', async () => {
  for (const env of [{ GH_TOKEN: 'workflow-fixture' }, { GH_TOKEN: 'workflow-fixture', EDITORIAL_APP_TOKEN: 'app-fixture' }]) {
    const commands = [];
    const run = async (_command, args) => {
      commands.push(args);
      if (args[0] === 'branch') return { stdout: 'automation/editorial\n' };
      if (args[0] === 'diff') return { stdout: 'automation/source-health.json\n' };
      if (args[0] === 'push') return { stdout: '' };
      throw new Error('Unexpected command');
    };
    assert.equal((await pushEditorialBranch({ env, run })).prAuthMode, env.EDITORIAL_APP_TOKEN ? 'github-app' : 'github-token-human-workflow-approval');
    assert.deepEqual(commands.at(-1), ['push', 'origin', 'HEAD:automation/editorial']);
  }
  for (const [branch, file] of [['main', 'automation/source-health.json'], ['automation/editorial', 'scripts/content-pipeline.mjs']]) {
    const commands = [];
    await assert.rejects(pushEditorialBranch({ run: async (_command, args) => {
      commands.push(args);
      return { stdout: args[0] === 'branch' ? branch : file };
    } }), /restricted|allowlist/);
    assert.ok(!commands.some((args) => args[0] === 'push'));
  }
});

test('workflow creates a narrowly scoped App token only when both configuration values exist', async (t) => {
  const root = await setup(t);
  const workflow = parse(await fs.readFile(new URL('../.github/workflows/editorial.yml', import.meta.url), 'utf8'));
  const steps = workflow.jobs.editorial.steps;
  const selector = steps.find((step) => step.id === 'editorial-auth');
  assert.equal(selector.env.APP_KEY_CONFIGURED, "${{ secrets.EDITORIAL_APP_PRIVATE_KEY != '' }}");
  assert.ok(!Object.hasOwn(selector.env, 'EDITORIAL_APP_PRIVATE_KEY'));
  for (const [client, key, enabled] of [['', 'false', false], ['configured-client', 'false', false], ['', 'true', false], ['configured-client', 'true', true]]) {
    const output = path.join(root, 'auth-output.txt');
    await fs.writeFile(output, '');
    const result = await exec('bash', ['-c', selector.run], { env: { PATH: process.env.PATH, GITHUB_OUTPUT: output, APP_CLIENT_ID: client, APP_KEY_CONFIGURED: key } });
    assert.equal((await fs.readFile(output, 'utf8')).trim(), `configured=${enabled}`);
    assert.match(result.stdout, enabled ? /repository-scoped installation token/ : /human approval.*required PR checks/);
  }
  const token = steps.find((step) => step.id === 'editorial-app-token');
  assert.equal(token.if, "steps.editorial-auth.outputs.configured == 'true'");
  assert.match(token.uses, /^actions\/create-github-app-token@[a-f0-9]{40}$/);
  assert.equal(token.with.owner, '${{ github.repository_owner }}');
  assert.equal(token.with.repositories, '${{ github.repository }}');
  assert.equal(token.with['client-id'], '${{ vars.EDITORIAL_APP_CLIENT_ID }}');
  assert.equal(token.with['private-key'], '${{ secrets.EDITORIAL_APP_PRIVATE_KEY }}');
  assert.equal(token.with['skip-token-revoke'], false);
  assert.deepEqual(Object.keys(token.with).filter((key) => key.startsWith('permission-')).sort(), ['permission-contents', 'permission-pull-requests']);
  assert.equal(token.with['permission-contents'], 'write');
  assert.equal(token.with['permission-pull-requests'], 'write');
  assert.equal(steps.find((step) => step.uses === 'actions/checkout@v4').with['persist-credentials'], false);
  const publish = steps.find((step) => step.name === 'Publish a reviewable content and source-health PR');
  assert.equal(publish.env.GH_TOKEN, '${{ github.token }}');
  assert.equal(publish.env.EDITORIAL_APP_TOKEN, '${{ steps.editorial-app-token.outputs.token }}');
  assert.match(publish.run, /node scripts\/editorial-pr\.mjs --push-branch/);
  assert.ok(!publish.run.includes('git push'));
  assert.ok(!publish.run.includes('git commit'));
  assert.ok(steps.indexOf(token) > steps.findIndex((step) => step.run === 'npm run verify'));
  assert.ok(steps.indexOf(token) > steps.findIndex((step) => step.name === 'Prepare the editorial state commit'));
  assert.ok(steps.slice(0, steps.indexOf(token)).every((step) => !Object.hasOwn(step.env ?? {}, 'EDITORIAL_APP_TOKEN')));
  const ci = await fs.readFile(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  assert.ok(!ci.includes('EDITORIAL_APP'));
});
