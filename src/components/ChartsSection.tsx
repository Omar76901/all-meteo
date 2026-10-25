import {
  Area, Bar, CartesianGrid, ComposedChart, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import type { ConsensusHourlyPoint } from '../domain/consensus';
import { formatDayHour, formatHour } from '../domain/timeUtils';
import { WIND_LABEL, convertTemp, convertWind } from '../domain/units';
import { useTheme, type Theme } from '../state/theme';
import { useUnits } from '../state/units';

interface Props { hourly: ConsensusHourlyPoint[]; startIdx: number; timezone: string | null }

const round1 = (v: number) => Math.round(v * 10) / 10;

/** I colori SVG di recharts sono attributi, non CSS: le variabili del tema non arrivano, servono due palette. */
const PALETTE: Record<Theme, Record<string, string>> = {
  dark: {
    axis: '#475569', grid: '#1e293b', tipBg: '#0f172a', tipBorder: '#334155', tipLabel: '#94a3b8',
    temp: '#fbbf24', rain: '#38bdf8', prob: '#818cf8', wind: '#38bdf8',
    pressione: '#a78bfa', umidita: '#34d399', uv: '#fb923c',
  },
  light: {
    axis: '#64748b', grid: '#cbd5e1', tipBg: '#ffffff', tipBorder: '#cbd5e1', tipLabel: '#475569',
    temp: '#d97706', rain: '#0284c7', prob: '#4f46e5', wind: '#0284c7',
    pressione: '#7c3aed', umidita: '#059669', uv: '#ea580c',
  },
};

const tooltipFormatter = (value: unknown) =>
  Array.isArray(value)
    ? value.map(x => (typeof x === 'number' ? round1(x) : String(x))).join(' ~ ')
    : typeof value === 'number' ? round1(value) : String(value ?? '');

export function ChartsSection({ hourly, startIdx, timezone }: Props) {
  const { units } = useUnits();
  const c = PALETTE[useTheme().theme];
  const AXIS = { stroke: c.axis, fontSize: 10 } as const;
  const GRID = { stroke: c.grid, strokeDasharray: '3 3' } as const;
  const TOOLTIP = {
    contentStyle: { background: c.tipBg, border: `1px solid ${c.tipBorder}`, borderRadius: 8, fontSize: 12 },
    labelStyle: { color: c.tipLabel },
    formatter: tooltipFormatter,
  } as const;
  const temp = (v: number | null) => (v === null ? null : convertTemp(v, units.temp));
  const wind = (v: number | null) => (v === null ? null : convertWind(v, units.wind));
  // L'asse X usa l'ISO completo come chiave: le sole ore si ripetono su 48h e
  // farebbero agganciare tooltip/dot alla prima occorrenza duplicata.
  const data = hourly.slice(startIdx, startIdx + 48).map(h => {
    const temps = Object.values(h.temperatureBySource)
      .filter((v): v is number => v !== null)
      .map(v => convertTemp(v, units.temp));
    return {
      t: h.time,
      temp: temp(h.temperature),
      banda: temps.length >= 2 ? [Math.min(...temps), Math.max(...temps)] : null,
      pioggia: h.precipitation,
      prob: h.precipitationProbability,
      vento: wind(h.windSpeed),
      raffiche: wind(h.windGusts),
      direzione: h.windDirection,
      pressione: h.pressure,
      umidita: h.humidity,
      uv: h.uvIndex,
    };
  });
  const arrows = data.filter((_, i) => i % 3 === 0);
  const tickHour = (t: string) => formatHour(t, timezone);
  const labelDayHour = (t: unknown) => (typeof t === 'string' ? formatDayHour(t, timezone) : '');

  return (
    <div className="flex flex-col gap-4">
      <section className="panel">
        <p className="panel-title">Temperatura 48h · linea = consenso, banda = divergenza fonti</p>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart data={data}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="t" tickFormatter={tickHour} {...AXIS} interval={5} />
            <YAxis {...AXIS} unit="°" width={32} domain={['auto', 'auto']} />
            <Tooltip {...TOOLTIP} labelFormatter={labelDayHour} />
            <Area dataKey="banda" fill={c.temp} fillOpacity={0.15} stroke="none" name="min–max fonti" />
            <Line dataKey="temp" stroke={c.temp} strokeWidth={2} dot={false} name={`consenso °${units.temp}`} />
          </ComposedChart>
        </ResponsiveContainer>
      </section>

      <section className="panel">
        <p className="panel-title">Precipitazioni · barre = mm/h, linea = probabilità</p>
        <ResponsiveContainer width="100%" height={180}>
          <ComposedChart data={data}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="t" tickFormatter={tickHour} {...AXIS} interval={5} />
            <YAxis yAxisId="mm" {...AXIS} unit="mm" width={40} />
            <YAxis yAxisId="pct" orientation="right" {...AXIS} unit="%" width={36} domain={[0, 100]} />
            <Tooltip {...TOOLTIP} labelFormatter={labelDayHour} />
            <Bar yAxisId="mm" dataKey="pioggia" fill={c.rain} name="mm/h" />
            <Line yAxisId="pct" dataKey="prob" stroke={c.prob} strokeWidth={1.5} dot={false} name="probabilità %" />
          </ComposedChart>
        </ResponsiveContainer>
      </section>

      <section className="panel">
        <p className="panel-title">Vento · velocità e raffiche ({WIND_LABEL[units.wind]}), frecce = direzione</p>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={data}>
            <CartesianGrid {...GRID} />
            <XAxis dataKey="t" tickFormatter={tickHour} {...AXIS} interval={5} />
            <YAxis {...AXIS} width={32} />
            <Tooltip {...TOOLTIP} labelFormatter={labelDayHour} />
            <Line dataKey="vento" stroke={c.wind} strokeWidth={2} dot={false} name="vento" />
            <Line dataKey="raffiche" stroke={c.wind} strokeWidth={1} strokeDasharray="4 3" dot={false} name="raffiche" />
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
          {([['pressione', 'hPa'], ['umidita', '%'], ['uv', '']] as const).map(([key, unit]) => (
            <ResponsiveContainer key={key} width="100%" height={110}>
              <LineChart data={data}>
                <XAxis dataKey="t" tickFormatter={tickHour} {...AXIS} interval={11} />
                <YAxis {...AXIS} width={38} unit={unit} domain={['auto', 'auto']} />
                <Tooltip {...TOOLTIP} labelFormatter={labelDayHour} />
                <Line dataKey={key} stroke={c[key]} strokeWidth={1.5} dot={false} name={key} />
              </LineChart>
            </ResponsiveContainer>
          ))}
        </div>
      </section>
    </div>
  );
}
