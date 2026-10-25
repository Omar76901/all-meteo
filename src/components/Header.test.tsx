import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
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
