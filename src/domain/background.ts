import type { WeatherCategory } from './weatherCodes';

export type DayPhase = 'dawn' | 'day' | 'dusk' | 'night';

const EDGE_MS = 45 * 60 * 1000;

export function computeDayPhase(now: Date, sunrise: Date | null, sunset: Date | null): DayPhase {
  if (!sunrise || !sunset) {
    const h = now.getUTCHours();
    return h >= 8 && h < 19 ? 'day' : 'night';
  }
  const t = now.getTime();
  if (Math.abs(t - sunrise.getTime()) <= EDGE_MS) return 'dawn';
  if (Math.abs(t - sunset.getTime()) <= EDGE_MS) return 'dusk';
  return t > sunrise.getTime() && t < sunset.getTime() ? 'day' : 'night';
}

type Key = `${WeatherCategory}-${DayPhase}`;

const G = (stops: string) => `linear-gradient(170deg, ${stops})`;

const BASE: Record<DayPhase, string> = {
  dawn: G('#3b2f5c 0%, #7c3f58 35%, #0b1120 85%'),
  day: G('#1d4ed8 0%, #172554 45%, #0b1120 85%'),
  dusk: G('#7c2d12 0%, #4c1d95 40%, #0b1120 85%'),
  night: G('#1e1b4b 0%, #0f172a 45%, #020617 90%'),
};

const OVERRIDES: Partial<Record<Key, string>> = {
  'clear-day': G('#0284c7 0%, #1e40af 45%, #0b1120 90%'),
  'rain-day': G('#334155 0%, #1e3a5f 45%, #0b1120 85%'),
  'rain-night': G('#1e293b 0%, #0f172a 50%, #020617 90%'),
  'storm-day': G('#3f3f46 0%, #312e81 45%, #020617 85%'),
  'storm-night': G('#27272a 0%, #1e1b4b 50%, #020617 90%'),
  'snow-day': G('#64748b 0%, #334155 45%, #0b1120 85%'),
  'fog-day': G('#475569 0%, #1e293b 50%, #0b1120 90%'),
  'cloudy-day': G('#475569 0%, #1e3a8a 50%, #0b1120 90%'),
};

export function gradientFor(category: WeatherCategory, phase: DayPhase): string {
  return OVERRIDES[`${category}-${phase}`] ?? BASE[phase];
}
