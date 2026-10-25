import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getFavorites, getLastCity, getSnapshot, isFavorite, setLastCity, setSnapshot, toggleFavorite } from './settings';

const milano = { name: 'Milano', lat: 45.4643, lon: 9.1895 };
const roma = { name: 'Roma', lat: 41.8919, lon: 12.5113 };

beforeEach(() => localStorage.clear());

describe('preferiti', () => {
  test('toggle aggiunge e rimuove, persiste', () => {
    expect(getFavorites()).toEqual([]);
    toggleFavorite(milano);
    toggleFavorite(roma);
    expect(getFavorites().map(c => c.name)).toEqual(['Milano', 'Roma']);
    expect(isFavorite(milano)).toBe(true);
    toggleFavorite({ ...milano, name: 'MILANO CENTRO' }); // stesse coordinate → stessa città
    expect(getFavorites().map(c => c.name)).toEqual(['Roma']);
  });
  test('localStorage corrotto → []', () => {
    localStorage.setItem('allmeteo:favorites', '{non-json');
    expect(getFavorites()).toEqual([]);
  });
  test('setItem che lancia (quota superata) non propaga l\'errore', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    try {
      expect(() => toggleFavorite(milano)).not.toThrow();
    } finally {
      spy.mockRestore();
    }
  });
});

describe('ultima città', () => {
  test('set/get', () => {
    expect(getLastCity()).toBeNull();
    setLastCity(roma);
    expect(getLastCity()!.name).toBe('Roma');
  });
  test('localStorage corrotto → null', () => {
    localStorage.setItem('allmeteo:lastCity', '{non-json');
    expect(getLastCity()).toBeNull();
  });
  test('setItem che lancia (quota superata) non propaga l\'errore', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    try {
      expect(() => setLastCity(roma)).not.toThrow();
    } finally {
      spy.mockRestore();
    }
  });
});

describe('anteprima ultime previsioni', () => {
  test('vale solo per la stessa città e scade dopo 12 ore', () => {
    const savedAt = new Date('2026-07-15T12:00:00Z');
    setSnapshot(milano, [], [{ id: 'gfs', name: 'GFS (NOAA)' }], savedAt);
    expect(getSnapshot(milano, savedAt.getTime() + 60_000)?.failedSources).toHaveLength(1);
    expect(getSnapshot(roma, savedAt.getTime())).toBeNull();
    expect(getSnapshot(milano, savedAt.getTime() + 13 * 3600_000)).toBeNull();
  });
});
