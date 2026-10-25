import { fetchJson } from './http';

export interface RadarFrame { time: number; path: string }

interface RVResponse { host: string; radar?: { past?: RadarFrame[]; nowcast?: RadarFrame[] } }

export async function fetchRadarFrames(): Promise<{ host: string; frames: RadarFrame[]; pastCount: number }> {
  const d = await fetchJson<RVResponse>('https://api.rainviewer.com/public/weather-maps.json');
  const past = d.radar?.past ?? [];
  const nowcast = d.radar?.nowcast ?? [];
  return { host: d.host, frames: [...past, ...nowcast], pastCount: past.length };
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
