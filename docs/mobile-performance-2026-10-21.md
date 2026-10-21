# Mobile performance baseline and image improvement — 2026-10-21

The local production build meets the LCP ≤2.5 s and CLS ≤0.1 lab targets on both measured pages. One small, measured image change reduces transferred bytes without changing the page layout or editorial text.

## Method

- Source baseline: `80569833d2e97a77b672ec7ef81de1620ba133cc`, with the working changes measured below. Production output contains the existing three published guides; review articles are excluded.
- Official Lighthouse **13.5.0**, Node **24.21.0**, installed Google Chrome **155.0.8059.85**, using a separate headless profile for each run. Lighthouse was installed in a temporary npm cache; project dependencies were not changed.
- Lighthouse mobile defaults: **412 × 823**, DPR **1.75**, simulated Slow 4G (**150 ms RTT, 1,638.4 Kbps throughput**) and **4× CPU slowdown**. Storage reset is enabled. Optional cookies are not accepted.
- Homepage and `/guides/sfo-to-fishermans-wharf-with-luggage/`, **three runs per page before and after**, measured serially on 21 October at approximately **20:12–20:17 Asia/Shanghai**. The tables use the median of each metric, rather than choosing a best run.
- Production environment: `DEPLOYMENT_ENV=production`, indexing enabled, review preview disabled, GA4 `G-QDDLYW7WRF` configured, ads disabled. Baseline and changed builds use separate output/cache directories and local preview ports 4548/4549; the normal `dist/` was not overwritten.

These are local page-load lab measurements. Localhost does not measure public DNS, TLS, Cloudflare routing or origin latency, and is not evidence of real-user Core Web Vitals. **TBT is not INP**; no INP result is claimed. See Google's [INP guidance](https://web.dev/articles/inp) and [Lighthouse performance scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring).

## Results

| Page | Metric | Before, median | After, median |
| --- | --- | ---: | ---: |
| Homepage | Performance score | 99 | 100 |
| Homepage | LCP | 1.954 s | 1.354 s |
| Homepage | CLS | 0 | 0 |
| Homepage | TBT | 0 ms | 0 ms |
| Homepage | Page transfer | 292.6 KiB | 246.2 KiB |
| SFO guide | Performance score | 100 | 100 |
| SFO guide | LCP | 1.353 s | 1.352 s |
| SFO guide | CLS | 0 | 0 |
| SFO guide | TBT | 0 ms | 0 ms |
| SFO guide | Page transfer | 81.0 KiB | 65.7 KiB |

All 12 runs completed without Lighthouse warnings or runtime errors. Each run recorded **zero external page requests** before optional consent. Homepage post-change LCP ranged from **1.206–1.503 s**; the LCP change is a lab observation, not a promised production improvement. The SFO guide's LCP is effectively unchanged.

## Change and verification

The original responsive candidates jumped from 400 px to 800 px. Lighthouse found that the SFO image displayed at 376 CSS pixels, about **658 device pixels** in this mobile setup, selected an 800 px image and reported approximately **21 KiB** of avoidable image data.

`src/lib/photos.ts` now also generates a **680 px WebP candidate**. It retains every previous candidate, image quality setting, original photo, author and license. The browser selects the closer candidate when appropriate. The change adds five static image variants to the build; it adds no client code or third-party service.

- Homepage transfer decreased by **47,507 bytes (15.9%)**; SFO guide transfer decreased by **15,685 bytes (18.9%)** in the matched runs.
- The SFO image-delivery audit changed from **21,819 estimated wasted bytes** to **0 reported wasted bytes**. This is the audit's estimate, distinct from measured transfer savings.
- Visible text hashes match before and after on both pages. The four existing photo provenance, original SHA-256, license and validation tests pass.
- Search hydration, `Photo.astro`, layout and CSS were left unchanged. The roughly 150 ms CSS render-blocking hint is recorded in the reports; it does not justify a CSS loading rewrite for this already small stylesheet in this change.

## Evidence and reproduction

Local evidence is retained under the ignored `artifacts/mobile-performance-2026-10-21/` directory:

- `baseline/summary.json` and `after/summary.json`: all runs, settings, medians, warnings and resource totals.
- `comparison.json`: transfer changes, image audit results and matching visible-text hashes.
- Each `home-{1,2,3}` and `sfo-guide-{1,2,3}` has a `.report.json`, `.report.html`, trace and network log in its stage directory. Mobile screenshots are also retained there.

To create an isolated preview without replacing the normal build output, create `artifacts/mobile-performance-preview/astro.config.mjs` with:

```js
import config from '../../astro.config.mjs';
import {fileURLToPath} from 'node:url';
export default {
  ...config,
  root:fileURLToPath(new URL('../../',import.meta.url)),
  outDir:fileURLToPath(new URL('./dist/',import.meta.url)),
  cacheDir:fileURLToPath(new URL('./cache/',import.meta.url)),
};
```

Build and start it in one terminal:

```sh
ASTRO_TELEMETRY_DISABLED=1 DEPLOYMENT_ENV=production \
SITE_INDEXING_ENABLED=true CONTENT_REVIEW_PREVIEW=false \
PUBLIC_SITE_URL=https://www.cedartrips.com \
PUBLIC_GA_MEASUREMENT_ID=G-QDDLYW7WRF ADSENSE_READY=false \
node node_modules/astro/bin/astro.mjs build \
  --config artifacts/mobile-performance-preview/astro.config.mjs

ASTRO_TELEMETRY_DISABLED=1 node node_modules/astro/bin/astro.mjs preview \
  --config artifacts/mobile-performance-preview/astro.config.mjs \
  --host 127.0.0.1 --port 4549 --ignore-lock
```

With that local production preview running, repeat the same six measurements in a second terminal:

```sh
CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
npm_config_cache=/private/tmp/cedar-lighthouse-npm \
node scripts/measure-mobile-performance.mjs \
  --base-url http://127.0.0.1:4549/ \
  --output-dir artifacts/mobile-performance-repeat \
  --runs 3
```

The script uses pinned `lighthouse@13.5.0` through `npm exec` by default. `--lighthouse-cli /absolute/path/to/lighthouse/cli/index.js` can reuse an existing installation; the returned version is checked. It accepts only localhost HTTP preview URLs, creates JSON/HTML/trace outputs, and rejects incomplete runs. To reproduce the exact isolated local build, the retained stage configs extend the normal Astro config and set their own `root`, `outDir` and `cacheDir`; both stages use the production environment listed above.

Repeat after substantial image, JavaScript or advertising changes. Review real-user LCP, CLS and INP in Search Console when enough actual visits are available; the lab results do not replace that check.
