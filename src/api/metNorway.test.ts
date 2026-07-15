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

  test('input malformato non lancia', () => {
    expect(parseMetNorway(null).hourly).toEqual([]);
    expect(parseMetNorway({}).hourly).toEqual([]);
    expect(parseMetNorway({ properties: {} }).hourly).toEqual([]);
  });

  test('entry senza data o con time non valido vengono scartate', () => {
    const f = parseMetNorway({
      properties: {
        timeseries: [
          { time: 'not-a-date', data: { instant: { details: { air_temperature: 1 } } } },
          { time: '2026-07-15T12:00:00Z' }, // senza data
          { time: '2026-07-15T13:00:00Z', data: { instant: { details: { air_temperature: 2 } } } },
        ] as unknown
      }
    } as unknown);
    expect(f.hourly).toHaveLength(1);
    expect(f.hourly[0].temperature).toBe(2);
  });
});
