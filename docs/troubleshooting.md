# Troubleshooting

## The map shows "API KEY REQUIRED"

**Cause:** the basemap provider started requiring a key. This happened with CARTO in
October 2026: its tiles kept answering `200 OK`, but with a placeholder image.

**Fix:** switch to another key-less tile service (the app now uses Esri Gray Canvas), and
update `img-src` in the CSP and the `map-tiles` cache pattern in `vite.config.ts`. The daily
[upstream check](ci-and-security.md#daily-upstream-check) is designed to catch this kind of
change.

## The radar shows "Zoom Level Not Supported" tiles

RainViewer's free API serves radar tiles only up to zoom 7. The radar layers must keep
`maxNativeZoom: 7` (`RadarMap.tsx`) so Leaflet upscales the zoom-7 tiles instead of
requesting unsupported ones.

## The radar is "non disponibile" or "in ritardo"

- **non disponibile**: the RainViewer frame list could not be loaded at all. Check
  `https://api.rainviewer.com/public/weather-maps.json` in a browser.
- **ultimo dato … (in ritardo)**, shown in amber: the newest frame is more than 30 minutes
  old. This is a delay on RainViewer's side; the app refreshes the list every 10 minutes.

## Something works with `npm run dev` but not on the live site

Almost always the **Content Security Policy**: it is injected only in production builds.
Open the browser console on the live site and look for "Refused to connect" or
"Refused to load the image". Add the host to `connect-src` or `img-src` in `vite.config.ts`.
Reproduce locally with:

```bash
npm run build && npm run preview
```

## The 7-day list starts from yesterday

This was a bug fixed in October 2026: Open-Meteo returns daily timestamps as local midnight
in unix time, and converting them straight to UTC moved every day back by one east of
Greenwich. `parseOpenMeteo` now applies `utc_offset_seconds`. If it comes back, check that
code and the test "la mezzanotte locale (UTC+1) resta sul giorno giusto".

## A source is always "errore · non disponibile"

- **Modelli globali** / a single global model: Open-Meteo did not answer, or answered without
  that model's data. Usually temporary.
- **Modelli locali**: the regional multi-model request failed. Note that a regional model
  that does not cover the location is **not** an error: it simply does not appear.
- **MET Norway**: MET Norway may throttle heavy traffic from one origin. Usually temporary.

The forecast keeps working with the remaining sources.

## The app does not install or work offline

- The site must be served over **HTTPS** (or `localhost`). From a LAN IP over plain HTTP the
  service worker is disabled by the browser. See [deployment.md](deployment.md#docker-on-your-lan).
- On Android/Chrome use **⋮ → Installa app**. If you only see "Aggiungi a schermata Home",
  open the site once, wait a few seconds for the service worker to activate, and try again.
- After a deploy, the new version is activated automatically on the next load. To force it,
  close all the app's tabs/windows and reopen.

## Old data after a fix is deployed

The app shows the last saved forecast for up to 12 hours while new data loads, and the
service worker serves API responses stale-while-revalidate. A reload, or waiting for the
background refresh (every 15 minutes), brings fresh data. To start from scratch, clear the
site data in the browser settings.

## CI fails on Bearer after editing a script

New `console.log` calls in Node scripts trigger Bearer's "logger leak" rule. If the output is
harmless, add the fingerprint from the CI log to `bearer.ignore` with a comment (see
[ci-and-security.md](ci-and-security.md#handling-findings)). Note that moving or editing the
flagged line can change its fingerprint.

## The upstream check failed with "fetch failed"

A network error from the GitHub runner. The script already retries once; if it keeps failing,
open the service URL from your own machine. If it works there, re-run the workflow; if not,
the service really changed or is down.
