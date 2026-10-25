import { useEffect, useState } from 'react';
import { aqiLevel, fetchAirQuality, pollenLevel, type AirQuality } from '../api/airQuality';

interface Props { lat: number; lon: number }

const r = (v: number | null) => (v === null ? '–' : Math.round(v));

export function AirQualityCard({ lat, lon }: Props) {
  const [aq, setAq] = useState<AirQuality | null>(null);

  useEffect(() => {
    let cancelled = false;
    setAq(null);
    fetchAirQuality(lat, lon)
      .then(d => { if (!cancelled) setAq(d); })
      // dato accessorio: se il servizio non risponde il pannello semplicemente non compare
      .catch(() => {});
    return () => { cancelled = true; };
  }, [lat, lon]);

  if (!aq || aq.aqi === null) return null;
  const level = aqiLevel(aq.aqi);
  const peak = aq.maxAqi24h !== null && aq.maxAqi24h > aq.aqi ? aqiLevel(aq.maxAqi24h) : null;
  const pollutants = [['PM2.5', aq.pm2_5], ['PM10', aq.pm10], ['Ozono', aq.ozone], ['NO₂', aq.no2]] as const;

  return (
    <section className="panel">
      <p className="panel-title">Qualità dell'aria{aq.pollen.length > 0 && ' e pollini'}</p>
      <div className="flex items-baseline gap-3 flex-wrap">
        <p className={`text-3xl font-light ${level.className}`}>{Math.round(aq.aqi)}</p>
        <p className={`text-sm ${level.className}`}>{level.label}</p>
        <p className="text-[10px] text-slate-500">indice europeo (EAQI)</p>
        {peak && (
          <p className="text-[10px] text-slate-400">
            picco 24h <span className={peak.className}>{Math.round(aq.maxAqi24h!)} · {peak.label}</span>
          </p>
        )}
      </div>
      <div className="grid grid-cols-4 gap-2 mt-3 text-center">
        {pollutants.map(([label, value]) => (
          <div key={label} className="bg-slate-950/40 border border-slate-800 rounded-lg py-2 px-1">
            <p className="text-[9px] text-slate-500">{label}</p>
            <p className="text-sm">{r(value)}<span className="text-[9px] text-slate-500"> µg/m³</span></p>
          </div>
        ))}
      </div>
      {aq.pollen.length > 0 && (
        <ul className="flex flex-wrap gap-2 mt-3">
          {aq.pollen.map(p => {
            const l = pollenLevel(p.value);
            return (
              <li key={p.name} className="text-[11px] border border-slate-700 rounded-full px-2 py-1">
                🌾 {p.name} <span className={l.className}>{l.label}</span>
                <span className="text-slate-500"> · {Math.round(p.value)}/m³</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
