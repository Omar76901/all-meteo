import type { ConsensusHourlyPoint } from './consensus';
import { formatDayHour } from './timeUtils';

export type AlertSeverity = 'giallo' | 'arancione' | 'rosso';

export interface WeatherAlert {
  id: string;
  severity: AlertSeverity;
  icon: string;
  title: string;
  description: string;
}

const SEVERITY_RANK: Record<AlertSeverity, number> = { rosso: 0, arancione: 1, giallo: 2 };

function grade(value: number, giallo: number, arancione: number, rosso: number): AlertSeverity | null {
  if (value >= rosso) return 'rosso';
  if (value >= arancione) return 'arancione';
  if (value >= giallo) return 'giallo';
  return null;
}

interface Peak { value: number; time: string }

function peakBy(points: ConsensusHourlyPoint[], select: (h: ConsensusHourlyPoint) => number | null): Peak | null {
  let best: Peak | null = null;
  for (const h of points) {
    const v = select(h);
    if (v !== null && (best === null || v > best.value)) best = { value: v, time: h.time };
  }
  return best;
}

const STORM_ORANGE = new Set([96, 99]);
const STORM_YELLOW = new Set([95]);
const SNOW_ORANGE = new Set([75, 86]);
const SNOW_YELLOW = new Set([71, 73, 77, 85]);

/** Allerte derivate dal consenso multi-fonte sulle prossime ore (non bollettini ufficiali). */
export function deriveAlerts(hourly: ConsensusHourlyPoint[], timezone: string | null): WeatherAlert[] {
  const window = hourly.slice(0, 48);
  if (window.length === 0) return [];
  const alerts: WeatherAlert[] = [];
  const when = (time: string) => formatDayHour(time, timezone);

  const push = (id: string, severity: AlertSeverity | null, icon: string, title: string, description: string) => {
    if (severity) alerts.push({ id, severity, icon, title, description });
  };

  const heat = peakBy(window, h => h.temperature);
  if (heat) push('caldo', grade(heat.value, 35, 37, 40), '🥵', 'Caldo intenso',
    `fino a ${Math.round(heat.value)}° · ${when(heat.time)}`);

  const cold = peakBy(window, h => (h.temperature === null ? null : -h.temperature));
  if (cold) push('gelo', grade(cold.value, 5, 10, 15), '🥶', 'Gelo',
    `fino a ${Math.round(-cold.value)}° · ${when(cold.time)}`);

  const wind = peakBy(window, h => h.windSpeed);
  if (wind) push('vento', grade(wind.value, 50, 70, 90), '💨', 'Vento forte',
    `fino a ${Math.round(wind.value)} km/h · ${when(wind.time)}`);

  const gusts = peakBy(window, h => h.windGusts);
  if (gusts) push('raffiche', grade(gusts.value, 70, 90, 110), '🌬️', 'Raffiche violente',
    `fino a ${Math.round(gusts.value)} km/h · ${when(gusts.time)}`);

  const rain = peakBy(window, h => h.precipitation);
  if (rain) push('pioggia', grade(rain.value, 6, 15, 30), '🌧️', 'Pioggia intensa',
    `fino a ${Math.round(rain.value)} mm/h · ${when(rain.time)}`);

  const stormOrange = window.find(h => h.weatherCode !== null && STORM_ORANGE.has(h.weatherCode));
  const stormYellow = window.find(h => h.weatherCode !== null && STORM_YELLOW.has(h.weatherCode));
  if (stormOrange) push('temporali', 'arancione', '⛈️', 'Temporali con grandine', `previsti ${when(stormOrange.time)}`);
  else if (stormYellow) push('temporali', 'giallo', '⛈️', 'Temporali', `previsti ${when(stormYellow.time)}`);

  const snowOrange = window.find(h => h.weatherCode !== null && SNOW_ORANGE.has(h.weatherCode));
  const snowYellow = window.find(h => h.weatherCode !== null && SNOW_YELLOW.has(h.weatherCode));
  if (snowOrange) push('neve', 'arancione', '❄️', 'Neve intensa', `prevista ${when(snowOrange.time)}`);
  else if (snowYellow) push('neve', 'giallo', '❄️', 'Neve', `prevista ${when(snowYellow.time)}`);

  const uv = peakBy(window, h => h.uvIndex);
  if (uv) push('uv', grade(uv.value, 8, 10, 11), '🔆', 'UV molto alto',
    `indice ${Math.round(uv.value)} · ${when(uv.time)}`);

  return alerts.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
}
