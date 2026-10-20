# Editorial automation operations

The repository contains a working draft → validate → review → publish pipeline. It is deliberately shipped with **five review articles, zero approvals, zero release records, and no model credentials**. Building or merging this implementation does not approve those articles. Production excludes review and draft articles; `CONTENT_REVIEW_PREVIEW=true npm run build` creates an unindexed review preview.

## Local commands

Use Node 24 and install the repository's locked dependencies with `npm ci`.

```sh
node scripts/validate-content.mjs
node --test tests/automation.test.mjs
node scripts/check-sources.mjs
node scripts/content-pipeline.mjs --draft
node scripts/content-pipeline.mjs --approve sfo-to-fishermans-wharf-with-luggage --reviewer YOUR_GITHUB_NAME
node scripts/content-pipeline.mjs --publish
node scripts/import-gsc.mjs /path/to/Queries.csv
```

`--approve` records a named review of an exact content SHA-256. It does not publish. Changing title, description, prose, source IDs, facts, image metadata or other editorial fields invalidates approval. The release step alone changes status and release date, and caps publication at **three articles in any rolling seven days**, including manually approved articles. First-five approvals will therefore take at least two release windows. Do not manually set Markdown status to bypass the ledger.

`--draft` requires explicitly configured credentials and a ready topic. No script calls a model during installation, build, validation, tests, source monitoring or CSV import. Test requests use in-memory mock responses.

## Verify official sources before the first release

The source registry contains official URLs, manually researched fact records and the initial check date. **Content hashes are intentionally absent until an editor reviews the official pages.** Missing baselines block generation and publication, and the site suppresses unverified dynamic facts.

1. Read every cited official page. Match each fact's statement and short evidence excerpt to the source; check that different pages do not disagree. Update `checkedAt`, and set dynamic `expiresAt` conservatively. All initial dynamic facts expire at the start of 2026-10-26 UTC.
2. Run `node scripts/check-sources.mjs --accept-baseline`. This fetches only registered HTTPS official hosts, checks redirects, records normalized source-text hashes **only for missing baselines**, and writes the source-health report. It does not extend dates or accept changed existing baselines. Review `automation/reports/source-check.json` for failures and missing evidence.
3. Review and commit only the intended registry and health changes. Repeat the five-article review using `docs/editorial-review.md`, record approvals, then run the separate publication command.

To approve a changed source later, review its actual content and all affected facts first. Update the affected statements, evidence and dates; remove **that source's** old `contentHash`; then run `--accept-baseline` and review the resulting diff. A change detected by a monitor is never automatically accepted as a new factual baseline.

An unchanged approved hash with a still-present evidence excerpt renews its source/fact check dates and a seven-day dynamic-fact lifetime. Changed or unreachable sources preserve their previous provenance and expiry dates. Sources without evidence cannot automatically renew facts. Hash comparison is conservative: harmless page changes may hold articles. Evidence matching and dates are deterministic checks, not a semantic guarantee; human review remains responsible for factual meaning and contradictory official pages.

## GitHub Actions setup and daily behavior

`Content and site checks` runs validation, meaningful automated tests, type checks, production build verification and a separate review build on pushes and pull requests. It has read-only repository permissions and receives no model keys.

`Editorial source monitor and content queue` runs daily at **09:15 Asia/Shanghai** and supports a manual dispatch. Configure repository Actions permission to create pull requests, allow auto-merge, and protect `main` with the `verify` check. The editorial workflow's write permissions are limited to repository contents, pull requests and dispatching the validation workflow. It respects required reviews and branch protection; it cannot make protected checks disappear. A protected environment or repository approval policy may still require an operator's action.

The workflow maintains the `automation/editorial` branch so unmerged drafts are preserved across runs. It merges current `main`, checks official sources, attempts at most one draft on Monday/Wednesday/Friday when model credentials exist, applies publication gates, verifies the site and creates or updates a review PR. It requests auto-merge only after five manually approved release records exist. Before that point, an editor reviews and merges the queue PR. Merge conflicts halt the run for review.

Daily source-health changes, safe unchanged-source provenance renewals and failure-queue changes travel through the same PR. Merging that PR triggers the normal deployment, rebuilding pages so changed, unavailable or expired facts are suppressed. **Until a health PR is merged and deployed, a static site retains its last build.** Precise fact claims are hidden in the default static HTML. The UI reveals them only after a browser date check and hides them at expiry; without JavaScript the official source link remains available instead of an exact dynamic claim. Do not claim immediate live fact refresh or a successful deployment from an uploaded artifact alone.

For the initial manual reviews, dispatch the editorial workflow on `main` with the exact `approve_slug`. The reviewer is recorded as the authenticated GitHub actor. Leave `generate_draft` false unless a new draft is wanted. Approval is an editorial attestation, so the person dispatching it must inspect the preview and sources first. The workflow never fabricates reviews. You may also run approval locally, review the JSON diff and commit it to the editorial branch.

Pipeline failure reports are uploaded with `if: always()`. A draft API error is queued without discarding source-health safety changes. Any failing site verification blocks the PR update. If auto-merge is disabled or branch requirements cannot be satisfied, the PR remains reviewable and the run reports that condition.

## Server-side model configuration

Add `DRAFT_API_KEY` as a repository **secret**. Add `DRAFT_MODEL` as a repository variable naming an explicitly selected model available to your provider. Optional variables are `DRAFT_API_BASE_URL` (defaults to `https://api.openai.com/v1/`) and `DRAFT_API_ALLOWED_HOSTS` (defaults to `api.openai.com`, exact comma-separated hostnames). A custom provider must expose a compatible `/chat/completions` JSON endpoint supporting `response_format` and `max_completion_tokens`. Unsupported requests fail into the review queue. No model name, paid account or budget is silently selected.

The transport follows the [official OpenAI Chat Completions reference](https://developers.openai.com/api/reference/resources/chat). It sends only the editorial brief and bounded official-source text. Keys are sent in server-side authorization headers, never prompt text, browser bundles or reports. Source and API redirects cannot escape configured hosts. The model can return only `title`, `description`, and Markdown `body`; it cannot select filenames, change source registries, approve itself, change release state or generate executable files.

Generation is initially limited to the site's registered San Francisco topic. Add a supported landing page and extend `supportedTopics` together before preparing another topic. `automation/topics.json` contains one ready brief and two held briefs whose intent overlaps existing drafts; `automation/keywords.json` contains researched candidates requiring editorial assessment. Add new ready briefs only after confirming a distinct reader problem, useful independent contribution and fresh official fact coverage. Do not automatically turn every query into a page.

## Quality gates and failure handling

Publication checks source health from the preceding 24 hours, unexpired facts, known source IDs and fact provenance, date validity, named-author registration, stable slugs, useful Markdown sections, length, duplicate intent and text overlap. It rejects raw HTML/MDX/imports, executable URLs, inline images, unsupported topics and exact prices, clock times or dated claims embedded in prose. Dynamic values belong in expiring fact records. Licensed local hero metadata is the only generated image interface.

Failures are deduplicated into `automation/review-queue.json`; human review can resolve and remove those entries after correcting the cause. Existing published Markdown is not overwritten by draft generation or failed source checks. A published article is never regenerated in place. Intent and shingle checks cannot detect every paraphrased duplicate, and syntax checks cannot prove helpfulness, fact completeness or an image's legal status. After the first five releases, inspect at least one published article each week and disable `autoPublishEnabled` if the pipeline starts drifting.

Reports live in `automation/reports/source-check.json` and `automation/reports/pipeline.json`; they are workflow artifacts rather than website content. `automation/source-health.json` is the compact build input. `automation/editorial.json` is the approval and publication ledger. Keep these versioned state files and source baselines during deployments and branch merges.

## Search feedback and operational checks

Export Search Console's Queries CSV and import it with `import-gsc.mjs`. The importer preserves actual clicks, impressions and position, sorts opportunities by observed impressions and labels them `needs-editorial-assessment`; it never invents volume, approves a topic or publishes an article. Its output is `automation/gsc-opportunities.json`. No Search Console credentials are needed for this manual CSV route.

Weekly review should combine search queries, organic landing pages, onward reading, reading depth, platform Page RPM, revenue per thousand sessions, and model/hosting costs. Keep AdSense Page RPM's denominator aligned with AdSense pageviews. Check the latest Actions artifacts, oldest held item, first-five count and rolling release count. Validate live deployment and official-source behavior separately from local fixture tests.
