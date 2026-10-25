import { useState } from 'react';
import { reverseGeocode } from '../api/geocoding';
import type { City } from '../domain/types';
import { getFavorites, isFavorite, toggleFavorite } from '../state/settings';
import { TEMP_UNITS, WIND_LABEL, WIND_UNITS } from '../domain/units';
import { THEME_SETTINGS, useTheme, type ThemeSetting } from '../state/theme';
import { useUnits } from '../state/units';
import { CitySearch } from './CitySearch';

interface Props { city: City | null; onSelectCity: (c: City) => void }

const next = <T,>(list: T[], current: T) => list[(list.indexOf(current) + 1) % list.length];

/** Due decimali ≈ 1 km. */
const roundCoord = (v: number) => Math.round(v * 100) / 100;

const THEME_ICON: Record<ThemeSetting, string> = { dark: '🌙', light: '☀️', auto: '🌓' };
const THEME_LABEL: Record<ThemeSetting, string> = { dark: 'scuro', light: 'chiaro', auto: 'come il sistema' };

export function Header({ city, onSelectCity }: Props) {
  const { units, setUnits } = useUnits();
  const { setting, setSetting } = useTheme();
  const [favorites, setFavorites] = useState<City[]>(getFavorites);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsBusy, setGpsBusy] = useState(false);

  const locate = () => {
    if (!navigator.geolocation) { setGpsError('Geolocalizzazione non supportata'); return; }
    setGpsBusy(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        // ~1 km di precisione basta per il meteo e non espone l'indirizzo esatto
        // ai servizi esterni né nell'URL condivisibile
        const lat = roundCoord(pos.coords.latitude), lon = roundCoord(pos.coords.longitude);
        try {
          onSelectCity(await reverseGeocode(lat, lon));
        } catch {
          onSelectCity({ name: 'Posizione attuale', lat, lon });
        } finally { setGpsBusy(false); }
      },
      () => { setGpsError('Permesso posizione negato: usa la ricerca'); setGpsBusy(false); },
      { timeout: 10000 },
    );
  };

  return (
    <header className="flex flex-col gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        <h1 className="text-lg font-bold text-sky-400 tracking-tight">allMeteo</h1>
        <CitySearch onSelect={onSelectCity} />
        <button
          onClick={locate}
          disabled={gpsBusy}
          aria-label="Usa la mia posizione"
          className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900/80 text-sm hover:border-sky-500 disabled:opacity-50"
        >
          {gpsBusy ? '…' : '📍'}
        </button>
        <button
          onClick={() => setUnits({ ...units, temp: next(TEMP_UNITS, units.temp) })}
          aria-label={`Unità temperatura: °${units.temp}, tocca per cambiare`}
          className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900/80 text-sm hover:border-sky-500"
        >
          °{units.temp}
        </button>
        <button
          onClick={() => setUnits({ ...units, wind: next(WIND_UNITS, units.wind) })}
          aria-label={`Unità vento: ${WIND_LABEL[units.wind]}, tocca per cambiare`}
          className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900/80 text-sm hover:border-sky-500"
        >
          {WIND_LABEL[units.wind]}
        </button>
        <button
          onClick={() => setSetting(next(THEME_SETTINGS, setting))}
          aria-label={`Tema: ${THEME_LABEL[setting]}, tocca per cambiare`}
          title={`Tema: ${THEME_LABEL[setting]}`}
          className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900/80 text-sm hover:border-sky-500"
        >
          {THEME_ICON[setting]}
        </button>
        {city && (
          <button
            onClick={() => setFavorites(toggleFavorite(city))}
            aria-label={isFavorite(city, favorites) ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
            className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900/80 text-sm hover:border-amber-400"
          >
            {isFavorite(city, favorites) ? '⭐' : '☆'}
          </button>
        )}
      </div>
      {favorites.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {favorites.map(f => (
            <button
              key={`${f.lat},${f.lon}`}
              onClick={() => onSelectCity(f)}
              className="shrink-0 px-3 py-1 rounded-full border border-slate-700 bg-slate-900/60 text-xs hover:border-sky-500"
            >
              ⭐ {f.name}
            </button>
          ))}
        </div>
      )}
      {gpsError && <p className="text-xs text-rose-400">{gpsError}</p>}
    </header>
  );
}
