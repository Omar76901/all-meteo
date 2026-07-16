import { describe, expect, test } from 'vitest';
import { buildConsensus, circularMeanDirection, median, mode } from './consensus';
import type { HourlyPoint, SourceForecast } from './types';

const hour = (time: string, over: Partial<HourlyPoint>): HourlyPoint => ({
  time, temperature: null, apparentTemperature: null, precipitation: null,
  precipitationProbability: null, windSpeed: null, windGusts: null, windDirection: null,
  humidity: null, pressure: null, uvIndex: null, weatherCode: null, ...over,
});

const src = (sourceId: string, hourly: HourlyPoint[], daily: SourceForecast['daily'] = []): SourceForecast =>
  ({ sourceId, sourceName: sourceId, timezone: 'Europe/Rome', hourly, daily });

const T0 = '2026-07-15T12:00:00.000Z';
const T1 = '2026-07-15T13:00:00.000Z';

describe('median / mode / circularMeanDirection', () => {
  test('median dispari e pari', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([])).toBeNull();
  });
  test('mode con tie → valore più alto', () => {
    expect(mode([2, 2, 61, 61])).toBe(61);
    expect(mode([0, 0, 3])).toBe(0);
    expect(mode([])).toBeNull();
  });
  test('direzione circolare: 350° e 10° → 0°, non 180°', () => {
    expect(circularMeanDirection([350, 10])!).toBeCloseTo(0, 5);
    expect(circularMeanDirection([90, 180])!).toBeCloseTo(135, 5);
    expect(circularMeanDirection([])).toBeNull();
  });
});

describe('buildConsensus', () => {
  test('mediana per ora allineata sul timestamp, spread e conteggio fonti', () => {
    const c = buildConsensus([
      src('a', [hour(T0, { temperature: 20, weatherCode: 0 })]),
      src('b', [hour(T0, { temperature: 22, weatherCode: 61 }), hour(T1, { temperature: 21 })]),
      src('c', [hour(T0, { temperature: 24, weatherCode: 61 })]),
    ])!;
    expect(c.hourly).toHaveLength(2);
    const p0 = c.hourly[0];
    expect(p0.time).toBe(T0);
    expect(p0.temperature).toBe(22);
    expect(p0.temperatureSpread).toBe(4);
    expect(p0.sourcesCount).toBe(3);
    expect(p0.weatherCode).toBe(61); // moda
    expect(p0.temperatureBySource).toEqual({ a: 20, b: 22, c: 24 });
    expect(c.hourly[1].temperatureBySource).toEqual({ a: null, b: 21, c: null });
    expect(c.hourly[1].sourcesCount).toBe(1);
  });
  test('valori null ignorati nella mediana', () => {
    const c = buildConsensus([
      src('a', [hour(T0, { temperature: null, humidity: 50 })]),
      src('b', [hour(T0, { temperature: 30, humidity: 60 })]),
    ])!;
    expect(c.hourly[0].temperature).toBe(30);
    expect(c.hourly[0].humidity).toBe(55);
  });
  test('daily: mediana tra fonti che la forniscono; sunrise dalla prima disponibile', () => {
    const daily = (tempMax: number) => [{
      date: '2026-07-15', tempMin: 15, tempMax, precipitationSum: 1,
      precipitationProbability: 40, windSpeedMax: 20, weatherCode: 2,
      sunrise: '2026-07-15T03:40:00.000Z', sunset: '2026-07-15T19:10:00.000Z',
    }];
    const c = buildConsensus([
      src('a', [], daily(24)), src('b', [], daily(26)), src('met', []), // met senza daily
    ])!;
    expect(c.daily).toHaveLength(1);
    expect(c.daily[0].tempMax).toBe(25);
    expect(c.daily[0].sunrise).toBe('2026-07-15T03:40:00.000Z');
  });
  test('accordo: spread medio <1.5 alto, <3 medio, altrimenti basso', () => {
    const mk = (t1: number, t2: number) => buildConsensus([
      src('a', [hour(T0, { temperature: t1 })]), src('b', [hour(T0, { temperature: t2 })]),
    ])!.agreement;
    expect(mk(20, 21)).toBe('alto');
    expect(mk(20, 22.5)).toBe('medio');
    expect(mk(18, 25)).toBe('basso');
  });
  test('accordo con singola fonte (spread non calcolabile) → basso, non alto', () => {
    const c = buildConsensus([src('a', [hour(T0, { temperature: 20 })])])!;
    expect(c.agreement).toBe('basso');
  });
  test('lista vuota → null; sourceIds e timezone propagati', () => {
    expect(buildConsensus([])).toBeNull();
    const c = buildConsensus([src('a', [hour(T0, { temperature: 20 })])])!;
    expect(c.sourceIds).toEqual(['a']);
    expect(c.timezone).toBe('Europe/Rome');
  });
});
