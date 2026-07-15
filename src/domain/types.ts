export interface City {
  name: string;
  region?: string;
  lat: number;
  lon: number;
}

/** Tutte le ore in ISO UTC (es. "2026-07-15T12:00:00.000Z"). Campi null se la fonte non li fornisce. */
export interface HourlyPoint {
  time: string;
  temperature: number | null;
  apparentTemperature: number | null;
  precipitation: number | null;          // mm
  precipitationProbability: number | null; // %
  windSpeed: number | null;              // km/h
  windGusts: number | null;              // km/h
  windDirection: number | null;          // gradi da cui proviene
  humidity: number | null;               // %
  pressure: number | null;               // hPa
  uvIndex: number | null;
  weatherCode: number | null;            // WMO
}

export interface DailyPoint {
  date: string;                          // "YYYY-MM-DD"
  tempMin: number | null;
  tempMax: number | null;
  precipitationSum: number | null;
  precipitationProbability: number | null;
  windSpeedMax: number | null;
  weatherCode: number | null;
  sunrise: string | null;                // ISO UTC
  sunset: string | null;                 // ISO UTC
}

export interface SourceForecast {
  sourceId: string;                      // 'ecmwf' | 'icon' | 'gfs' | 'met_norway'
  sourceName: string;
  timezone: string | null;               // IANA tz della città, se nota
  hourly: HourlyPoint[];
  daily: DailyPoint[];                   // può essere [] (MET Norway)
}
