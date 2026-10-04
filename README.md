# allMeteo ⛅

Dashboard meteo PWA che fonde più fonti in un dato di consenso.

## Fonti
- Open-Meteo (modelli globali ECMWF, ICON, GFS) — https://open-meteo.com
- Modelli locali ad alta risoluzione via Open-Meteo, usati solo dove coprono la località:
  ICON-2I (Italia), ICON-CH2 (Svizzera/Alpi), ICON-D2 (Europa centrale), AROME (Francia),
  UKV (Regno Unito), HRRR (USA), HRDPS (Canada), MSM (Giappone)
- MET Norway — https://api.met.no
- Radar: RainViewer — https://rainviewer.com · Basemap © OpenStreetMap © CARTO
- Geocoding: Open-Meteo · Reverse: BigDataCloud

Nessuna API key richiesta.

## Funzioni
- Consenso multi-fonte (mediana pesata: i modelli locali contano doppio nei giorni che
  coprono) con indice di accordo e confronto per fonte
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
Il sito è servito da nginx (immagine non-root) sulla porta 8080: dal PC su http://localhost:8080, dagli altri
dispositivi della LAN su `http://<IP-del-PC>:8080` (se non risponde, consenti a Docker
la porta 8080 nel firewall di Windows). Nota: da un IP LAN in HTTP il browser non
considera l'origine "sicura", quindi il service worker (cache offline / installazione PWA)
resta disattivato; il sito funziona comunque normalmente.

## CI
Un'unica pipeline (`.github/workflows/ci.yml`) in tre fasi, ognuna parte solo se la
precedente è verde:
1. **Sicurezza**: gitleaks (segreti in tutta la storia), Trivy (dipendenze, segreti e
   misconfigurazioni), Bearer (analisi statica del codice)
2. **Test e build**: `npm audit`, typecheck, test, build
3. **Deploy GitHub Pages**: solo su push su master (richiede Pages attivo nelle
   impostazioni); sulle PR girano le fasi 1 e 2
- **Dependabot**: aggiornamenti settimanali di npm e GitHub Actions, validati dalla CI

## Sicurezza
Dipendenze con versioni esatte (`save-exact`), lockfile committato, `npm audit`, gitleaks, Trivy e Bearer in CI,
CSP restrittiva in produzione, nessun asset CDN a runtime.

## Licenza
Distribuito con licenza [PolyForm Noncommercial 1.0.0](LICENSE): puoi usare, studiare,
modificare e condividere questo software per scopi personali e non commerciali.
**Qualsiasi uso commerciale (vendita, rivendita, servizi a pagamento basati su questo
software) non è consentito.**
