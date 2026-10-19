# First five articles: required human review

All five initial articles intentionally have `status: review`. They are excluded from production article routes and the production sitemap until explicitly approved. The local review-preview mode renders review content with `noindex`; it is for checking the proposed result. A preview is not publication approval.

## Review queue

| Order | Slug | Main question | Key review point |
| --- | --- | --- | --- |
| 1 | `san-francisco-without-a-car` | How should a first visit be organized? | Useful accommodation and journey decisions without claiming a tested itinerary |
| 2 | `sfo-to-fishermans-wharf-with-luggage` | Which complete airport transfer suits the group? | BART plus street-level transfer and final hotel walk are explicit; no fixed time or invented road fare |
| 3 | `bart-vs-muni-clipper` | What do operator, pass and payment names mean? | Payment compatibility is not confused with unlimited coverage or guaranteed transfer credits |
| 4 | `is-muni-pass-worth-it` | Does a pass fit the planned paid fare windows? | Formula and product coverage are correct; current prices remain in expiring registry facts |
| 5 | `golden-gate-bridge-without-a-car` | Is the visit a viewpoint, partial walk or crossing? | Bridge end, return stop and pedestrian-access verification are clear |

## Checklist before approval

- [ ] Open the current official pages; verify every referenced fact and its source, checked date and expiry. A successful HTTP response or an unchanged hash alone does not prove the fact is true.
- [ ] Resolve material conflicts before adding a definite claim. Current known conflicts are purchase-channel labels and incomplete inter-agency discount guidance; drafts avoid making those promises.
- [ ] Confirm the article answers its primary intent and adds a concrete comparison, calculation or planning sequence. Remove filler and overlap with an existing article.
- [ ] Recalculate the Muni comparison using actual applicable fares and product rules. Do not count every boarding as a new fare window or apply one adult fare to every rider.
- [ ] Verify official links and related internal links. The bridge article uses `/destinations/`; the other four use `/guides/`.
- [ ] Confirm no invented firsthand experience, named expert, travel test, testimonial, guaranteed safety, blanket accessibility or revenue claim appears.
- [ ] Inspect the preview on mobile and desktop with JavaScript disabled. Confirm headings, tables, citations and fact-expiry messaging remain useful.
- [ ] Confirm the hero is labeled as an original illustration, its attribution is accurate, and the CC0 declaration is intended by the site owner. It is not a location photograph or a usable navigation map.
- [ ] Confirm title and description accurately describe the content; image alt describes the illustration; no keyword repetition is added solely to target search.
- [ ] Record a named reviewer and review date using the approval command documented in the operations guide. Do not approve solely to unlock automated publishing.

## Drafting and fact policy

Official content was checked on **2026-10-19**. Exact amounts and live service conditions belong in the source registry with expiry, and relevant fact IDs are referenced by article frontmatter. Markdown explains the decision process and links to operator checks. If a dynamic fact expires or its source changes, the site should withhold its exact current assertion and direct readers to the official source.

Routine planning advice is editorial reasoning, not a claim of personal travel. No interview, on-site visit, accessibility audit, fare purchase or end-to-end transfer was performed. Reviewers must not replace that boundary with a fabricated author biography or a claim that staff tested the route.

External links in draft prose provide attribution and the next official check. Do not automatically replace published prose when a fetch fails. A failed or changed source needs investigation; it does not show that a service was cancelled or a fare changed.

## After the first five approvals

Passing automated checks permits the configured subsequent workflow; it does not establish editorial truth. Review one published article each week, rotate through high-change facts and any reader reports, and pause the affected publication when a material error is found. Keep the initial weekly cap and treat exceptions as review work, not a reason to publish unrelated volume.

Keyword ideas, source hashes and Search Console data are inputs to a decision. They do not authorize duplicate pages or turn an unverified draft into a published article. A new article must add a distinct useful answer and retain source provenance.
