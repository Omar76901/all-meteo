import type { SourceForecast } from '../domain/types';
import { fetchJson } from './http';

interface MetDetails {
  air_temperature?: number; relative_humidity?: number;
  wind_speed?: number; wind_speed_of_gust?: number; wind_from_direction?: number;
  air_pressure_at_sea_level?: number; ultraviolet_index_clear_sky?: number;
}
interface MetTimeseries {
  time: string;
  data: {
    instant?: { details?: MetDetails };
    next_1_hours?: { summary?: { symbol_code?: string }; details?: { precipitation_amount?: number } };
  };
}
interface MetResponse { properties?: { timeseries?: MetTimeseries[] } }

/** symbol_code (senza suffisso _day/_night/_polartwilight) → codice WMO equivalente. */
const SYMBOL_TO_WMO: Record<string, number> = {
  clearsky: 0, fair: 1, partlycloudy: 2, cloudy: 3, fog: 45,
  lightrain: 61, rain: 63, heavyrain: 65,
  lightrainshowers: 80, rainshowers: 81, heavyrainshowers: 82,
  lightsleet: 66, sleet: 66, heavysleet: 67,
  lightsleetshowers: 66, sleetshowers: 66, heavysleetshowers: 67,
  lightsnow: 71, snow: 73, heavysnow: 75,
  lightsnowshowers: 85, snowshowers: 85, heavysnowshowers: 86,
  lightrainandthunder: 95, rainandthunder: 95, heavyrainandthunder: 95,
  lightrainshowersandthunder: 95, rainshowersandthunder: 95, heavyrainshowersandthunder: 95,
  snowandthunder: 95, sleetandthunder: 95,
};

function symbolToWmo(symbol: string | undefined): number | null {
  if (!symbol) return null;
  const base = symbol.replace(/_(day|night|polartwilight)$/, '');
  return SYMBOL_TO_WMO[base] ?? null;
}

const kmh = (ms: number | undefined): number | null => ms == null ? null : Math.round(ms * 3.6 * 10) / 10;
const orNull = (v: number | undefined): number | null => v ?? null;

export function parseMetNorway(data: unknown): SourceForecast {
  const rawTs = (data as MetResponse | null)?.properties?.timeseries;
  const ts = (Array.isArray(rawTs) ? rawTs : []).filter(
    t => t && t.data && Number.isFinite(Date.parse(t.time))
  );
  return {
    sourceId: 'met_norway',
    sourceName: 'MET Norway',
    timezone: null,
    daily: [],
    hourly: ts.map(t => {
      const d = t.data.instant?.details ?? {};
      const next = t.data.next_1_hours;
      return {
        time: new Date(t.time).toISOString(),
        temperature: orNull(d.air_temperature),
        apparentTemperature: null,
        precipitation: next?.details?.precipitation_amount ?? null,
        precipitationProbability: null,
        windSpeed: kmh(d.wind_speed),
        windGusts: kmh(d.wind_speed_of_gust),
        windDirection: orNull(d.wind_from_direction),
        humidity: orNull(d.relative_humidity),
        pressure: orNull(d.air_pressure_at_sea_level),
        uvIndex: orNull(d.ultraviolet_index_clear_sky),
        weatherCode: symbolToWmo(next?.summary?.symbol_code),
      };
    }),
  };
}

export async function fetchMetNorway(lat: number, lon: number): Promise<SourceForecast> {
  const url = `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}`;
  return parseMetNorway(await fetchJson(url));
}
