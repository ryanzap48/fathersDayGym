import type { WorkoutDetail } from "@/lib/queries";
import { totalVolume } from "./volume";
import { estimateOneRepMax } from "./one-rep-max";
import type { SetRecord } from "./personal-records";

function isoWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

/** Total working volume for a single workout. */
export function workoutVolume(w: WorkoutDetail): number {
  return w.workout_exercises.reduce((sum, we) => sum + totalVolume(we.sets), 0);
}

/** Volume per workout over time, oldest first — for the volume line chart. */
export function volumeSeries(
  workouts: WorkoutDetail[],
): { date: string; volume: number }[] {
  return [...workouts]
    .sort((a, b) => a.started_at.localeCompare(b.started_at))
    .map((w) => ({ date: w.started_at, volume: Math.round(workoutVolume(w)) }));
}

/** Total volume per ISO week for the last `weeks` weeks, oldest first. */
export function weeklyVolume(
  workouts: WorkoutDetail[],
  weeks = 12,
): { weekStart: string; volume: number }[] {
  const buckets = new Map<string, number>();
  for (const w of workouts) {
    const key = isoWeekStart(new Date(w.started_at)).toISOString().slice(0, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + workoutVolume(w));
  }

  const out: { weekStart: string; volume: number }[] = [];
  const thisWeek = isoWeekStart(new Date());
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(thisWeek);
    d.setDate(d.getDate() - i * 7);
    const key = d.toISOString().slice(0, 10);
    out.push({ weekStart: key, volume: Math.round(buckets.get(key) ?? 0) });
  }
  return out;
}

/** This-week working volume (Mon-start). */
export function thisWeekVolume(workouts: WorkoutDetail[]): number {
  const weekStart = isoWeekStart(new Date());
  return workouts
    .filter((w) => new Date(w.started_at) >= weekStart)
    .reduce((sum, w) => sum + workoutVolume(w), 0);
}

/** Weekly volume split by primary muscle group over the last `days` days. */
export function muscleBalance(
  workouts: WorkoutDetail[],
  days = 7,
): { muscle: string; volume: number }[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const totals = new Map<string, number>();

  for (const w of workouts) {
    if (new Date(w.started_at) < cutoff) continue;
    for (const we of w.workout_exercises) {
      const muscle = we.exercise?.primary_muscle ?? "other";
      totals.set(muscle, (totals.get(muscle) ?? 0) + totalVolume(we.sets));
    }
  }

  return [...totals.entries()]
    .map(([muscle, volume]) => ({ muscle, volume: Math.round(volume) }))
    .sort((a, b) => b.volume - a.volume);
}

/**
 * Per-exercise strength progression: best top-set weight and best estimated
 * 1RM per session date, oldest first. Drives the strength line chart.
 */
export function exerciseProgression(
  records: SetRecord[],
  exerciseId: string,
): { date: string; topSet: number; e1rm: number }[] {
  const byDay = new Map<string, { topSet: number; e1rm: number }>();
  for (const r of records) {
    if (r.exerciseId !== exerciseId) continue;
    const day = r.date.slice(0, 10);
    const e1rm = estimateOneRepMax(r.weight, r.reps);
    const cur = byDay.get(day) ?? { topSet: 0, e1rm: 0 };
    byDay.set(day, {
      topSet: Math.max(cur.topSet, r.weight),
      e1rm: Math.max(cur.e1rm, e1rm),
    });
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, v]) => ({ date, topSet: v.topSet, e1rm: Math.round(v.e1rm * 10) / 10 }));
}
