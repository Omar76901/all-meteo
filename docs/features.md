# Features

A tour of what the user sees, with the exact rules behind each panel. The interface is in
Italian; the labels below are quoted as they appear.

## Header

| Control | Behaviour |
|---|---|
| **Cerca città…** | City search (Open-Meteo geocoding), from 2 characters, 300 ms debounce, up to 6 results |
| 📍 | Uses the browser's geolocation, rounded to ~1 km for privacy, then reverse-geocodes the name (falls back to "Posizione attuale") |
| °C / °F | Cycles the temperature unit |
| km/h → m/s → nodi → mph | Cycles the wind unit |
| 🌙 / ☀️ / 🌓 | Cycles dark, light and follow-system theme |
| ☆ / ⭐ | Adds or removes the current city from favourites; favourites appear as chips below |

Units and theme are saved on the device. Data is always kept in °C and km/h and only
converted for display, so changing units never changes alerts or the consensus.

## Shareable links

The current city is always written in the address bar:

```
https://omar76901.github.io/all-meteo/?lat=45.6983&lon=9.6773&name=Bergamo
```

Opening such a link shows that city, ahead of the last city used on that device. The URL
is updated with `history.replaceState`, so switching city does not fill the back-button
history. Invalid coordinates (non-numeric, |lat| > 90, |lon| > 180) are ignored.

## Instant start

The last successful forecast is saved together with its city. When you open the app (or
come back to that city) within 12 hours, it is rendered immediately while the fresh data
loads; the footer "aggiornato alle HH:MM" tells how old it is. If the refresh fails the
saved data stays on screen with the notice "Aggiornamento non riuscito · dati precedenti
mostrati".

## Current conditions

The big card shows the consensus for the current hour: temperature, sky, apparent
temperature, today's min/max, humidity, precipitation probability, wind, gusts, pressure
and UV index.

Two badges on the right:

- **accordo alto / medio / basso ±x°**: the agreement index and the current uncertainty
  (see [consensus.md](consensus.md#5-agreement-index));
- **n/m fonti**: how many sources answered out of those requested.

## Weather alerts

Alerts are **derived from the consensus over the next 48 hours**. They are not official
warnings, and the banner says so ("stima dal consenso delle fonti"). Thresholds
(`src/domain/alerts.ts`):

| Alert | 🟡 Yellow | 🟠 Orange | 🔴 Red |
|---|---|---|---|
| 🥵 Caldo intenso (heat) | ≥ 35 °C | ≥ 37 °C | ≥ 40 °C |
| 🥶 Gelo (frost) | ≤ −5 °C | ≤ −10 °C | ≤ −15 °C |
| 💨 Vento forte (wind) | ≥ 50 km/h | ≥ 70 km/h | ≥ 90 km/h |
| 🌬️ Raffiche violente (gusts) | ≥ 70 km/h | ≥ 90 km/h | ≥ 110 km/h |
| 🌧️ Pioggia intensa (rain rate) | ≥ 6 mm/h | ≥ 15 mm/h | ≥ 30 mm/h |
| 🔆 UV molto alto | ≥ 8 | ≥ 10 | ≥ 11 |
| ⛈️ Temporali | WMO 95 | WMO 96, 99 (hail) | — |
| ❄️ Neve | WMO 71, 73, 77, 85 | WMO 75, 86 | — |

Each alert shows the peak value and when it happens, in the selected units. Alerts are
sorted red → orange → yellow.

## Next 24 hours and 7 days

- **Prossime 24 ore**: a horizontal strip with icon, temperature and precipitation
  probability for each hour; the current hour is highlighted.
- **Prossimi 7 giorni**: one row per day with icon, precipitation probability, min and
  max. Tapping a row expands description, precipitation total, max wind, sunrise and
  sunset.

## Charts (48 hours)

| Chart | Content |
|---|---|
| Temperatura | Consensus line + shaded band between the coldest and warmest source: a wide band means low agreement |
| Precipitazioni | Bars in mm/h + precipitation probability line (right axis) |
| Vento | Speed (solid) and gusts (dashed) in the selected unit; arrows every 3 hours show where the wind blows towards |
| Pressione · Umidità · UV | Three compact sparkline charts |

Charts follow the selected units and theme.

## Air quality and pollen

From the Copernicus (CAMS) model via Open-Meteo. The headline is the **European Air
Quality Index (EAQI)** with the EEA bands:

| EAQI | Label |
|---|---|
| 0–20 | buona (good) |
| 20–40 | discreta (fair) |
| 40–60 | moderata (moderate) |
| 60–80 | scadente (poor) |
| 80–100 | molto scadente (very poor) |
| > 100 | pessima (extremely poor) |

When the next 24 hours get worse than now, the peak is shown next to it. Below: PM2.5,
PM10, ozone and NO₂ in µg/m³.

Pollen chips (alder, birch, grasses, mugwort, olive, ragweed) appear only when present
(≥ 1 grain/m³), sorted from the highest. Levels use indicative thresholds common to all
types: basso < 10, medio < 50, alto ≥ 50 grains/m³. Pollen is modelled only in Europe
and in season, so outside that the section disappears. If the service is unreachable
the whole panel hides itself.

## Radar

An animated precipitation radar centred on the city (RainViewer):

- about 2 hours of observed frames, one every 10 minutes, playing in a loop;
- ⏸ / ▶ to pause, a slider to scrub through the frames;
- ⛶ or a tap on the map for full screen;
- the header shows the time of the displayed frame and the age of the latest one
  ("ultimo dato 9 min fa"), in amber when it is more than 30 minutes old;
- frames are refreshed every 10 minutes while the page is visible;
- city labels are drawn above the radar so they stay readable.

## Source comparison

A table with, for every source, its status and its current temperature, precipitation and
wind, with one decimal so the differences are visible. Regional models carry a **locale**
badge (they weigh double). Failed sources are listed as "errore · non disponibile", and
the last row is the consensus.

## Dynamic background

The page background changes with the weather (clear, cloudy, fog, rain, snow, storm) and
the phase of the day (dawn and dusk within 45 minutes of sunrise/sunset, day, night),
computed from the location's sunrise and sunset. In the light theme the same gradient is
kept under a light veil.

## Installable app (PWA)

On Android (Chrome) use **⋮ → Installa app / Aggiungi a schermata Home**; on iOS
(Safari) use **Condividi → Aggiungi alla schermata Home**. The app then opens full
screen, works offline with the last data and updates itself in the background.
