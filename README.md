# Cedar Trips

A source-led English travel site for https://www.cedartrips.com. Astro generates readable static HTML; React progressively enhances guide search. No account, database or CMS is required.

## Continue this project on another computer

Start with [AGENTS.md](AGENTS.md) and the [current handoff](docs/handoff/README.md). The handoff includes the [project history](docs/handoff/history.md), [next-stage plan](docs/handoff/roadmap.md) and [portable, unapplied review candidates](docs/handoff/pending/README.md). It records dated evidence and remaining work without requiring the original chat, local memory or ignored artifacts. Recheck the current remote state before acting; credentials and Codex account automations do not travel with a clone.

## Run and review

Use Node 24 (`.nvmrc`). The npm lockfile is the single dependency source.

```sh
npm ci
npm run verify
CONTENT_REVIEW_PREVIEW=true npm run dev
```

The local review site opens at `http://127.0.0.1:4321`. It includes editorial review copies, including the new waterfront itinerary. All preview pages are `noindex`, optional analytics/ads remain disabled, and review articles never enter the sitemap. To inspect generated output instead:

```sh
CONTENT_REVIEW_PREVIEW=true npm run build
CONTENT_REVIEW_PREVIEW=true npm run verify:build
npm run preview
```

A normal production build excludes draft/review articles. Automatic publication state and release records are in `automation/editorial.json`. The Codex scheduled task selects an eligible topic, generates a bounded Markdown draft with the current session model, verifies the site and commits the result to `main`. Official-source freshness, duplicate detection, fact expiry and build verification remain publication gates. Operational details are in [docs/automation.md](docs/automation.md).

## Site architecture

- `/topics/{slug}/`: connected planning hub (initial topic: San Francisco without a car).
- `/guides/{slug}/` and `/destinations/{slug}/`: source-linked Markdown articles.
- About, editorial policy, contact/corrections, privacy and advertising disclosures.
- Per-page canonical, description, Open Graph images, safely escaped Article/Breadcrumb JSON-LD, robots, sitemap and a true 404.
- Five real destination and transport photos with reviewed Commons source pages, creators, dates, licenses and original checksums in `src/data/photos.json`. Local JPEG originals in `src/assets/photos/` generate responsive WebP variants, JPEG fallbacks and per-page social previews at build time; no remote image requests are needed. Captions and `/photo-credits/` retain attribution, license and adaptation details. Legacy unverified hotlinks remain removed from the 100 research seeds.
- A first-party pass comparison calculator uses reader-supplied current fares and paid fare windows; it does not invent ticket prices.
- Optional current-fact panels use registered facts, source health and expiry. Precise claims are hidden by default in static HTML. A browser checks the date before revealing them and hides them at expiry; without JavaScript, readers get the official reference instead. Guide prose and links remain readable without JavaScript.
- Internal Markdown links to unreleased guides degrade to readable text and become links once the destination is published. Related cards only include visible articles.

## Cloudflare deployment

Deploy the existing Astro static output with **Workers Static Assets**, using the `cedar-trips` Worker, `dist` directory and Node 24. No SSR adapter, Worker script, database or runtime binding is required. Wrangler is pinned in the npm lockfile. The old SSH `Makefile push` remains disabled.

Connect only `jageros/travel` through Workers Builds. Set the production branch to `main`, enable Worker Previews for other branches, and use these commands:

| Setting | Value |
| --- | --- |
| Build command | `npm ci && npm run build:cloudflare` |
| Production command | `npx wrangler deploy` |
| Preview command | `npx wrangler preview` |
| Build variable | `SKIP_DEPENDENCY_INSTALL=1` |
| Node version | `24` (also recorded in `.nvmrc`) |

Configure public values as **build variables**, not runtime bindings. Set `PUBLIC_SITE_URL=https://www.cedartrips.com`, `SITE_INDEXING_ENABLED=true`, `PUBLIC_GA_MEASUREMENT_ID=G-QDDLYW7WRF` and `ADSENSE_READY=false`. The build wrapper derives production/preview from Cloudflare's `WORKERS_CI_BRANCH`; every non-main branch forces review mode, noindex, empty GA and disabled advertising even if shared build settings contain production values. Missing Cloudflare branch metadata stops the build. No model or editorial App secrets belong in Cloudflare.

For local production verification, explicitly set `DEPLOYMENT_ENV=production SITE_INDEXING_ENABLED=true`. Without deployment intent, local builds remain noindex. Preview builds include review copies by default; hiding copies cannot make a preview indexable. Production rejects review mode. The required GitHub `verify` job builds and checks both production and a preview deliberately supplied with the indexing switch enabled.

Static routing preserves directory URLs and uses `404.html` with a real 404 status. `_headers` preserves security protections, makes fingerprinted Astro assets immutable and leaves other responses on Cloudflare's default revalidation policy. Production `workers.dev` and Version URLs are disabled; independent Worker Previews are configured separately.

The dashboard enables `previews.cedartrips.com` for Preview traffic only. Branch previews use `https://<normalized-branch>.previews.cedartrips.com`; the host-specific `_headers` rule adds `X-Robots-Tag: noindex`. Keep the production and preview `workers.dev` switches disabled. The top-level `preview_urls` setting controls both older Version URLs and newer workers.dev Preview URLs, so custom preview hosts are required with the current configuration. Preview builds also exclude optional analytics and advertising independently of the hostname settings.

### Canonical domain and recovery

The only canonical origin is `https://www.cedartrips.com`. Set the Production `PUBLIC_SITE_URL` to this value before deploying. The shared identity in `src/lib/site-config.mjs` is used by Astro, page metadata and editorial monitoring. A bare Cedar Trips URL is normalized to `www`; retired or unrelated origins fail the build instead of silently emitting incorrect canonical URLs.

Manage `www.cedartrips.com` as the Worker's Custom Domain in the Cloudflare dashboard. Keep the apex redirect scoped to `cedartrips.com`, using 308 to the same path on www with query-string preservation. Dashboard domain settings are deliberately absent from `wrangler.jsonc` so ordinary builds cannot replace them or require zone-edit permissions. Preserve the existing Search Console TXT and all unrelated DNS records.

The existing Search Console Domain property and sitemap URL are unchanged. This hosting move does not require Change of Address. The five initial approved articles and the subsequent waterfront guide have release records in `automation/editorial.json`; use that ledger and the dated [handoff](docs/handoff/README.md) for current status. Content approval and release limits remain independent of hosting. The retired `travel.mumasir.com` remains outside this site's routing; no rules target other mumasir services.

For deployment acceptance, verify canonical/OG/JSON-LD, redirects, real HTTP statuses, robots/sitemap, consent-based GA events and the committed Git SHA in Cloudflare. A scheduled task commit still needs an actual Cloudflare production deployment check. Historical acceptance documents preserve what was true at their recorded time. Recovery uses Cloudflare deployment versions and retains current article and source state; rebuild older code with current state if an old static version would restore unsafe facts.

## Optional site configuration

Copy `.env.example` to a local `.env` for local-only configuration. Set deployment values in Cloudflare Build variables. Never prefix model/GSC credentials with `PUBLIC_`.

| Setting | Purpose |
| --- | --- |
| `PUBLIC_SITE_URL` | Canonical origin, default `https://www.cedartrips.com` |
| `DEPLOYMENT_ENV` | `production`, `preview` or `local`; local is the default |
| `SITE_INDEXING_ENABLED` | Explicit production indexing opt-in; default false |
| `CONTENT_REVIEW_PREVIEW` | Include review copies only in noindex preview |
| `PUBLIC_GOOGLE_SITE_VERIFICATION` | Search Console verification token |
| `PUBLIC_GA_MEASUREMENT_ID` | Optional validated `G-…` identifier |
| `PUBLIC_CONTACT_EMAIL` | Real site contact; otherwise public GitHub issue link |
| `ADSENSE_READY` | Explicit advertising setup approval; default false |
| `PUBLIC_ADSENSE_CLIENT` | Real publisher ID, never a placeholder on a live site |
| `PUBLIC_ADSENSE_SLOT_MID_ARTICLE` / `PUBLIC_ADSENSE_SLOT_END_ARTICLE` | Real responsive display slot IDs |
| `PUBLIC_CMP_SCRIPT_URL` | Optional matching Google Funding Choices script URL |

No configured account means no ad slot or advertising script. No visitor consent means no optional analytics request. Advertising additionally requires a signal from the external CMP integration; the site's own preferences dialog is **not** a certified CMP. Verify actual regional requirements and the configured provider before enabling ads. A valid TCF API signal is a technical prerequisite, not proof of regulatory compliance.

The optional CMP loader accepts only the configured publisher's HTTPS Funding Choices path on `fundingchoicesmessages.google.com`; an independently installed certified CMP may signal readiness with `travel:cmp-ready`. If CMP readiness is absent, advertising stays off. Confirm the exact script path generated in your publisher account.

`/ads.txt` is generated from an enabled, validated publisher ID. Verify both `https://cedartrips.com/ads.txt` and `https://www.cedartrips.com/ads.txt`, including the apex redirect, and confirm the publisher dashboard recognizes the authorized seller.

Analytics sends result count and query length, not typed search text. It records optional reading-depth and selected internal-navigation events only after consent. Configure and verify GA4/Search Console in the real accounts; no credentials, earnings or account linkage are fabricated here.

## Automated content and measurement

- [Keyword research](docs/keyword-research.md): 60 candidates, qualitative evidence and limitations; no invented search volume/KD.
- [Automation operations](docs/automation.md): source hashes, source-health, daily Codex scheduled commits, automatic topic selection and publication gates.
- [Editorial review](docs/editorial-review.md): historical first-five approval record and content boundaries.
- [Metrics](docs/metrics.md): actual-data CSV reports for search/reading/ad revenue and costs.
- [Next-stage operations](docs/growth-operations-2026-10-21.md): follow-up content, actual analytics baseline, release follow-up and weekly review.
- [Mobile performance](docs/mobile-performance-2026-10-21.md): reproducible lab baseline and measured responsive-image improvement.

Model-generated content is restricted to plain Markdown with registered topic/source/fact IDs. It cannot choose files, execute code, alter registries or change publication state outside the pipeline. Evidence gaps, expired facts, conflicting evidence, unsafe output and duplicates remain held in the queue for the next automated run. Evidence-backed changed sources can advance through the automatic source gate. The current session model runs through the Codex scheduled task and is never called during build, tests or browser requests.

Daily source monitoring and automatic generation start once the Codex desktop app is running with the local project available. These are scheduled tasks, not a claim that a 90-day operating period has already run.

## Verification

`npm run verify` runs content gates, Astro type checks, automated failure/success tests, production build, and static-output checks for titles, canonical tags, JSON-LD, real internal URLs, draft exclusion and removal of legacy click-ad code. CI additionally builds and checks the review version. Browser validation covers desktop/mobile rendering and progressive search; real-user performance needs production traffic.
