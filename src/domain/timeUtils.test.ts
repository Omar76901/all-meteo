import { describe, expect, test } from 'vitest';
import { currentHourIndex, formatDayHour, formatHour, formatWeekday } from './timeUtils';

describe('timeUtils', () => {
  test('currentHourIndex: ultima ora passata', () => {
    const times = ['2026-07-15T10:00:00.000Z', '2026-07-15T11:00:00.000Z', '2026-07-15T12:00:00.000Z'];
    expect(currentHourIndex(times, new Date('2026-07-15T11:30:00Z'))).toBe(1);
    expect(currentHourIndex(times, new Date('2026-07-15T09:00:00Z'))).toBe(0);
    expect(currentHourIndex(times, new Date('2026-07-16T00:00:00Z'))).toBe(2);
  });
  test('formatHour rispetta il timezone', () => {
    expect(formatHour('2026-07-15T12:00:00.000Z', 'Europe/Rome')).toBe('14');
  });
  test('formatWeekday in italiano', () => {
    expect(formatWeekday('2026-07-15')).toMatch(/^mer/);
  });
  test('formatDayHour mostra giorno e ora nel timezone', () => {
    const s = formatDayHour('2026-07-15T22:30:00.000Z', 'Europe/Rome');
    expect(s).toMatch(/gio/); // le 00:30 di giovedì 16 a Roma
    expect(s).toContain('16');
    expect(s).toContain('00');
  });
});
