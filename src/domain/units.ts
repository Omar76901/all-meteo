/** I dati restano sempre in °C e km/h: la conversione avviene solo quando si mostrano. */
export type TempUnit = 'C' | 'F';
export type WindUnit = 'kmh' | 'ms' | 'kn' | 'mph';

export interface Units { temp: TempUnit; wind: WindUnit }

export const DEFAULT_UNITS: Units = { temp: 'C', wind: 'kmh' };

export const TEMP_UNITS: TempUnit[] = ['C', 'F'];
export const WIND_UNITS: WindUnit[] = ['kmh', 'ms', 'kn', 'mph'];

const WIND_FACTOR: Record<WindUnit, number> = { kmh: 1, ms: 1 / 3.6, kn: 1 / 1.852, mph: 1 / 1.609344 };
export const WIND_LABEL: Record<WindUnit, string> = { kmh: 'km/h', ms: 'm/s', kn: 'nodi', mph: 'mph' };

export const convertTemp = (c: number, u: TempUnit) => (u === 'F' ? c * 9 / 5 + 32 : c);
/** Per differenze di temperatura (es. divergenza tra fonti) non va aggiunto l'offset. */
export const convertTempDelta = (c: number, u: TempUnit) => (u === 'F' ? c * 9 / 5 : c);
export const convertWind = (kmh: number, u: WindUnit) => kmh * WIND_FACTOR[u];

/** "21°", o "–" se manca il dato. */
export function fmtTemp(c: number | null | undefined, u: TempUnit): string {
  return c == null ? '–' : `${Math.round(convertTemp(c, u))}°`;
}

/** "12 km/h"; in m/s una cifra decimale, altrimenti i venti deboli diventano tutti 1 o 2. */
export function fmtWind(kmh: number | null | undefined, u: WindUnit, withUnit = true): string {
  if (kmh == null) return '–';
  const v = convertWind(kmh, u);
  const n = u === 'ms' ? (Math.round(v * 10) / 10).toString() : Math.round(v).toString();
  return withUnit ? `${n} ${WIND_LABEL[u]}` : n;
}

export function parseUnits(raw: unknown): Units {
  const r = (raw ?? {}) as Partial<Units>;
  return {
    temp: TEMP_UNITS.includes(r.temp as TempUnit) ? r.temp! : DEFAULT_UNITS.temp,
    wind: WIND_UNITS.includes(r.wind as WindUnit) ? r.wind! : DEFAULT_UNITS.wind,
  };
}
