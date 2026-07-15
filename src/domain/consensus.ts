import type { DailyPoint, HourlyPoint, SourceForecast } from './types';

export type Agreement = 'alto' | 'medio' | 'basso';

export interface ConsensusHourlyPoint extends HourlyPoint {
  temperatureBySource: Record<string, number | null>;
  temperatureSpread: number | null;
  sourcesCount: number;
}

export interface ConsensusForecast {
  hourly: ConsensusHourlyPoint[];
  daily: DailyPoint[];
  agreement: Agreement;
  sourceIds: string[];
  timezone: string | null;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

export function mode(values: number[]): number | null {
  if (values.length === 0) return null;
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best: number | null = null, bestCount = 0;
  for (const [v, n] of counts)
    if (n > bestCount || (n === bestCount && (best === null || v > best))) { best = v; bestCount = n; }
  return best;
}

export function circularMeanDirection(deg: number[]): number | null {
  if (deg.length === 0) return null;
  let x = 0, y = 0;
  for (const d of deg) { const r = (d * Math.PI) / 180; x += Math.cos(r); y += Math.sin(r); }
  const ang = (Math.atan2(y, x) * 180) / Math.PI;
  return (ang + 360) % 360;
}

const MEDIAN_KEYS = [
  'temperature', 'apparentTemperature', 'precipitation', 'precipitationProbability',
  'windSpeed', 'windGusts', 'humidity', 'pressure', 'uvIndex',
] as const;

const DAILY_MEDIAN_KEYS = [
  'tempMin', 'tempMax', 'precipitationSum', 'precipitationProbability', 'windSpeedMax',
] as const;

function collect(points: HourlyPoint[], key: (typeof MEDIAN_KEYS)[number]): number[] {
  return points.map(p => p[key]).filter((v): v is number => v !== null);
}

export function buildConsensus(sources: SourceForecast[]): ConsensusForecast | null {
  if (sources.length === 0) return null;

  const byTime = new Map<string, { sourceId: string; point: HourlyPoint }[]>();
  for (const s of sources)
    for (const p of s.hourly) {
      const arr = byTime.get(p.time) ?? [];
      arr.push({ sourceId: s.sourceId, point: p });
      byTime.set(p.time, arr);
    }

  const times = [...byTime.keys()].sort();
  const hourly: ConsensusHourlyPoint[] = times.map(time => {
    const entries = byTime.get(time)!;
    const points = entries.map(e => e.point);
    const merged = { time } as ConsensusHourlyPoint;
    for (const key of MEDIAN_KEYS) merged[key] = median(collect(points, key));
    merged.windDirection = circularMeanDirection(
      points.map(p => p.windDirection).filter((v): v is number => v !== null));
    merged.weatherCode = mode(points.map(p => p.weatherCode).filter((v): v is number => v !== null));
    const temps = collect(points, 'temperature');
    merged.temperatureSpread = temps.length >= 2 ? Math.max(...temps) - Math.min(...temps) : null;
    merged.temperatureBySource = Object.fromEntries(entries.map(e => [e.sourceId, e.point.temperature]));
    merged.sourcesCount = points.length;
    return merged;
  });

  const dailySources = sources.filter(s => s.daily.length > 0);
  const dailyDates = [...new Set(dailySources.flatMap(s => s.daily.map(d => d.date)))].sort();
  const daily: DailyPoint[] = dailyDates.map(date => {
    const points = dailySources.map(s => s.daily.find(d => d.date === date)).filter((d): d is DailyPoint => !!d);
    const merged = { date } as DailyPoint;
    for (const key of DAILY_MEDIAN_KEYS)
      merged[key] = median(points.map(p => p[key]).filter((v): v is number => v !== null));
    merged.weatherCode = mode(points.map(p => p.weatherCode).filter((v): v is number => v !== null));
    merged.sunrise = points.find(p => p.sunrise)?.sunrise ?? null;
    merged.sunset = points.find(p => p.sunset)?.sunset ?? null;
    return merged;
  });

  const spreads = hourly.slice(0, 24).map(h => h.temperatureSpread).filter((v): v is number => v !== null);
  const avgSpread = spreads.length ? spreads.reduce((a, b) => a + b, 0) / spreads.length : 0;
  const agreement: Agreement = avgSpread < 1.5 ? 'alto' : avgSpread < 3 ? 'medio' : 'basso';

  return {
    hourly, daily, agreement,
    sourceIds: sources.map(s => s.sourceId),
    timezone: sources.find(s => s.timezone)?.timezone ?? null,
  };
}
