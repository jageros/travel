# Editorial automation operations

The repository uses a Codex scheduled task in the current chat to refill the destination review queue and publish eligible articles. Each run checks registered official sources, uses the persisted Search Console opportunities to select eligible briefs in order, verifies the production and preview builds, and commits the resulting state directly to `main`.

The Codex task runs in the local project directory and does not require a model API key. A run that cannot produce a valid article records source health and failure details when verification passes. A run never commits an article that failed validation, duplicate checks, source freshness checks or build verification.

## Local commands

Use Node 24 and install the lockfile dependencies with `npm ci`.

```sh
node scripts/validate-content.mjs
node --test tests/automation.test.mjs
node scripts/check-sources.mjs
node scripts/content-pipeline.mjs --plan-session
node scripts/content-pipeline.mjs --save-session-draft <slug> < /path/to/draft.json
node scripts/content-pipeline.mjs --publish --automatic --slug <slug>
node scripts/import-gsc.mjs /path/to/Queries.csv
```

The planning command refreshes official captures and returns `publish-review`, `draft`, or a hold reason. When it returns `draft`, pass a JSON object with exactly `title`, `description` and `body` to the draft command. The script assembles metadata from the selected brief and validates the article. The final command checks the sources again and attempts to release only the selected slug. The legacy `--draft` option is separate and requires its own `DRAFT_API_*` variables.

Topic ranking uses exact query matches, then clicks, then impressions from matching real import rows. Ties and briefs without matching data use descending editorial priority and stable queue order. The current Search Console file is an older import. Query aliases identify an attraction's name or search intent and carry no traffic estimates.

## Automatic destination queue refill

At the start of a daily run, check for fewer than six usable U.S. destination review drafts. Refill toward six with at most three accepted drafts per daily run. The planner reads current articles, topics, the publication ledger, source health, and the photo registry. It consults National Park Service state indexes and gives priority to states with fewer destinations in the queue or collection. It skips existing topics and sites with registered NPS coverage.

```sh
node scripts/destination-intake.mjs --plan
node scripts/destination-intake.mjs --research STATE PARK_CODE
node scripts/destination-intake.mjs --preview-photo COMMONS_FILE
node scripts/destination-intake.mjs --enqueue < /path/to/proposal.json
```

Use the full state name and four-character park code returned by the planner. Research retrieves the official overview and visitor pages and checks Commons for a reusable JPEG. Pass the exact Commons file title to the image-preview command and inspect the resulting ignored local JPEG for the destination and a suitable cover. The proposal contains `region`, `parkCode`, `primaryIntent`, `brief`, `facts` (each with `source`, `statement`, a literal `evidence` excerpt and boolean `dynamic`), `photo` (its `commonsTitle`, `alt` and `caption`), and `draft` (its `title`, `description` and Markdown `body`). A supported location override requires an exact reference in the official capture.

Enqueue fetches the official sources and original Commons image again. New sources use the existing official host allowlist, and each fact must have matching evidence in the current capture. The Commons check requires a matching JPEG with credited authorship, known CC0 or reusable CC BY or CC BY-SA rights, and matching original size and SHA-1. The registered local JPEG has its own SHA-256 and an adaptation note. Skip any candidate whose evidence, license, image subject, or content fails verification.

Run production and preview verification before submitting the intake as a separate content-only commit to `main`. Stage only the appended source, topic and photo registry entries, plus the new review Markdown and JPEG. Fetch `origin/main` and verify the starting commit still matches. Enqueue leaves the publication ledger untouched. Review routes remain excluded from production and the sitemap. The publication command makes a fresh official-source check and records the release under the daily quota. Neither intake nor publication requires a separate paid model API.

## Source and fact gates

The source registry contains official URLs, registered facts, evidence excerpts and check dates. Every run fetches only registered HTTPS hosts and writes the current source report and normalized snapshots to `automation/reports/`.

- A changed source can advance automatically when the current capture still contains every registered evidence fragment and the source has no manual facts. A missing fragment or unavailable source remains held for the next run.
- A matching baseline can renew evidence-backed dynamic facts for seven days.
- Automatic baseline adoption is limited to evidence-backed changed sources. The workflow retains the old baseline when evidence is missing, so the failure queue remains visible.
- Manual facts retain their explicit expiry and need a fresh evidence-backed update.
- Article prose is validated separately from the fact panels. A source-state change can hide a precise fact panel, but it does not certify the surrounding prose.
- Resolved source-check and fact-evidence queue entries are removed on the next successful source run. Article and draft holds remain until their own gate passes.

The `--accept-baseline` option is reserved for initializing missing baselines in a controlled local operation. The scheduled publisher uses `--automatic` with the existing registered baselines. Destination intake separately registers a new source from its verified capture and literal fact evidence.

## Automated publication flow

The Codex scheduled task runs daily at 09:15 Asia/Shanghai in the local project. The computer must remain powered on and the Codex desktop app must remain running. `.github/workflows/editorial.yml` is a read-only source diagnostic workflow and does not publish articles.

1. Check the current `main` checkout and synchronize `origin/main`.
2. Check the [review queue](#automatic-destination-queue-refill) and refill if needed. Fetch registered official sources and rank ready topics with the persisted Search Console opportunities. Recalculate the remaining daily quota from the ledger.
3. Use the command's selected slug. Reuse a validated review copy or draft with the current Codex model. An attraction brief locks its location, region, category, featured flag, cover ID, sources, facts and related articles. Release with `node scripts/content-pipeline.mjs --publish --automatic --slug <slug>`.
4. Run `npm run verify` in production mode and verify the preview build. The checks cover content validation, Astro diagnostics, tests, and static build verification.
5. Commit the verified state and fetch `origin/main` again. The push stops if another commit advanced `main` while the task was running.
6. Push the exact verified commit to `main` and check the deployment. After a successful article, repeat from the updated ledger until the quota is filled or the planning command finds no eligible brief.

GitHub branch protection can reject a direct push. The task treats that as a failed delivery and leaves the commit available in the local workspace for diagnosis. The repository must allow the local Git identity to write `main` before unattended publication can operate.

The manual GitHub diagnostic workflow uploads `automation/reports/`, `automation/review-queue.json` and `automation/source-health.json` as artifacts. The Codex task keeps its raw captures in ignored local reports.

## Model configuration

The current Codex session supplies the model for scheduled runs. The publication drafter receives the topic brief and bounded official-source text and returns a title, description and Markdown body. The intake command uses validated research and a controlled proposal to choose file paths and append registries. The publication command controls ledger changes. Both flows exclude executable content and work without `DRAFT_API_KEY`, `DRAFT_MODEL` or an external model endpoint.

## Failure handling

A draft is written only after the model response matches the expected shape and passes content, source, intent, duplicate and fact checks. A failed draft or source check leaves existing published Markdown intact.

The cap is three releases per Beijing calendar day across all topics. November 19, 2026 has a cap of four to accommodate the one additional release requested that day. Count the current day's entries in the release ledger each time a candidate is evaluated. A new day starts at midnight in `Asia/Shanghai`. The scheduled run aims to publish one to three articles when enough candidates pass the gates, and the ledger records each article's exact digest and publication time.

Search Console import, source monitoring, generated drafts and publication reports remain versioned only where they are editorial inputs or release state. Raw exports and oversized source snapshots stay in ignored artifacts. The current Search Console JSON is still a persisted import and requires a separate authorized sync if live click data is needed.

## Operational checks

Review the latest workflow artifact after failures, inspect the oldest queue entry and verify the production deployment separately from the Git commit. Keep Search Console and GA4 windows aligned when evaluating which topic to publish next. Record missing data as unavailable instead of treating it as zero demand.
