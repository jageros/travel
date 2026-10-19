# Actual traffic, advertising and cost reporting

Copy the header-only `docs/metrics-template.csv` and populate it with actual measurements. Run:

```sh
node scripts/report-metrics.mjs /path/to/matched-cohorts.csv
```

The command prints a summary and writes ignored `reports/metrics.json`, including totals, the observed date range and a landing-page breakdown. With no input it prints usage and creates nothing. A header-only file is rejected as having no observations. No external API, model key or invented traffic/revenue estimate is used.

Each row is one **date × canonical landing-page path × channel × country × device** cohort. Dates must be real `YYYY-MM-DD` days. Use lowercase channel names such as `organic_search`, `direct` or `paid_search`, two-letter country codes or `UNKNOWN`, and `desktop`, `mobile`, `tablet` or `unknown` devices. Counts must be nonnegative whole numbers; revenue and allocated costs may be nonnegative decimals. Use decimal points without thousands separators. Every row must use one uppercase three-letter currency and the same IANA reporting time zone. The importer does not convert currencies or reconcile different daily windows.

Do not mix aggregate totals with detailed rows. Duplicate cohort keys are rejected, as are `all`, `total` and similar aggregate dimension values. Trailing slashes are normalized so the same page cannot be counted twice that way. Use a consistent canonical path with no query string or fragment. Include zero-valued measurements explicitly; a missing value is not assumed to be zero.

## Match scope before calculating

`sessions` and `pageviews` must be measured for the same GA4 session cohort. `ad_pageviews` and `ad_revenue` must come from the advertising platform and refer to the same period and users/cohort represented by that row. For a landing-page cohort, attribute advertising views/revenue from that cohort consistently, including any subsequent pageviews counted in its GA4 pageviews. Ad-platform page-URL exports alone do not establish landing-page session attribution. If your exports cannot support a reliable join, do not combine them into this report; prepare a matched cohort first. The script validates structure, dates and duplicate keys, not the truth of that attribution.

Allocate each period's content, hosting and tool costs **once across the included rows**, using a documented method. For example, divide a shared monthly cost across the days and cohorts included using an agreed allocation rule. Do not repeat a whole-site monthly cost on every row or subtract the same content cost again each week unless that is your explicit amortization method. A partial cohort report needs its corresponding share of costs. Keep the original exports and allocation worksheet outside Git; the template carries no real analytics data.

## Report definitions

| Output | Calculation |
| --- | --- |
| `organic_sessions` | Sum of `sessions` where `channel` is exactly `organic_search` |
| `pages_per_session` | Matched GA4 `pageviews / sessions` |
| `ad_page_rpm` | `ad_revenue / ad_pageviews × 1000`, using the advertising platform's pageview definition |
| `revenue_per_1000_sessions` | `ad_revenue / sessions × 1000`, a custom metric using matched GA4 sessions |
| `net_profit` | `ad_revenue - content_cost - hosting_cost - tool_cost` |

The custom session revenue metric is **not an AdSense-native RPM**. Do not replace `ad_pageviews` with GA4 pageviews when interpreting advertising Page RPM. Ratios with zero denominators are `null` (undefined), not fabricated zero performance; net profit may be negative. Aggregated ratios are recomputed from total numerators and denominators, never averaged from row RPMs. Values are rounded to six decimal places for reporting, not used as an accounting ledger. The observed date range does not imply that missing days were measured.

Compare reports only after matching their date windows, attribution, channels, countries, devices, currency, time zone and cost allocation. Evaluate organic sessions, onward reading, Page RPM, custom session revenue and net profit together before increasing publishing volume or ad density.
