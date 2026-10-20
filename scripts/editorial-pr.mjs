import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { manualReleaseCount, readJson } from './content-lib.mjs';

const exec = promisify(execFile);
const allowedUpdates = /^(?:src\/content\/articles\/[a-z0-9]+(?:-[a-z0-9]+)*\.md|automation\/(?:editorial|review-queue|source-health|sources)\.json)$/;

export async function openEditorialPullRequest({ root = process.cwd(), run = (command, args) => exec(command, args, { cwd: root, encoding: 'utf8' }), sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), attempts = 60, delayMs = 10000, now = new Date() } = {}) {
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
  const autoEligible = manualCount >= 5 && state.autoPublishEnabled === true;
  const listRuns = async () => JSON.parse((await run('gh', ['run', 'list', '--workflow', 'ci.yml', '--event', 'workflow_dispatch', '--branch', 'automation/editorial', '--commit', sha, '--limit', '10', '--json', 'databaseId,status,conclusion,headSha'])).stdout);
  const priorRuns = new Set(autoEligible ? (await listRuns()).map((item) => item.databaseId) : []);
  // GITHUB_TOKEN pushes do not reliably start CI. workflow_dispatch is explicit.
  await run('gh', ['workflow', 'run', 'ci.yml', '--ref', 'automation/editorial']);
  if (!autoEligible) return { status: 'manual-review', number: pr.number, url: pr.url, sha, manualReleases: manualCount };

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
  await run('gh', ['pr', 'merge', String(pr.number), '--auto', '--squash', '--match-head-commit', sha]);
  return { status: 'auto-merge-requested', number: pr.number, url: pr.url, sha, manualReleases: manualCount };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try { console.log(JSON.stringify(await openEditorialPullRequest(), null, 2)); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
