# Consensus algorithm

Weather models disagree, and no single model is always right. allMeteo does not pick one:
it merges every available source into a **consensus forecast** and tells you how much the
sources agree. The implementation is in `src/domain/consensus.ts` and is fully unit-tested
in `consensus.test.ts`.

## 1. Weights

| Source | Weight |
|---|---|
| Global models (ECMWF, ICON, GFS) and MET Norway | 1 |
| Regional high-resolution models (ICON-2I, AROME, HRRR, …) | **2** (`LOCAL_WEIGHT`) |

Regional models run at 1–3 km instead of 9–25 km and resolve terrain, coasts and
convection much better, so where they cover the location they should prevail. They are
not given absolute priority: the global models still take part and dampen a regional
model that goes off on its own.

Regional models only cover their first 2–5 days (hours beyond the horizon are removed by
the parser), so from day 3–5 onwards the consensus is made by the global models alone.

## 2. Hourly merge

All hourly points of all sources are grouped by their exact UTC timestamp. For each hour:

| Field | Method | Why |
|---|---|---|
| temperature, apparent temperature, precipitation, precipitation probability, wind speed, gusts, humidity, pressure, UV | **weighted median** | robust to one outlier model, unlike the mean |
| wind direction | **weighted circular mean** | the mean of 350° and 10° must be 0°, not 180° |
| weather code (WMO) | **weighted mode**; on a tie the higher code wins | the most "voted" sky; on a tie, the more severe condition |

`null` values are ignored, so a source that lacks a field (e.g. MET Norway has no
precipitation probability) simply does not vote on it.

### Weighted median

Values are sorted; the median is the value at which the cumulative weight reaches half
of the total. When the cumulative weight is exactly half, the two central values are
averaged, so with equal weights it is the classic median.

Example, one hour with four sources:

| Source | Temperature | Weight |
|---|---|---|
| GFS | 11.0 °C | 1 |
| ECMWF | 12.6 °C | 1 |
| ICON-2I | 12.8 °C | 2 |
| ICON | 13.0 °C | 1 |

Total weight 5, half = 2.5. Cumulative: 1 → 2 → **4** (ICON-2I) → consensus **12.8 °C**.
A mean would give about 12.4 °C, pulled down by GFS alone.

### Weighted circular mean

Each direction is turned into a unit vector, the vectors are summed with their weights,
and `atan2` gives the resulting angle, normalised to 0–360°.

## 3. Per-hour extras

- `temperatureBySource`: the temperature of every source at that hour (`null` if
  missing). Used for the divergence band in the 48-hour chart and for the source table.
- `temperatureSpread`: max − min temperature across sources (needs at least 2).
- `sourcesCount`: how many sources contributed.

## 4. Daily merge

Only sources with a daily block take part (Open-Meteo models; MET Norway has none).
For each local date: weighted median of min/max temperature, precipitation sum,
precipitation probability and max wind; weighted mode of the weather code; sunrise and
sunset taken from the first source that has them.

## 5. Agreement index

The average temperature spread over the **next 24 hours** classifies the agreement:

| Average spread | Agreement | Badge |
|---|---|---|
| < 1.5 °C | `alto` (high) | green |
| 1.5 – 3 °C | `medio` (medium) | amber |
| ≥ 3 °C, or fewer than 2 sources | `basso` (low) | red |

The badge in the current-conditions card also shows the current uncertainty as
`± spread / 2` (converted to °F when that unit is selected).

## Design choices

- **Median, not mean**: one model with a wrong front timing should not drag the forecast.
- **Mode for the sky, not median**: weather codes are categories, not quantities; the
  median of "clear" (0) and "thunderstorm" (95) would be meaningless.
- **Ties go to the worse weather**: for a dashboard it is safer to show a possible storm
  than to hide it.
- **No source is mandatory**: with any single source available the app still produces a
  forecast; with none it shows an error and the last saved snapshot, if any.
