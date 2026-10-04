import type { DailyPoint, HourlyPoint, SourceForecast } from '../domain/types';
import { fetchJson } from './http';

export const OPEN_METEO_MODELS = [
  { id: 'ecmwf', name: 'ECMWF', model: 'ecmwf_ifs025' },
  { id: 'icon', name: 'ICON (DWD)', model: 'icon_seamless' },
  { id: 'gfs', name: 'GFS (NOAA)', model: 'gfs_seamless' },
] as const;

/**
 * Modelli regionali ad alta risoluzione (1–3 km), affidabili sui primi 2–5 giorni.
 * Richiesti tutti insieme: Open-Meteo omette dalla risposta quelli che non coprono
 * il punto, o li restituisce tutti null (AROME ai bordi del dominio).
 */
export const LOCAL_MODELS = [
  { id: 'icon_2i', name: 'ICON-2I (Italia)', model: 'italia_meteo_arpae_icon_2i' },
  { id: 'icon_ch2', name: 'ICON-CH2 (MeteoSvizzera)', model: 'meteoswiss_icon_ch2' },
  { id: 'icon_d2', name: 'ICON-D2 (DWD)', model: 'icon_d2' },
  { id: 'arome', name: 'AROME (Météo-France)', model: 'meteofrance_arome_france_hd' },
  { id: 'ukv', name: 'UKV (Met Office)', model: 'ukmo_uk_deterministic_2km' },
  { id: 'hrrr', name: 'HRRR (NOAA)', model: 'ncep_hrrr_conus' },
  { id: 'hrdps', name: 'HRDPS (Canada)', model: 'gem_hrdps_continental' },
  { id: 'msm', name: 'MSM (JMA)', model: 'jma_msm' },
] as const;

export interface OpenMeteoModel { id: string; name: string; model: string }

const HOURLY_VARS = 'temperature_2m,apparent_temperature,precipitation,precipitation_probability,wind_speed_10m,wind_gusts_10m,wind_direction_10m,relative_humidity_2m,surface_pressure,uv_index,weather_code';
const DAILY_VARS = 'temperature_2m_min,temperature_2m_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,weather_code,sunrise,sunset';

interface Block { time?: number[]; [key: string]: number[] | undefined }
interface OMResponse { timezone?: string; hourly?: Block; daily?: Block }

const iso = (epoch: number) => new Date(epoch * 1000).toISOString();

/** Con &models= le chiavi possono arrivare suffissate col nome modello: prova entrambe. */
function col(block: Block | undefined, key: string, model: string): (number | null)[] | null {
  const arr = block?.[key] ?? block?.[`${key}_${model}`];
  return Array.isArray(arr) ? arr : null;
}

const at = (arr: (number | null)[] | null, i: number): number | null => arr?.[i] ?? null;

export function parseOpenMeteo(data: unknown, m: OpenMeteoModel): SourceForecast {
  const d = data as OMResponse;
  const h = d.hourly, dy = d.daily;
  const c = (key: string) => col(h, key, m.model);
  const cd = (key: string) => col(dy, key, m.model);

  const hourly: HourlyPoint[] = (h?.time ?? []).map((t, i) => ({
    time: iso(t),
    temperature: at(c('temperature_2m'), i),
    apparentTemperature: at(c('apparent_temperature'), i),
    precipitation: at(c('precipitation'), i),
    precipitationProbability: at(c('precipitation_probability'), i),
    windSpeed: at(c('wind_speed_10m'), i),
    windGusts: at(c('wind_gusts_10m'), i),
    windDirection: at(c('wind_direction_10m'), i),
    humidity: at(c('relative_humidity_2m'), i),
    pressure: at(c('surface_pressure'), i),
    uvIndex: at(c('uv_index'), i),
    weatherCode: at(c('weather_code'), i),
  }));

  const daily: DailyPoint[] = (dy?.time ?? []).map((t, i) => ({
    date: iso(t).slice(0, 10),
    tempMin: at(cd('temperature_2m_min'), i),
    tempMax: at(cd('temperature_2m_max'), i),
    precipitationSum: at(cd('precipitation_sum'), i),
    precipitationProbability: at(cd('precipitation_probability_max'), i),
    windSpeedMax: at(cd('wind_speed_10m_max'), i),
    weatherCode: at(cd('weather_code'), i),
    sunrise: cd('sunrise')?.[i] != null ? iso(cd('sunrise')![i]!) : null,
    sunset: cd('sunset')?.[i] != null ? iso(cd('sunset')![i]!) : null,
  }));

  return { sourceId: m.id, sourceName: m.name, timezone: d.timezone ?? null, hourly, daily };
}

const forecastUrl = (models: string, lat: number, lon: number) =>
  `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
  `&hourly=${HOURLY_VARS}&daily=${DAILY_VARS}` +
  `&models=${models}&forecast_days=7&timezone=auto&timeformat=unixtime&wind_speed_unit=kmh`;

export async function fetchOpenMeteoModel(m: OpenMeteoModel, lat: number, lon: number): Promise<SourceForecast> {
  return parseOpenMeteo(await fetchJson(forecastUrl(m.model, lat, lon)), m);
}

/**
 * Estrae i modelli locali da una risposta multi-modello. Oltre l'orizzonte del
 * modello le ore sono null e i giorni coperti solo in parte hanno daily null:
 * entrambi vengono scartati, così il consenso usa i globali per il resto.
 */
export function parseLocalModels(data: unknown): SourceForecast[] {
  return LOCAL_MODELS
    .map(m => {
      const f = parseOpenMeteo(data, m);
      return {
        ...f,
        local: true,
        hourly: f.hourly.filter(h => h.temperature !== null),
        daily: f.daily.filter(d => d.tempMin !== null && d.tempMax !== null),
      };
    })
    .filter(f => f.hourly.length > 0);
}

export async function fetchLocalModels(lat: number, lon: number): Promise<SourceForecast[]> {
  const models = LOCAL_MODELS.map(m => m.model).join(',');
  return parseLocalModels(await fetchJson(forecastUrl(models, lat, lon)));
}
