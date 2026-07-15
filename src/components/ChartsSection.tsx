import {
  Area, Bar, CartesianGrid, ComposedChart, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import type { ConsensusHourlyPoint } from '../domain/consensus';
import { formatHour } from '../domain/timeUtils';

interface Props { hourly: ConsensusHourlyPoint[]; startIdx: number; timezone: string | null }

const AXIS = { stroke: '#475569', fontSize: 10 } as const;
const GRID = { stroke: '#1e293b', strokeDasharray: '3 3' } as const;
const TOOLTIP = {
  contentStyle: { background: '#0f172a', border: '1px solid #334155', borderRadius: 8, fontSize: 12 },
  labelStyle: { color: '#94a3b8' },
} as const;

export function ChartsSection({ hourly, startIdx, timezone }: Props) {
  const data = hourly.slice(startIdx, startIdx + 48).map(h => {
    const temps = Object.values(h.temperatureBySource).filter((v): v is number => v !== null);
    return {
      ora: formatHour(h.time, timezone),
      temp: h.temperature,
      banda: temps.length >= 2 ? [Math.min(...temps), Math.max(...temps)] : null,
      pioggia: h.precipitation,
      prob: h.precipitationProbability,
      vento: h.windSpeed,
      raffiche: h.windGusts,
      direzione: h.windDirection,
      pressione: h.pressure,
      umidita: h.humidity,
      uv: h.uvIndex,
    };
  });
  const arrows = data.filter((_, i) => i % 3 === 0);

  return (
    <div className="flex flex-col gap-4">
      <section className="panel">
        <p className="panel-title">Temperatura 48h · linea = consenso, banda = divergenza fonti</p>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="ora" {...AXIS} interval={5} />
            <YAxis {...AXIS} unit="°" width={32} domain={['auto', 'auto']} />
            <Tooltip {...TOOLTIP} />
            <Area dataKey="banda" fill="#fbbf24" fillOpacity={0.15} stroke="none" name="min–max fonti" />
            <Line dataKey="temp" stroke="#fbbf24" strokeWidth={2} dot={false} name="consenso °C" />
          </ComposedChart>
        </ResponsiveContainer>
      </section>

      <section className="panel">
        <p className="panel-title">Precipitazioni · barre = mm/h, linea = probabilità</p>
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={data}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="ora" {...AXIS} interval={5} />
            <YAxis yAxisId="mm" {...AXIS} unit="mm" width={40} />
            <YAxis yAxisId="pct" orientation="right" {...AXIS} unit="%" width={36} domain={[0, 100]} />
            <Tooltip {...TOOLTIP} />
            <Bar yAxisId="mm" dataKey="pioggia" fill="#38bdf8" name="mm/h" />
            <Line yAxisId="pct" dataKey="prob" stroke="#818cf8" strokeWidth={1.5} dot={false} name="probabilità %" />
          </ComposedChart>
        </ResponsiveContainer>
      </section>

      <section className="panel">
        <p className="panel-title">Vento · velocità e raffiche (km/h), frecce = direzione</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="ora" {...AXIS} interval={5} />
            <YAxis {...AXIS} width={32} />
            <Tooltip {...TOOLTIP} />
            <Line dataKey="vento" stroke="#38bdf8" strokeWidth={2} dot={false} name="vento" />
            <Line dataKey="raffiche" stroke="#38bdf8" strokeWidth={1} strokeDasharray="4 3" dot={false} name="raffiche" />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex justify-between px-8 text-sky-400 text-xs" aria-hidden>
          {arrows.map((d, i) => (
            <span key={i} style={{ transform: `rotate(${(d.direzione ?? 0) + 180}deg)`, display: 'inline-block' }}>↑</span>
          ))}
        </div>
      </section>

      <section className="panel">
        <p className="panel-title">Pressione · Umidità · UV</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {([['pressione', '#a78bfa', 'hPa'], ['umidita', '#34d399', '%'], ['uv', '#fb923c', '']] as const).map(([key, color, unit]) => (
            <ResponsiveContainer key={key} width="100%" height={110}>
              <LineChart data={data}>
                <XAxis dataKey="ora" {...AXIS} interval={11} />
                <YAxis {...AXIS} width={38} unit={unit} domain={['auto', 'auto']} />
                <Tooltip {...TOOLTIP} />
                <Line dataKey={key} stroke={color} strokeWidth={1.5} dot={false} name={key} />
              </LineChart>
            </ResponsiveContainer>
          ))}
        </div>
      </section>
    </div>
  );
}
