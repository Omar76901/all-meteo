import { describe, expect, test } from 'vitest';
import { OPEN_METEO_MODELS, parseOpenMeteo } from './openMeteo';
import { openMeteoFixture, openMeteoSuffixedFixture } from './__fixtures__/openMeteo';

const ecmwf = OPEN_METEO_MODELS.find(m => m.id === 'ecmwf')!;

describe('parseOpenMeteo', () => {
  test('normalizza orari (ISO UTC), unità e daily', () => {
    const f = parseOpenMeteo(openMeteoFixture, ecmwf);
    expect(f.sourceId).toBe('ecmwf');
    expect(f.timezone).toBe('Europe/Rome');
    expect(f.hourly).toHaveLength(3);
    expect(f.hourly[0].time).toBe('2026-07-15T12:00:00.000Z');
    expect(f.hourly[0].temperature).toBe(21.4);
    expect(f.hourly[1].precipitation).toBe(0.2);
    expect(f.hourly[0].windSpeed).toBe(8.4); // già km/h
    expect(f.daily).toHaveLength(1);
    expect(f.daily[0].date).toBe('2026-07-15');
    expect(f.daily[0].tempMax).toBe(24.8);
    expect(f.daily[0].sunrise).toBe('2026-07-15T04:00:00.000Z');
  });
  test('gestisce chiavi suffissate dal modello e campi mancanti → null', () => {
    const f = parseOpenMeteo(openMeteoSuffixedFixture, ecmwf);
    expect(f.hourly[0].temperature).toBe(21.0);
    expect(f.hourly[0].uvIndex).toBeNull();
    expect(f.hourly[0].humidity).toBeNull();
    expect(f.daily[0].tempMax).toBe(24.0);
    expect(f.daily[0].tempMin).toBeNull();
  });
});
