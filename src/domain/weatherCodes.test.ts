import { describe, expect, test } from 'vitest';
import { getWeatherInfo } from './weatherCodes';

describe('getWeatherInfo', () => {
  test('codici noti', () => {
    expect(getWeatherInfo(0)).toEqual({ description: 'Sereno', icon: '☀️', category: 'clear' });
    expect(getWeatherInfo(3).category).toBe('cloudy');
    expect(getWeatherInfo(45).category).toBe('fog');
    expect(getWeatherInfo(61).category).toBe('rain');
    expect(getWeatherInfo(75).category).toBe('snow');
    expect(getWeatherInfo(95).category).toBe('storm');
  });
  test('codice ignoto o null → fallback nuvoloso', () => {
    expect(getWeatherInfo(999).description).toBe('Variabile');
    expect(getWeatherInfo(null).category).toBe('cloudy');
  });
});
