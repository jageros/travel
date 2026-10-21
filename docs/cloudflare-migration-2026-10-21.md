# Cloudflare migration acceptance — 2026-10-21

The owner approved Workers Static Assets with Workers Builds, deployment and preview acceptance before production DNS binding, and immediate retirement of this site's Vercel project after production acceptance. The canonical origin remains `https://www.cedartrips.com`; content, approvals, source baselines and the rolling release cap are outside this migration.

## Prepared configuration

- Worker `cedar-trips`, static `dist`, directory HTML routes, `404-page`, no Worker script or runtime binding.
- Wrangler pinned to `4.151.3`; independent Worker Previews configured, production `workers.dev` and Version URLs disabled. No formal custom domain is in the initial configuration.
- Node 24; Workers Builds command `npm ci && npm run build:cloudflare`, with `SKIP_DEPENDENCY_INSTALL=1`. Main deploys with `npx wrangler deploy`; other branches use `npx wrangler preview`.
- Build-time public settings: canonical www origin, existing GA measurement ID `G-QDDLYW7WRF`, explicit production indexing, advertising off. The wrapper uses actual Cloudflare branch metadata to force preview noindex and remove GA/advertising even when shared settings contain production values.
- Editorial App and model credentials remain in GitHub. Cloudflare has its own dedicated build credential; no credential value was committed to the repository.

## Local validation

The full production `npm run verify` passed: 125 automated tests, Astro checks (59 files, zero errors/warnings/hints), five-article content validation and fourteen-page static-output verification. Actual isolated production and preview builds cover consent/analytics, preview review copies, hidden-review previews, erroneous preview indexing/advertising settings and true draft exclusion. [PR #14](https://github.com/jageros/travel/pull/14) passed CI and was merged into main at `3437a023`.

`wrangler deploy --dry-run` passed with the pinned CLI: 72 static assets discovered and no bindings. The command used task-specific temporary configuration/log directories, sent no telemetry, and performed no upload or deployment. This is configuration evidence, not proof of a remote deployment.

## Cloudflare access and isolated preview

The official Cloudflare Workers and Pages GitHub App is installed with **Only select repositories → `jageros/travel`**. Its fixed request includes Metadata read and Administration/Code/Checks/Deployments/Pull requests write. The dedicated **Cedar Trips Builds** user token is registered with only **Workers Scripts: Edit** and **Account Settings: Read** on the selected account. Temporary Workers CI permission and the local credential file were removed after registration. No secret was committed.

The first isolated upload succeeded on Node 24.22.0 (`5a534883-b6cc-47fb-81ae-69feb908697d`), but `preview_urls: false` also disabled the new workers.dev preview URLs. The dashboard now manages `previews.cedartrips.com` for **Preview only**, and `www.cedartrips.com` for **Production only**. Both workers.dev switches remain off. Keep `route` and `routes` absent from Wrangler: a partial configured domain list can replace dashboard-managed domains and would require extra zone permissions.

[PR #16](https://github.com/jageros/travel/pull/16) added host-specific noindex headers. Its branch preview and unique deployment URL at head `38e9fbf2` passed twenty strict HTTPS checks: review copies are readable, HTML and headers are noindex, sitemap is empty, canonical points to www, and GA, advertising and external scripts are absent. Unknown paths are real 404; the new Preview service uses its default short error body. The production service separately passed the custom 404 checks below.

Cloudflare's zone-level RUM was disabled after discovering automatically injected analytics. It is absent from the verified preview and production HTML. Other zones and account-wide analytics were not changed.

## Production cutover and HTTP acceptance

The active Cloudflare zone uses `karsyn.ns.cloudflare.com` and `ridge.ns.cloudflare.com`, confirmed by two public resolvers. Google verification TXT remains intact. Universal SSL for the apex and wildcard is active through **2027-01-19**; public HTTPS checks independently passed certificate verification.

The first accepted production deployment used main `02a1bdca5f7dcc0f019de7e09f152296a77bcb10`, build `76bb87fa-e7ab-4b13-bd0f-5481bd1a0eaf`, active version **`1d1d48da-82bf-4a30-a06a-d785425596b6` at 100%**. Its real log confirms the standard build wrapper, reduced token and fourteen-page public-output verification.

The apex uses one proxied, originless A record (`192.0.2.0`). Two narrowly scoped redirect rules send the apex and HTTP www directly to HTTPS www using 308, retaining the original path and query. The www domain binding created its Worker record; preview DNS and Google TXT were preserved.

Production acceptance at **2026-10-21 17:24–17:25 Asia/Shanghai** passed with no failures or warnings:

- Fourteen public HTML outputs, canonical/OG/JSON-LD, static article prose and three security headers.
- Three published guides return 200; two review URLs and unknown paths return 404 with the site's own HTML and security headers.
- Nine canonical sitemap URLs, original robots text, twenty-eight referenced assets and responsive images; fingerprinted assets cache for one year and HTML revalidates.
- Twelve HTTP/HTTPS, apex/www, homepage/deep/unknown combinations retain encoded query values, redirect exactly once when needed, and end in the expected 200 or 404.
- No Cloudflare beacon or advertising code. TLS verification was enabled throughout. An initial local proxy-route failure was resolved without changing the site or disabling certificate checks.

Local evidence is in ignored `artifacts/cloudflare-production-http-2026-10-21T09-24-56-730Z/report.json`. Artifacts contain public responses and verification output, not credentials.

## Analytics, Google and editorial automation

Rejecting optional cookies and reloading produced no external script. After opting in, the existing GA4 property **559805493** / **G-QDDLYW7WRF** actually received the test session: `page_view`, `internal_navigation`, `view_search_results` and `reading_depth`. These are test events, not organic traffic or revenue.

Search Console's existing domain property remains accessible. The San Francisco car-free guide is reported as indexed; a fresh live test at **17:27 Asia/Shanghai** passed indexability and detected valid breadcrumbs. No Change of Address was submitted because the URL is unchanged.

The first observed scheduled source monitor was run [#6](https://github.com/jageros/travel/actions/runs/39552640836), event `schedule`, at 13:58:54 Asia/Shanghai. The post-cutover monitor-only run [#7](https://github.com/jageros/travel/actions/runs/39576782311) created [App PR #17](https://github.com/jageros/travel/pull/17), passed required PR-event CI at exact head `16d98fb9e060952f8eff14d528e83b8b7ae8cc56`, and automatically merged to **`d18f319ede96591e5e91aea0c5873ad5bede9807`**. Its Cloudflare production build **`c5bec699-06d9-4da1-91cd-7a3d2ea32825`** succeeded. Eleven source hashes are unchanged, conflicts are empty, article/approval ledgers are untouched, and the short-lived App token was revoked. No human approval, merge or rerun was needed for this monitor.

## Provider retirement and recovery

The final cleanup removes `vercel.json`, legacy environment fallback and current Vercel operations instructions. Its local production verification passed **125 tests**, Astro checks on sixty files with zero diagnostics, and the fourteen-page static-output checks. Production indexing still requires an explicit production environment and opt-in; previews remain isolated.

The remaining external operation is deletion of only Vercel project **`jageros-projects/travel`** (`prj_fL9D4WBu6AoXIS7ohMONMM080Ze5`) after the cleanup PR and final deployment are accepted. This deletes that project's deployments, domain bindings, variables and settings; account-wide integrations and unrelated projects are outside scope. The browser's irreversible-deletion confirmation is a separate final action.

Recovery uses Cloudflare. An older static version must not restore expired source claims or roll back the approval ledger. When source state differs, rebuild the chosen code with current content and provenance rather than rolling back stale assets. Historical acceptance documents retain their original provider evidence.
