// Verifica che i servizi esterni usati dall'app rispondano ancora come ci aspettiamo.
// Gira ogni giorno in CI (.github/workflows/upstream-check.yml): un servizio che cambia
// (es. CARTO che inizia a chiedere una API key) fa fallire il job invece di rompere il sito in silenzio.
// Uso: node scripts/check-upstreams.mjs

const UA = 'allMeteo upstream check (https://github.com/omar76901/all-meteo)';
const LAT = 45.4643, LON = 9.1895; // Milano: coperta da tutte le fonti europee

async function get(url, accept) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const type = res.headers.get('content-type') ?? '';
  if (accept && !type.startsWith(accept)) throw new Error(`content-type ${type}, atteso ${accept}`);
  return res;
}

const json = async url => (await get(url, 'application/json')).json();
const bytes = async (url, accept) => Buffer.from(await (await get(url, accept)).arrayBuffer());

/**
 * Un servizio di tile che si rompe spesso risponde 200 con un'immagine segnaposto
 * ("API KEY REQUIRED", "Zoom Level Not Supported"), uguale per ogni tile:
 * due tile diverse che arrivano identiche indicano proprio questo.
 */
async function distinctTiles(name, urlA, urlB, accept = 'image/') {
  const [a, b] = await Promise.all([bytes(urlA, accept), bytes(urlB, accept)]);
  if (a.equals(b)) throw new Error(`${name}: due tile diverse identiche, probabile immagine segnaposto`);
}

const checks = {
  'Open-Meteo forecast (multi-modello)': async () => {
    const d = await json(`https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}` +
      '&hourly=temperature_2m&models=ecmwf_ifs025,icon_seamless,gfs_seamless&forecast_days=1&timeformat=unixtime');
    for (const m of ['ecmwf_ifs025', 'icon_seamless', 'gfs_seamless']) {
      if (!d.hourly?.[`temperature_2m_${m}`]?.some(v => v !== null)) throw new Error(`nessun dato per ${m}`);
    }
  },
  'Open-Meteo geocoding': async () => {
    const d = await json('https://geocoding-api.open-meteo.com/v1/search?name=Milano&count=1&language=it');
    if (!d.results?.length) throw new Error('nessun risultato');
  },
  'Open-Meteo air quality': async () => {
    const d = await json(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${LAT}&longitude=${LON}` +
      '&current=european_aqi&hourly=european_aqi&forecast_days=1');
    if (typeof d.current?.european_aqi !== 'number') throw new Error('nessun dato AQI');
  },
  'MET Norway': async () => {
    const d = await json(`https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${LAT}&lon=${LON}`);
    if (!d.properties?.timeseries?.length) throw new Error('timeseries vuota');
  },
  'BigDataCloud reverse geocoding': async () => {
    const d = await json(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${LAT}&longitude=${LON}&localityLanguage=it`);
    if (!d.city && !d.locality) throw new Error('nessuna località');
  },
  'RainViewer radar': async () => {
    const d = await json('https://api.rainviewer.com/public/weather-maps.json');
    const past = d.radar?.past ?? [];
    if (!past.length) throw new Error('nessun frame radar');
    const age = Date.now() / 1000 - past[past.length - 1].time;
    if (age > 3600) throw new Error(`ultimo frame vecchio di ${Math.round(age / 60)} min`);
    const tile = (z, x, y) => `${d.host}${past[past.length - 1].path}/256/${z}/${x}/${y}/2/1_1.png`;
    // zoom 7 è il massimo usato dall'app (maxNativeZoom in RadarMap)
    await distinctTiles('RainViewer', tile(7, 68, 46), tile(7, 67, 45), 'image/png');
  },
  'Esri basemap': async () => {
    const base = 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas';
    await distinctTiles('Esri base',
      `${base}/World_Dark_Gray_Base/MapServer/tile/7/46/68`, `${base}/World_Dark_Gray_Base/MapServer/tile/7/45/67`);
    await distinctTiles('Esri etichette',
      `${base}/World_Dark_Gray_Reference/MapServer/tile/7/46/68`, `${base}/World_Dark_Gray_Reference/MapServer/tile/7/45/67`);
  },
};

let failed = 0;
for (const [name, check] of Object.entries(checks)) {
  try {
    await check();
    console.log(`ok    ${name}`);
  } catch (e) {
    failed++;
    console.log(`FAIL  ${name}: ${e.message}`);
  }
}
process.exit(failed ? 1 : 0);
