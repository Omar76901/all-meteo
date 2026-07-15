import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import { Header } from './Header';

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
