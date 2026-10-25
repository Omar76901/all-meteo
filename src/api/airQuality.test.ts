import { describe, expect, test } from 'vitest';
import { aqiLevel, parseAirQuality, pollenLevel } from './airQuality';

const NOW = 1792922400_000;

describe('parseAirQuality', () => {
  test('valori correnti, picco a 24h e solo i pollini presenti, dal più alto', () => {
    const aq = parseAirQuality({
      current: {
        european_aqi: 40, pm2_5: 14.9, pm10: 19.7, ozone: 51, nitrogen_dioxide: 15.1,
        alder_pollen: 0, birch_pollen: null, grass_pollen: 12.5, ragweed_pollen: 3,
      },
      hourly: {
        time: [NOW / 1000 - 7200, NOW / 1000, NOW / 1000 + 3600, NOW / 1000 + 30 * 3600],
        european_aqi: [99, 40, 55, 90],
      },
    }, NOW);
    expect(aq.aqi).toBe(40);
    expect(aq.maxAqi24h).toBe(55); // esclude le ore passate e quelle oltre le 24h
    expect(aq.no2).toBe(15.1);
    expect(aq.pollen).toEqual([{ name: 'Graminacee', value: 12.5 }, { name: 'Ambrosia', value: 3 }]);
  });
  test('fuori Europa: niente pollini, campi mancanti → null', () => {
    const aq = parseAirQuality({ current: { european_aqi: 61, birch_pollen: null } }, NOW);
    expect(aq.pollen).toEqual([]);
    expect(aq.pm10).toBeNull();
    expect(aq.maxAqi24h).toBeNull();
  });
});

describe('livelli', () => {
  test('fasce EAQI', () => {
    expect(aqiLevel(15).label).toBe('buona');
    expect(aqiLevel(40).label).toBe('discreta');
    expect(aqiLevel(75).label).toBe('scadente');
    expect(aqiLevel(130).label).toBe('pessima');
  });
  test('pollini', () => {
    expect(pollenLevel(3).label).toBe('basso');
    expect(pollenLevel(30).label).toBe('medio');
    expect(pollenLevel(80).label).toBe('alto');
  });
});
