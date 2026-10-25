import { fetchJson } from './http';

const POLLEN = [
  ['alder_pollen', 'Ontano'],
  ['birch_pollen', 'Betulla'],
  ['grass_pollen', 'Graminacee'],
  ['mugwort_pollen', 'Artemisia'],
  ['olive_pollen', 'Olivo'],
  ['ragweed_pollen', 'Ambrosia'],
] as const;

const CURRENT_VARS = ['european_aqi', 'pm2_5', 'pm10', 'ozone', 'nitrogen_dioxide', ...POLLEN.map(([k]) => k)].join(',');

export interface AirQuality {
  aqi: number | null;                      // indice europeo EAQI
  maxAqi24h: number | null;                // picco nelle prossime 24 ore
  pm2_5: number | null;                    // µg/m³
  pm10: number | null;
  ozone: number | null;
  no2: number | null;
  /** Solo i pollini presenti; vuoto fuori stagione o fuori Europa (dove il modello non c'è). */
  pollen: { name: string; value: number }[];
}

interface AQResponse {
  current?: Record<string, number | null>;
  hourly?: { time?: number[]; european_aqi?: (number | null)[] };
}

export function parseAirQuality(data: unknown, now = Date.now()): AirQuality {
  const d = data as AQResponse;
  const c = d.current ?? {};
  const v = (k: string) => (typeof c[k] === 'number' ? c[k] : null);
  const times = d.hourly?.time ?? [];
  const next24 = (d.hourly?.european_aqi ?? []).filter((x, i): x is number =>
    x !== null && times[i] * 1000 >= now - 3600_000 && times[i] * 1000 <= now + 24 * 3600_000);
  return {
    aqi: v('european_aqi'),
    maxAqi24h: next24.length ? Math.max(...next24) : null,
    pm2_5: v('pm2_5'),
    pm10: v('pm10'),
    ozone: v('ozone'),
    no2: v('nitrogen_dioxide'),
    pollen: POLLEN
      .map(([k, name]) => ({ name, value: v(k) }))
      .filter((p): p is { name: (typeof POLLEN)[number][1]; value: number } => p.value !== null && p.value >= 1)
      .sort((a, b) => b.value - a.value),
  };
}

export async function fetchAirQuality(lat: number, lon: number): Promise<AirQuality> {
  return parseAirQuality(await fetchJson(
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}` +
    `&current=${CURRENT_VARS}&hourly=european_aqi&forecast_days=2&timeformat=unixtime`,
  ));
}

/** Fasce dell'indice europeo di qualità dell'aria (EEA). */
export function aqiLevel(aqi: number): { label: string; className: string } {
  if (aqi <= 20) return { label: 'buona', className: 'text-emerald-400' };
  if (aqi <= 40) return { label: 'discreta', className: 'text-lime-400' };
  if (aqi <= 60) return { label: 'moderata', className: 'text-amber-400' };
  if (aqi <= 80) return { label: 'scadente', className: 'text-orange-400' };
  if (aqi <= 100) return { label: 'molto scadente', className: 'text-rose-400' };
  return { label: 'pessima', className: 'text-fuchsia-400' };
}

/** Soglie indicative (granuli/m³) comuni a tutti i pollini: bastano per dire basso/medio/alto. */
export function pollenLevel(value: number): { label: string; className: string } {
  if (value < 10) return { label: 'basso', className: 'text-emerald-400' };
  if (value < 50) return { label: 'medio', className: 'text-amber-400' };
  return { label: 'alto', className: 'text-rose-400' };
}
