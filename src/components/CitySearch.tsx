import { useEffect, useRef, useState } from 'react';
import { searchCities } from '../api/geocoding';
import type { City } from '../domain/types';

export function CitySearch({ onSelect }: { onSelect: (c: City) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<City[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    clearTimeout(timer.current);
    if (query.trim().length < 2) { setResults([]); return; }
    timer.current = setTimeout(() => {
      searchCities(query).then(r => { setResults(r); setOpen(true); }).catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(timer.current);
  }, [query]);

  return (
    <div className="relative flex-1 min-w-40 max-w-72">
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        placeholder="Cerca città…"
        aria-label="Cerca città"
        className="w-full bg-slate-900/80 border border-slate-700 rounded-lg px-3 py-2 text-sm
                   placeholder:text-slate-600 focus:outline-none focus:border-sky-500"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-40 mt-1 w-full bg-slate-900 border border-slate-700 rounded-lg overflow-hidden">
          {results.map((c, i) => (
            <li key={`${c.lat},${c.lon},${i}`}>
              <button
                className="w-full text-left px-3 py-2 text-sm hover:bg-slate-800"
                onClick={() => { onSelect(c); setQuery(''); setOpen(false); }}
              >
                {c.name} <span className="text-slate-500">{c.region ?? ''}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
