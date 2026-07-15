import { describe, expect, test } from 'vitest';
import { parseMetNorway } from './metNorway';
import { metNorwayFixture } from './__fixtures__/metNorway';

describe('parseMetNorway', () => {
  const f = parseMetNorway(metNorwayFixture);
  test('normalizza: vento m/s→km/h, tempo ISO UTC, symbol→WMO', () => {
    expect(f.sourceId).toBe('met_norway');
    expect(f.daily).toEqual([]);
    expect(f.hourly[0].time).toBe('2026-07-15T12:00:00.000Z');
    expect(f.hourly[0].windSpeed).toBe(9); // 2.5 m/s
    expect(f.hourly[0].windGusts).toBeCloseTo(16.2, 5);
    expect(f.hourly[0].weatherCode).toBe(2); // partlycloudy
    expect(f.hourly[1].weatherCode).toBe(61); // lightrain
    expect(f.hourly[1].precipitation).toBe(0.4);
  });
  test('campi assenti → null', () => {
    expect(f.hourly[2].precipitation).toBeNull();
    expect(f.hourly[2].weatherCode).toBeNull();
    expect(f.hourly[0].apparentTemperature).toBeNull(); // MET non la fornisce
  });
});
