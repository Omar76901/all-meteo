import { describe, expect, test } from 'vitest';
import { cityUrlSearch, getUrlCity } from './urlCity';

describe('città nell\'URL', () => {
  test('andata e ritorno', () => {
    const c = { name: 'Reggio Emilia', lat: 44.698993, lon: 10.631046 };
    expect(getUrlCity(cityUrlSearch(c))).toEqual({ name: 'Reggio Emilia', lat: 44.699, lon: 10.631 });
  });
  test('senza nome usa le coordinate', () => {
    expect(getUrlCity('?lat=45.5&lon=9.2')?.name).toBe('45.50, 9.20');
  });
  test('parametri mancanti o non validi → null', () => {
    expect(getUrlCity('')).toBeNull();
    expect(getUrlCity('?lat=45')).toBeNull();
    expect(getUrlCity('?lat=abc&lon=9')).toBeNull();
    expect(getUrlCity('?lat=95&lon=9')).toBeNull();
  });
});
