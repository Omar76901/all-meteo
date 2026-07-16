# allMeteo ⛅

Dashboard meteo PWA che fonde più fonti in un dato di consenso.

## Fonti
- Open-Meteo (modelli ECMWF, ICON, GFS) — https://open-meteo.com
- MET Norway — https://api.met.no
- Radar: RainViewer — https://rainviewer.com · Basemap © OpenStreetMap © CARTO
- Geocoding: Open-Meteo · Reverse: BigDataCloud

Nessuna API key richiesta.

## Funzioni
- Consenso multi-fonte (mediana) con indice di accordo e confronto per fonte
- Città preferite + geolocalizzazione
- Grafici 48h (temperatura con banda di divergenza, precipitazioni, vento, pressione/umidità/UV)
- Previsioni 7 giorni, radar animato espandibile
- PWA installabile con cache offline, sfondo dinamico per meteo/ora

## Sviluppo
```bash
npm ci        # installa (versioni bloccate)
npm run dev   # sviluppo
npm test      # vitest
npm run build # produzione (dist/)
```

## Sicurezza
Dipendenze con versioni esatte (`save-exact`), lockfile committato, `npm audit` in CI locale,
CSP restrittiva in produzione, nessun asset CDN a runtime.
