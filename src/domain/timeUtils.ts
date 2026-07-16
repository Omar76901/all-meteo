export function currentHourIndex(times: string[], now: Date = new Date()): number {
  let idx = 0;
  for (let i = 0; i < times.length; i++) {
    if (new Date(times[i]).getTime() <= now.getTime()) idx = i;
    else break;
  }
  return idx;
}

export function formatHour(iso: string, timezone: string | null): string {
  return new Intl.DateTimeFormat('it-IT', { hour: '2-digit', timeZone: timezone ?? undefined }).format(new Date(iso));
}

export function formatTime(iso: string, timezone: string | null): string {
  return new Intl.DateTimeFormat('it-IT', { hour: '2-digit', minute: '2-digit', timeZone: timezone ?? undefined }).format(new Date(iso));
}

export function formatDayHour(iso: string, timezone: string | null): string {
  return new Intl.DateTimeFormat('it-IT', {
    weekday: 'short', day: 'numeric', hour: '2-digit',
    timeZone: timezone ?? undefined,
  }).format(new Date(iso));
}

export function formatWeekday(dateStr: string): string {
  return new Intl.DateTimeFormat('it-IT', { weekday: 'short', day: 'numeric' }).format(new Date(`${dateStr}T12:00:00Z`));
}
