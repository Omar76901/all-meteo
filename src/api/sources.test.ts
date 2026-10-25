import { describe, expect, test, vi } from 'vitest';
import type { SourceForecast } from '../domain/types';

const empty = (sourceId: string, local?: boolean) =>
  ({ sourceId, sourceName: sourceId, timezone: null, hourly: [], daily: [], local }) as SourceForecast;

vi.mock('./openMeteo', async importOriginal => ({
  ...(await importOriginal<typeof import('./openMeteo')>()),
  // GFS assente dalla risposta multi-modello
  fetchGlobalModels: vi.fn(async () => [empty('ecmwf'), empty('icon')]),
  fetchLocalModels: vi.fn(async () => [empty('icon_2i', true), empty('icon_d2', true)]),
}));
vi.mock('./metNorway', () => ({
  fetchMetNorway: vi.fn(async () => empty('met_norway')),
}));

import { fetchAllSources } from './sources';
import { fetchGlobalModels, fetchLocalModels } from './openMeteo';

describe('fetchAllSources', () => {
  test('fonti fallite isolate in failed, le altre in ok con i locali in testa', async () => {
    const { ok, failed } = await fetchAllSources(45, 9);
    expect(ok.map(s => s.sourceId)).toEqual(['icon_2i', 'icon_d2', 'ecmwf', 'icon', 'met_norway']);
    expect(failed).toEqual([{ id: 'gfs', name: 'GFS (NOAA)' }]);
  });
  test('richiesta dei modelli locali fallita → una sola voce in failed', async () => {
    vi.mocked(fetchLocalModels).mockRejectedValueOnce(new Error('HTTP 502'));
    const { ok, failed } = await fetchAllSources(45, 9);
    expect(ok.some(s => s.local)).toBe(false);
    expect(failed).toContainEqual({ id: 'local', name: 'Modelli locali' });
  });
  test('richiesta dei globali fallita → una sola voce, non una per modello', async () => {
    vi.mocked(fetchGlobalModels).mockRejectedValueOnce(new Error('HTTP 502'));
    const { ok, failed } = await fetchAllSources(45, 9);
    expect(ok.map(s => s.sourceId)).toEqual(['icon_2i', 'icon_d2', 'met_norway']);
    expect(failed).toEqual([{ id: 'global', name: 'Modelli globali' }]);
  });
});
