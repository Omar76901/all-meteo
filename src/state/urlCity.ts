import type { City } from '../domain/types';

/** Città indicata nell'URL (?lat=..&lon=..&name=..), per link condivisibili e segnalibri. */
export function getUrlCity(search = window.location.search): City | null {
  const p = new URLSearchParams(search);
  const lat = Number(p.get('lat')), lon = Number(p.get('lon'));
  if (!p.has('lat') || !p.has('lon') || !Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { name: p.get('name')?.trim() || `${lat.toFixed(2)}, ${lon.toFixed(2)}`, lat, lon };
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
