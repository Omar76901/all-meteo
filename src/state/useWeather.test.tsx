import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import type { SourceForecast } from '../domain/types';

const okSource: SourceForecast = {
  sourceId: 'ecmwf', sourceName: 'ECMWF', timezone: 'Europe/Rome', daily: [],
  hourly: [{
    time: '2026-07-15T12:00:00.000Z', temperature: 21, apparentTemperature: 20,
    precipitation: 0, precipitationProbability: 10, windSpeed: 8, windGusts: 15,
    windDirection: 180, humidity: 55, pressure: 1013, uvIndex: 3, weatherCode: 1,
  }],
};

function makeSource(temperature: number): SourceForecast {
  return {
    sourceId: 'ecmwf', sourceName: 'ECMWF', timezone: 'Europe/Rome', daily: [],
    hourly: [{
      time: '2026-07-15T12:00:00.000Z', temperature, apparentTemperature: temperature,
      precipitation: 0, precipitationProbability: 10, windSpeed: 8, windGusts: 15,
      windDirection: 180, humidity: 55, pressure: 1013, uvIndex: 3, weatherCode: 1,
    }],
  };
}

const fetchAllSources = vi.fn();
vi.mock('../api/sources', () => ({ fetchAllSources: (...a: unknown[]) => fetchAllSources(...a) }));

import { useWeather } from './useWeather';

const milano = { name: 'Milano', lat: 45.4643, lon: 9.1895 };

describe('useWeather', () => {
  test('carica e produce consenso', async () => {
    fetchAllSources.mockResolvedValue({ ok: [okSource], failed: [{ id: 'gfs', name: 'GFS (NOAA)' }] });
    const { result } = renderHook(() => useWeather(milano));
    expect(result.current.status).toBe('loading');
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.consensus!.hourly[0].temperature).toBe(21);
    expect(result.current.failedSources).toEqual([{ id: 'gfs', name: 'GFS (NOAA)' }]);
    expect(result.current.updatedAt).toBeInstanceOf(Date);
  });
  test('tutte le fonti giù → error', async () => {
    fetchAllSources.mockResolvedValue({ ok: [], failed: [{ id: 'ecmwf', name: 'ECMWF' }] });
    const { result } = renderHook(() => useWeather(milano));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('Nessuna fonte meteo raggiungibile');
  });
  test('senza città resta idle', async () => {
    const { result } = renderHook(() => useWeather(null));
    expect(result.current.status).toBe('idle');
  });
  test('refresh richiama il fetch', async () => {
    fetchAllSources.mockResolvedValue({ ok: [okSource], failed: [] });
    const { result } = renderHook(() => useWeather(milano));
    await waitFor(() => expect(result.current.status).toBe('ready'));
    const calls = fetchAllSources.mock.calls.length;
    await act(async () => result.current.refresh());
    expect(fetchAllSources.mock.calls.length).toBe(calls + 1);
  });

  test('nessun flicker di loading su refresh', async () => {
    fetchAllSources.mockResolvedValue({ ok: [okSource], failed: [] });
    const { result } = renderHook(() => useWeather(milano));
    await waitFor(() => expect(result.current.status).toBe('ready'));

    let resolveRefresh: (v: unknown) => void;
    const pending = new Promise(r => { resolveRefresh = r; });
    fetchAllSources.mockReturnValueOnce(pending);

    act(() => { result.current.refresh(); });
    expect(result.current.status).toBe('ready');

    await act(async () => {
      resolveRefresh({ ok: [okSource], failed: [] });
      await pending;
    });
    expect(result.current.status).toBe('ready');
  });

  test('auto-refresh rispetta la visibilità del documento', async () => {
    vi.useFakeTimers();
    try {
      fetchAllSources.mockResolvedValue({ ok: [okSource], failed: [] });
      const { result } = renderHook(() => useWeather(milano));
      await vi.waitFor(() => expect(result.current.status).toBe('ready'));

      const callsAfterInitial = fetchAllSources.mock.calls.length;

      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      await vi.advanceTimersByTimeAsync(15 * 60 * 1000);
      expect(fetchAllSources.mock.calls.length).toBe(callsAfterInitial);

      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
      await vi.advanceTimersByTimeAsync(15 * 60 * 1000);
      expect(fetchAllSources.mock.calls.length).toBe(callsAfterInitial + 1);
    } finally {
      vi.useRealTimers();
      Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
    }
  });

  test('scarta la risposta stale al cambio città in volo', async () => {
    let resolveA: (v: unknown) => void;
    const pA = new Promise(r => { resolveA = r; });
    fetchAllSources.mockReturnValueOnce(pA);

    const roma = { name: 'Roma', lat: 41.9028, lon: 12.4964 };
    const { result, rerender } = renderHook(({ city }) => useWeather(city), {
      initialProps: { city: milano as typeof milano | typeof roma },
    });
    expect(result.current.status).toBe('loading');

    fetchAllSources.mockResolvedValueOnce({ ok: [makeSource(99)], failed: [] });
    rerender({ city: roma });
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.consensus!.hourly[0].temperature).toBe(99);

    await act(async () => {
      resolveA({ ok: [makeSource(1)], failed: [] });
      await pA;
    });

    expect(result.current.consensus!.hourly[0].temperature).toBe(99);
  });
});
