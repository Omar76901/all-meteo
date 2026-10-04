import { describe, expect, test } from 'vitest';
import {
  LOCAL_WEIGHT, buildConsensus, circularMeanDirection, median, mode,
  weightedCircularMean, weightedMedian, weightedMode,
} from './consensus';
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

describe('versioni pesate', () => {
  const w = (value: number, weight: number) => ({ value, weight });
  test('weightedMedian: il peso sposta la mediana verso la fonte che pesa di più', () => {
    expect(weightedMedian([w(10, 1), w(20, 1), w(30, 2)])).toBe(25); // 10 | 20 | 30 30
    expect(weightedMedian([w(10, 1), w(20, 1), w(30, 3)])).toBe(30);
    expect(weightedMedian([w(5, 2)])).toBe(5);
    expect(weightedMedian([])).toBeNull();
  });
  test('weightedMode: vince il peso totale, non il numero di fonti', () => {
    expect(weightedMode([w(0, 1), w(0, 1), w(61, 3)])).toBe(61);
    expect(weightedMode([w(0, 2), w(61, 2)])).toBe(61); // pari → il più severo
  });
  test('weightedCircularMean: pende verso la direzione col peso maggiore', () => {
    expect(weightedCircularMean([w(0, 1), w(90, 1)])!).toBeCloseTo(45, 5);
    expect(weightedCircularMean([w(0, 1), w(90, 3)])!).toBeGreaterThan(70);
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
  test(`modelli locali pesano ${LOCAL_WEIGHT}x su orario e daily, solo dove coprono`, () => {
    const daily = (tempMax: number) => [{
      date: '2026-07-15', tempMin: 15, tempMax, precipitationSum: 0,
      precipitationProbability: null, windSpeedMax: 10, weatherCode: 0, sunrise: null, sunset: null,
    }];
    const local = { ...src('loc', [hour(T0, { temperature: 26 })], daily(30)), local: true };
    const c = buildConsensus([
      src('a', [hour(T0, { temperature: 20 }), hour(T1, { temperature: 20 })], daily(24)),
      src('b', [hour(T0, { temperature: 22 }), hour(T1, { temperature: 22 })], daily(25)),
      local,
    ])!;
    // T0: 20 | 22 | 26 26 → mediana pesata 24 (senza peso sarebbe 22)
    expect(c.hourly[0].temperature).toBe(24);
    // T1: il locale è oltre il suo orizzonte → solo i globali
    expect(c.hourly[1].temperature).toBe(21);
    expect(c.hourly[1].temperatureBySource.loc).toBeNull();
    // daily: 24 | 25 | 30 30 → 27.5
    expect(c.daily[0].tempMax).toBe(27.5);
  });
  test('lista vuota → null; sourceIds e timezone propagati', () => {
    expect(buildConsensus([])).toBeNull();
    const c = buildConsensus([src('a', [hour(T0, { temperature: 20 })])])!;
    expect(c.sourceIds).toEqual(['a']);
    expect(c.timezone).toBe('Europe/Rome');
  });
});
