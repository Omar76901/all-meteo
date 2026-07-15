import { useState } from 'react';
import { reverseGeocode } from '../api/geocoding';
import type { City } from '../domain/types';
import { getFavorites, isFavorite, toggleFavorite } from '../state/settings';
import { CitySearch } from './CitySearch';

interface Props { city: City | null; onSelectCity: (c: City) => void }

export function Header({ city, onSelectCity }: Props) {
  const [favorites, setFavorites] = useState<City[]>(getFavorites);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [gpsBusy, setGpsBusy] = useState(false);

  const locate = () => {
    if (!navigator.geolocation) { setGpsError('Geolocalizzazione non supportata'); return; }
    setGpsBusy(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          onSelectCity(await reverseGeocode(pos.coords.latitude, pos.coords.longitude));
        } catch {
          onSelectCity({ name: 'Posizione attuale', lat: pos.coords.latitude, lon: pos.coords.longitude });
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
