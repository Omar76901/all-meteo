import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import type { DailyPoint } from '../domain/types';
import { DailyList } from './DailyList';

const day: DailyPoint = {
  date: '2026-07-15', tempMin: 16.2, tempMax: 24.8, precipitationSum: 1.2,
  precipitationProbability: 45, windSpeedMax: 14, weatherCode: 2,
  sunrise: '2026-07-15T04:00:00.000Z', sunset: '2026-07-15T19:10:00.000Z',
};

describe('DailyList', () => {
  test('riga con min/max e probabilità; click espande i dettagli', () => {
    render(<DailyList daily={[day]} timezone="Europe/Rome" />);
    expect(screen.getByText('16°')).toBeTruthy();
    expect(screen.getByText('25°')).toBeTruthy();
    expect(screen.getByText('45%')).toBeTruthy();
    expect(screen.queryByText(/Alba/)).toBeNull();
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByText(/Alba/)).toBeTruthy();
    expect(screen.getByText(/1.2 mm/)).toBeTruthy();
  });
});
