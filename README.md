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

## Docker (LAN)
```bash
docker compose up -d --build
```
Il sito è servito da nginx sulla porta 8080: dal PC su http://localhost:8080, dagli altri
dispositivi della LAN su `http://<IP-del-PC>:8080` (se non risponde, consenti a Docker
la porta 8080 nel firewall di Windows). Nota: da un IP LAN in HTTP il browser non
considera l'origine "sicura", quindi il service worker (cache offline / installazione PWA)
resta disattivato; il sito funziona comunque normalmente.

## CI
- **CI**: su ogni PR e push su master — `npm audit`, typecheck, test, build
- **Deploy GitHub Pages**: su push su master (richiede Pages attivo nelle impostazioni)
- **Dependabot**: aggiornamenti settimanali di npm e GitHub Actions, validati dalla CI

## Sicurezza
Dipendenze con versioni esatte (`save-exact`), lockfile committato, `npm audit` in CI locale,
CSP restrittiva in produzione, nessun asset CDN a runtime.
