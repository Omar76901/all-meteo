import { describe, expect, test } from 'vitest';
import { convertTempDelta, fmtTemp, fmtWind, parseUnits } from './units';

describe('unità', () => {
  test('temperatura', () => {
    expect(fmtTemp(21.4, 'C')).toBe('21°');
    expect(fmtTemp(0, 'F')).toBe('32°');
    expect(fmtTemp(-40, 'F')).toBe('-40°');
    expect(fmtTemp(null, 'F')).toBe('–');
    expect(convertTempDelta(2, 'F')).toBeCloseTo(3.6);
  });
  test('vento', () => {
    expect(fmtWind(36, 'kmh')).toBe('36 km/h');
    expect(fmtWind(10, 'ms')).toBe('2.8 m/s');
    expect(fmtWind(18.52, 'kn')).toBe('10 nodi');
    expect(fmtWind(16.09, 'mph', false)).toBe('10');
    expect(fmtWind(undefined, 'kmh')).toBe('–');
  });
  test('impostazioni salvate non valide → default', () => {
    expect(parseUnits({ temp: 'K', wind: 'ms' })).toEqual({ temp: 'C', wind: 'ms' });
    expect(parseUnits(null)).toEqual({ temp: 'C', wind: 'kmh' });
  });
});
