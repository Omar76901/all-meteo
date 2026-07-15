import { describe, expect, test, vi } from 'vitest';
import type { SourceForecast } from '../domain/types';

vi.mock('./openMeteo', async importOriginal => ({
  ...(await importOriginal<typeof import('./openMeteo')>()),
  fetchOpenMeteoModel: vi.fn(async m => {
    if (m.id === 'gfs') throw new Error('timeout');
    return { sourceId: m.id, sourceName: m.name, timezone: null, hourly: [], daily: [] } as SourceForecast;
  }),
}));
vi.mock('./metNorway', () => ({
  fetchMetNorway: vi.fn(async () =>
    ({ sourceId: 'met_norway', sourceName: 'MET Norway', timezone: null, hourly: [], daily: [] }) as SourceForecast),
}));

import { fetchAllSources } from './sources';

describe('fetchAllSources', () => {
  test('fonti fallite isolate in failed, le altre in ok', async () => {
    const { ok, failed } = await fetchAllSources(45, 9);
    expect(ok.map(s => s.sourceId).sort()).toEqual(['ecmwf', 'icon', 'met_norway']);
    expect(failed).toEqual([{ id: 'gfs', name: 'GFS (NOAA)' }]);
  });
});
