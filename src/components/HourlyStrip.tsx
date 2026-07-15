import type { ConsensusHourlyPoint } from '../domain/consensus';
import { formatHour } from '../domain/timeUtils';
import { getWeatherInfo } from '../domain/weatherCodes';

interface Props { hourly: ConsensusHourlyPoint[]; startIdx: number; timezone: string | null }

export function HourlyStrip({ hourly, startIdx, timezone }: Props) {
  const slice = hourly.slice(startIdx, startIdx + 24);
  return (
    <section className="panel">
      <p className="panel-title">Prossime 24 ore</p>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {slice.map((h, i) => (
          <div key={h.time} className={`shrink-0 w-14 text-center rounded-lg py-2 ${i === 0 ? 'bg-sky-500/15 border border-sky-500/40' : ''}`}>
            <p className="text-[10px] text-slate-500">{i === 0 ? 'ora' : formatHour(h.time, timezone)}</p>
            <p className="text-base my-1">{getWeatherInfo(h.weatherCode).icon}</p>
            <p className="text-xs text-amber-300">{h.temperature === null ? '–' : `${Math.round(h.temperature)}°`}</p>
            <p className="text-[9px] text-sky-400">
              {h.precipitationProbability === null ? '' : `${Math.round(h.precipitationProbability)}%`}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
