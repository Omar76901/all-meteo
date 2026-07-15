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
});
