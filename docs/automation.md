# Editorial automation operations

The repository runs a scheduled source monitor and publisher. Each run reads the registered official sources, imports the latest persisted Search Console opportunities, selects the next qualified topic, drafts one article when model credentials are configured, applies the content and source gates, verifies the production build, and commits the resulting state directly to `main`.

The workflow does not create an editorial branch or pull request. A run that cannot produce a valid article still records source health and failure details when the site verification passes. A run never commits an article that failed validation, duplicate checks, source freshness checks or build verification.

## Local commands

Use Node 24 and install the lockfile dependencies with `npm ci`.

```sh
node scripts/validate-content.mjs
node --test tests/automation.test.mjs
node scripts/check-sources.mjs
node scripts/content-pipeline.mjs --draft --publish --automatic
node scripts/import-gsc.mjs /path/to/Queries.csv
```

`content-pipeline.mjs --draft --publish --automatic` performs one complete monitor, topic-selection, generation and publication attempt without an approval gate. It requires `DRAFT_API_KEY` and `DRAFT_MODEL` for model generation. The API endpoint must be HTTPS and match the configured allow-list. A missing key records a failed draft attempt and leaves the existing articles untouched.

The pipeline uses real Search Console imports only. `automation/gsc-opportunities.json` retains the source and observation window. Small or incomplete query samples are editorial signals, not invented demand estimates.

## Source and fact gates

The source registry contains official URLs, registered facts, evidence excerpts and check dates. Every run fetches only registered HTTPS hosts and writes the current source report and normalized snapshots to `automation/reports/`.

- A changed source can advance automatically when the current capture still contains every registered evidence fragment and the source has no manual facts. A missing fragment or unavailable source remains held for the next run.
- A matching baseline can renew evidence-backed dynamic facts for seven days.
- Automatic baseline adoption is limited to evidence-backed changed sources. The workflow retains the old baseline when evidence is missing, so the failure queue remains visible.
- Manual facts retain their explicit expiry and need a fresh evidence-backed update.
- Article prose is validated separately from the fact panels. A source-state change can hide a precise fact panel, but it does not certify the surrounding prose.
- Resolved source-check and fact-evidence queue entries are removed on the next successful source run. Article and draft holds remain until their own gate passes.

The `--accept-baseline` option is reserved for initializing missing baselines in a controlled local operation. The scheduled workflow uses `--automatic` instead and never initializes a missing baseline.

## Automated publication flow

`.github/workflows/editorial.yml` runs daily at 09:15 Asia/Shanghai and can also be started manually. The job runs on `main` with repository `contents: write` permission.

1. Checkout the current `main` commit with the workflow credential available for the final push.
2. Run `node scripts/content-pipeline.mjs --draft --publish --automatic` with server-side model credentials.
3. Run the production `npm run verify` command. This covers content validation, Astro checks, tests, production build and static build verification.
4. Stage article and editorial-state files. If nothing changed, finish without a commit.
5. Commit the verified state and fetch `origin/main` again. The push stops if another commit advanced `main` while the job was running.
6. Push the exact verified commit to `main`.

GitHub branch protection can reject a direct push. The workflow treats that as a failed delivery and leaves the commit available in the job workspace for diagnosis. The repository must explicitly allow the workflow identity to write `main` before unattended publication can operate.

The workflow uploads `automation/reports/`, `automation/review-queue.json` and `automation/source-health.json` as artifacts on every run. Reports do not become website content.

## Model configuration

Set `DRAFT_API_KEY` as an Actions secret and `DRAFT_MODEL` as an Actions variable. Optional variables are `DRAFT_API_BASE_URL` and `DRAFT_API_ALLOWED_HOSTS`. The model receives only the topic brief and bounded official-source text. It can return a title, description and Markdown body. It cannot select files, alter the source registry, change ledger state or emit executable content.

The workflow calls the model on every scheduled run. If credentials are absent or the provider fails, the pipeline records the error and leaves existing articles unchanged. No credentials are committed to the repository or passed to browser code.

## Failure handling

Publication is transactional at the article level. A draft is written only after the model response matches the expected shape and passes content, source, intent, duplicate and fact checks. Existing published Markdown is never overwritten by a failed draft or source check.

The publication cap, if enabled in the ledger, is checked by `publicationDecision` before a status changes to `published`. The ledger records the exact content digest and publication timestamp for every release. The workflow does not fabricate approvals or transfer an old digest to a changed article.

Search Console import, source monitoring, generated drafts and publication reports remain versioned only where they are editorial inputs or release state. Raw exports and oversized source snapshots stay in ignored artifacts.

## Operational checks

Review the latest workflow artifact after failures, inspect the oldest queue entry and verify the production deployment separately from the Git commit. Keep Search Console and GA4 windows aligned when evaluating which topic to publish next. Record missing data as unavailable instead of treating it as zero demand.
