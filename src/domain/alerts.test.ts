import { describe, expect, test } from 'vitest';
import { deriveAlerts } from './alerts';
import type { ConsensusHourlyPoint } from './consensus';

const hour = (i: number, over: Partial<ConsensusHourlyPoint>): ConsensusHourlyPoint => ({
  time: new Date(Date.UTC(2026, 6, 15, 10 + i)).toISOString(),
  temperature: 22, apparentTemperature: 22, precipitation: 0, precipitationProbability: 0,
  windSpeed: 10, windGusts: 15, windDirection: 180, humidity: 50, pressure: 1013,
  uvIndex: 3, weatherCode: 1, temperatureBySource: {}, temperatureSpread: 0.5, sourcesCount: 4,
  ...over,
});

const calm = Array.from({ length: 12 }, (_, i) => hour(i, {}));

describe('deriveAlerts', () => {
  test('condizioni tranquille → nessuna allerta', () => {
    expect(deriveAlerts(calm, 'Europe/Rome')).toEqual([]);
    expect(deriveAlerts([], 'Europe/Rome')).toEqual([]);
  });

  test('caldo: 36° giallo, 38° arancione, 41° rosso', () => {
    expect(deriveAlerts([hour(0, { temperature: 36 })], null)[0]).toMatchObject({ id: 'caldo', severity: 'giallo' });
    expect(deriveAlerts([hour(0, { temperature: 38 })], null)[0]).toMatchObject({ id: 'caldo', severity: 'arancione' });
    expect(deriveAlerts([hour(0, { temperature: 41 })], null)[0]).toMatchObject({ id: 'caldo', severity: 'rosso' });
  });

  test('gelo: -6° giallo, -12° arancione, -16° rosso', () => {
    expect(deriveAlerts([hour(0, { temperature: -6 })], null)[0]).toMatchObject({ id: 'gelo', severity: 'giallo' });
    expect(deriveAlerts([hour(0, { temperature: -12 })], null)[0]).toMatchObject({ id: 'gelo', severity: 'arancione' });
    expect(deriveAlerts([hour(0, { temperature: -16 })], null)[0]).toMatchObject({ id: 'gelo', severity: 'rosso' });
  });

  test('vento e raffiche', () => {
    expect(deriveAlerts([hour(0, { windSpeed: 55 })], null)[0]).toMatchObject({ id: 'vento', severity: 'giallo' });
    expect(deriveAlerts([hour(0, { windSpeed: 75 })], null)[0]).toMatchObject({ id: 'vento', severity: 'arancione' });
    expect(deriveAlerts([hour(0, { windGusts: 95 })], null)[0]).toMatchObject({ id: 'raffiche', severity: 'arancione' });
  });

  test('pioggia intensa dal rateo orario', () => {
    expect(deriveAlerts([hour(0, { precipitation: 7 })], null)[0]).toMatchObject({ id: 'pioggia', severity: 'giallo' });
    expect(deriveAlerts([hour(0, { precipitation: 31 })], null)[0]).toMatchObject({ id: 'pioggia', severity: 'rosso' });
  });

  test('temporali dal weatherCode: 95 giallo, 96/99 arancione (grandine)', () => {
    expect(deriveAlerts([hour(0, { weatherCode: 95 })], null)[0]).toMatchObject({ id: 'temporali', severity: 'giallo' });
    expect(deriveAlerts([hour(0, { weatherCode: 99 })], null)[0]).toMatchObject({ id: 'temporali', severity: 'arancione' });
  });

  test('neve: 73 giallo, 75 arancione', () => {
    expect(deriveAlerts([hour(0, { weatherCode: 73 })], null)[0]).toMatchObject({ id: 'neve', severity: 'giallo' });
    expect(deriveAlerts([hour(0, { weatherCode: 75 })], null)[0]).toMatchObject({ id: 'neve', severity: 'arancione' });
  });

  test('UV: 8 giallo, 11 rosso', () => {
    expect(deriveAlerts([hour(0, { uvIndex: 8 })], null)[0]).toMatchObject({ id: 'uv', severity: 'giallo' });
    expect(deriveAlerts([hour(0, { uvIndex: 11 })], null)[0]).toMatchObject({ id: 'uv', severity: 'rosso' });
  });

  test('ordinate per gravità: rosso prima di giallo', () => {
    const alerts = deriveAlerts([hour(0, { temperature: 41, uvIndex: 8 })], null);
    expect(alerts.map(a => a.severity)).toEqual(['rosso', 'giallo']);
  });

  test('la descrizione indica quando (giorno e ora)', () => {
    const a = deriveAlerts([hour(5, { temperature: 36 })], 'Europe/Rome')[0];
    expect(a.description).toMatch(/mer 15/);
    expect(a.description).toContain('36°');
  });

  test('valori null ignorati senza errori', () => {
    expect(deriveAlerts([hour(0, { temperature: null, windSpeed: null, windGusts: null, precipitation: null, uvIndex: null, weatherCode: null })], null)).toEqual([]);
  });
});
