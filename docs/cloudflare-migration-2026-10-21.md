# Cloudflare migration acceptance — 2026-10-21

The owner approved Workers Static Assets with Workers Builds, deployment and preview acceptance before production DNS binding, and immediate retirement of this site's Vercel project after production acceptance. The canonical origin remains `https://www.cedartrips.com`; content, approvals, source baselines and the rolling release cap are outside this migration.

## Prepared configuration

- Worker `cedar-trips`, static `dist`, directory HTML routes, `404-page`, no Worker script or runtime binding.
- Wrangler pinned to `4.151.3`; independent Worker Previews configured, production `workers.dev` and Version URLs disabled. No formal custom domain is in the initial configuration.
- Node 24; Workers Builds command `npm ci && npm run build:cloudflare`, with `SKIP_DEPENDENCY_INSTALL=1`. Main deploys with `npx wrangler deploy`; other branches use `npx wrangler preview`.
- Build-time public settings: canonical www origin, existing GA measurement ID `G-QDDLYW7WRF`, explicit production indexing, advertising off. The wrapper uses actual Cloudflare branch metadata to force preview noindex and remove GA/advertising even when shared settings contain production values.
- Editorial App and model credentials remain in GitHub; no key was copied to Cloudflare or the repository.

## Local validation

The full production `npm run verify` passed: all automated tests, Astro checks (59 files, zero errors/warnings/hints), five-article content validation and fourteen-page static-output verification. Actual isolated production and preview builds cover consent/analytics, preview review copies, hidden-review previews, erroneous preview indexing/advertising settings and true draft exclusion.

`wrangler deploy --dry-run` passed with the pinned CLI: 72 static assets discovered and no bindings. The command used task-specific temporary configuration/log directories, sent no telemetry, and performed no upload or deployment. This is configuration evidence, not proof of a remote deployment.

## External state and remaining acceptance

Cloudflare's domain overview reports the domain is protected and uses full DNS setup. Its DNS list currently contains only the retained Google verification TXT; no apex/www web record was added by this migration. Cached NS and SOA responses differed during planning, so production binding requires an active zone and a valid certificate rather than inference from one resolver.

The official Cloudflare Workers and Pages GitHub App installation form is prepared with **Only select repositories → `jageros/travel`**. Its fixed permission request includes Metadata read and Administration/Code/Checks/Deployments/Pull requests write. Installation awaits the owner's specific security-access confirmation. No installation, Cloudflare project creation, production DNS change or Vercel deletion is claimed here.

After a real preview passes, bind www and configure the apex 308 redirect preserving path/query. Confirm three published guides return 200, two review URLs and unknown paths return 404, the sitemap has nine canonical URLs, robots allows production crawling, preview remains noindex, GA receives consented events, Search Console verification survives, and an editorial monitor PR reaches a Cloudflare production deployment at its exact merged SHA.

Only after those checks, delete the travel Vercel project and project bindings, remove transitional Vercel code/configuration, and record the Cloudflare deployment/version and Git SHA. Do not uninstall account-wide integrations shared by unrelated projects. Future rollback uses Cloudflare; old static versions must not restore unsafe source facts or roll back the editorial ledger. If source state differs, rebuild the chosen code with current content and provenance instead.
