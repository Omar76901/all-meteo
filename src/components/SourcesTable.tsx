import { SOURCE_LABELS } from '../api/sources';
import type { ConsensusForecast } from '../domain/consensus';
import { currentHourIndex } from '../domain/timeUtils';
import type { SourceForecast } from '../domain/types';

interface Props {
  sources: SourceForecast[];
  failed: { id: string; name: string }[];
  consensus: ConsensusForecast;
}

const fmt = (v: number | null | undefined, unit = '') => (v == null ? '–' : `${Math.round(v * 10) / 10}${unit}`);

export function SourcesTable({ sources, failed, consensus }: Props) {
  const nowIdx = currentHourIndex(consensus.hourly.map(h => h.time));
  const nowTime = consensus.hourly[nowIdx]?.time;
  const consNow = consensus.hourly[nowIdx];
  return (
    <section className="panel overflow-x-auto">
      <p className="panel-title">Confronto fonti · adesso</p>
      <table className="w-full text-xs min-w-96">
        <thead>
          <tr className="text-slate-500 text-left">
            <th className="py-1 pr-2 font-normal">Fonte</th>
            <th className="py-1 pr-2 font-normal">Stato</th>
            <th className="py-1 pr-2 font-normal">Temp</th>
            <th className="py-1 pr-2 font-normal">Pioggia</th>
            <th className="py-1 pr-2 font-normal">Vento</th>
          </tr>
        </thead>
        <tbody>
          {sources.map(s => {
            const p = s.hourly.find(h => h.time === nowTime);
            return (
              <tr key={s.sourceId} className="border-t border-slate-800">
                <td className="py-1.5 pr-2">{SOURCE_LABELS[s.sourceId] ?? s.sourceName}</td>
                <td className="py-1.5 pr-2 text-emerald-400">● ok</td>
                <td className="py-1.5 pr-2 text-amber-300">{fmt(p?.temperature, '°')}</td>
                <td className="py-1.5 pr-2 text-sky-400">{fmt(p?.precipitation, ' mm')}</td>
                <td className="py-1.5 pr-2">{fmt(p?.windSpeed, ' km/h')}</td>
              </tr>
            );
          })}
          {failed.map(f => (
            <tr key={f.id} className="border-t border-slate-800 text-slate-600">
              <td className="py-1.5 pr-2">{f.name}</td>
              <td className="py-1.5 pr-2 text-rose-400">● errore</td>
              <td colSpan={3} className="py-1.5 pr-2">non disponibile</td>
            </tr>
          ))}
          <tr className="border-t-2 border-slate-700 font-bold">
            <td className="py-1.5 pr-2 text-sky-400">Consenso</td>
            <td className="py-1.5 pr-2" />
            <td className="py-1.5 pr-2 text-amber-300">{fmt(consNow?.temperature, '°')}</td>
            <td className="py-1.5 pr-2 text-sky-400">{fmt(consNow?.precipitation, ' mm')}</td>
            <td className="py-1.5 pr-2">{fmt(consNow?.windSpeed, ' km/h')}</td>
          </tr>
        </tbody>
      </table>
    </section>
  );
}
