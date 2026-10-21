import assert from 'node:assert/strict';
import test from 'node:test';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createBranchRunner, prepareEditorialBranch } from '../scripts/editorial-branch.mjs';

const exec = promisify(execFile);
const main = 'a'.repeat(40);
const tip = 'b'.repeat(40);
const merge = 'c'.repeat(40);
const other = 'd'.repeat(40);
const branch = 'automation/editorial';
const ref = `refs/heads/${branch}`;
const env = { GH_REPO: 'jageros/travel', GH_TOKEN: 'workflow-fixture' };
const now = new Date('2026-10-21T03:00:00Z');

function pull(overrides = {}) {
  return {
    number: 9, state: 'closed', merged_at: '2026-10-21T02:11:54Z', merge_commit_sha: merge,
    head: { sha: tip, ref: branch, repo: { full_name: env.GH_REPO } },
    base: { ref: 'main', repo: { full_name: env.GH_REPO } }, ...overrides,
  };
}

function fixture(options = {}) {
  const calls = [];
  let openReads = 0;
  let latestReads = 0;
  let mainReads = 0;
  const run = async (command, args) => {
    const call = { command, args };
    calls.push(call);
    if (options.before) await options.before(call, calls);
    if (command === 'gh' && args[0] === 'api') {
      const query = new URL(args[1], 'https://api.github.com/');
      assert.equal(query.pathname, `/repos/${env.GH_REPO}/pulls`);
      assert.equal(query.searchParams.get('base'), 'main');
      assert.equal(query.searchParams.get('head'), 'jageros:automation/editorial');
      assert.equal(query.searchParams.get('sort'), 'created');
      assert.equal(query.searchParams.get('direction'), 'desc');
      if (query.searchParams.get('state') === 'open') {
        assert.equal(query.searchParams.get('per_page'), '2');
        const value = typeof options.open === 'function' ? options.open(++openReads) : (openReads++, options.open ?? []);
        return { stdout: JSON.stringify(value) };
      }
      assert.equal(query.searchParams.get('state'), 'all', 'closed-unmerged PRs must not be filtered out');
      assert.equal(query.searchParams.get('per_page'), '1');
      const value = typeof options.latest === 'function' ? options.latest(++latestReads) : (latestReads++, options.latest ?? [pull()]);
      return { stdout: JSON.stringify(value) };
    }
    assert.equal(command, 'git');
    if (args[0] === 'status') return { stdout: options.dirty ? ' M automation/source-health.json\n' : '' };
    if (args[0] === 'branch') return { stdout: options.localBranch ? `  ${branch}\n` : '' };
    if (args[0] === 'rev-parse') return { stdout: `${args[1] === 'FETCH_HEAD' ? (options.fetchedTip ?? tip) : main}\n` };
    if (args[0] === 'ls-remote') {
      if (args.at(-1) === ref) return { stdout: options.remoteOutput ?? (options.noRemote ? '' : `${tip}\t${ref}\n`) };
      assert.equal(args.at(-1), 'refs/heads/main');
      const value = typeof options.remoteMain === 'function' ? options.remoteMain(++mainReads) : (mainReads++, options.remoteMain ?? main);
      return { stdout: `${value}\trefs/heads/main\n` };
    }
    if (args[0] === 'fetch') return { stdout: '' };
    if (args[0] === 'merge-base') {
      assert.deepEqual(args, ['merge-base', '--is-ancestor', merge, 'origin/main']);
      if (options.notAncestor) throw Object.assign(new Error('Merge commit is not in checked main'), { code: 1 });
      return { stdout: '' };
    }
    if (args[0] === 'push') {
      if (options.leaseFailure) throw Object.assign(new Error('rejected (stale info)'), { code: 1 });
      return { stdout: '' };
    }
    if (args[0] === 'checkout') {
      if (options.checkoutFailure) throw new Error('Checkout failed');
      return { stdout: '' };
    }
    if (args[0] === 'merge') {
      if (options.mergeConflict) throw new Error('CONFLICT: source-health.json');
      return { stdout: '' };
    }
    throw new Error(`Unexpected git command: ${args.join(' ')}`);
  };
  return { run, calls };
}

const commands = (runner, name) => runner.calls.filter((call) => call.command === 'git' && call.args[0] === name);
const prepare = (runner) => prepareEditorialBranch({ env, run: runner.run, now });

test('an absent remote branch starts from checked main without creating or deleting a remote ref', async () => {
  const runner = fixture({ noRemote: true });
  assert.equal((await prepare(runner)).status, 'created-from-main');
  assert.deepEqual(commands(runner, 'checkout').map((call) => call.args), [['checkout', '-b', branch, 'origin/main']]);
  assert.equal(commands(runner, 'push').length, 0);
  assert.equal(commands(runner, 'fetch').length, 0);
});

test('an open PR preserves its exact head and merges main without deleting or resetting drafts', async () => {
  const runner = fixture({ open: [pull({ state: 'open', merged_at: null, merge_commit_sha: null })] });
  assert.equal((await prepare(runner)).status, 'continued-open-pr');
  assert.deepEqual(commands(runner, 'fetch')[0].args, ['fetch', '--no-tags', 'origin', ref]);
  assert.deepEqual(commands(runner, 'checkout')[0].args, ['checkout', '-b', branch, tip]);
  assert.deepEqual(commands(runner, 'merge')[0].args, ['merge', '--no-edit', 'origin/main']);
  assert.equal(commands(runner, 'push').length, 0);
  assert.ok(!runner.calls.some((call) => call.args.includes('--hard') || call.args.includes('-B')));
});

test('only the exact latest merged head with an ancestor merge commit is retired using an exact lease', async () => {
  const runner = fixture();
  const result = await prepare(runner);
  assert.equal(result.status, 'recreated-after-merged-pr');
  const deletion = commands(runner, 'push')[0];
  assert.deepEqual(deletion.args, ['push', `--force-with-lease=${ref}:${tip}`, 'origin', `:${ref}`]);
  assert.equal(commands(runner, 'push').length, 1);
  assert.equal(commands(runner, 'merge').length, 0, 'a squash-merged head must not be merged into new main again');
  assert.ok(runner.calls.indexOf(commands(runner, 'merge-base')[0]) < runner.calls.indexOf(deletion));
  assert.ok(runner.calls.indexOf(deletion) < runner.calls.indexOf(commands(runner, 'checkout')[0]));
  assert.deepEqual(commands(runner, 'checkout')[0].args, ['checkout', '-b', branch, 'origin/main']);
});

test('a latest closed-unmerged PR holds even when an older merged PR exists', async () => {
  const latest = pull({ number: 10, merged_at: null, merge_commit_sha: null });
  const runner = fixture({ latest: [latest] });
  await assert.rejects(prepare(runner), /merged PR/);
  assert.equal(commands(runner, 'push').length, 0);
  assert.equal(commands(runner, 'checkout').length, 0);
  assert.ok(runner.calls.some((call) => call.command === 'gh' && call.args[1].includes('state=all')));
});

test('unknown, ambiguous, mismatched or future PR evidence never permits remote cleanup', async (t) => {
  const cases = {
    'no history': { latest: [] },
    'ambiguous history': { latest: [pull(), pull({ number: 8 })] },
    'head moved beyond approved merge': { latest: [pull({ head: { sha: other, ref: branch, repo: { full_name: env.GH_REPO } } })] },
    'another head repository': { latest: [pull({ head: { sha: tip, ref: branch, repo: { full_name: 'elsewhere/travel' } } })] },
    'another base repository': { latest: [pull({ base: { ref: 'main', repo: { full_name: 'elsewhere/travel' } } })] },
    'another base branch': { latest: [pull({ base: { ref: 'preview', repo: { full_name: env.GH_REPO } } })] },
    'another head branch': { latest: [pull({ head: { sha: tip, ref: 'review/draft', repo: { full_name: env.GH_REPO } } })] },
    'invalid merge date': { latest: [pull({ merged_at: '2026-02-30T02:11:54Z' })] },
    'future merge date': { latest: [pull({ merged_at: '2026-10-22T02:11:54Z' })] },
    'missing merge commit': { latest: [pull({ merge_commit_sha: null })] },
    'merge not on checked main': { notAncestor: true },
  };
  for (const [name, options] of Object.entries(cases)) await t.test(name, async () => {
    const runner = fixture(options);
    await assert.rejects(prepare(runner));
    assert.equal(commands(runner, 'push').length, 0);
    assert.equal(commands(runner, 'checkout').length, 0);
  });
});

test('open PR inconsistencies and API errors preserve the remote and local branches', async (t) => {
  const open = pull({ state: 'open', merged_at: null, merge_commit_sha: null });
  const cases = {
    'missing ref with open review': { noRemote: true, open: [open] },
    'multiple open reviews': { open: [open, { ...open, number: 10 }] },
    'open review head differs': { open: [{ ...open, head: { ...open.head, sha: other } }] },
    'API request fails': { before: ({ command }) => { if (command === 'gh') throw new Error('HTTP 503'); } },
    'invalid API JSON': { open: 'not-an-array' },
    'dirty checkout': { dirty: true },
    'existing local branch': { localBranch: true },
  };
  for (const [name, options] of Object.entries(cases)) await t.test(name, async () => {
    const runner = fixture(options);
    await assert.rejects(prepare(runner));
    assert.equal(commands(runner, 'push').length, 0);
    assert.equal(commands(runner, 'checkout').length, 0);
  });
});

test('branch, PR and main races fail before cleanup', async (t) => {
  const open = pull({ state: 'open', merged_at: null, merge_commit_sha: null });
  const cases = {
    'fetched branch changed': { fetchedTip: other },
    'new open PR before deletion': { open: (read) => read === 1 ? [] : [open] },
    'latest PR changes': { latest: (read) => [pull({ number: read === 1 ? 9 : 10 })] },
    'main moved': { remoteMain: other },
    'malformed remote tip': { remoteOutput: `${tip}\t${ref}\n${other}\t${ref}\n` },
  };
  for (const [name, options] of Object.entries(cases)) await t.test(name, async () => {
    const runner = fixture(options);
    await assert.rejects(prepare(runner));
    assert.equal(commands(runner, 'push').length, 0);
    assert.equal(commands(runner, 'checkout').length, 0);
  });
});

test('an exact-lease rejection stops before local recreation or downstream merge', async () => {
  const runner = fixture({ leaseFailure: true });
  await assert.rejects(prepare(runner), /stale info/);
  assert.equal(commands(runner, 'push').length, 1);
  assert.equal(commands(runner, 'checkout').length, 0);
  assert.equal(commands(runner, 'merge').length, 0);
});

test('a checkout failure or main movement after cleanup propagates without a fallback reset or publication', async (t) => {
  for (const options of [{ checkoutFailure: true }, { remoteMain: (read) => read === 1 ? main : other }]) await t.test(JSON.stringify(options), async () => {
    const runner = fixture(options);
    await assert.rejects(prepare(runner));
    assert.equal(commands(runner, 'push').length, 1, 'the only remote operation was the proven merged-ref deletion');
    assert.equal(commands(runner, 'merge').length, 0);
    assert.ok(!runner.calls.some((call) => call.args[0] === 'reset' || call.command === 'gh' && call.args[0] !== 'api'));
  });
});

test('a conflict in an open PR propagates and leaves its remote ref intact', async () => {
  const runner = fixture({ open: [pull({ state: 'open', merged_at: null })], mergeConflict: true });
  await assert.rejects(prepare(runner), /CONFLICT/);
  assert.equal(commands(runner, 'push').length, 0);
  assert.equal(commands(runner, 'checkout').length, 1);
});

test('bootstrap credentials use only the workflow token with no private key, App token, argv secret or saved config', async () => {
  const captured = [];
  const workflowToken = 'workflow-token-fixture';
  const appToken = 'app-token-fixture';
  const privateKey = 'private-key-fixture';
  const runner = createBranchRunner({ root: '/tmp/bootstrap-fixture', env: { GH_TOKEN: workflowToken, GH_REPO: env.GH_REPO, EDITORIAL_APP_TOKEN: appToken, EDITORIAL_APP_PRIVATE_KEY: privateKey, GITHUB_TOKEN: 'alias-token' }, execute: async (command, args, options) => {
    captured.push({ command, args, options });
    return { stdout: '' };
  } });
  await runner('gh', ['api', 'repos/jageros/travel/pulls']);
  await runner('git', ['ls-remote', 'origin', 'refs/heads/main']);
  await runner('git', ['push', `--force-with-lease=${ref}:${tip}`, 'origin', `:${ref}`]);
  assert.equal(captured[0].options.env.GH_TOKEN, workflowToken);
  for (const call of captured) {
    assert.equal(call.options.cwd, '/tmp/bootstrap-fixture');
    for (const key of ['EDITORIAL_APP_TOKEN', 'EDITORIAL_APP_PRIVATE_KEY', 'GITHUB_TOKEN']) assert.equal(call.options.env[key], undefined);
    assert.ok(!JSON.stringify(call).includes(appToken));
    assert.ok(!JSON.stringify(call).includes(privateKey));
    assert.ok(!call.args.join(' ').includes(workflowToken));
    assert.ok(!call.args.includes('config'));
    if (call.command === 'git') {
      assert.equal(call.options.env.GH_TOKEN, undefined);
      assert.equal(call.options.env.GIT_TRACE, '0');
      assert.equal(call.options.env.GIT_TRACE_CURL, '0');
      assert.equal(call.options.env.GIT_CURL_VERBOSE, '0');
      assert.equal(call.options.env.GIT_CONFIG_VALUE_0, '');
      assert.equal(call.options.env.GIT_CONFIG_VALUE_1, `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${workflowToken}`).toString('base64')}`);
    }
  }
});

test('bootstrap rejects App-only auth and any push beyond the single lease-protected ref deletion', async () => {
  const executed = [];
  const execute = async (...args) => { executed.push(args); return { stdout: '' }; };
  const appOnly = createBranchRunner({ env: { EDITORIAL_APP_TOKEN: 'app-fixture' }, execute });
  await assert.rejects(appOnly('gh', ['api', 'repos/jageros/travel/pulls']), /workflow credential/);
  await assert.rejects(appOnly('git', ['ls-remote', 'origin', ref]), /workflow credential/);
  const runner = createBranchRunner({ env, execute });
  for (const args of [
    ['push', 'origin', `:${ref}`],
    ['push', '--force', 'origin', `:${ref}`],
    ['push', `--force-with-lease=${ref}:${tip}`, 'origin', ':refs/heads/main'],
    ['push', `--force-with-lease=${ref}:${tip}`, 'origin', `HEAD:${branch}`],
    ['push', `--force-with-lease=${ref}:${tip}`, 'origin', `:${ref}`, ':refs/heads/other'],
  ]) await assert.rejects(runner('git', args), /restricted/);
  assert.equal(executed.length, 0);
});

async function temporary(t, prefix) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return root;
}

test('the CLI runs before npm ci with no node_modules and no transitive imports', async (t) => {
  // macOS exposes the temporary directory through a /var -> /private/var
  // symlink. Use the real entry path so import.meta.url matches Node's argv.
  const root = await fs.realpath(await temporary(t, 'cedar-branch-cold-'));
  const bin = path.join(root, 'bin');
  await fs.mkdir(bin);
  const script = path.join(root, 'editorial-branch.mjs');
  await fs.copyFile(new URL('../scripts/editorial-branch.mjs', import.meta.url), script);
  const git = `#!${process.execPath}\nconst a=process.argv.slice(2); if(a[0]==='rev-parse') console.log('${main}'); else if(a[0]==='ls-remote' && a.at(-1)==='refs/heads/main') console.log('${main}\\trefs/heads/main'); else if(!['status','branch','ls-remote','checkout'].includes(a[0])) process.exit(8);\n`;
  await fs.writeFile(path.join(bin, 'git'), git, { mode: 0o755 });
  await fs.writeFile(path.join(bin, 'gh'), `#!${process.execPath}\nconsole.log('[]');\n`, { mode: 0o755 });
  const result = await exec(process.execPath, [script], { cwd: root, env: { PATH: `${bin}:${process.env.PATH}`, ...env } });
  assert.equal(JSON.parse(result.stdout).status, 'created-from-main');
  await assert.rejects(fs.access(path.join(root, 'node_modules')));
});

async function realGitFixture(t) {
  const root = await temporary(t, 'cedar-branch-real-');
  const remote = path.join(root, 'origin.git');
  const seed = path.join(root, 'seed');
  const checkout = path.join(root, 'checkout');
  const git = (args, cwd = seed) => exec('git', args, { cwd, env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_CONFIG_NOSYSTEM: '1' } });
  await fs.mkdir(seed);
  await git(['init', '--bare', remote], root);
  await git(['init', '--initial-branch=main']);
  await git(['config', 'user.name', 'Fixture']);
  await git(['config', 'user.email', 'fixture@example.invalid']);
  await git(['remote', 'add', 'origin', remote]);
  await fs.writeFile(path.join(seed, 'health.json'), 'baseline\n');
  await git(['add', 'health.json']); await git(['commit', '-m', 'baseline']);
  await git(['push', 'origin', 'main']);
  await git(['checkout', '-b', branch]);
  await fs.writeFile(path.join(seed, 'health.json'), 'automated observation\n');
  await git(['commit', '-am', 'observation']);
  await git(['push', 'origin', branch]);
  const realTip = (await git(['rev-parse', 'HEAD'])).stdout.trim();
  await git(['checkout', 'main']);
  await git(['merge', '--squash', branch]); await git(['commit', '-m', 'squash accepted observation']);
  const realMerge = (await git(['rev-parse', 'HEAD'])).stdout.trim();
  await fs.writeFile(path.join(seed, 'health.json'), 'later manually reviewed baseline\n');
  await git(['commit', '-am', 'manual baseline adoption']); await git(['push', 'origin', 'main']);
  const realMain = (await git(['rev-parse', 'HEAD'])).stdout.trim();
  await git(['clone', '--branch', 'main', remote, checkout], root);
  const record = pull({ head: { sha: realTip, ref: branch, repo: { full_name: env.GH_REPO } }, merge_commit_sha: realMerge });
  return { remote, checkout, git, realTip, realMain, record };
}

test('real Git replaces the stale squash-merged ref without replaying conflicting historical health', async (t) => {
  const fixture = await realGitFixture(t);
  const run = async (command, args) => command === 'gh'
    ? { stdout: JSON.stringify(args[1].includes('state=open') ? [] : [fixture.record]) }
    : fixture.git(args, fixture.checkout);
  const result = await prepareEditorialBranch({ env, run, now });
  assert.equal(result.status, 'recreated-after-merged-pr');
  assert.equal((await fixture.git(['rev-parse', 'HEAD'], fixture.checkout)).stdout.trim(), fixture.realMain);
  assert.equal((await fixture.git(['branch', '--show-current'], fixture.checkout)).stdout.trim(), branch);
  assert.equal((await fixture.git(['ls-remote', 'origin', ref], fixture.checkout)).stdout, '');
  assert.equal(await fs.readFile(path.join(fixture.checkout, 'health.json'), 'utf8'), 'later manually reviewed baseline\n');
});

test('real Git lease protects a newly moved ref and leaves its new commits untouched', async (t) => {
  const fixture = await realGitFixture(t);
  let checkoutAttempted = false;
  const run = async (command, args) => {
    if (command === 'gh') return { stdout: JSON.stringify(args[1].includes('state=open') ? [] : [fixture.record]) };
    if (args[0] === 'push') await fixture.git(['--git-dir', fixture.remote, 'update-ref', ref, fixture.realMain]);
    if (args[0] === 'checkout') checkoutAttempted = true;
    return fixture.git(args, fixture.checkout);
  };
  await assert.rejects(prepareEditorialBranch({ env, run, now }), /stale info|rejected|failed to push/);
  assert.equal(checkoutAttempted, false);
  assert.equal((await fixture.git(['ls-remote', 'origin', ref], fixture.checkout)).stdout.trim(), `${fixture.realMain}\t${ref}`);
  assert.equal((await fixture.git(['branch', '--list', branch], fixture.checkout)).stdout, '');
});
