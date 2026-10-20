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

## Production and Vercel

The previous `Makefile push` used SSH to replace a different domain. It has been disabled. Do not run an old copy to deploy this project.

The new `vercel.json` uses Astro, `npm ci`, the verified build command and `dist` output. The implementation PR triggered a Vercel Git preview for project `jageros-projects/travel`, confirming repository integration. Production account settings and real service identifiers still need verification. Before publishing:

1. Confirm the Vercel project belongs to this site, Git repository `jageros/travel`, root directory, production branch `main`, domain, and Node 24. Use a feature-branch Preview first.
2. Vercel Preview deployments automatically include review copies unless explicitly overridden with `CONTENT_REVIEW_PREVIEW=false`. Use `CONTENT_REVIEW_PREVIEW=true` for local review builds. Keep `SITE_INDEXING_ENABLED=false` while initial content is being reviewed. `VERCEL_ENV=preview` independently forces noindex and disables optional services.
3. Review the five guides and source baselines; release through the approval ledger. Confirm article URLs, canonical/JSON-LD, keyboard/mobile behavior, source links, robots/sitemap and real 404 responses on the deployment.
4. After approved content is available, set `SITE_INDEXING_ENABLED=true` in Production and rebuild. Submit `https://www.cedartrips.com/sitemap.xml` in the verified Search Console property.
5. Verify the deployed result and retain the previous deployment for rollback. Local builds do not prove production deployment, indexing or real-user Core Web Vitals.

### Cedar Trips domain migration

The only canonical origin is `https://www.cedartrips.com`. Set the Production `PUBLIC_SITE_URL` to this value before deploying. The shared identity in `src/lib/site-config.mjs` is used by Astro, page metadata and editorial monitoring. A bare Cedar Trips URL is normalized to `www`; retired or unrelated origins fail the build instead of silently emitting incorrect canonical URLs.

`vercel.json` contains a host-scoped permanent redirect from `cedartrips.com` to the same path at the canonical origin. Query parameters are retained. An existing Vercel domain redirect must target the same canonical hostname to avoid loops. The owner has chosen to retire the unused `travel.mumasir.com` hostname without a redirect: remove its specific DNS record and Vercel custom-domain binding. No rule or retirement step targets the unrelated `mumasir.com` root site or its other services.

The owner has added the Search Console Domain property `cedartrips.com`, which includes `www`. New reports can initially show processing; adding a property does not itself index pages. Keep the current noindex and editorial gates until the first guides have been reviewed and released. Then submit `https://www.cedartrips.com/sitemap.xml` in that existing property. This launch does not include an old-site Change of Address workflow.

After deployment, check the Cedar Trips homepage and deep-path redirects (including query parameters), canonical/OG/JSON-LD, robots/sitemap, real HTTP 404s, and Preview noindex. Confirm the retired hostname no longer serves the site. Do not enable indexing, advertising, model calls or article approvals merely because the domain changed.

## Optional site configuration

Copy `.env.example` to a local `.env` for local-only configuration. Set deployment values in Vercel. Never prefix model/GSC credentials with `PUBLIC_`.

| Setting | Purpose |
| --- | --- |
| `PUBLIC_SITE_URL` | Canonical origin, default `https://www.cedartrips.com` |
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
