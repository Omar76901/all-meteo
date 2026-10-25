# allMeteo documentation

Technical documentation of [allMeteo](../README.md), a multi-source consensus weather PWA.

| Document | Read it to… |
|---|---|
| [Architecture](architecture.md) | understand the layers, the data model, the data flow, state, theming and offline support |
| [Data sources](data-sources.md) | see every external service, the exact requests and how each response is normalised |
| [Consensus algorithm](consensus.md) | learn how forecasts are merged and how the agreement index is computed |
| [Features](features.md) | know what every panel shows and the rules behind it (alert thresholds, AQI bands, …) |
| [Development guide](development.md) | set up the project, run tests, follow the conventions, extend the app |
| [Deployment](deployment.md) | publish to GitHub Pages or run with Docker; CSP and PWA configuration |
| [CI & security](ci-and-security.md) | understand the pipeline, the daily upstream check and the security measures |
| [Troubleshooting](troubleshooting.md) | fix the problems that have actually happened |

## In one paragraph

allMeteo is a React + TypeScript single-page app with no backend. On every city change it
asks Open-Meteo (global and regional high-resolution models) and MET Norway for a 7-day
forecast in parallel, normalises the answers into one data model, and merges them with a
weighted median (regional models count double) into a consensus forecast with an agreement
index. Around it: derived weather alerts, 48-hour charts, air quality and pollen, an animated
radar, units and theme preferences, shareable links and offline support. It is deployed to
GitHub Pages by a CI pipeline that runs security scanners and tests first, and a daily job
checks that every external service still works.
