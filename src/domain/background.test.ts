import { describe, expect, test } from 'vitest';
import { computeDayPhase, gradientFor } from './background';

const d = (h: number, m = 0) => new Date(Date.UTC(2026, 6, 15, h, m));

describe('computeDayPhase', () => {
  const sunrise = d(4, 40), sunset = d(19, 10);
  test('entro 45min dall\'alba → dawn', () => {
    expect(computeDayPhase(d(4, 20), sunrise, sunset)).toBe('dawn');
    expect(computeDayPhase(d(5, 20), sunrise, sunset)).toBe('dawn');
  });
  test('pieno giorno → day', () => expect(computeDayPhase(d(12), sunrise, sunset)).toBe('day'));
  test('entro 45min dal tramonto → dusk', () => expect(computeDayPhase(d(19, 30), sunrise, sunset)).toBe('dusk'));
  test('notte → night', () => expect(computeDayPhase(d(23), sunrise, sunset)).toBe('night'));
  test('senza alba/tramonto: 8-19 UTC day, altrimenti night', () => {
    expect(computeDayPhase(d(12), null, null)).toBe('day');
    expect(computeDayPhase(d(2), null, null)).toBe('night');
  });
});

describe('gradientFor', () => {
  test('restituisce sempre un linear-gradient', () => {
    for (const cat of ['clear', 'cloudy', 'fog', 'rain', 'snow', 'storm'] as const)
      for (const ph of ['dawn', 'day', 'dusk', 'night'] as const)
        expect(gradientFor(cat, ph)).toMatch(/^linear-gradient\(/);
  });
  test('sereno giorno ≠ pioggia notte', () => {
    expect(gradientFor('clear', 'day')).not.toBe(gradientFor('rain', 'night'));
  });
});
