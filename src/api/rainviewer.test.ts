import { describe, expect, test } from 'vitest';
import { formatSpan, radarAge } from './rainviewer';

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
