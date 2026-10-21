import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';

const exec = promisify(execFile);
const branch = 'automation/editorial';
const remoteRef = `refs/heads/${branch}`;
const shaPattern = /^[a-f0-9]{40}$/;

// Bootstrap runs before npm ci: keep every dependency in this file node:-only.
export function createBranchRunner({ root = process.cwd(), env = process.env, execute = exec } = {}) {
  return async (command, args) => {
    const token = env.GH_TOKEN;
    const network = command === 'gh' || (command === 'git' && ['fetch', 'ls-remote', 'push'].includes(args[0]));
    if (network && (!token || typeof token !== 'string' || /\s/.test(token))) throw new Error('Editorial branch preparation requires its limited workflow credential');
    if (command === 'git' && args[0] === 'push' && !(args.length === 4 && new RegExp(`^--force-with-lease=${remoteRef}:[a-f0-9]{40}$`).test(args[1]) && args[2] === 'origin' && args[3] === `:${remoteRef}`)) throw new Error('Bootstrap writes are restricted to lease-guarded deletion of the editorial ref');
    const childEnv = { ...env };
    delete childEnv.EDITORIAL_APP_TOKEN;
    delete childEnv.EDITORIAL_APP_PRIVATE_KEY;
    delete childEnv.GITHUB_TOKEN;
    if (command === 'gh') childEnv.GH_TOKEN = token;
    if (command === 'git') {
      delete childEnv.GH_TOKEN;
      childEnv.GIT_TERMINAL_PROMPT = '0';
      childEnv.GIT_TRACE = '0';
      childEnv.GIT_TRACE_CURL = '0';
      childEnv.GIT_CURL_VERBOSE = '0';
      if (token) {
        if (typeof token !== 'string' || /\s/.test(token)) throw new Error('Invalid bootstrap workflow credential');
        childEnv.GIT_CONFIG_COUNT = '2';
        childEnv.GIT_CONFIG_KEY_0 = 'credential.helper';
        childEnv.GIT_CONFIG_VALUE_0 = '';
        childEnv.GIT_CONFIG_KEY_1 = 'http.https://github.com/.extraheader';
        childEnv.GIT_CONFIG_VALUE_1 = `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${token}`).toString('base64')}`;
      }
    }
    return execute(command, args, { cwd: root, encoding: 'utf8', env: childEnv });
  };
}

export async function prepareEditorialBranch({ root = process.cwd(), env = process.env, run = createBranchRunner({ root, env }), now = new Date() } = {}) {
  const repository = env.GH_REPO;
  if (typeof repository !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9-]*\/[A-Za-z0-9_.-]+$/.test(repository) || ['.', '..'].includes(repository.split('/')[1])) throw new Error('GH_REPO must identify the current owner/repository');
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) throw new Error('Invalid branch-preparation time');
  if ((await run('git', ['status', '--porcelain'])).stdout.trim()) throw new Error('Editorial branch preparation requires a clean checkout');
  if ((await run('git', ['branch', '--list', branch])).stdout.trim()) throw new Error('An existing local editorial branch requires review; no reset is permitted');
  const main = (await run('git', ['rev-parse', 'origin/main'])).stdout.trim();
  if (!shaPattern.test(main)) throw new Error('Cannot identify the checked origin/main commit');

  function parseRemote(stdout, ref, optional = false) {
    const value = stdout.trim();
    if (!value && optional) return null;
    const parts = value.split('\t');
    if (parts.length !== 2 || !shaPattern.test(parts[0]) || parts[1] !== ref) throw new Error('Missing, ambiguous or malformed remote branch tip');
    return parts[0];
  }
  const tip = parseRemote((await run('git', ['ls-remote', '--heads', 'origin', remoteRef])).stdout, remoteRef, true);
  const owner = repository.split('/')[0];
  const query = (state, limit) => `repos/${repository}/pulls?state=${state}&base=main&head=${encodeURIComponent(`${owner}:${branch}`)}&sort=created&direction=desc&per_page=${limit}`;
  const validatePull = (pr) => {
    if (!pr || !Number.isSafeInteger(pr.number) || pr.number <= 0 || !['open', 'closed'].includes(pr.state) || pr.head?.ref !== branch || pr.base?.ref !== 'main' || pr.head?.repo?.full_name !== repository || pr.base?.repo?.full_name !== repository || !shaPattern.test(pr.head?.sha ?? '')) throw new Error('Unknown or mismatched editorial PR metadata');
    return pr;
  };
  const readOpen = async () => {
    const list = JSON.parse((await run('gh', ['api', query('open', 2)])).stdout);
    if (!Array.isArray(list) || list.length > 1) throw new Error('Ambiguous open editorial PRs; branch remains untouched');
    return list.map((pr) => {
      validatePull(pr);
      if (pr.state !== 'open' || pr.merged_at !== null) throw new Error('Unexpected open PR state');
      return pr;
    });
  };
  const readLatest = async () => {
    // Explicit creation ordering includes closed-unmerged PRs. Never search only
    // for a historical merged PR that could mask a newer abandoned review.
    const list = JSON.parse((await run('gh', ['api', query('all', 1)])).stdout);
    if (!Array.isArray(list) || list.length !== 1) throw new Error('No unambiguous latest editorial PR proves this remote branch merged');
    return validatePull(list[0]);
  };
  const verifyMerged = (pr) => {
    const time = Date.parse(pr.merged_at);
    if (pr.state !== 'closed' || typeof pr.merged_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(pr.merged_at) || !Number.isFinite(time) || new Date(time).toISOString().replace('.000Z', 'Z') !== pr.merged_at.replace('.000Z', 'Z') || time > now.getTime() || !shaPattern.test(pr.merge_commit_sha ?? '')) throw new Error('The latest editorial PR is not a verified past merged PR');
    if (pr.head.sha !== tip) throw new Error('Remote editorial tip has unknown commits beyond the latest merged PR');
  };
  const verifyMain = async () => {
    const live = parseRemote((await run('git', ['ls-remote', 'origin', 'refs/heads/main'])).stdout, 'refs/heads/main');
    if (live !== main) throw new Error('Main moved after checkout; retry with a fresh checkout');
  };
  const fetchExactTip = async () => {
    await run('git', ['fetch', '--no-tags', 'origin', remoteRef]);
    if ((await run('git', ['rev-parse', 'FETCH_HEAD'])).stdout.trim() !== tip) throw new Error('Remote editorial branch moved while fetching; stop without cleanup');
  };
  const createFromMain = async () => {
    await verifyMain();
    await run('git', ['checkout', '-b', branch, 'origin/main']);
  };

  const open = await readOpen();
  if (!tip) {
    if (open.length) throw new Error('An open editorial PR has a missing remote branch; retain its review intent');
    await createFromMain();
    return { status: 'created-from-main', branch, base: main, cleanup: false, reason: 'No remote editorial branch or open PR exists' };
  }
  if (open.length) {
    if (open[0].head.sha !== tip) throw new Error('Open editorial PR does not match the observed remote tip');
    await fetchExactTip();
    await verifyMain();
    await run('git', ['checkout', '-b', branch, tip]);
    // A conflict stops the job here. Never select ours/theirs or reset drafts.
    await run('git', ['merge', '--no-edit', 'origin/main']);
    return { status: 'continued-open-pr', branch, head: tip, base: main, prNumber: open[0].number, cleanup: false };
  }

  const latest = await readLatest();
  verifyMerged(latest);
  await fetchExactTip();
  // Squash-merged head commits need not be ancestors of main; their recorded
  // merge commit must be. Otherwise this checkout cannot safely replace them.
  await run('git', ['merge-base', '--is-ancestor', latest.merge_commit_sha, 'origin/main']);
  if ((await readOpen()).length) throw new Error('A new open editorial PR appeared; retain the remote branch');
  const confirmed = await readLatest();
  verifyMerged(confirmed);
  if (confirmed.number !== latest.number || confirmed.merge_commit_sha !== latest.merge_commit_sha || confirmed.merged_at !== latest.merged_at) throw new Error('Latest editorial PR evidence changed during preparation');
  await verifyMain();
  await run('git', ['push', `--force-with-lease=${remoteRef}:${tip}`, 'origin', `:${remoteRef}`]);
  // If local creation fails after cleanup, propagate it: downstream steps must
  // not publish from a different branch or continue using stale source state.
  await createFromMain();
  return { status: 'recreated-after-merged-pr', branch, previousHead: tip, base: main, prNumber: latest.number, cleanup: true, reason: 'Remote tip exactly matched the newest merged editorial PR; removed only that ref using force-with-lease' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log(JSON.stringify(await prepareEditorialBranch(), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
