import type { City } from '../domain/types';

const FAV_KEY = 'allmeteo:favorites';
const LAST_KEY = 'allmeteo:lastCity';

const cityKey = (c: City) => `${c.lat.toFixed(4)},${c.lon.toFixed(4)}`;

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
