// Day-by-day series for the Control Room charts. Pure functions, safe on the server and in the browser.

/** The store runs on Sri Lanka time, so a "day" starts at midnight in Colombo. */
export const DASHBOARD_TIME_ZONE = "Asia/Colombo";
export const DASHBOARD_DAYS = 30;

export type DayPoint = { day: string; value: number };

const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: DASHBOARD_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" });

/** The calendar day (YYYY-MM-DD, store time) a timestamp falls on, or null when it isn't a date. */
export function storeDay(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : dayFormat.format(date);
}

/** The last `days` calendar days, oldest first, ending today. */
export function recentDays(days = DASHBOARD_DAYS, now = new Date()) {
  const keys: string[] = [];
  // Noon UTC is the same calendar day in every zone within ±11h, so stepping by 24h never skips a day.
  const today = storeDay(now) ?? dayFormat.format(new Date());
  const anchor = Date.parse(`${today}T12:00:00Z`);
  for (let offset = days - 1; offset >= 0; offset -= 1) keys.push(new Date(anchor - offset * 86_400_000).toISOString().slice(0, 10));
  return keys;
}

/** The earliest instant the series covers, for the database filter. */
export function seriesStart(days = DASHBOARD_DAYS, now = new Date()) {
  // A day of slack covers the zone offset; rows outside the window are dropped when bucketed.
  return new Date(Date.parse(`${recentDays(days, now)[0]}T00:00:00Z`) - 86_400_000).toISOString();
}

/** Sums `value` (default 1 per row) into each day; rows outside the window are ignored. */
export function bucketByDay<T>(rows: readonly T[], at: (row: T) => string, days: readonly string[], value: (row: T) => number = () => 1): DayPoint[] {
  const totals = new Map(days.map((day) => [day, 0]));
  for (const row of rows) {
    const day = storeDay(at(row));
    if (day !== null && totals.has(day)) totals.set(day, (totals.get(day) ?? 0) + value(row));
  }
  return days.map((day) => ({ day, value: totals.get(day) ?? 0 }));
}

export function seriesTotal(points: readonly DayPoint[]) {
  return points.reduce((total, point) => total + point.value, 0);
}

/** A rounded axis maximum (1, 2, 5 × 10ⁿ) so gridlines land on readable numbers. */
export function niceMax(value: number) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find((candidate) => candidate * magnitude >= value) ?? 10;
  return step * magnitude;
}
