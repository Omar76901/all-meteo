import { fetchJson } from './http';

export interface RadarFrame { time: number; path: string }

interface RVResponse { host: string; radar?: { past?: RadarFrame[]; nowcast?: RadarFrame[] } }

/** L'unico host di tile ammesso dalla CSP (img-src): un host diverso verrebbe comunque bloccato. */
export const RADAR_TILE_HOST = 'https://tilecache.rainviewer.com';
const FRAME_PATH = /^\/v2\/radar\/[A-Za-z0-9_]+$/;

/**
 * Host e path finiscono nell'URL delle tile: si accettano solo nella forma attesa,
 * così una risposta alterata non può far caricare immagini da altrove.
 */
export function parseRadarFrames(data: unknown): { host: string; frames: RadarFrame[]; pastCount: number } {
  const d = data as RVResponse;
  if (d?.host !== RADAR_TILE_HOST) throw new Error(`host radar inatteso: ${String(d?.host)}`);
  const valid = (list: unknown) => (Array.isArray(list) ? list : []).filter((f): f is RadarFrame =>
    Number.isFinite(f?.time) && typeof f?.path === 'string' && FRAME_PATH.test(f.path));
  const past = valid(d.radar?.past);
  const nowcast = valid(d.radar?.nowcast);
  return { host: d.host, frames: [...past, ...nowcast], pastCount: past.length };
}

export async function fetchRadarFrames(): Promise<{ host: string; frames: RadarFrame[]; pastCount: number }> {
  return parseRadarFrames(await fetchJson('https://api.rainviewer.com/public/weather-maps.json'));
}

/** "-2h", "-50 min": quanto indietro arriva la timeline rispetto all'ultimo frame osservato. */
export function formatSpan(seconds: number): string {
  const min = Math.round(seconds / 60);
  return min >= 60 && min % 60 === 0 ? `-${min / 60}h` : `-${min} min`;
}

/** Età dell'ultimo frame osservato; stale se il radar è in ritardo (normalmente esce ogni 10 min). */
export function radarAge(latestTime: number, now = Date.now()): { label: string; stale: boolean } {
  const min = Math.max(0, Math.round((now / 1000 - latestTime) / 60));
  return { label: min < 1 ? 'adesso' : `${min} min fa`, stale: min > 30 };
}
