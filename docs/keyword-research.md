# Initial topic research — 2026-10-19

## Decision and evidence boundary

Start with **San Francisco without a car**, subject to the first five drafts receiving human review. This is an editorial feasibility decision: we found useful operator boundaries, a reproducible fare comparison, and several closely connected visitor decisions that can be explained with official sources. It is not evidence that this cluster has the greatest search demand, lowest competition or highest revenue.

`automation/keywords.json` contains 20 English query candidates for each of three clusters, 60 total. The queries are hypotheses. None has a verified search-volume estimate, keyword-difficulty number, ranking forecast or revenue estimate. The five `review-draft` entries identify drafts, not approved or published pages. Do not publish separate pages for closely overlapping queries; consolidate payment, fare-product and airport-transfer variants when they serve the same decision.

## Research actually performed

On 2026-10-19, used current web search for these representative searches, then opened official pages for factual checks:

- `site.sfmta.com fares single ride visitor passport 2026 Muni`
- `site.bart.gov SFO Fishermans Wharf BART Muni Clipper`
- `site.goldengate.org bridge visiting getting to the bridge public transit`
- `SFO to Fishermans Wharf luggage BART Muni best route`
- `Zion shuttle without car Grand Canyon village shuttle 2026`
- `New York first time budget free museums transport ferry 2026`

The airport search surfaced repeated luggage/connection questions alongside operator information. Treat that as a weak indication that wording matters to readers, not a quantified demand measurement. The parks sample returned official seasonal schedules and numerous shuttle explainers. The New York sample returned official admission conditions alongside many generic free-activity lists. We did not inspect every result or every candidate query, and did not measure rank positions or organic click share.

Technical and travel facts below rely on the primary sources, rather than assertions made in search-result snippets or forum answers. Search output was used to discover questions and official pages. The two broader searches were not a comprehensive competitor audit.

## Qualitative rubric and selection

All scores are editorial judgments on an ordinal 1–5 scale. Higher maintenance ease means less expected maintenance. Weighted score = sum of score × weight. Demand scores are deliberately low because traffic and query data are unavailable.

| Criterion | Weight | SF car-free | Southwest parks | NYC budget |
| --- | ---: | ---: | ---: | ---: |
| Demand evidence | 20% | 2 | 2 | 2 |
| Observed explanatory gap | 20% | 3 | 2 | 2 |
| Potential independent value | 25% | 5 | 3 | 3 |
| Official verifiability | 20% | 5 | 5 | 4 |
| Maintenance ease | 10% | 3 | 2 | 2 |
| Fit for useful long-form reading | 5% | 3 | 3 | 3 |
| Weighted editorial score | 100% | **3.70** | **2.90** | **2.70** |

SF's advantage is the ability to join operator documents into explicit decisions: rail plus final transfer, payment versus coverage, and fare-window counting. This is a potential contribution we can implement, not a measured deficit across all competing pages. Seasonal parks transport and inter-park connections need more frequent checks. NYC admission benefits vary by institution and eligibility, requiring a broader source set. All clusters can support useful articles; none has demonstrated advertising performance.

The scores do not imply statistically meaningful differences. Reassess when Search Console has impressions and queries. If real query data favors another cluster or reveals that existing SF pages cannot answer useful unmet questions, update the research before expanding.

## Primary-source findings and limitations

| Official source | What it supports | Editorial consequence |
| --- | --- | --- |
| [BART SFO guide](https://www.bart.gov/guide/airport/sfo) | Airport station connection, fare-payment guidance and luggage information | Plan the hotel connection after the train; avoid a universal end-to-end travel time |
| [SFMTA fare overview](https://www.sfmta.com/getting-around/muni/fares) | Distinct products and current listed amounts | Store prices in expiring source facts; compare products by coverage |
| [Adult single ride](https://www.sfmta.com/fares/single-ride-adult-ages-19-64), [Day Pass](https://www.sfmta.com/fares/day-pass), [Visitor Passport](https://www.sfmta.com/fares/1-day-visitor-passport) | Fare-window and product conditions | Explain a formula instead of hardcoding a recommendation based on one itinerary |
| [F route](https://www.sfmta.com/routes/f-market-wharves) and [streetcar access guide](https://www.sfmta.com/getting-around/accessibility/muni-accessibility/muni-access-guide/access-historic-streetcars) | Waterfront connection and stop-specific access distinctions | Avoid blanket step-free or luggage-convenience claims |
| [Clipper contactless payments](https://www.clippercard.com/contactless-payments) | Rider/device consistency and discount-program distinctions | Keep payment method separate from transport coverage |
| [Bridge transit](https://www.goldengate.org/bridge/visiting-the-bridge/public-transit/) and [pedestrian access](https://www.goldengate.org/bridge/visiting-the-bridge/bikes-pedestrians/) | Different end-of-bridge connections and current access rules | Plan return stops and keep access conditions subject to recheck |
| [NPS Zion shuttle](https://www.nps.gov/zion/planyourvisit/zion-canyon-shuttle-system.htm) and [Grand Canyon shuttle routes](https://www.nps.gov/grca/planyourvisit/shuttle-buses.htm) | Seasonal systems and stop distinctions | Parks cluster needs date-specific verification before any draft |
| [NYC cultural admission directory](https://www.nyc.gov/site/dcla/resources/free-and-suggested-admission.page) and [MTA fare information](https://www.mta.info/fares-tolls) | Admission eligibility and transit-product source entry points | Check each institution and journey individually before any claim |

Observed on the research date: the SFMTA fare hub says MuniMobile single rides were discontinued, while the single-ride detail still labels that purchase channel. The hub's inter-agency-discount link redirected to the general single-ride detail, which did not fully resolve discount conditions. The drafts therefore avoid MuniMobile buying instructions and fixed transfer-credit claims. A source's listed fare is a checked source statement, not proof every checkout or rider will show that amount.

The Clipper legacy `how-to-use-clipper.html` URL failed during this session; the current contactless page was opened instead. Do not add the failed URL as a healthy source. Search engines and sites can present stale snapshots; reviewers should open the live operator page again before approval.

## Next validation steps

1. Review each of the first five drafts against the linked sources and source-fact registry, including a live fare-channel check. The drafts have distinct intents but need a human acceptance decision.
2. For the next candidate, inspect its individual current search results and determine whether it adds a new decision or belongs in an existing guide. Record what would be new before drafting.
3. After Search Console begins returning data, prioritize useful query/page pairs with impressions. Interpret missing data as missing evidence rather than proof of no demand.
4. Track publication date, substantive changes, search landing pages and reading behavior. Evaluate expansion and advertisements from observed reader value, with no ranking or income guarantee.
