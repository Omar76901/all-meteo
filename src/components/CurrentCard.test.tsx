import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import type { ConsensusHourlyPoint } from '../domain/consensus';
import { CurrentCard } from './CurrentCard';

const current: ConsensusHourlyPoint = {
  time: '2026-07-15T12:00:00.000Z', temperature: 21.34, apparentTemperature: 19.8,
  precipitation: 0, precipitationProbability: 35, windSpeed: 8, windGusts: 15,
  windDirection: 180, humidity: 55, pressure: 1013, uvIndex: 3, weatherCode: 2,
  temperatureBySource: { ecmwf: 21, icon: 21.5 }, temperatureSpread: 0.5, sourcesCount: 4,
};

describe('CurrentCard', () => {
  test('temperatura arrotondata, condizione, accordo e fonti', () => {
    render(<CurrentCard current={current} today={undefined} agreement="alto"
      sourcesTotal={4} failedCount={0} cityName="Milano" />);
    expect(screen.getByText('21°')).toBeTruthy();
    expect(screen.getByText(/Parzialmente nuvoloso/)).toBeTruthy();
    expect(screen.getByText(/accordo alto/i)).toBeTruthy();
    expect(screen.getByText('4/4 fonti')).toBeTruthy();
    expect(screen.getByText(/percepita 20°/i)).toBeTruthy();
  });
  test('fonte mancante → 3/4 fonti', () => {
    render(<CurrentCard current={current} today={undefined} agreement="medio"
      sourcesTotal={4} failedCount={1} cityName="Milano" />);
    expect(screen.getByText('3/4 fonti')).toBeTruthy();
  });
});
