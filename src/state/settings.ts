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

export function getFavorites(): City[] {
  return readJson<City[]>(FAV_KEY, []);
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
  return readJson<City | null>(LAST_KEY, null);
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

/** Ultime previsioni scaricate per questa città, da mostrare subito all'apertura. */
export function getSnapshot(c: Pick<City, 'lat' | 'lon'>, now = Date.now()): WeatherSnapshot | null {
  const snap = readJson<WeatherSnapshot | null>(SNAPSHOT_KEY, null);
  if (!snap || snap.city !== cityKey(c)) return null;
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
