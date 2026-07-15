import type { SourceForecast } from '../domain/types';
import { fetchMetNorway } from './metNorway';
import { OPEN_METEO_MODELS, fetchOpenMeteoModel } from './openMeteo';

export const SOURCE_LABELS: Record<string, string> = {
  ecmwf: 'ECMWF', icon: 'ICON (DWD)', gfs: 'GFS (NOAA)', met_norway: 'MET Norway',
};

export async function fetchAllSources(lat: number, lon: number): Promise<{
  ok: SourceForecast[];
  failed: { id: string; name: string }[];
}> {
  const tasks: { id: string; name: string; promise: Promise<SourceForecast> }[] = [
    ...OPEN_METEO_MODELS.map(m => ({ id: m.id, name: m.name, promise: fetchOpenMeteoModel(m, lat, lon) })),
    { id: 'met_norway', name: 'MET Norway', promise: fetchMetNorway(lat, lon) },
  ];
  const results = await Promise.allSettled(tasks.map(t => t.promise));
  const ok: SourceForecast[] = [];
  const failed: { id: string; name: string }[] = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') ok.push(r.value);
    else failed.push({ id: tasks[i].id, name: tasks[i].name });
  });
  return { ok, failed };
}
