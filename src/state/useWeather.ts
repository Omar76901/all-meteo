import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAllSources } from '../api/sources';
import { buildConsensus, type ConsensusForecast } from '../domain/consensus';
import type { City, SourceForecast } from '../domain/types';
import { getSnapshot, setSnapshot } from './settings';

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
  const requestSeq = useRef(0);
  const shownCity = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (lat === undefined || lon === undefined) {
      requestSeq.current++;
      shownCity.current = null;
      setState(IDLE);
      return;
    }
    const seq = ++requestSeq.current;
    const key = `${lat},${lon}`;
    // al cambio città mostra subito le ultime previsioni salvate, se ci sono, mentre arrivano le nuove
    const snapshot = shownCity.current !== key ? getSnapshot({ lat, lon }) : null;
    const fromSnapshot = snapshot && buildConsensus(snapshot.sources);
    shownCity.current = key;
    if (snapshot && fromSnapshot) {
      setState({
        status: 'ready', consensus: fromSnapshot, sources: snapshot.sources, failedSources: snapshot.failedSources,
        updatedAt: new Date(snapshot.savedAt), error: null,
      });
    } else {
      setState(s => ({ ...s, status: s.consensus ? s.status : 'loading', error: null }));
    }
    try {
      const { ok, failed } = await fetchAllSources(lat, lon);
      if (seq !== requestSeq.current) return;
      const consensus = buildConsensus(ok);
      if (!consensus) {
        setState(s => ({ ...s, status: 'error', error: 'Nessuna fonte meteo raggiungibile', failedSources: failed }));
        return;
      }
      const updatedAt = new Date();
      setSnapshot({ lat, lon }, ok, failed, updatedAt);
      setState({ status: 'ready', consensus, sources: ok, failedSources: failed, updatedAt, error: null });
    } catch (e) {
      if (seq !== requestSeq.current) return;
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
