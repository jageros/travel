# Changed-source review proposal — 2026-10-28

## Publication result and approval boundary

The October 28 scheduled [editorial run](https://github.com/jageros/travel/actions/runs/40646242863) completed successfully at 06:51 UTC. Its source-state [PR #28](https://github.com/jageros/travel/pull/28) normally merged as `06ec018944b034ed0978bcd5e82874dbbd2c0a30`. It **did not publish an article**: the Muni-pass and Golden Gate Bridge review copies were held because `sfmta-fares` changed; the waterfront review was held by the first-five approval gate. The rolling-seven-day allowance has recovered, and all five original article digests still match their named owner approvals.

This separate proposal requires an explicit owner decision before normal protected merge. It proposes eight individually reviewed source baselines, not new article approval or publication. Until adoption, production keeps the source holds. Do not merge this proposal using the October 26 baseline approval: these are different captured versions.

## Exact evidence

The runner captured all 29 complete normalized official bodies at **2026-10-28T06:50:14.538Z**: 21 unchanged, eight changed, no unavailable sources or evidence conflicts. GitHub artifact **12797996153**, `editorial-reports.zip`, is **44,178 bytes**, with SHA-256 `d816a94ba5d103529b4cbe09452fce886106f8f20792ec8af339f050fccca944`. The ZIP digest matches GitHub, and every body hash independently matches its snapshot and the observed health report.

Unlike the earlier initial review, the complete October 26 approved bodies are available here. Their hashes match the registered baselines. This review compares those exact bodies with October 27 and October 28 captures, rather than inferring what caused a hash change from a live search result or a text fragment.

## Individual semantic decisions

| Official source | Exact change and retained claim boundary | Proposed SHA-256 |
| --- | --- | --- |
| [SFMTA fares](https://www.sfmta.com/getting-around/muni/fares) | Fare body before the trailing travel-updates widget is byte-identical across all three captures. Only that widget adds the November 2 Dia de Los Muertos event and removes the October 31 River of Life event. No facts are registered on this overview. Existing exclusions for outdated MuniMobile single-ride copy and inconsistent Passport channel-discount prose remain. | `850feb3eda1c73800504e088c83b0d3a349e52b75d313d5bb77e707012f0a714` |
| [SFMTA travel updates](https://www.sfmta.com/travel-transit-updates) | Adds an October 31 event, removes Subway Help, and replaces an October 27 event with the November 2 event. Dated advisories, elevator-status and temporary-stop lookup links still support the complete registered statement. No current incident or working equipment is asserted. | `6c7c5c9682d411a619c2d7373adc450c5ecf59ba5737a4702ffed38736f6cc7d` |
| [BART SFO](https://www.bart.gov/guide/airport/sfo) | Only the expired October 25 Green Line banner was removed; the remaining normalized body is identical. International Terminal station and free AirTrain access remain supported; no current departure or service duration is inferred. | `6e47386934ab24578646995df7f4d9551c949f7860f31fa66822f532db7d4edb` |
| [BART advisories](https://www.bart.gov/schedules/advisories) | Removes that banner and the October 25 planned-work item; Yellow Line next work changes from October 22–24 to November 12–13; adds a Powell station entrance notice for November 2–10. Cancellation and elevator-alternative lookup statements remain supported. These dates are not copied into evergreen travel advice. | `2aeaad11266a9ac34492fc19efdaf553f7c0d11dd07f348002d54dc922ab6c6d` |
| [BART paying fares](https://www.bart.gov/tickets) | Only the expired banner was removed. The entire remaining body supports both registered Youth Clipper and Clipper-alternative statements. Keep agent-first exit guidance separate from conditional grace provisions; no universal card-upgrade or charge claim. | `1382a97f3ce5039caa30a67d7698c2803649ad93461e7f6886ab27fa7382d9d4` |
| [BART Tap and Ride](https://www.bart.gov/tickets/contactless) | Only the expired banner was removed. Agent assistance with tapping records remains documented; credential matching, eligibility and transfer credits remain separate conditions. | `3d170b08b742c9f33d3ef7b6d307e2be7062ae696de8d20ec940e1c076be143f` |
| [BART schedules](https://www.bart.gov/schedules) | Only the expired banner was removed. The planned-delay capability of the official planner remains supported; no particular itinerary or last connection was tested. | `5c2865ef412d2a3113a3e6377ad240a42852717e2527b56a992438fe33328e11` |
| [BART official app](https://www.bart.gov/guide/apps) | Only the expired banner was removed. Station-specific last-train lookup remains documented. Historical payment-launch copy is not treated as current payment advice. | `1286193aa37fea5773dedb011ed1d0eb47df37954b816d761ef056add0c013d3` |

All **nine complete registered facts** associated with these sources, including their evidence fragments, remain supported. No fact statement, evidence, source URL, publisher, allowed host, article wording or photo permission needs changing. The proposal sets these eight source check days and nine evidence-backed fact check days to October 28, with dynamic expiry **November 4 at 00:00 UTC / 08:00 Asia/Shanghai**. The two manual Sausalito facts retain their original October 21 verification and October 24 expiry.

## Queue and next release

Proposed health reclassification retains every actual October 28 timestamp and observed hash; only the eight statuses change against the proposed matching baselines. The original runner artifact still correctly records eight changes before adoption. The proposed queue removes those resolved source errors and deduplicates obsolete quota holds: the current run actually evaluated the recovered allowance and did not report a quota error. The waterfront's current exact-content approval hold remains. This PR changes neither article status nor the approval/publication ledger.

After explicit owner adoption and merge, the existing publication workflow must capture current official sources again and recheck facts, article digests, allowance, PR CI and normal protected merge. If both original review copies pass, they can complete the five approved releases together. Only after that threshold may the waterfront review use a remaining slot under existing automatic rules; no human approval is fabricated.

## Deployment acceptance at this review

Main `06ec018` has a successful Cloudflare production build `6b588343-72ff-4b73-a661-2566693d0540`, Version `e0d3e84f-ec5d-4cab-9248-00a8823b4b50`. The PR head `6d66450258c322a8b6c0a27871ac98ad12f07953` passed required PR CI with 135 tests and has an identical Git tree to the merge commit. This is head-CI evidence, not a claim that a separate merge-SHA GitHub CI ran.

Live strict-TLS checks confirm the existing three guides remain 200, the two target reviews and waterfront review remain 404, an unknown path is 404, and the sitemap contains nine production URLs. Static bodies, canonical, JSON-LD, photo credits and consent-gated GA4 configuration remain correct; advertising stays off. Preview pages are readable with noindex headers/metadata, no GA4 identifier or ads, and an empty sitemap. No JavaScript or analytics events were generated during acceptance. No live Search Console inspection or traffic-allocation percentage was independently verified in this check.

Ignored evidence is under `artifacts/first-five-2026-10-28/afternoon/`: original run15 ZIP, full snapshots, individual BART/SFMTA semantic reviews, workflow logs, CI/deployment records and public HTTP checks. Raw official text and visitor-statistics exports are not committed.

## Proposal validation

The proposed data change passes content validation, all 135 existing tests, Astro checks with zero errors/warnings/hints, and production verification of 14 pages. A separate preview build with production indexing and GA4 values deliberately supplied still passes preview isolation verification for 17 pages. The proposal does not release the review copies or change an original article digest, an approval or a publication record. Remote PR checks and a branch preview are separate from these local results.
