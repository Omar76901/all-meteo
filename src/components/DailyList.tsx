import { useState } from 'react';
import { formatTime, formatWeekday } from '../domain/timeUtils';
import type { DailyPoint } from '../domain/types';
import { getWeatherInfo } from '../domain/weatherCodes';

const r = (v: number | null) => (v === null ? '–' : Math.round(v));

export function DailyList({ daily, timezone }: { daily: DailyPoint[]; timezone: string | null }) {
  const [openDate, setOpenDate] = useState<string | null>(null);
  return (
    <section className="panel">
      <p className="panel-title">Prossimi 7 giorni</p>
      <ul className="divide-y divide-slate-800">
        {daily.slice(0, 7).map(d => {
          const info = getWeatherInfo(d.weatherCode);
          const open = openDate === d.date;
          return (
            <li key={d.date}>
              <button
                className="w-full flex items-center gap-3 py-2 text-sm hover:bg-slate-800/40 rounded"
                onClick={() => setOpenDate(open ? null : d.date)}
              >
                <span className="w-16 text-left text-slate-400">{formatWeekday(d.date)}</span>
                <span className="text-lg">{info.icon}</span>
                <span className="w-12 text-sky-400 text-xs">
                  {d.precipitationProbability === null ? '' : `${Math.round(d.precipitationProbability)}%`}
                </span>
                <span className="flex-1 text-right text-slate-400">{r(d.tempMin)}°</span>
                <span className="w-10 text-right text-amber-300">{r(d.tempMax)}°</span>
                <span className="text-slate-600">{open ? '▴' : '▾'}</span>
              </button>
              {open && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-3 px-2 text-xs text-slate-400">
                  <p>{info.description}</p>
                  <p>🌧️ {d.precipitationSum === null ? '–' : `${d.precipitationSum} mm`}</p>
                  <p>💨 max {r(d.windSpeedMax)} km/h</p>
                  <p>
                    Alba {d.sunrise ? formatTime(d.sunrise, timezone) : '–'} · Tram. {d.sunset ? formatTime(d.sunset, timezone) : '–'}
                  </p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
