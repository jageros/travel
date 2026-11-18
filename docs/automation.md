# Editorial automation operations

The repository uses a Codex scheduled task in the current chat as the automatic publisher. Each run reads the registered official sources, imports the latest persisted Search Console opportunities, selects the next qualified topic, uses the current Codex model to draft one article, applies the content and source gates, verifies the production build, and commits the resulting state directly to `main`.

The Codex task runs in the local project directory and does not require a model API key. A run that cannot produce a valid article records source health and failure details when verification passes. A run never commits an article that failed validation, duplicate checks, source freshness checks or build verification.

## Local commands

Use Node 24 and install the lockfile dependencies with `npm ci`.

```sh
node scripts/validate-content.mjs
node --test tests/automation.test.mjs
node scripts/check-sources.mjs
node scripts/content-pipeline.mjs --draft --publish --automatic
node scripts/import-gsc.mjs /path/to/Queries.csv
```

`content-pipeline.mjs --publish --automatic` validates and publishes a current-session-generated review article without an approval gate. The scheduled Codex task writes the article with its current model before invoking this command.

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

The Codex scheduled task runs daily at 09:15 Asia/Shanghai in the local project. The computer must remain powered on and the Codex desktop app must remain running. `.github/workflows/editorial.yml` is a read-only source diagnostic workflow and does not publish articles.

1. Check the current `main` checkout and synchronize `origin/main`.
2. Fetch registered official sources and rank ready topics with the persisted Search Console opportunities.
3. Use the current Codex model to write one review article, then run `node scripts/content-pipeline.mjs --publish --automatic`.
4. Run the production `npm run verify` command. This covers content validation, Astro checks, tests, production build and static build verification.
5. Commit the verified state and fetch `origin/main` again. The push stops if another commit advanced `main` while the task was running.
6. Push the exact verified commit to `main`.

GitHub branch protection can reject a direct push. The task treats that as a failed delivery and leaves the commit available in the local workspace for diagnosis. The repository must allow the local Git identity to write `main` before unattended publication can operate.

The workflow uploads `automation/reports/`, `automation/review-queue.json` and `automation/source-health.json` as artifacts on every run. Reports do not become website content.

## Model configuration

The current Codex session supplies the model for scheduled runs. No `DRAFT_API_KEY`, `DRAFT_MODEL` or external model endpoint is required. The model receives only the topic brief and bounded official-source text. It can return a title, description and Markdown body. It cannot select files, alter the source registry, change ledger state or emit executable content.

## Failure handling

Publication is transactional at the article level. A draft is written only after the model response matches the expected shape and passes content, source, intent, duplicate and fact checks. Existing published Markdown is never overwritten by a failed draft or source check.

The publication cap, if enabled in the ledger, is checked by `publicationDecision` before a status changes to `published`. The ledger records the exact content digest and publication timestamp for every release. The workflow does not fabricate approvals or transfer an old digest to a changed article.

Search Console import, source monitoring, generated drafts and publication reports remain versioned only where they are editorial inputs or release state. Raw exports and oversized source snapshots stay in ignored artifacts. The current Search Console JSON is still a persisted import and requires a separate authorized sync if live click data is needed.

## Operational checks

Review the latest workflow artifact after failures, inspect the oldest queue entry and verify the production deployment separately from the Git commit. Keep Search Console and GA4 windows aligned when evaluating which topic to publish next. Record missing data as unavailable instead of treating it as zero demand.
