import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ThemeProvider } from '../state/theme';
import { UnitsProvider } from '../state/units';
import { Header } from './Header';

afterEach(cleanup);

beforeEach(() => localStorage.clear());

describe('Header', () => {
  test('mostra brand, ricerca e GPS', () => {
    render(<Header city={null} onSelectCity={() => {}} />);
    expect(screen.getByText('allMeteo')).toBeTruthy();
    expect(screen.getByLabelText('Cerca città')).toBeTruthy();
    expect(screen.getByLabelText('Usa la mia posizione')).toBeTruthy();
  });
  test('con città mostra il toggle preferito', () => {
    render(<Header city={{ name: 'Milano', lat: 45.46, lon: 9.19 }} onSelectCity={() => {}} />);
    expect(screen.getByLabelText('Aggiungi ai preferiti')).toBeTruthy();
  });
});

describe('Header · unità', () => {
  test('i pulsanti cambiano e ricordano le unità', () => {
    render(<UnitsProvider><Header city={null} onSelectCity={() => {}} /></UnitsProvider>);
    fireEvent.click(screen.getByLabelText(/Unità temperatura: °C/));
    fireEvent.click(screen.getByLabelText(/Unità vento: km\/h/));
    expect(screen.getByLabelText(/Unità temperatura: °F/)).toBeTruthy();
    expect(screen.getByLabelText(/Unità vento: m\/s/)).toBeTruthy();
    expect(JSON.parse(localStorage.getItem('allmeteo:units')!)).toEqual({ temp: 'F', wind: 'ms' });
  });
});

describe('Header · tema', () => {
  test('scuro → chiaro → sistema, applicato alla pagina e ricordato', () => {
    render(<ThemeProvider><Header city={null} onSelectCity={() => {}} /></ThemeProvider>);
    expect(document.documentElement.dataset.theme).toBe('dark');
    fireEvent.click(screen.getByLabelText(/Tema: scuro/));
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('allmeteo:theme')).toBe('light');
    fireEvent.click(screen.getByLabelText(/Tema: chiaro/));
    expect(screen.getByLabelText(/Tema: come il sistema/)).toBeTruthy();
  });
});

describe('Header · posizione GPS', () => {
  test('arrotonda le coordinate a ~1 km prima di usarle', async () => {
    const getCurrentPosition = vi.fn((ok: PositionCallback) =>
      ok({ coords: { latitude: 45.698312, longitude: 9.677345 } } as GeolocationPosition));
    vi.stubGlobal('navigator', { ...navigator, geolocation: { getCurrentPosition } });
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({}), { status: 500 })));
    const onSelectCity = vi.fn();
    try {
      render(<Header city={null} onSelectCity={onSelectCity} />);
      fireEvent.click(screen.getByLabelText('Usa la mia posizione'));
      await vi.waitFor(() => expect(onSelectCity).toHaveBeenCalled());
      expect(onSelectCity.mock.calls[0][0]).toMatchObject({ lat: 45.7, lon: 9.68 });
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
