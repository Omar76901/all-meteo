import { useMemo, useState } from 'react';
import { ChartsSection } from './components/ChartsSection';
import { CurrentCard } from './components/CurrentCard';
import { Header } from './components/Header';
import { HourlyStrip } from './components/HourlyStrip';
import { computeDayPhase, gradientFor } from './domain/background';
import { currentHourIndex, formatTime } from './domain/timeUtils';
import type { City } from './domain/types';
import { getWeatherInfo } from './domain/weatherCodes';
import { getLastCity, setLastCity } from './state/settings';
import { useWeather } from './state/useWeather';

export default function App() {
  const [city, setCity] = useState<City | null>(getLastCity);
  const weather = useWeather(city);
  const { consensus } = weather;

  const selectCity = (c: City) => { setCity(c); setLastCity(c); };

  const nowIdx = consensus ? currentHourIndex(consensus.hourly.map(h => h.time)) : 0;
  const current = consensus?.hourly[nowIdx] ?? null;

  const background = useMemo(() => {
    const category = getWeatherInfo(current?.weatherCode ?? null).category;
    const today = consensus?.daily[0];
    const phase = computeDayPhase(
      new Date(),
      today?.sunrise ? new Date(today.sunrise) : null,
      today?.sunset ? new Date(today.sunset) : null,
    );
    return gradientFor(category, phase);
  }, [current?.weatherCode, consensus?.daily]);

  return (
    <div className="min-h-screen" style={{ background }}>
      <div className="mx-auto max-w-3xl px-3 py-4 flex flex-col gap-4">
        <Header city={city} onSelectCity={selectCity} />

        {!city && (
          <section className="panel text-center py-14">
            <p className="text-2xl mb-2">⛅</p>
            <p className="text-slate-300">Cerca una città o usa 📍 per iniziare</p>
          </section>
        )}

        {weather.status === 'loading' && (
          <section className="panel text-center py-14 animate-pulse">Caricamento fonti meteo…</section>
        )}

        {weather.status === 'error' && (
          <section className="panel text-center py-10">
            <p className="text-rose-400 mb-3">{weather.error}</p>
            <button onClick={weather.refresh} className="px-4 py-2 rounded-lg border border-slate-600 hover:border-sky-500">
              Riprova
            </button>
          </section>
        )}

        {consensus && current && city && (
          <>
            <CurrentCard
              current={current}
              today={consensus.daily[0]}
              agreement={consensus.agreement}
              sourcesTotal={consensus.sourceIds.length + weather.failedSources.length}
              failedCount={weather.failedSources.length}
              cityName={city.name}
            />
            <HourlyStrip hourly={consensus.hourly} startIdx={nowIdx} timezone={consensus.timezone} />
            <ChartsSection hourly={consensus.hourly} startIdx={nowIdx} timezone={consensus.timezone} />
            {/* Task 13: <DailyList /> + <SourcesTable /> */}
            {/* Task 14: <RadarMap /> */}
            {weather.updatedAt && (
              <p className="text-center text-[10px] text-slate-500">
                aggiornato alle {formatTime(weather.updatedAt.toISOString(), consensus.timezone)}
                {' · '}
                <button onClick={weather.refresh} className="underline hover:text-sky-400">aggiorna</button>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
