# Cedar Trips weekly review — 2026-10-26

## Actual search and analytics observations

The authorized Search Console domain property now has a downloadable performance report. On October 26 the unfiltered Web report showed **40 property-level impressions, zero clicks, CTR 0%, average position 28.5**. The selected range was the past three months, but the available daily rows cover **October 19–23**. Do not treat October 24–26 as measured zeros. Page totals and query totals have different aggregation/privacy boundaries; do not add them together or reconcile them by inventing missing queries.

The real ZIP export contains seven disclosed queries with **eleven impressions and zero clicks**. `automation/gsc-opportunities.json` imports their exact query strings, clicks, impressions and position as `needs-editorial-assessment`. The English-only importer could not read this account's Chinese export; it now also accepts the observed Chinese headers, with equivalent-English regression coverage. The original ZIP and CSV files remain ignored artifacts, rather than reconstructed CSVs or public content.

The page report gives the SFO/luggage guide 24 impressions, the car-free guide nine and the BART/Muni guide eight. This is an early visibility signal. The disclosed `fisherman's wharf bart station` and `bart to muni transfer` queries each have only one impression. The existing articles already address the connecting journey and operator boundary; this sample does not justify a new duplicate article, a title rewrite or a ranking claim. Prioritize checking and refining these existing pages when a larger dated sample establishes a missing answer.

GA4 property **559805493** was read for its displayed **September 28–October 25** period. It reports **four sessions, all Direct**, two users, seven `page_view`, 24 `reading_depth`, two `internal_navigation` and two `view_search_results` events. There is no Organic Search row from which to assess an organic landing-page or onward-reading cohort. These small counts may include owner/acceptance activity; they are not evidence of organic visitor growth. No new site visit or consent acceptance was generated for this audit. AdSense is not enabled and no actual advertising earnings or operating-cost export was available, so no RPM, net-profit or zero-cost claim is calculated from GA4's revenue field.

The aggregate indexing report still has an **October 19** update date and predates the first release; its displayed zero indexed URLs is not a current indexing count. Today's actual SFO-guide URL inspection says **URL is on Google / page is indexed**, with HTTPS and one valid breadcrumb item. Keep this dated URL-inspection and performance evidence separate from that lagging aggregate report.

## Published-article sample and production checks

The BART/Muni/Clipper guide was sampled against the current official SFO, Clipper and SFMTA pages. Separate rider credentials, operator-specific entry/exit taps, the ordinary-Muni transfer window and Visitor Passport coverage remain consistent. The MuniMobile discontinuation and the Passport page's contradictory legacy channel-discount sentence remain explicitly bounded by the existing wording; no new price, channel discount, current service or firsthand-travel assertion was added.

The public SFO guide link, site/topic navigation, editorial/contact/photo-credit pages and the BART photograph were checked. Credits still identify Michael Dunn, the original Commons photograph, CC BY 2.0, capture year and resizing/cropping. The unpublished pass comparison is rendered as text in production rather than a broken internal link. A separate strict-TLS HTTP sample found three public guides readable, the two approved review copies and waterfront review still 404, sitemap nine public URLs, www canonicals, indexable public pages and responsive local photographs. GA consent configuration remains present; advertising remains off.

## Source-monitor failures and bounded fixes

Remote main was still `dc67fea` when this review began. October 22's monitor ran successfully but held its state PR; October 23–25 failed after successful source checks, tests and branch pushes. A failed job therefore did **not** mean that official sources were never checked. PR #22 contained the pending health updates, with unchanged approved hashes and no article or approval-ledger changes.

Two distinct issues were found:

1. The historical main health report honestly combines checks from different capture times. The classifier rejected this historical base because it required every row to equal its envelope time. Historical rows may now retain their real timestamps at or before the report assembly time. A proposed new health report still requires every row to belong to one fresh run; future, duplicate, missing, unknown-hash or falsely refreshed rows remain rejected. No recorded timestamp is rewritten.
2. An existing PR's head was read once immediately after a push. The three failures' timing and linear branch history are consistent with temporarily lagging PR metadata, but the old log did not record the mismatching value, so that cause is an inference. The code now retries a mismatching PR view at most six times, two seconds apart, only while the actual remote branch retains the exact local SHA and the same open PR identity. A changed branch, replaced/closed/ambiguous PR or API error still stops. Exact-SHA CI, base freshness, required PR checks and `--match-head-commit` remain in force.

The monitor now records the **actual current-run normalized official text** alongside source IDs, observed hashes and health in ignored `automation/reports/source-snapshots.json`. The existing Actions artifact upload includes it without new permissions. This makes a changed hash reviewable against the exact capture. Unavailable sources contain no text and cannot inherit an old snapshot. The artifact is evidence, not source-baseline approval or semantic fact verification.

PR #22 was manually reviewed and normally merged as `305ffd4cc89d06ae0f1d5ad56885e6a3baa24a10`: 21 unchanged sources, eight changed sources, no evidence conflicts. It accepts **no new source baseline** and releases **no article**. The eight changes remain a separate semantic-review queue; a full-page hash mismatch can reflect an advisory or page chrome but must not be automatically dismissed. Six BART pages returned 403 to the local standard capture; web-readable semantics are not represented as a successful local machine capture or a byte-for-byte historical diff.

## Publication and editorial decisions

The five named approvals, original article digests and three publication records remain unchanged. Rolling allowance recovers **October 27 at 20:18:20.750 Asia/Shanghai**. The configured next daily attempt is **October 28 at 09:15**, subject to GitHub scheduling delay. The current health and fact gates must pass independently of that allowance; an old successful run or recovered quota cannot release a changed/unavailable/expired source.

The two manually verified Sausalito facts expired **October 24 at 08:00 Asia/Shanghai** and remain unrenewed. A static shell hash or `ready` brief label cannot revalidate their rendered route controls. Hold that topic until a new manual review. No external model, payment credential, advertisement or new permission was configured. The first-five publication follow-up and weekly review remain useful; this audit does not claim the October 28 release has occurred.

Raw exports, browser observations, source captures, workflow-log evidence and HTTP responses are retained under ignored artifacts for this dated review. Current search signals favor maintaining the existing cluster while resolving the source queue; they do not establish demand volume, durable rankings or ad income.

## Follow-up acceptance

[PR #23](https://github.com/jageros/travel/pull/23) passed **135/135 tests**, zero Astro diagnostics and both build modes before normal merge as `211fb45`. The subsequent monitor-only **run #13** left baseline acceptance, article approval, drafting and publication unset. It produced the new exact-body artifact, passed current-head CI and automatically merged source-state **PR #24** as `48e39d4`, restoring the real automatic update chain. This run does not prove that PR metadata actually lagged during this particular execution; the bounded-retry and historical mixed-time cases are covered by regression tests.

Cloudflare's production check for `48e39d4` succeeded: Build `3d12df4d-483f-4241-9f05-d52a3fa1bb25`, Version `cf134860-d77e-4b74-bbe1-a33574d3ae9c`. The connected check contains no traffic-allocation field. The Cloudflare UI currently requires sign-in and displays a terms-acceptance notice; no new terms were accepted during this audit. Therefore 100% traffic allocation was not independently rechecked in the UI, rather than inferred from public HTML.

The [individual changed-source review proposal](source-review-2026-10-26.md) binds all eight candidates to the complete run13 bodies and preserves their original capture time. Its nine statements need no correction; adoption remains a separate source-baseline approval. No new article was released during this weekly review.
