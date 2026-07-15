import { fetchJson } from './http';

export interface RadarFrame { time: number; path: string }

interface RVResponse { host: string; radar?: { past?: RadarFrame[]; nowcast?: RadarFrame[] } }

export async function fetchRadarFrames(): Promise<{ host: string; frames: RadarFrame[]; pastCount: number }> {
  const d = await fetchJson<RVResponse>('https://api.rainviewer.com/public/weather-maps.json');
  const past = d.radar?.past ?? [];
  const nowcast = d.radar?.nowcast ?? [];
  return { host: d.host, frames: [...past, ...nowcast], pastCount: past.length };
}
