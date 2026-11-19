# First five articles: historical human-review record

The initial five articles entered `status: review` and stayed excluded from production routes until their exact versions were approved and released. The owner confirmed all five exact digests on 2026-10-20; the overview, operator/payment and SFO transfer guides were released that day, and the other two on 2026-10-28 after the rolling quota recovered. The waterfront guide was then automatically released under the after-five rules without a fabricated manual approval. This file preserves that historical record. Current publication uses the automatic source, fact, quality, duplicate and build gates in [automation operations](automation.md), with ledger authority in `automation/editorial.json`.

## Review queue

| Order | Slug | Main question | Key review point |
| --- | --- | --- | --- |
| 1 | `san-francisco-without-a-car` | How should a first visit be organized? | Useful accommodation and journey decisions without claiming a tested itinerary |
| 2 | `sfo-to-fishermans-wharf-with-luggage` | Which complete airport transfer suits the group? | BART plus street-level transfer and final hotel walk are explicit; no fixed time or invented road fare |
| 3 | `bart-vs-muni-clipper` | What do operator, pass and payment names mean? | Payment compatibility is not confused with unlimited coverage or guaranteed transfer credits |
| 4 | `is-muni-pass-worth-it` | Does a pass fit the planned paid fare windows? | Formula and product coverage are correct; current prices remain in expiring registry facts |
| 5 | `golden-gate-bridge-without-a-car` | Is the visit a viewpoint, partial walk or crossing? | Bridge end, return stop and pedestrian-access verification are clear |

## Historical checklist before the first five approvals

- [ ] Open the current official pages; verify every referenced fact and its source, checked date and expiry. A successful HTTP response or an unchanged hash alone does not prove the fact is true.
- [ ] Resolve material conflicts before adding a definite claim. Current known conflicts are purchase-channel labels and incomplete inter-agency discount guidance; drafts avoid making those promises.
- [ ] Confirm the article answers its primary intent and adds a concrete comparison, calculation or planning sequence. Remove filler and overlap with an existing article.
- [ ] Recalculate the Muni comparison using actual applicable fares and product rules. Do not count every boarding as a new fare window or apply one adult fare to every rider.
- [ ] Verify official links and related internal links. The bridge article uses `/destinations/`; the other four use `/guides/`.
- [ ] Confirm no invented firsthand experience, named expert, travel test, testimonial, guaranteed safety, blanket accessibility or revenue claim appears.
- [ ] Inspect the preview on mobile and desktop with JavaScript disabled. Confirm headings, tables, citations and fact-expiry messaging remain useful.
- [ ] Confirm the registered hero photo matches the actual location and transport discussed. Check the original Commons file page, photographer, capture date and license against `src/data/photos.json`; the downloaded original's checksum must match. A historical photo does not establish today's services, signs or fares.
- [ ] Confirm the photo credit, license link and resize/crop disclosure are visible, including the original ShareAlike license on adapted photos where required. Do not add unverified image URLs or invent a license.
- [ ] Confirm title and description accurately describe the content; image alt describes what the photograph shows; no keyword repetition is added solely to target search.
- [x] Record the named reviewer, review date and exact digest in the historical editorial ledger.

## Drafting and fact policy

Initial official-source research began on **2026-10-19**; current verification dates belong in `automation/sources.json` and `automation/source-health.json`, rather than this historical starting date. Exact amounts and live service conditions belong in the source registry with expiry, and relevant fact IDs are referenced by article frontmatter. Markdown explains the decision process and links to operator checks. If a dynamic fact expires or its source changes, the site should withhold its exact current assertion and direct readers to the official source.

Routine planning advice is editorial reasoning, not a claim of personal travel. No interview, on-site visit, accessibility audit, fare purchase or end-to-end transfer was performed. Reviewers must not replace that boundary with a fabricated author biography or a claim that staff tested the route.

External links in draft prose provide attribution and the next official check. Do not automatically replace published prose when a fetch fails. A failed or changed source needs investigation; it does not show that a service was cancelled or a fare changed.

## Current automatic publication

Passing automated checks permits publication within the [current daily cap](automation.md#failure-handling). The source monitor checks high-change facts and records failures in the queue. A material source or fact failure holds the affected article until the automatic evidence gate passes again.

Keyword ideas, source hashes and Search Console data are inputs to a decision. They do not authorize duplicate pages or turn an unverified draft into a published article. A new article must add a distinct useful answer and retain source provenance.
