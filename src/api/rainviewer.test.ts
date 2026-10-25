import { describe, expect, test } from 'vitest';
import { rainviewerFixture } from './__fixtures__/misc';
import { formatSpan, parseRadarFrames, radarAge } from './rainviewer';

describe('radar', () => {
  test('formatSpan', () => {
    expect(formatSpan(7200)).toBe('-2h');
    expect(formatSpan(3000)).toBe('-50 min');
  });
  test('radarAge', () => {
    const t = 1_800_000_000;
    expect(radarAge(t, t * 1000 + 20_000)).toEqual({ label: 'adesso', stale: false });
    expect(radarAge(t, t * 1000 + 12 * 60_000)).toEqual({ label: '12 min fa', stale: false });
    expect(radarAge(t, t * 1000 + 45 * 60_000).stale).toBe(true);
  });
});

describe('parseRadarFrames', () => {
  test('frame passati e nowcast, nell\'ordine', () => {
    const r = parseRadarFrames(rainviewerFixture);
    expect(r.frames.map(f => f.path)).toEqual(['/v2/radar/1789470000', '/v2/radar/1789470600', '/v2/radar/nowcast_abc']);
    expect(r.pastCount).toBe(2);
  });
  test('host diverso da quello atteso → errore', () => {
    expect(() => parseRadarFrames({ ...rainviewerFixture, host: 'https://evil.example' })).toThrow();
    expect(() => parseRadarFrames(null)).toThrow();
  });
  test('scarta i frame con path o time non validi', () => {
    const r = parseRadarFrames({
      host: 'https://tilecache.rainviewer.com',
      radar: { past: [
        { time: 1, path: '/v2/radar/abc' },
        { time: 2, path: '/../../x' },
        { time: 3, path: '//evil.example/v2/radar/a' },
        { time: 'x', path: '/v2/radar/b' },
      ] },
    });
    expect(r.frames.map(f => f.path)).toEqual(['/v2/radar/abc']);
  });
});
