import type { SourceForecast } from '../domain/types';
import { fetchMetNorway } from './metNorway';
import { LOCAL_MODELS, OPEN_METEO_MODELS, fetchGlobalModels, fetchLocalModels } from './openMeteo';

export const SOURCE_LABELS: Record<string, string> = {
  ecmwf: 'ECMWF', icon: 'ICON (DWD)', gfs: 'GFS (NOAA)', met_norway: 'MET Norway',
  ...Object.fromEntries(LOCAL_MODELS.map(m => [m.id, m.name])),
};

export async function fetchAllSources(lat: number, lon: number): Promise<{
  ok: SourceForecast[];
  failed: { id: string; name: string }[];
}> {
  // una richiesta può produrre più fonti (i modelli locali), o nessuna se il punto non è coperto
  const tasks: { id: string; name: string; promise: Promise<SourceForecast[]> }[] = [
    { id: 'global', name: 'Modelli globali', promise: fetchGlobalModels(lat, lon) },
    { id: 'met_norway', name: 'MET Norway', promise: fetchMetNorway(lat, lon).then(f => [f]) },
    { id: 'local', name: 'Modelli locali', promise: fetchLocalModels(lat, lon) },
  ];
  const results = await Promise.allSettled(tasks.map(t => t.promise));
  const ok: SourceForecast[] = [];
  const failed: { id: string; name: string }[] = [];
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') ok.push(...r.value);
    else failed.push({ id: tasks[i].id, name: tasks[i].name });
  });
  // se la richiesta dei globali riesce ma un modello manca, va segnalato da solo
  if (results[0].status === 'fulfilled') {
    for (const m of OPEN_METEO_MODELS) {
      if (!ok.some(f => f.sourceId === m.id)) failed.push({ id: m.id, name: m.name });
    }
  }
  // i locali in testa: sono i più precisi e così appaiono per primi nel confronto fonti
  ok.sort((a, b) => Number(!!b.local) - Number(!!a.local));
  return { ok, failed };
}
