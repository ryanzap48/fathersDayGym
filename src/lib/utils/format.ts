import type { UnitsPref } from "@/lib/database.types";

/** Format a number without trailing zeros (e.g. 47.5, 100, 2.5). */
export function num(value: number | null | undefined, maxDecimals = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return value
    .toLocaleString(undefined, { maximumFractionDigits: maxDecimals })
    .replace(/\.0+$/, "");
}

/** A weight with its unit, e.g. "185 lb". */
export function weight(value: number | null | undefined, units: UnitsPref): string {
  if (value === null || value === undefined) return "—";
  return `${num(value)} ${units}`;
}

/** Compact volume display, e.g. "12,450 lb" or "12.4k lb". */
export function volume(value: number, units: UnitsPref): string {
  if (value >= 100_000) return `${num(value / 1000, 0)}k ${units}`;
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${units}`;
}

/** Signed delta, e.g. "+5", "−2.5", "0". Uses a true minus sign. */
export function delta(value: number, maxDecimals = 1): string {
  const rounded = Math.round(value * 10 ** maxDecimals) / 10 ** maxDecimals;
  if (rounded === 0) return "0";
  const sign = rounded > 0 ? "+" : "−";
  return `${sign}${num(Math.abs(rounded), maxDecimals)}`;
}

/** "8 Jun", "8 Jun 2024" if not this year. */
export function shortDate(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  const now = new Date();
  const opts: Intl.DateTimeFormatOptions =
    d.getFullYear() === now.getFullYear()
      ? { day: "numeric", month: "short" }
      : { day: "numeric", month: "short", year: "numeric" };
  return d.toLocaleDateString(undefined, opts);
}

/** Duration between two ISO timestamps, e.g. "1h 12m" or "48m". */
export function duration(start: string, end: string | null): string {
  if (!end) return "—";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const mins = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** Seconds → m:ss for the rest timer. */
export function clock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.max(0, totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export const MUSCLE_LABELS: Record<string, string> = {
  chest: "Chest",
  back: "Back",
  legs: "Legs",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  forearms: "Forearms",
  core: "Core",
};

export const SET_TYPE_LABELS: Record<string, string> = {
  warmup: "Warm-up",
  working: "Working",
  dropset: "Dropset",
  failure: "Failure",
};
