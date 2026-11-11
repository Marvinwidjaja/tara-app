/** Dates are plain YYYY-MM-DD strings in the parent's time zone (the server says what "today" is). */

const parse = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
};

export function addDays(date: string, days: number) {
  const d = parse(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Monday of the week containing `date`. */
export function startOfWeek(date: string) {
  const day = parse(date).getUTCDay(); // 0 = Sunday
  return addDays(date, day === 0 ? -6 : 1 - day);
}

export function weekDates(start: string) {
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function weekdayShort(date: string) {
  return parse(date).toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }) as
    | 'Mon'
    | 'Tue'
    | 'Wed'
    | 'Thu'
    | 'Fri'
    | 'Sat'
    | 'Sun';
}

export function dayOfMonth(date: string) {
  return parse(date).getUTCDate();
}

export function prettyDate(date: string, today?: string) {
  if (today) {
    if (date === today) return 'Today';
    if (date === addDays(today, 1)) return 'Tomorrow';
    if (date === addDays(today, -1)) return 'Yesterday';
  }
  return parse(date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function shortDate(date: string) {
  return parse(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

export function timeAgo(iso: string) {
  const diff = (Date.now() - Date.parse(iso)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function clockTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** Calendar day of a timestamp in the device's time zone, e.g. "Nov 9". */
export function localDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
