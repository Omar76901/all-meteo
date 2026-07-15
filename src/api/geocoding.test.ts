import { afterEach, describe, expect, test, vi } from 'vitest';
import { reverseGeocode, searchCities } from './geocoding';
import { geocodingFixture, reverseFixture } from './__fixtures__/misc';

const mockFetch = (body: unknown) =>
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(body))));

afterEach(() => vi.unstubAllGlobals());

describe('searchCities', () => {
  test('mappa i risultati in City con regione', async () => {
    mockFetch(geocodingFixture);
    const cities = await searchCities('mila');
    expect(cities).toEqual([
      { name: 'Milano', region: 'Lombardia', lat: 45.4643, lon: 9.1895 },
      { name: 'Milano', region: 'Italia', lat: 45.6, lon: 9.3 },
    ]);
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain('language=it');
  });
  test('query corta → [] senza fetch', async () => {
    mockFetch(geocodingFixture);
    expect(await searchCities('m')).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe('reverseGeocode', () => {
  test('usa city, fallback locality, poi "Posizione attuale"', async () => {
    mockFetch(reverseFixture);
    expect((await reverseGeocode(45.46, 9.19)).name).toBe('Milano');
    mockFetch({ locality: 'Brera' });
    expect((await reverseGeocode(45.46, 9.19)).name).toBe('Brera');
    mockFetch({});
    expect((await reverseGeocode(45.46, 9.19)).name).toBe('Posizione attuale');
  });
});
