import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import type { ConsensusHourlyPoint } from '../domain/consensus';
import { ChartsSection } from './ChartsSection';

// Recharts ResponsiveContainer non misura in jsdom: stub con dimensioni fisse
vi.mock('recharts', async importOriginal => {
  const mod = await importOriginal<typeof import('recharts')>();
  return {
    ...mod,
    ResponsiveContainer: ({ children }: { children: React.ReactElement }) => (
      <div style={{ width: 500, height: 200 }}>{children}</div>
    ),
  };
});

const mk = (i: number): ConsensusHourlyPoint => ({
  time: new Date(Date.UTC(2026, 6, 15, i)).toISOString(),
  temperature: 20 + i * 0.1, apparentTemperature: 19, precipitation: i % 3 ? 0 : 0.5,
  precipitationProbability: 30, windSpeed: 10, windGusts: 18, windDirection: (i * 30) % 360,
  humidity: 50, pressure: 1013, uvIndex: 3, weatherCode: 2,
  temperatureBySource: { a: 20 + i * 0.1, b: 21 + i * 0.1 }, temperatureSpread: 1, sourcesCount: 2,
});

describe('ChartsSection', () => {
  test('renderizza i 4 pannelli', () => {
    render(<ChartsSection hourly={Array.from({ length: 48 }, (_, i) => mk(i))} startIdx={0} timezone="Europe/Rome" />);
    expect(screen.getByText(/Temperatura 48h/i)).toBeTruthy();
    expect(screen.getByText(/Precipitazioni/i)).toBeTruthy();
    expect(screen.getByText(/Vento/i)).toBeTruthy();
    expect(screen.getByText(/Pressione/i)).toBeTruthy();
  });
});
