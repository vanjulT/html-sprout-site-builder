import { DAY_MS, MAX_MONTHS_AHEAD, MIN_LEAD_MINUTES, SLOT_MINUTES } from "./pricing";

const p2 = (n: number) => String(n).padStart(2, "0");

export const TIME_SLOTS: string[] = Array.from({ length: (24 * 60) / SLOT_MINUTES }, (_, i) => {
  const m = i * SLOT_MINUTES;
  return `${p2(Math.floor(m / 60))}:${p2(m % 60)}`;
});

/** Earliest bookable moment: now + lead time, rounded up to the next slot. */
export function earliestBookable(now = new Date()): Date {
  const d = new Date(now.getTime() + MIN_LEAD_MINUTES * 60_000);
  d.setSeconds(0, 0);
  d.setMinutes(Math.ceil(d.getMinutes() / SLOT_MINUTES) * SLOT_MINUTES);
  return d;
}

export function latestBookable(now = new Date()): Date {
  const d = new Date(now);
  d.setMonth(d.getMonth() + MAX_MONTHS_AHEAD);
  d.setHours(23, 59, 0, 0);
  return d;
}

export const startOfDay = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const timeOf = (d: Date) => `${p2(d.getHours())}:${p2(d.getMinutes())}`;

export function withTime(day: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(day);
  d.setHours(h, m, 0, 0);
  return d;
}

/** A date `days` from today at hh:mm. */
export function daysFromNow(days: number, hour: number, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

export const addMinutes = (d: Date, minutes: number) => new Date(d.getTime() + minutes * 60_000);

/** Local "YYYY-MM-DDTHH:mm" for URLs. */
export function toLocalIso(d: Date): string {
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`;
}

export function parseLocalIso(v: unknown): Date | null {
  if (typeof v !== "string" || !v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export function formatShort(d: Date | null, locale = "fr-FR"): string {
  if (!d) return "—";
  return `${d.toLocaleDateString(locale, { day: "numeric", month: "short" })} · ${timeOf(d)}`;
}

export function formatLong(d: Date, locale = "fr-FR"): string {
  const s = d.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function durationText(start: Date | null, end: Date | null, dayUnit = "j"): string {
  if (!start || !end || end <= start) return "—";
  const h = Math.round((end.getTime() - start.getTime()) / 3_600_000);
  const d = Math.floor(h / 24);
  const r = h % 24;
  return [d ? `${d} ${dayUnit}` : "", r ? `${r} h` : ""].filter(Boolean).join(" ") || "0 h";
}

export const sameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();
export { DAY_MS };
