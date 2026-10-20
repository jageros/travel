# Cedar Trips launch checkpoint — 2026-10-20

## Completed and verified

- [PR #3](https://github.com/jageros/travel/pull/3) merged the five revised review guides, source research, exact-SHA approval controls and the follow-up topic queue. The article digest list remains in `docs/first-five-review.md`.
- [The first real editorial run](https://github.com/jageros/travel/actions/runs/39408017360) ran on `main` with only `accept_missing_baselines=true`. It made no approval, publication or model request. All eleven official sources passed; the nine dynamic facts are checked on October 20 and expire at the start of October 27 UTC unless renewed by the source monitor.
- [Source-health PR #4](https://github.com/jageros/travel/pull/4) changed only sources and source health. Its explicitly dispatched CI and subsequently approved PR-event CI passed; the PR was merged. Seven local network-failure queue items were reviewed against that healthy result and resolved; their original failures remain in Git history and the source-review report.
- The owner explicitly authorized GitHub Actions to create PRs. The repository's default token permissions remain read-only; the editorial workflow declares its limited write scopes. Initial releases still require named, exact-content approval.
- A separate **Cedar Trips** GA4 property (`559805493`) and **Cedar Trips Web** stream (`16165432958`) were created under the existing Analytics account. Its real measurement ID is `G-QDDLYW7WRF`, saved as Production `PUBLIC_GA_MEASUREMENT_ID` in Vercel. Reports use the existing China time-zone default and USD. Enhanced measurement is disabled; standard page views and the site's consent-gated search-count, navigation and reading-depth events are the intended collection path.

## Pending human confirmation and launch acceptance

All five articles remain `review`, with no approvals or releases recorded. The owner has been given the full deployment preview and Chinese review packet and asked to confirm the exact five digests. General implementation authorization is not recorded as editorial approval.

After that explicit confirmation, record approval for the city overview, operator/payment guide and SFO-to-Wharf guide first, then run the ordinary publication gates against a fresh accepted source report. Record the two remaining approvals after the first three are published so filename ordering cannot select the bridge or pass article for the first batch. Keep the rolling seven-day maximum of three releases. Approvals do not bypass fact/source health checks.

Production indexing is still off. After the first three public guide URLs pass static HTML, metadata, links and actual HTTP checks, enable Production `SITE_INDEXING_ENABLED=true` and redeploy. Then submit the real sitemap to the existing `cedartrips.com` Search Console property, inspect a published URL, and verify analytics consent and actual GA4 receipt. A configured measurement ID or successful deployment is not proof that analytics received an event, Google indexed a page, or search traffic grew.

The follow-up queue plans eight independent reader problems beyond the initial five; only one currently has sufficient registered source coverage to be ready. The other candidates retain source or overlap holds. No draft-model credentials, model choice or spending limit have been supplied, and no paid model requests were made. Advertising remains disabled.
