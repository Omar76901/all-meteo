import type { City } from '../domain/types';
import { fetchJson } from './http';

interface GeoResult { name: string; latitude: number; longitude: number; country?: string; admin1?: string }
interface ReverseResult { city?: string; locality?: string; principalSubdivision?: string }

export async function searchCities(query: string): Promise<City[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const data = await fetchJson<{ results?: GeoResult[] }>(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=it&format=json`);
  return (data.results ?? []).map(r => ({
    name: r.name,
    region: r.admin1 ?? r.country,
    lat: r.latitude,
    lon: r.longitude,
  }));
}

export async function reverseGeocode(lat: number, lon: number): Promise<City> {
  const d = await fetchJson<ReverseResult>(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=it`);
  return { name: d.city || d.locality || 'Posizione attuale', region: d.principalSubdivision, lat, lon };
}
