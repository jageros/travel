import assert from 'node:assert/strict';
import test from 'node:test';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { parse } from 'yaml';
import { openEditorialPullRequest } from '../scripts/editorial-pr.mjs';
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

function fakeRunner({ existing = false, changed = ['automation/source-health.json'], noDiff = false, conclusion = 'success', pending = false, prHead = head } = {}) {
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

test('a new health-only PR is created after the prior branch PR was merged or closed', async (t) => {
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
