# CI & security

## The CI pipeline

`.github/workflows/ci.yml` runs on every pull request, on every push to `master` and on
demand. It has three stages; each starts only if the previous one is green.

| Stage | Job | What it checks |
|---|---|---|
| 1. Security | **gitleaks** | Secrets anywhere in the **full git history** (`fetch-depth: 0`) |
| | **Trivy** (`fs` scan) | Vulnerable dependencies, secrets and misconfigurations (Dockerfile, workflows); fails on fixable HIGH/CRITICAL |
| | **Bearer** | Static analysis of the source code (data leaks, injection, unsafe patterns) |
| 2. Test & build | `npm ci` | Install from the lockfile only |
| | `npm audit --audit-level=high` | Known vulnerabilities in dependencies |
| | `npx tsc -b` | Type check |
| | `npm test` | Full Vitest suite |
| | `npm run build -- --base=/all-meteo/` | The exact production build |
| 3. Deploy | `deploy-pages` | Only on `master`; publishes the artifact built in stage 2 |

Hardening of the workflow itself:

- `permissions: contents: read` at the top level; only the deploy job gets
  `pages: write` and `id-token: write`.
- **Every action is pinned to a commit SHA**, not a tag (tags can be moved), with the
  version in a comment; Dependabot updates both. The tool versions (gitleaks, Trivy,
  Bearer) are pinned too.
- Every checkout uses `persist-credentials: false`, so the `GITHUB_TOKEN` is not left in
  `.git/config` while `npm ci` and the scanners run.
- On pull requests only the latest push runs (`cancel-in-progress`); on `master` every
  commit runs to the end.

## Daily upstream check

`.github/workflows/upstream-check.yml` runs `scripts/check-upstreams.mjs` every day at
06:17 UTC (and on demand from the Actions tab). If a check fails, the workflow fails and
GitHub sends an email to the repository owner.

| Check | Passes when |
|---|---|
| Open-Meteo forecast | The multi-model request returns temperatures for ECMWF, ICON and GFS |
| Open-Meteo geocoding | Searching "Milano" returns a result |
| Open-Meteo air quality | A current European AQI is returned |
| MET Norway | The timeseries is not empty |
| BigDataCloud | A locality name is returned |
| RainViewer | Frames exist, the latest is less than 1 hour old, and two different zoom-7 tiles differ |
| Esri basemap | Two different tiles differ, for both the base and the label layer |

**Why compare two tiles?** Tile services rarely fail with an HTTP error. When CARTO started
requiring an API key it kept answering `200 OK` with a valid PNG that read
"API KEY REQUIRED", and RainViewer does the same with "Zoom Level Not Supported". A
placeholder is the same image for every tile, so two different tiles with identical bytes
reveal it. This check would have caught the CARTO outage on the first day.

Each check is retried once after 10 seconds, so a single network glitch of the runner does
not send a false alarm. To run it locally:

```bash
node scripts/check-upstreams.mjs
```

## Dependabot

`.github/dependabot.yml` checks npm packages and GitHub Actions **every Monday at 07:00
(Europe/Rome)**. Minor and patch npm updates are grouped into one PR (`minor-e-patch`) to
reduce noise; major updates get their own PR. Every Dependabot PR runs the full pipeline
before it can be merged.

## Security measures in the app

| Measure | Where |
|---|---|
| Strict Content Security Policy, no third-party scripts, no runtime CDN | `vite.config.ts` → see [deployment.md](deployment.md#content-security-policy) |
| React escapes all rendered text; no `innerHTML`, `eval` or `dangerouslySetInnerHTML` anywhere | `src/` |
| No secrets: every API used is public and key-less | — |
| No backend, no cookies, no accounts; all user data stays in the browser's `localStorage` | `src/state/` |
| Coordinates are sent only to the weather/geocoding services that need them | `src/api/` |
| **GPS position rounded to ~1 km** (2 decimals) before it is sent anywhere or written in the URL | `Header.tsx` |
| **Referrer policy** `strict-origin-when-cross-origin`: third parties never see the URL with the city | `index.html` |
| **Shareable links are untrusted input**: coordinates validated (numeric, in range); the name stripped of control and bidi-override characters and capped at 60 characters | `src/state/urlCity.ts` |
| **Stored data is validated on read** (favourites, last city, snapshot), so tampered storage cannot crash the page | `src/state/settings.ts` |
| **Radar responses are validated**: tile host must be `tilecache.rainviewer.com`, frame paths must match `/v2/radar/<id>` | `src/api/rainviewer.ts` |
| **Anti-clickjacking**: inside any iframe the app does not start and only shows a link that opens it in a new tab (GitHub Pages cannot send `frame-ancestors`) | `src/main.tsx` |
| Security headers on Docker/nginx: `frame-ancestors 'none'`, `X-Frame-Options`, `nosniff`, referrer policy, COOP, Permissions-Policy (geolocation only), `server_tokens off` | `nginx-security-headers.conf` |
| Exact dependency versions + committed lockfile + `npm ci` | `.npmrc`, `package-lock.json` |
| Non-root nginx image for Docker | `Dockerfile` |
| Request timeout (8 s) on every API call | `src/api/http.ts` |

### Known limits

- **GitHub Pages does not allow custom HTTP headers.** HSTS is provided by GitHub, but
  `frame-ancestors`, `Permissions-Policy` and `X-Content-Type-Options` cannot be set. The
  CSP is delivered as a `<meta>` tag and clickjacking is handled in JavaScript. Hosting on
  a platform with configurable headers (or the Docker setup) closes this gap.
- **Shared origin.** Every GitHub Pages project of the same account is served from
  `omar76901.github.io`, so they share `localStorage`. Only publish trusted projects there,
  or use a custom domain for allMeteo.
- **`style-src 'unsafe-inline'`** is needed for inline styles (dynamic background, Leaflet,
  Recharts). Scripts remain strictly `'self'`.

## Handling findings

- **A real vulnerability in a dependency**: update it (`npm audit fix` or a Dependabot PR).
  Moderate/low findings do not block CI but should still be fixed when an update exists.
- **A Bearer false positive**: add its fingerprint to `bearer.ignore` with
  `"false_positive": true` and a comment explaining why it is safe. The fingerprint is
  printed in the CI log (`To ignore this finding, run: bearer ignore add <fingerprint>`).
  Existing entries cover `console.log` in the two Node scripts, which only print file
  paths, service names and HTTP errors.
- **A leaked secret flagged by gitleaks**: revoke the secret first, then clean the history.
