# Data sources

allMeteo uses only public services that need **no API key and no account**. All of them
are called directly from the browser, so every host must allow cross-origin requests
(CORS) and must be listed in the Content Security Policy (`vite.config.ts`).

| Service | Used for | Module | CSP directive |
|---|---|---|---|
| [Open-Meteo Forecast](https://open-meteo.com/en/docs) | Global and regional weather models | `src/api/openMeteo.ts` | `connect-src` |
| [MET Norway Locationforecast](https://api.met.no/weatherapi/locationforecast/2.0/documentation) | Independent forecast source | `src/api/metNorway.ts` | `connect-src` |
| [Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api) | AQI, pollutants, pollen (CAMS) | `src/api/airQuality.ts` | `connect-src` |
| [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) | City search | `src/api/geocoding.ts` | `connect-src` |
| [BigDataCloud](https://www.bigdatacloud.com/free-api/free-reverse-geocode-to-city-api) | Name of the place found by GPS | `src/api/geocoding.ts` | `connect-src` |
| [RainViewer](https://www.rainviewer.com/api.html) | Radar frame list and radar tiles | `src/api/rainviewer.ts` | `connect-src` + `img-src` |
| [Esri Gray Canvas](https://www.arcgis.com/home/item.html?id=358ec1e175ea41c3bf5c68f0da11ae2b) | Basemap and labels (dark and light) | `src/components/RadarMap.tsx` | `img-src` |

Every service is also checked once a day by `scripts/check-upstreams.mjs`
(see [CI & security](ci-and-security.md#daily-upstream-check)).

---

## Open-Meteo Forecast

### Global models

| Id | Name | Open-Meteo model |
|---|---|---|
| `ecmwf` | ECMWF | `ecmwf_ifs025` |
| `icon` | ICON (DWD) | `icon_seamless` |
| `gfs` | GFS (NOAA) | `gfs_seamless` |

All three come from **one** request with `&models=ecmwf_ifs025,icon_seamless,gfs_seamless`.
With several models Open-Meteo suffixes every variable with the model name
(`temperature_2m_ecmwf_ifs025`); the parser's `col()` helper reads both the suffixed and
the plain key, so the same parser works for single- and multi-model responses.

A model with no temperature at all in the response is dropped by `parseGlobalModels` and
reported individually as failed. If the whole request fails, a single
"Modelli globali" entry is reported instead.

### Regional high-resolution models

| Id | Name | Coverage | Open-Meteo model |
|---|---|---|---|
| `icon_2i` | ICON-2I | Italy | `italia_meteo_arpae_icon_2i` |
| `icon_ch2` | ICON-CH2 (MeteoSwiss) | Switzerland / Alps | `meteoswiss_icon_ch2` |
| `icon_d2` | ICON-D2 (DWD) | Central Europe | `icon_d2` |
| `arome` | AROME (Météo-France) | France | `meteofrance_arome_france_hd` |
| `ukv` | UKV (Met Office) | United Kingdom | `ukmo_uk_deterministic_2km` |
| `hrrr` | HRRR (NOAA) | Continental USA | `ncep_hrrr_conus` |
| `hrdps` | HRDPS | Canada | `gem_hrdps_continental` |
| `msm` | MSM (JMA) | Japan | `jma_msm` |

They are requested all together for every location. Open-Meteo omits the ones that do not
cover the point, or returns them full of `null` (AROME near the edge of its domain).
`parseLocalModels` therefore:

- keeps only the models with at least one hourly temperature;
- drops the hours beyond the model's horizon (2–5 days, depending on the model);
- drops the days only partially covered, so the consensus uses the global models there.

Regional models are flagged `local: true` and count **double** in the consensus.

### Request

```
https://api.open-meteo.com/v1/forecast
  ?latitude=…&longitude=…
  &hourly=temperature_2m,apparent_temperature,precipitation,precipitation_probability,
          wind_speed_10m,wind_gusts_10m,wind_direction_10m,relative_humidity_2m,
          surface_pressure,uv_index,weather_code
  &daily=temperature_2m_min,temperature_2m_max,precipitation_sum,
         precipitation_probability_max,wind_speed_10m_max,weather_code,sunrise,sunset
  &models=…&forecast_days=7&timezone=auto&timeformat=unixtime&wind_speed_unit=kmh
```

### Normalisation notes

- Hourly timestamps are unix seconds → converted to ISO UTC.
- **Daily timestamps are local midnight** expressed as unix seconds. Converted naively to
  UTC they would fall on the previous day for any location east of Greenwich, so the
  parser adds `utc_offset_seconds` before taking the date.
- `sunrise`/`sunset` are converted to ISO UTC.

---

## MET Norway

`GET https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=…&lon=…`
(coordinates rounded to 4 decimals, as MET Norway's terms require).

| MET Norway field | Normalised field | Conversion |
|---|---|---|
| `air_temperature` | `temperature` | — |
| `relative_humidity` | `humidity` | — |
| `wind_speed`, `wind_speed_of_gust` | `windSpeed`, `windGusts` | m/s × 3.6 → km/h |
| `wind_from_direction` | `windDirection` | — |
| `air_pressure_at_sea_level` | `pressure` | — |
| `ultraviolet_index_clear_sky` | `uvIndex` | — |
| `next_1_hours.details.precipitation_amount` | `precipitation` | — |
| `next_1_hours.summary.symbol_code` | `weatherCode` | symbol → WMO code table |

MET Norway has no apparent temperature, no precipitation probability and no daily block:
those fields stay `null` and the consensus simply uses the other sources for them.
Symbol codes lose their `_day` / `_night` / `_polartwilight` suffix and are mapped to the
closest WMO code (`SYMBOL_TO_WMO` in `metNorway.ts`). Malformed entries (missing `data`,
invalid time) are skipped instead of breaking the whole source.

---

## Open-Meteo Air Quality

```
https://air-quality-api.open-meteo.com/v1/air-quality?latitude=…&longitude=…
  &current=european_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,
           alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen
  &hourly=european_aqi&forecast_days=2&timeformat=unixtime
```

Data comes from the Copernicus Atmosphere Monitoring Service (CAMS). Pollen is only
modelled in Europe and only during the pollen season: elsewhere the values are `null`,
and pollen below 1 grain/m³ is hidden. The 24-hour AQI peak is computed from the hourly
series, from one hour ago to 24 hours ahead. See [features.md](features.md#air-quality-and-pollen)
for the bands.

---

## Geocoding

- **Search**: `geocoding-api.open-meteo.com/v1/search?name=…&count=6&language=it`,
  debounced by 300 ms, from 2 characters.
- **Reverse** (GPS): `api.bigdatacloud.net/data/reverse-geocode-client?latitude=…&longitude=…&localityLanguage=it`.
  If it fails, the location is still used and named "Posizione attuale".

---

## Radar: RainViewer

1. `GET https://api.rainviewer.com/public/weather-maps.json` returns a tile `host` and
   the list of radar frames (`radar.past`, about 2 hours, one every 10 minutes).
2. Each frame is a Leaflet tile layer:
   `{host}{path}/256/{z}/{x}/{y}/2/1_1.png` (colour scheme 2, smoothed, with snow).

Current limitations of the free API, handled by the app:

- **Tiles exist only up to zoom 7.** Beyond that RainViewer returns a
  "Zoom Level Not Supported" image, so the layers use `maxNativeZoom: 7` and Leaflet
  upscales the zoom-7 tiles.
- **No nowcast.** `radar.nowcast` is now always empty; the timeline end label shows
  "ora" instead of "+30min" when there are no forecast frames.

The frame list is refreshed every 10 minutes while the page is visible, and the header
shows the age of the latest frame (amber after 30 minutes).

## Basemap: Esri Gray Canvas

```
https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_{Dark|Light}_Gray_{Base|Reference}/MapServer/tile/{z}/{y}/{x}
```

Note the `{y}/{x}` order (ArcGIS), the opposite of OSM-style URLs. The `Reference` layer
(labels) is drawn in a separate Leaflet pane above the radar, so city names stay readable
over the rain. The app used CARTO basemaps until October 2026, when CARTO started
requiring an API key (see [troubleshooting](troubleshooting.md#the-map-shows-api-key-required)).
