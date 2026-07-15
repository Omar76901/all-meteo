# allMeteo — Design

**Data:** 2026-07-15
**Stato:** approvato dall'utente

## Obiettivo

Sito web meteo consultabile da desktop e telefono che:
1. aggrega più fonti meteo attendibili in un dato di "consenso" con indicatore di accordo;
2. gestisce città preferite + città corrente via geolocalizzazione;
3. presenta una grafica accattivante (dashboard dark tecnica, sfondo dinamico) con tutti i dati principali e grafici dettagliati;
4. include una mappa radar delle precipitazioni animata;
5. è installabile come PWA.

## Stack

- **React + TypeScript + Vite** — SPA statica, nessun backend, nessuna API key.
- **Tailwind CSS** — stile.
- **Recharts** — grafici.
- **Leaflet** (+ react-leaflet) — mappa radar.
- **vite-plugin-pwa** — manifest + service worker.
- **Vitest** — test unitari.

## Fonti dati (tutte gratuite, senza API key, CORS abilitato)

| Fonte | Uso |
|---|---|
| Open-Meteo forecast (modello ECMWF) | fonte 1 |
| Open-Meteo forecast (modello ICON) | fonte 2 |
| Open-Meteo forecast (modello GFS) | fonte 3 |
| MET Norway Locationforecast 2.0 | fonte 4 (indipendente da Open-Meteo) |
| Open-Meteo Geocoding API | ricerca città (lingua it) |
| Reverse geocoding (BigDataCloud client-side, senza key) | nome località da GPS |
| RainViewer API | tile radar precipitazioni (ultime 2h + nowcast 30min) |
| Basemap tile scure (Carto dark) | sfondo mappa radar |

### Logica di consenso

- Per ogni variabile oraria (temperatura, precipitazioni, vento, ecc.): **mediana** dei valori delle fonti disponibili, allineate per timestamp UTC.
- **Indice di accordo**: deviazione/intervallo tra fonti, mostrato accanto al dato (es. `±0.8°`) e come badge qualitativo (accordo alto/medio/basso).
- Probabilità di precipitazione: presa da Open-Meteo (MET non la fornisce per tutte le località); media dei modelli che la espongono.
- Se una fonte fallisce (timeout 8s / errore): consenso dalle rimanenti, badge "3/4 fonti attive". Con 0 fonti: messaggio di errore e dati cache se presenti.
- Condizione meteo (icona/descrizione): dal weathercode più frequente tra le fonti (moda), tradotto in italiano.

## Città e geolocalizzazione

- Ricerca con autocompletamento (Open-Meteo Geocoding, `language=it`).
- Preferite: stella per aggiungere/rimuovere; persistite in `localStorage` (nome, lat, lon, timezone). Elenco rapido nell'header.
- Posizione corrente: `navigator.geolocation` su richiesta esplicita dell'utente (tap sul pulsante 📍); reverse geocoding per il nome. Permesso negato → si continua con ricerca manuale, nessun blocco.
- Ultima città consultata ricordata in `localStorage` e riaperta all'avvio.

## UI — dashboard dark tecnica, sfondo dinamico, pagina unica a scroll

Lingua: italiano. Unità: metriche. Mobile-first, breakpoint desktop con griglia più larga.

- **Sfondo dinamico**: gradiente full-page che varia per condizione (sereno/nuvoloso/pioggia/neve/temporale) × momento del giorno (alba/giorno/tramonto/notte, calcolato da alba/tramonto delle API). Transizione morbida.
- **Pannelli**: card scure semi-trasparenti su griglia, accenti monospace, palette tecnica (ambra per temperatura, azzurro per acqua/vento).

Sezioni nell'ordine:
1. **Header**: selettore città con ricerca, chip delle preferite, pulsante GPS.
2. **Card principale**: temperatura consenso grande, percepita, min/max, condizione con icona, badge accordo fonti e n. fonti attive, ora ultimo aggiornamento.
3. **Striscia oraria 24h** scorrevole in orizzontale (icona, temp, prob. pioggia).
4. **Grafici 48h** (Recharts):
   - temperatura multi-fonte: linea consenso + banda min–max fonti;
   - precipitazioni: barre mm/h + curva probabilità;
   - vento: velocità media + raffiche + frecce direzione;
   - secondari: pressione, umidità, indice UV.
5. **Previsioni 7 giorni**: righe con icona, min/max, prob. pioggia, vento; espandibili per dettaglio.
6. **Radar**: mini-mappa Leaflet incorporata centrata sulla città, tile RainViewer animate con timeline (play/pausa, ultime 2h + 30min previsione); tap/click → overlay a schermo pieno.
7. **Confronto fonti**: tabella con il valore di ogni fonte per le prossime ore + stato (ok/errore/latenza).

## PWA e offline

- `vite-plugin-pwa`: manifest (nome "allMeteo", icone, tema scuro, display standalone), service worker con precache dell'app shell.
- Dati meteo: cache runtime stale-while-revalidate; offline si mostrano gli ultimi dati con timestamp evidente "aggiornato alle …".
- Tile radar/mappa: cache runtime con scadenza breve, no precache.

## Sicurezza (supply chain e runtime)

- **Versioni esatte** per tutte le dipendenze: `.npmrc` con `save-exact=true`, nessun `^`/`~` in `package.json`.
- **`package-lock.json` committato**; installazioni riproducibili con `npm ci`.
- **Dipendenze minime**: solo quelle elencate nello stack; niente utility superflue.
- **`npm audit`** eseguito e pulito prima di ogni commit di dipendenze.
- Nessun asset da CDN a runtime: tutto bundlato (CSS Leaflet incluso).
- **CSP** via meta tag: `default-src 'self'`; `connect-src` limitato ai domini API elencati; `img-src` limitato ai domini tile; niente `unsafe-eval`.
- Nessun dato personale trasmesso: le coordinate GPS vanno solo alle API meteo/reverse-geocoding via HTTPS; preferiti solo in `localStorage`.

## Architettura del codice

```
src/
  api/            # un modulo per fonte + tipi normalizzati
    openMeteo.ts  # fetch per modello (ecmwf, icon, gfs)
    metNorway.ts
    geocoding.ts  # ricerca + reverse
    rainviewer.ts # metadata frame radar
  domain/
    consensus.ts  # fusione fonti, mediana, indice accordo (puro, testato)
    weatherCodes.ts # mappa codici → icona/descrizione it
    background.ts # condizione+ora → gradiente (puro, testato)
  state/
    settings.ts   # preferiti, ultima città (localStorage)
    useWeather.ts # hook: carica fonti in parallelo, produce consenso
  components/     # Header, CurrentCard, HourlyStrip, Charts/, DailyList,
                  # RadarMap, SourcesTable, ...
```

Ogni fonte restituisce lo stesso tipo normalizzato `SourceForecast`; `consensus.ts` è una funzione pura `SourceForecast[] → ConsensusForecast`, testabile senza rete.

## Error handling

- Timeout per fonte (8s) con `AbortController`; fallimenti isolati per fonte.
- Retry non automatico: pulsante "riprova" e refresh manuale (pull/bottone) + auto-refresh ogni 15 min se la scheda è attiva.
- Geolocalizzazione negata/non disponibile → toast informativo, resta la ricerca.
- Radar: se RainViewer non risponde, la sezione mostra errore locale senza rompere il resto.

## Test

- **Vitest**: `consensus.ts` (mediana, accordo, fonti mancanti, allineamento timestamp), `weatherCodes.ts`, `background.ts`, parsing/normalizzazione risposte API (fixture JSON reali salvate).
- Verifica manuale nel browser (desktop + viewport mobile) per UI, radar, PWA.

## Fuori scope (per ora)

- Notifiche push / allerte meteo.
- Backend, account utente, sync preferiti tra dispositivi.
- Storico meteo passato.
- Più lingue oltre l'italiano.
