# Changed-source review proposal — 2026-10-26

## Evidence and approval boundary

This separate PR proposes replacing eight registered source baselines after individual semantic review of their **complete, exact runner captures**. It is not an automatic hash acceptance, a content approval or a release. The owner's source-baseline review requirement remains in force; until this PR is approved and normally merged, production retains the eight changed-source holds.

[Monitor run #13](https://github.com/jageros/travel/actions/runs/40262191328), based on `211fb452773ae91f7a088cf79f7a73459baceab5`, captured all 29 sources at **2026-10-26T03:04:18.235Z** with 21 unchanged, eight changed, no unavailable sources and no evidence conflicts. Its source-state [PR #24](https://github.com/jageros/travel/pull/24) automatically merged as `48e39d44f812152105058f714d4fe5c2004049b5`, without changing an article, approved baseline or the release ledger.

The actual downloaded `editorial-reports.zip` is **44,237 bytes**. Its SHA-256 is `b8cb8029b1994f1269c65e5cf9a03a940f88ec8b05ff1837bda764512d6cc767`, matching GitHub artifact **12625026513**. `reports/source-snapshots.json` contains every successful current-run normalized body. Each selected body's SHA-256 was independently recomputed and matched the snapshot and source-check report before semantic review. The eight candidate hashes also match the preceding day's runner, but this review uses today's exact capture; it does not reuse that older hash as today's verification.

Six BART URLs returned 403 to the normal local fetch. Earlier web-readable semantic review alone did not bind a full local body to a hash. Today's runner artifact resolves that limitation. There is no historical complete approved body available for a byte-for-byte diff, so no claim is made that a particular banner, navigation element or incident explains all eight changes.

## Individual decisions

| Source | Complete statement review and retained boundary | Proposed SHA-256 |
| --- | --- | --- |
| [BART SFO](https://www.bart.gov/guide/airport/sfo) | International Terminal station and free AirTrain connection still support the registered airport-access statement. The dated October 25 notice is not a service assertion for October 26. | `eb07be9ef24dbc0f337095a61c6c8b26b1250e92ddcdd54be7549613820fbab5` |
| [SFMTA fares](https://www.sfmta.com/getting-around/muni/fares) | No facts are registered on this index. The current table and linked-product boundaries remain compatible with the existing individual fare sources. Old MuniMobile single-ride wording and conflicting channel-discount copy are not new recommendations. | `133f1b6c93fd9be0e361b1de2b1d199656cd26a28c1c83e35bbc42e7512c237a` |
| [SFMTA travel updates](https://www.sfmta.com/travel-transit-updates) | Supports checking dated advisories, elevator information and temporary-stop notices. It certifies no current incident, replacement service or equipment availability. | `056d30a9115b00b8dd08f6a2756a3fbe0d20ebaa1daa40dc5ac8d906cfc3157d` |
| [BART advisories](https://www.bart.gov/schedules/advisories) | Station-specific cancellation lookup and station-name links to elevator alternatives remain documented. No dated closure or step-free substitute is copied into evergreen prose. | `a7c69d9f0753114ceb58c2896c3fc08aed2ac3014bb0a46bdaf95641f5b76ddd` |
| [BART paying fares](https://www.bart.gov/tickets) | The two registered statements about Youth Clipper eligibility and a Clipper payment alternative remain supported. Agent-first no-ride instructions coexist with a conditional grace period for specified payment states; neither a universal charge nor universal upgraded-card status is inferred. | `40a697577f3ae5ad64a47bee6d612ffd7e7ee159913192e074e90b694710c54e` |
| [BART Tap and Ride](https://www.bart.gov/tickets/contactless) | Station-agent assistance with tapping records remains documented. Matching the credential across entry and exit, discount eligibility and transfer-credit conditions remain distinct questions. | `ee88797733d6a9f189df011ff5f4cbb8d645e04360bbca2cd7d497e3743dbdb8` |
| [BART schedules](https://www.bart.gov/schedules) | The official planner's inclusion of planned delays is still stated. No final SFO connection or travel-date journey result was tested. | `3d03c8dd86c3c0265941ed37f519503bbd85a8936dd1c492a8243546b417a048` |
| [BART official app](https://www.bart.gov/guide/apps) | The documented station-specific last-evening-train lookup supports the registered tool capability. Historical Google Pay coming-soon footer text is not current payment guidance. | `1e3eb5dfba98e9bb4ba041d4a2e09afd7162cb9ab0baf74e5fcf9142bbf2c732` |

All **nine full registered statements** and their evidence fragments remain supported by those exact bodies. No statement, evidence, URL, publisher, official-host allowlist or article wording changes. The proposal updates the eight baselines and their check days, renews the nine evidence-backed dynamic facts to **November 2 at 00:00 UTC / 08:00 Asia/Shanghai**, and compares the same observed health hashes with these proposed baselines. The original raw report remains unchanged in the artifact: it correctly records eight changed sources before adoption.

## Queue and publication constraints

The proposal removes source-check items resolved by the current matching captures, including three earlier Clipper changes that already returned to their existing approved hashes. It removes the now-resolved SFMTA-fares reasons from publication holds and deduplicates identical quota items while retaining their original detection times. The remaining queue still has the rolling-quota holds for the two approved initial review copies and the waterfront review. This is not a new publication attempt.

The original five article digests, five owner approvals and three publication records remain unchanged. The two manual Sausalito facts still have their original October 21 check and **October 24** expiry; neither a shell capture nor this PR renews them. New source health, expiry, exact-version approval and release allowance must all pass at the eventual publication attempt.

Ignored evidence includes the original ZIP, complete run13 reports, `run13-exact-review.json`, the eight UTF-8 body copies and independent digest/ledger checks under `artifacts/weekly-review-2026-10-26/`. None of the official captured bodies or raw visitor-statistics exports is committed as public website content.
