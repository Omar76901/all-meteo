import { beforeEach, describe, expect, test } from 'vitest';
import { getFavorites, getLastCity, isFavorite, setLastCity, toggleFavorite } from './settings';

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
});
