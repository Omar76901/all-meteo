import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';
import type { WeatherState } from './state/useWeather';

afterEach(cleanup);

const milano = { name: 'Milano', lat: 45.4643, lon: 9.1895 };

vi.mock('./state/settings', () => ({
  getLastCity: () => milano,
  setLastCity: () => {},
}));

vi.mock('./components/Header', () => ({ Header: () => <div data-testid="header" /> }));
vi.mock('./components/CurrentCard', () => ({ CurrentCard: () => <div data-testid="current-card" /> }));
vi.mock('./components/HourlyStrip', () => ({ HourlyStrip: () => <div data-testid="hourly-strip" /> }));
vi.mock('./components/ChartsSection', () => ({ ChartsSection: () => <div data-testid="charts-section" /> }));
vi.mock('./components/DailyList', () => ({ DailyList: () => <div data-testid="daily-list" /> }));
vi.mock('./components/RadarMap', () => ({ RadarMap: () => <div data-testid="radar-map" /> }));
vi.mock('./components/SourcesTable', () => ({ SourcesTable: () => <div data-testid="sources-table" /> }));

const useWeatherMock = vi.fn();
vi.mock('./state/useWeather', () => ({ useWeather: (...a: unknown[]) => useWeatherMock(...a) }));

import App from './App';

const consensus = {
  hourly: [{
    time: '2026-07-15T12:00:00.000Z', temperature: 21, apparentTemperature: 20,
    precipitation: 0, precipitationProbability: 10, windSpeed: 8, windGusts: 15,
    windDirection: 180, humidity: 55, pressure: 1013, uvIndex: 3, weatherCode: 1,
    temperatureBySource: { ecmwf: 21 }, temperatureSpread: null, sourcesCount: 1,
  }],
  daily: [],
  agreement: 'alto' as const,
  sourceIds: ['ecmwf'],
  timezone: 'Europe/Rome',
};

function baseState(overrides: Partial<WeatherState>): WeatherState & { refresh: () => void } {
  return {
    status: 'ready', consensus: null, sources: [], failedSources: [], updatedAt: null, error: null,
    refresh: vi.fn(),
    ...overrides,
  };
}

describe('App - errore su refresh con dati stale', () => {
  test('status error + consenso presente: notice inline, niente pannello grande, dashboard visibile', () => {
    useWeatherMock.mockReturnValue(baseState({ status: 'error', consensus, error: 'boom' }));
    render(<App />);
    expect(screen.getByText(/Aggiornamento non riuscito/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Riprova' })).toBeNull();
    expect(screen.getByTestId('current-card')).toBeTruthy();
  });

  test('status error + consenso assente: pannello grande visibile, niente dashboard', () => {
    useWeatherMock.mockReturnValue(baseState({ status: 'error', consensus: null, error: 'boom' }));
    render(<App />);
    expect(screen.getByText('boom')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Riprova' })).toBeTruthy();
    expect(screen.queryByTestId('current-card')).toBeNull();
    expect(screen.queryByText(/Aggiornamento non riuscito/)).toBeNull();
  });
});
