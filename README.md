# Cedar Trips

A source-led English travel site for https://www.cedartrips.com. Astro generates readable static HTML; React progressively enhances guide search. No account, database or CMS is required.

## Run and review

Use Node 24 (`.nvmrc`). The npm lockfile is the single dependency source.

```sh
npm ci
npm run verify
CONTENT_REVIEW_PREVIEW=true npm run dev
```

The local review site opens at `http://127.0.0.1:4321`. It includes the first five editorial review copies. All preview pages are `noindex`, optional analytics/ads remain disabled, and review articles never enter the sitemap. To inspect generated output instead:

```sh
CONTENT_REVIEW_PREVIEW=true npm run build
CONTENT_REVIEW_PREVIEW=true npm run verify:build
npm run preview
```

A normal production build excludes draft/review articles. Current named approvals and release records are in `automation/editorial.json`; merging code is not editorial approval. The owner confirmed the five exact initial article versions on 2026-10-20, with the overview, operator/payment and SFO transfer guides selected for the first batch. First-five review instructions are in [docs/editorial-review.md](docs/editorial-review.md); official-source baseline and release procedures are in [docs/automation.md](docs/automation.md).

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

The existing Search Console Domain property and sitemap URL are unchanged. This hosting move does not require Change of Address. Three articles are published, two remain approved review copies; content approval and release limits are independent of hosting. The retired `travel.mumasir.com` remains outside this site's routing; no rules target other mumasir services.

For deployment acceptance, verify canonical/OG/JSON-LD, redirects, real HTTP statuses, robots/sitemap, consent-based GA events and the merged Git SHA in Cloudflare. Source-monitor PRs must reach an actual Cloudflare production deployment; a successful CI artifact alone does not prove the live site changed. Historical acceptance documents preserve what was true at their recorded time. Recovery uses Cloudflare deployment versions and retains current article approvals and source health; rebuild older code with current state if an old static version would restore unsafe facts.

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
- [Automation operations](docs/automation.md): source hashes, source-health, daily Actions PR, first-five exact-content approvals, three releases per rolling seven days and optional model setup.
- [Editorial review](docs/editorial-review.md): first-five approval checklist.
- [Metrics](docs/metrics.md): actual-data CSV reports for search/reading/ad revenue and costs.

Model-generated content is restricted to plain Markdown with registered topic/source/fact IDs. It cannot choose files, execute code, alter registries or approve itself. Missing credentials, source changes, expired facts, conflicting evidence, unsafe output and duplicates are held for review. The model interface was checked against official OpenAI documentation; no paid requests are made during build or tests.

Daily source monitoring and weekly generation start only once the workflow is on `main` and the required Actions permissions/secrets have been configured. These are repository workflows, not a claim that a 90-day operating period has already run.

## Verification

`npm run verify` runs content gates, Astro type checks, automated failure/success tests, production build, and static-output checks for titles, canonical tags, JSON-LD, real internal URLs, draft exclusion and removal of legacy click-ad code. CI additionally builds and checks the review version. Browser validation covers desktop/mobile rendering and progressive search; real-user performance needs production traffic.
