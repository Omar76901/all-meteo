# Development guide

## Requirements

- **Node.js 24** (the version used by CI and the Docker image)
- npm (comes with Node)

No API keys, no `.env` file, no backend to start.

## Getting started

```bash
git clone https://github.com/Omar76901/all-meteo.git
cd all-meteo
npm ci          # install the exact locked versions
npm run dev     # http://localhost:5173 with hot reload
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server with hot module replacement. The CSP is **not** injected in dev (it would block Vite's websocket). |
| `npm test` | Runs the whole Vitest suite once (jsdom environment) |
| `npx vitest` | Vitest in watch mode |
| `npx tsc -b` | Type-check the app and the Node config |
| `npm run build` | Type-check, then production build into `dist/` (with CSP, service worker and manifest) |
| `npm run build -- --base=/all-meteo/` | Same build with the GitHub Pages base path, exactly as CI does |
| `npm run preview` | Serves `dist/` locally, to try the production build and the service worker |
| `npm run icons` | Regenerates all PNG icons and `favicon.ico` from `public/icon.svg` and `public/favicon.svg` |
| `node scripts/check-upstreams.mjs` | Checks that every external service still answers as expected |

## Project structure

```
all-meteo/
├── .github/
│   ├── workflows/ci.yml              # security → test/build → deploy to Pages
│   ├── workflows/upstream-check.yml  # daily check of external services
│   └── dependabot.yml
├── docs/                             # this documentation
├── public/                           # icons, favicon, copied as-is into dist/
├── scripts/
│   ├── generate-icons.mjs            # PNG/ICO icons from the SVG sources
│   └── check-upstreams.mjs           # external service health check
├── src/
│   ├── api/                          # one client per external service
│   │   ├── __fixtures__/             # recorded API responses used by tests
│   │   ├── http.ts                   # fetchJson with timeout and error messages
│   │   ├── openMeteo.ts              # global + regional models, parsers
│   │   ├── metNorway.ts              # MET Norway + symbol → WMO mapping
│   │   ├── airQuality.ts             # AQI, pollutants, pollen, level bands
│   │   ├── geocoding.ts              # search and reverse geocoding
│   │   ├── rainviewer.ts             # radar frames, age and span helpers
│   │   └── sources.ts                # runs all forecast sources in parallel
│   ├── domain/                       # pure logic, no React, no network
│   │   ├── types.ts                  # City, HourlyPoint, DailyPoint, SourceForecast
│   │   ├── consensus.ts              # weighted median/mode/circular mean
│   │   ├── alerts.ts                 # alerts from the consensus
│   │   ├── units.ts                  # °C/°F, km/h/m/s/kn/mph conversions
│   │   ├── weatherCodes.ts           # WMO code → description, icon, category
│   │   ├── background.ts             # gradient by weather and day phase
│   │   └── timeUtils.ts              # current hour, Italian date/time formatting
│   ├── state/
│   │   ├── useWeather.ts             # loading, snapshot, refresh, stale-response guard
│   │   ├── settings.ts               # favourites, last city, snapshot (localStorage)
│   │   ├── units.tsx                 # UnitsProvider / useUnits
│   │   ├── theme.tsx                 # ThemeProvider / useTheme
│   │   └── urlCity.ts                # ?lat=&lon=&name= in the address bar
│   ├── components/                   # one panel per file
│   ├── App.tsx                       # page layout and wiring
│   ├── main.tsx                      # providers + React root
│   └── index.css                     # Tailwind, panels, light theme palette
├── index.html
├── vite.config.ts                    # plugins, CSP, PWA manifest, Workbox caching
├── Dockerfile, docker-compose.yml, nginx.conf
└── bearer.ignore                     # reviewed Bearer false positives
```

## Tech stack

| Area | Choice |
|---|---|
| UI | React 19 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) |
| Charts | Recharts |
| Map | Leaflet |
| PWA | vite-plugin-pwa (Workbox) |
| Tests | Vitest + Testing Library + jsdom |

## Testing

```bash
npm test
```

The suite covers parsers, consensus, alerts, units, settings, the weather hook and the
main components. Conventions:

- **Parsers are tested against recorded responses** in `src/api/__fixtures__/`, never
  against the live APIs. When an API changes shape, add a fixture that reproduces it.
- **Domain logic is tested with plain data**: build a few `HourlyPoint`s, call the
  function, check the result.
- **Hooks** are tested with `renderHook` and a mocked `fetchAllSources`; timers with
  `vi.useFakeTimers()`.
- **Components** are rendered with Testing Library; heavy children (charts, map) are
  mocked in `App.test.tsx`.
- Tests that touch `localStorage` clear it in `beforeEach`.

The live services are covered separately by `scripts/check-upstreams.mjs`, which runs
every day in CI.

## Conventions

- **Italian UI and code comments, English commit messages.** Identifiers are in English.
- **Exact dependency versions.** `.npmrc` sets `save-exact=true`; the lockfile is
  committed and CI installs with `npm ci`. Dependabot proposes updates weekly.
- **Conventional commits**: `feat:`, `fix:`, `perf:`, `ci:`, `chore(deps):`, `docs:`, `test:`,
  optionally with a scope (`fix(radar): …`).
- **Normalise at the edge.** API modules convert everything into the shared types; nothing
  outside `src/api/` knows about a provider's field names.
- **`null` means "no data".** Never replace a missing value with `0`.
- **Fail soft.** One failing source, a missing panel or unavailable storage must never
  break the rest of the page.

## How to…

### Add a regional model

1. Add an entry to `LOCAL_MODELS` in `src/api/openMeteo.ts` with the Open-Meteo model name
   (see the [Open-Meteo docs](https://open-meteo.com/en/docs)).
2. That's it: it is requested together with the others, dropped where it does not cover
   the point, weighted double, and labelled in the source table via `SOURCE_LABELS`.
3. Update the table in [data-sources.md](data-sources.md#regional-high-resolution-models)
   and the README.

### Add a new forecast provider

1. Create `src/api/<provider>.ts` with a `parse<Provider>(data: unknown): SourceForecast`
   and a `fetch<Provider>(lat, lon)`.
2. Add a fixture and tests for the parser.
3. Add a task to `fetchAllSources` in `src/api/sources.ts`.
4. Add the host to `connect-src` in the CSP and to the `weather-api` runtime cache pattern
   in `vite.config.ts`.
5. Add a check to `scripts/check-upstreams.mjs`.

### Add a new external host of any kind

Any new domain must be allowed by the Content Security Policy in `vite.config.ts`
(`connect-src` for `fetch`, `img-src` for images and tiles), otherwise the production build
blocks it while `npm run dev` (no CSP) works. Always test with `npm run build && npm run preview`.

### Change an alert threshold

Edit the `grade(value, yellow, orange, red)` call in `src/domain/alerts.ts`, update
`alerts.test.ts` and the table in [features.md](features.md#weather-alerts). Thresholds
are always in °C, km/h and mm/h.
