import type { Agreement, ConsensusHourlyPoint } from '../domain/consensus';
import type { DailyPoint } from '../domain/types';
import { getWeatherInfo } from '../domain/weatherCodes';

interface Props {
  current: ConsensusHourlyPoint;
  today: DailyPoint | undefined;
  agreement: Agreement;
  sourcesTotal: number;
  failedCount: number;
  cityName: string;
}

const AGREEMENT_STYLE: Record<Agreement, string> = {
  alto: 'text-emerald-400 border-emerald-400/40',
  medio: 'text-amber-400 border-amber-400/40',
  basso: 'text-rose-400 border-rose-400/40',
};

const r = (v: number | null) => (v === null ? '–' : Math.round(v));

export function CurrentCard({ current, today, agreement, sourcesTotal, failedCount, cityName }: Props) {
  const info = getWeatherInfo(current.weatherCode);
  return (
    <section className="panel">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-sky-400 uppercase tracking-widest">{cityName}</p>
          <p className="text-6xl font-light text-amber-400 my-1">{r(current.temperature)}°</p>
          <p className="text-slate-300">{`${info.icon} ${info.description}`}</p>
          <p className="text-xs text-slate-500 mt-1">
            percepita {r(current.apparentTemperature)}°
            {today && <> · min {r(today.tempMin)}° / max {r(today.tempMax)}°</>}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 text-right">
          <span className={`text-[10px] uppercase tracking-wider border rounded-full px-2 py-1 ${AGREEMENT_STYLE[agreement]}`}>
            accordo {agreement}
            {current.temperatureSpread !== null && ` ±${(current.temperatureSpread / 2).toFixed(1)}°`}
          </span>
          <span className="text-[10px] text-slate-400 border border-slate-700 rounded-full px-2 py-1">
            {sourcesTotal - failedCount}/{sourcesTotal} fonti
          </span>
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4 text-center">
        {[
          ['💧 Umidità', current.humidity, '%'],
          ['🌧️ Pioggia', current.precipitationProbability, '%'],
          ['💨 Vento', current.windSpeed, ' km/h'],
          ['🌬️ Raffiche', current.windGusts, ' km/h'],
          ['📉 Pressione', current.pressure, ' hPa'],
          ['🔆 UV', current.uvIndex, ''],
        ].map(([label, value, unit]) => (
          <div key={label as string} className="bg-slate-950/40 border border-slate-800 rounded-lg py-2 px-1">
            <p className="text-[9px] text-slate-500">{label}</p>
            <p className="text-sm">{value === null ? '–' : `${Math.round(value as number)}${unit}`}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
