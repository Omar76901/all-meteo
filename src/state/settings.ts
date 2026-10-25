import type { City, SourceForecast } from '../domain/types';

const FAV_KEY = 'allmeteo:favorites';
const LAST_KEY = 'allmeteo:lastCity';

const cityKey = (c: Pick<City, 'lat' | 'lon'>) => `${c.lat.toFixed(4)},${c.lon.toFixed(4)}`;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

/** I dati salvati possono essere vecchi o alterati: una città senza coordinate valide manderebbe in errore la pagina. */
export function isCity(v: unknown): v is City {
  const c = v as City;
  return typeof c === 'object' && c !== null && typeof c.name === 'string'
    && Number.isFinite(c.lat) && Number.isFinite(c.lon) && Math.abs(c.lat) <= 90 && Math.abs(c.lon) <= 180;
}

export function getFavorites(): City[] {
  const favs = readJson<unknown>(FAV_KEY, []);
  return Array.isArray(favs) ? favs.filter(isCity) : [];
}

export function isFavorite(c: City, favs: City[] = getFavorites()): boolean {
  return favs.some(f => cityKey(f) === cityKey(c));
}

export function toggleFavorite(c: City): City[] {
  const favs = getFavorites();
  const next = isFavorite(c, favs) ? favs.filter(f => cityKey(f) !== cityKey(c)) : [...favs, c];
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(next));
  } catch {
    // localStorage non disponibile/quota superata: ignora, lo stato in memoria resta valido
  }
  return next;
}

export function getLastCity(): City | null {
  const c = readJson<unknown>(LAST_KEY, null);
  return isCity(c) ? c : null;
}

export function setLastCity(c: City): void {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify(c));
  } catch {
    // localStorage non disponibile/quota superata: ignora
  }
}

const SNAPSHOT_KEY = 'allmeteo:snapshot';
/** Oltre questa età i dati salvati sono troppo vecchi per essere utili anche come anteprima. */
const SNAPSHOT_MAX_AGE_MS = 12 * 60 * 60 * 1000;

export interface WeatherSnapshot {
  city: string;
  savedAt: string;
  sources: SourceForecast[];
  failedSources: { id: string; name: string }[];
}

/** Forma minima perché il consenso possa lavorarci senza andare in errore. */
function isSnapshotShape(s: WeatherSnapshot): boolean {
  return Array.isArray(s.failedSources) && Array.isArray(s.sources) && s.sources.every(f =>
    typeof f?.sourceId === 'string' && Array.isArray(f.hourly) && Array.isArray(f.daily)
    && f.hourly.every(h => typeof h?.time === 'string'));
}

/** Ultime previsioni scaricate per questa città, da mostrare subito all'apertura. */
export function getSnapshot(c: Pick<City, 'lat' | 'lon'>, now = Date.now()): WeatherSnapshot | null {
  const snap = readJson<WeatherSnapshot | null>(SNAPSHOT_KEY, null);
  if (!snap || snap.city !== cityKey(c) || !isSnapshotShape(snap)) return null;
  return now - Date.parse(snap.savedAt) < SNAPSHOT_MAX_AGE_MS ? snap : null;
}

export function setSnapshot(
  c: Pick<City, 'lat' | 'lon'>, sources: SourceForecast[], failedSources: { id: string; name: string }[], savedAt: Date,
): void {
  const snap: WeatherSnapshot = { city: cityKey(c), savedAt: savedAt.toISOString(), sources, failedSources };
  try {
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snap));
  } catch {
    // quota superata: l'anteprima è solo una comodità, si fa senza
  }
}
