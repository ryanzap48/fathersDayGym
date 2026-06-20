/**
 * Consistency metrics over a list of workout dates (ISO strings).
 * All calculations are in the runtime's local timezone.
 */

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function startOfWeek(d: Date): Date {
  const out = new Date(d);
  const day = (out.getDay() + 6) % 7; // Monday = 0
  out.setHours(0, 0, 0, 0);
  out.setDate(out.getDate() - day);
  return out;
}

/** Distinct training days as a Set of day keys. */
export function trainingDaySet(dates: string[]): Set<string> {
  return new Set(dates.map((d) => dayKey(new Date(d))));
}

/**
 * Current streak in consecutive days with at least one workout, counting
 * back from today (or yesterday, so a rest day this morning doesn't reset it).
 */
export function currentStreak(dates: string[]): number {
  const days = trainingDaySet(dates);
  if (days.size === 0) return 0;

  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  if (!days.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1); // allow today to be a rest day
    if (!days.has(dayKey(cursor))) return 0;
  }

  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Count of workouts in the current Monday-start week. */
export function workoutsThisWeek(dates: string[]): number {
  const weekStart = startOfWeek(new Date());
  return dates.filter((d) => new Date(d) >= weekStart).length;
}

/** Workouts per week label e.g. for the last `weeks` weeks. */
export function weeklyCounts(
  dates: string[],
  weeks = 12,
): { weekStart: string; count: number }[] {
  const out: { weekStart: string; count: number }[] = [];
  const thisWeek = startOfWeek(new Date());
  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(thisWeek);
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const count = dates.filter((d) => {
      const t = new Date(d);
      return t >= start && t < end;
    }).length;
    out.push({ weekStart: start.toISOString().slice(0, 10), count });
  }
  return out;
}

/**
 * Calendar heatmap data: an intensity (0..n) per day for the last `days` days,
 * ending today. Returned oldest-first.
 */
export function heatmap(
  dates: string[],
  days = 119,
): { date: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const d of dates) {
    const k = dayKey(new Date(d));
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const out: { date: string; count: number }[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() - days + 1);
  for (let i = 0; i < days; i++) {
    out.push({
      date: cursor.toISOString().slice(0, 10),
      count: counts.get(dayKey(cursor)) ?? 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}
