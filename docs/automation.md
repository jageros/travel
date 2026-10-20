# Editorial automation operations

The repository contains a working draft → validate → review → publish pipeline. It is deliberately shipped with **five review articles, zero approvals, zero release records, and no model credentials**. Building or merging this implementation does not approve those articles. Production excludes review and draft articles; `CONTENT_REVIEW_PREVIEW=true npm run build` creates an unindexed review preview.

## Local commands

Use Node 24 and install the repository's locked dependencies with `npm ci`.

```sh
node scripts/validate-content.mjs
node --test tests/automation.test.mjs
node scripts/check-sources.mjs
node scripts/content-pipeline.mjs --draft
node scripts/content-pipeline.mjs --list-review
node scripts/content-pipeline.mjs --approve sfo-to-fishermans-wharf-with-luggage --reviewer YOUR_GITHUB_NAME --sha256 REVIEWED_CONTENT_SHA256
node scripts/content-pipeline.mjs --publish
node scripts/import-gsc.mjs /path/to/Queries.csv
```

`--list-review` is read-only and prints each review article's current `contentSha256`. Inspect that exact version and provide the reviewed value to `--approve --sha256`; a missing or mismatched digest is rejected. `--approve` records the named review but does not publish. Changing title, description, prose, source IDs, facts, image metadata or other editorial fields invalidates approval. The release step alone changes status and release date, and caps publication at **three articles in any rolling seven days**, including manually approved articles. Releasing all first five therefore takes at least two release windows. Do not manually set Markdown status to bypass the ledger.

With no `--draft` or `--publish` flags, `content-pipeline.mjs` monitors official sources and writes health/review reports only. This mode needs no model key and leaves article status and the approval/publication ledger unchanged. `--publish` is always explicit for a local/manual command.

`--draft` requires explicitly configured credentials and a ready topic. No script calls a model during installation, build, validation, tests, source monitoring or CSV import. Test requests use in-memory mock responses.

## Verify official sources before the first release

The source registry contains official URLs, manually researched fact records and their check dates. **An editor must review the official pages before accepting their initial content hashes.** Missing baselines block generation and publication, and the site suppresses unverified dynamic facts.

1. Read every cited official page. Match each fact's statement and short evidence excerpt to the source; check that different pages do not disagree. Update `checkedAt`, and set dynamic `expiresAt` conservatively. Inspect the actual dates in `automation/sources.json`; expiry is at the start of the recorded day in UTC.
2. Run `node scripts/check-sources.mjs --accept-baseline`. This fetches only registered HTTPS official hosts, checks redirects, records normalized source-text hashes **only for missing baselines**, and writes the source-health report. It does not extend dates or accept changed existing baselines. Review `automation/reports/source-check.json` for failures and missing evidence.
3. Review and commit only the intended registry and health changes. Repeat the five-article review using `docs/editorial-review.md`, record approvals, then run the separate publication command.

To approve a changed source later, review its actual content and all affected facts first. Update the affected statements, evidence and dates; remove **that source's** old `contentHash`; then run `--accept-baseline` and review the resulting diff. A change detected by a monitor is never automatically accepted as a new factual baseline.

The [2026-10-20 source review](source-review-2026-10-20.md) completed factual review of all eleven registered official sources. Local TLS/network failures left BART's initial hash uncaptured after ten sources succeeded. To retry missing hashes on a GitHub runner, manually dispatch on `main` with `accept_missing_baselines=true` **only after completing that official-source review**. Leave draft, publication and approval inputs unset for a monitoring run. The workflow records the authenticated `github.actor` in its log, captures only absent hashes, and then runs normal monitoring. It continues after a capture failure so health and failure reports can still reach the review PR/artifact; changed existing hashes remain held. The option defaults to false and is unavailable to scheduled acceptance. A successful fetch is not a substitute for factual review or article approval.

An unchanged approved hash with a still-present evidence excerpt renews its source/fact check dates and a seven-day dynamic-fact lifetime. Changed or unreachable sources preserve their previous provenance and expiry dates. Sources without evidence cannot automatically renew facts. Hash comparison is conservative: harmless page changes may hold articles. Evidence matching and dates are deterministic checks, not a semantic guarantee; human review remains responsible for factual meaning and contradictory official pages.

## GitHub Actions setup and daily behavior

`Content and site checks` runs validation, meaningful automated tests, type checks, production build verification and a separate review build on pushes and pull requests. It has read-only repository permissions and receives no model keys.

`Editorial source monitor and content queue` runs daily at **09:15 Asia/Shanghai** and supports a manual dispatch. Repository permission for GitHub Actions to create pull requests was enabled with the user's approval on 2026-10-20; the repository's default workflow-token permission remains read-only. Separately verify auto-merge and protect `main` with the `verify` check before relying on unattended merging. The editorial workflow explicitly requests write permissions limited to repository contents, pull requests and dispatching the validation workflow. It respects required reviews and branch protection; it cannot make protected checks disappear. A protected environment or repository approval policy may still require an operator's action.

The workflow maintains the `automation/editorial` branch so unmerged drafts are preserved across runs. It merges current `main`, checks official sources, verifies the site and creates or updates an **open** review PR. A previous merged/closed PR is not reused. Scheduled runs attempt at most one draft on Monday/Wednesday/Friday only when both model key and model name exist, and attempt publication through the same gates. Manual dispatch defaults to monitoring: `accept_missing_baselines=false`, `generate_draft=false` and `publish_approved=false`, with no approval fields, calls no model and changes no article status or editorial ledger.

The content/source-state PR is limited to Markdown articles and the four versioned editorial/health/source JSON files. Unexpected executable/configuration changes hold it for manual review. It requests auto-merge only after five distinct past releases match retained named approvals and content hashes, automatic publication is enabled, and explicitly dispatched CI has succeeded at the exact branch SHA. The merge request also uses `--match-head-commit`; changed heads, failed/timed-out checks or repository protection requirements hold the PR. Before five verified releases, an editor reviews and merges the queue PR. Merge conflicts halt the run.

GitHub documents that [`GITHUB_TOKEN` pushes do not trigger ordinary push workflows, while `workflow_dispatch` does](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow). Bot PR events may create approval-required runs. This workflow explicitly dispatches `ci.yml` with the token's `actions: write` permission instead of relying on a bot push. An account policy or required workflow can still require human approval; no PAT, bypass or permission change is silently added.

Daily source-health changes, safe unchanged-source provenance renewals and failure-queue changes travel through the same PR. Merging that PR triggers the normal deployment, rebuilding pages so changed, unavailable or expired facts are suppressed. **Until a health PR is merged and deployed, a static site retains its last build.** Precise fact claims are hidden in the default static HTML. The UI reveals them only after a browser date check and hides them at expiry; without JavaScript the official source link remains available instead of an exact dynamic claim. Do not claim immediate live fact refresh or a successful deployment from an uploaded artifact alone.

For an initial human review, inspect the preview and sources and obtain its SHA from `--list-review`. Dispatch on `main` with both `approve_slug` and `approve_sha256`; the reviewer is the authenticated GitHub actor. Leave `publish_approved=false` to record approval without releasing. Set it true only for an explicitly intended release attempt, still subject to current source health and the rolling cap. Leave `generate_draft=false` unless a new draft is wanted. The workflow never fabricates reviews. A changed version needs another inspection and digest; a prior approval is not silently transferred to it.

Pipeline failure reports are uploaded with `if: always()`. A draft API error is queued without discarding source-health safety changes. Any failing site verification blocks the PR update. If auto-merge is disabled or branch requirements cannot be satisfied, the PR remains reviewable and the run reports that condition.

## Server-side model configuration

Add `DRAFT_API_KEY` as a repository **secret**. Add `DRAFT_MODEL` as a repository variable naming an explicitly selected model available to your provider. Optional variables are `DRAFT_API_BASE_URL` (defaults to `https://api.openai.com/v1/`) and `DRAFT_API_ALLOWED_HOSTS` (defaults to `api.openai.com`, exact comma-separated hostnames). A custom provider must expose a compatible `/chat/completions` JSON endpoint supporting `response_format` and `max_completion_tokens`. Unsupported requests fail into the review queue. No model name, paid account or budget is silently selected.

The transport follows the [official OpenAI Chat Completions reference](https://developers.openai.com/api/reference/resources/chat). It sends only the editorial brief and bounded official-source text. Keys are sent in server-side authorization headers, never prompt text, browser bundles or reports. Source and API redirects cannot escape configured hosts. The model can return only `title`, `description`, and Markdown `body`; it cannot select filenames, change source registries, approve itself, change release state or generate executable files.

Generation is initially limited to the site's registered San Francisco topic. Add a supported landing page and extend `supportedTopics` together before preparing another topic. `automation/topics.json` now plans **eight distinct follow-ups** beyond the five initial articles, a potential thirteen-article cluster. Three potentially overlapping briefs remain `needs-editorial-assessment` and are excluded from that target. Only the waterfront itinerary is currently `ready`; seven other independent briefs name missing official facts/sources and remain `needs-source-verification`. The adult group-payment candidate was deliberately held after the initial guide's new per-rider section covered most of that task; a worksheet alone does not justify another full article. These are planning states, not search-demand evidence or permission to publish.

Every ready candidate is checked before a model request. Unknown sources/facts, explicit unresolved `sourceGaps`, covered intents, stale verification, baseline mismatch and evidence conflicts are queued as `draft-preflight` holds. The pipeline can then select the next qualified ready brief rather than spending each run on one blocked item. `heldDrafts` in the report makes the skip visible. `automation/keywords.json` remains a pool of hypotheses; no keyword volume, ranking or revenue is invented. Resolve the declared gaps, verify facts and confirm an independent reader outcome before promoting a held brief.

## Quality gates and failure handling

Publication checks both the report and each cited source's check from the preceding 24 hours; each current hash must match the approved source baseline. It also requires unexpired facts, known source IDs and fact provenance, date validity, named-author registration, stable slugs, useful Markdown sections, length, duplicate intent and text overlap. It rejects raw HTML/MDX/imports, executable URLs, inline images, unsupported topics and exact prices, clock times or dated claims embedded in title, description or prose. Dynamic values belong in expiring fact records. Licensed local hero metadata is the only generated image interface.

Failures are deduplicated into `automation/review-queue.json`; human review can resolve and remove those entries after correcting the cause. Existing published Markdown is not overwritten by draft generation or failed source checks. A published article is never regenerated in place. Intent and shingle checks cannot detect every paraphrased duplicate, and syntax checks cannot prove helpfulness, fact completeness or an image's legal status. After the first five releases, inspect at least one published article each week and disable `autoPublishEnabled` if the pipeline starts drifting.

Reports live in `automation/reports/source-check.json` and `automation/reports/pipeline.json`; they are workflow artifacts rather than website content. `automation/source-health.json` is the compact build input. `automation/editorial.json` is the approval and publication ledger. Keep these versioned state files and source baselines during deployments and branch merges.

## Search feedback and operational checks

Export Search Console's Queries CSV and import it with `import-gsc.mjs`. The importer preserves actual clicks, impressions and position, sorts opportunities by observed impressions and labels them `needs-editorial-assessment`; it never invents volume, approves a topic or publishes an article. Its output is `automation/gsc-opportunities.json`. No Search Console credentials are needed for this manual CSV route.

Weekly review should combine search queries, organic landing pages, onward reading, reading depth, platform Page RPM, revenue per thousand sessions, and model/hosting costs. Keep AdSense Page RPM's denominator aligned with AdSense pageviews. Check the latest Actions artifacts, oldest held item, first-five count and rolling release count. Validate live deployment and official-source behavior separately from local fixture tests.
