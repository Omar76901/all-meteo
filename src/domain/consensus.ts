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

/**
 * Peso nel consenso dei modelli regionali ad alta risoluzione: dove coprono la
 * località prevalgono sui globali, che però restano e smorzano un locale anomalo.
 */
export const LOCAL_WEIGHT = 2;

export interface Weighted { value: number; weight: number }

const unweighted = (values: number[]): Weighted[] => values.map(value => ({ value, weight: 1 }));

/** Mediana pesata; a pesi uguali coincide con la mediana classica (media dei centrali se pari). */
export function weightedMedian(items: Weighted[]): number | null {
  if (items.length === 0) return null;
  const s = [...items].sort((a, b) => a.value - b.value);
  const half = s.reduce((t, x) => t + x.weight, 0) / 2;
  let acc = 0;
  for (let i = 0; i < s.length - 1; i++) {
    acc += s[i].weight;
    if (acc > half) return s[i].value;
    if (acc === half) return (s[i].value + s[i + 1].value) / 2;
  }
  return s[s.length - 1].value;
}

export const median = (values: number[]) => weightedMedian(unweighted(values));

/** Valore col peso totale maggiore; a parità vince il codice più alto (il più severo). */
export function weightedMode(items: Weighted[]): number | null {
  if (items.length === 0) return null;
  const totals = new Map<number, number>();
  for (const { value, weight } of items) totals.set(value, (totals.get(value) ?? 0) + weight);
  let best: number | null = null, bestTotal = 0;
  for (const [v, n] of totals)
    if (n > bestTotal || (n === bestTotal && (best === null || v > best))) { best = v; bestTotal = n; }
  return best;
}

export const mode = (values: number[]) => weightedMode(unweighted(values));

export function weightedCircularMean(items: Weighted[]): number | null {
  if (items.length === 0) return null;
  let x = 0, y = 0;
  for (const { value, weight } of items) {
    const r = (value * Math.PI) / 180;
    x += weight * Math.cos(r); y += weight * Math.sin(r);
  }
  const ang = (Math.atan2(y, x) * 180) / Math.PI;
  return (ang + 360) % 360;
}

export const circularMeanDirection = (deg: number[]) => weightedCircularMean(unweighted(deg));

const MEDIAN_KEYS = [
  'temperature', 'apparentTemperature', 'precipitation', 'precipitationProbability',
  'windSpeed', 'windGusts', 'humidity', 'pressure', 'uvIndex',
] as const;

const DAILY_MEDIAN_KEYS = [
  'tempMin', 'tempMax', 'precipitationSum', 'precipitationProbability', 'windSpeedMax',
] as const;

const weightOf = (s: SourceForecast) => (s.local ? LOCAL_WEIGHT : 1);

/** Valori non null di un campo, ciascuno col peso della sua fonte. */
function collect<P>(entries: { point: P; weight: number }[], get: (p: P) => number | null): Weighted[] {
  return entries.flatMap(({ point, weight }) => {
    const value = get(point);
    return value === null ? [] : [{ value, weight }];
  });
}

export function buildConsensus(sources: SourceForecast[]): ConsensusForecast | null {
  if (sources.length === 0) return null;

  const byTime = new Map<string, { sourceId: string; point: HourlyPoint; weight: number }[]>();
  for (const s of sources)
    for (const p of s.hourly) {
      const arr = byTime.get(p.time) ?? [];
      arr.push({ sourceId: s.sourceId, point: p, weight: weightOf(s) });
      byTime.set(p.time, arr);
    }

  const times = [...byTime.keys()].sort();
  const hourly: ConsensusHourlyPoint[] = times.map(time => {
    const entries = byTime.get(time)!;
    const merged = { time } as ConsensusHourlyPoint;
    for (const key of MEDIAN_KEYS) merged[key] = weightedMedian(collect(entries, p => p[key]));
    merged.windDirection = weightedCircularMean(collect(entries, p => p.windDirection));
    merged.weatherCode = weightedMode(collect(entries, p => p.weatherCode));
    const temps = collect(entries, p => p.temperature).map(t => t.value);
    merged.temperatureSpread = temps.length >= 2 ? Math.max(...temps) - Math.min(...temps) : null;
    const bySource = new Map(entries.map(e => [e.sourceId, e.point]));
    merged.temperatureBySource = Object.fromEntries(
      sources.map(s => [s.sourceId, bySource.get(s.sourceId)?.temperature ?? null]));
    merged.sourcesCount = entries.length;
    return merged;
  });

  const dailySources = sources.filter(s => s.daily.length > 0);
  const dailyDates = [...new Set(dailySources.flatMap(s => s.daily.map(d => d.date)))].sort();
  const daily: DailyPoint[] = dailyDates.map(date => {
    const entries = dailySources.flatMap(s => {
      const point = s.daily.find(d => d.date === date);
      return point ? [{ point, weight: weightOf(s) }] : [];
    });
    const points = entries.map(e => e.point);
    const merged = { date } as DailyPoint;
    for (const key of DAILY_MEDIAN_KEYS) merged[key] = weightedMedian(collect(entries, p => p[key]));
    merged.weatherCode = weightedMode(collect(entries, p => p.weatherCode));
    merged.sunrise = points.find(p => p.sunrise)?.sunrise ?? null;
    merged.sunset = points.find(p => p.sunset)?.sunset ?? null;
    return merged;
  });

  const spreads = hourly.slice(0, 24).map(h => h.temperatureSpread).filter((v): v is number => v !== null);
  const avgSpread = spreads.length ? spreads.reduce((a, b) => a + b, 0) / spreads.length : 0;
  const agreement: Agreement =
    spreads.length === 0 ? 'basso' : avgSpread < 1.5 ? 'alto' : avgSpread < 3 ? 'medio' : 'basso';

  return {
    hourly, daily, agreement,
    sourceIds: sources.map(s => s.sourceId),
    timezone: sources.find(s => s.timezone)?.timezone ?? null,
  };
}
