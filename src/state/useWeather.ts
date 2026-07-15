import { useCallback, useEffect, useState } from 'react';
import { fetchAllSources } from '../api/sources';
import { buildConsensus, type ConsensusForecast } from '../domain/consensus';
import type { City, SourceForecast } from '../domain/types';

const REFRESH_MS = 15 * 60 * 1000;

export interface WeatherState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  consensus: ConsensusForecast | null;
  sources: SourceForecast[];
  failedSources: { id: string; name: string }[];
  updatedAt: Date | null;
  error: string | null;
}

const IDLE: WeatherState = {
  status: 'idle', consensus: null, sources: [], failedSources: [], updatedAt: null, error: null,
};

export function useWeather(city: City | null): WeatherState & { refresh: () => void } {
  const [state, setState] = useState<WeatherState>(IDLE);
  const lat = city?.lat, lon = city?.lon;

  const load = useCallback(async () => {
    if (lat === undefined || lon === undefined) {
      setState(IDLE);
      return;
    }
    setState(s => ({ ...s, status: s.consensus ? s.status : 'loading', error: null }));
    try {
      const { ok, failed } = await fetchAllSources(lat, lon);
      const consensus = buildConsensus(ok);
      if (!consensus) {
        setState(s => ({ ...s, status: 'error', error: 'Nessuna fonte meteo raggiungibile', failedSources: failed }));
        return;
      }
      setState({ status: 'ready', consensus, sources: ok, failedSources: failed, updatedAt: new Date(), error: null });
    } catch (e) {
      setState(s => ({ ...s, status: 'error', error: e instanceof Error ? e.message : String(e) }));
    }
  }, [lat, lon]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  return { ...state, refresh: () => void load() };
}
