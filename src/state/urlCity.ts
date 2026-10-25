import type { City } from '../domain/types';

/** Città indicata nell'URL (?lat=..&lon=..&name=..), per link condivisibili e segnalibri. */
export function getUrlCity(search = window.location.search): City | null {
  const p = new URLSearchParams(search);
  const lat = Number(p.get('lat')), lon = Number(p.get('lon'));
  if (!p.has('lat') || !p.has('lon') || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { name: cleanName(p.get('name')) || `${lat.toFixed(2)}, ${lon.toFixed(2)}`, lat, lon };
}

const MAX_NAME = 60;

/**
 * Il nome arriva da un link che chiunque può costruire e viene mostrato come titolo:
 * niente caratteri di controllo e lunghezza da nome di città, così un link non può
 * spacciare messaggi lunghi ("chiama questo numero…") dentro la pagina.
 */
function cleanName(raw: string | null): string {
  // eslint-disable-next-line no-control-regex
  const name = (raw ?? '').replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g, '').trim();
  return name.length > MAX_NAME ? `${name.slice(0, MAX_NAME - 1)}…` : name;
}

export function cityUrlSearch(c: City): string {
  return '?' + new URLSearchParams({ lat: c.lat.toFixed(4), lon: c.lon.toFixed(4), name: c.name }).toString();
}

/** Aggiorna l'URL senza aggiungere voci alla cronologia. */
export function setUrlCity(c: City): void {
  const search = cityUrlSearch(c);
  if (window.location.search !== search) {
    window.history.replaceState(null, '', window.location.pathname + search + window.location.hash);
  }
}
