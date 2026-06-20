import { estimateOneRepMax } from "./one-rep-max";

export interface SetRecord {
  exerciseId: string;
  exerciseName: string;
  date: string; // ISO
  weight: number;
  reps: number;
}

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  kind: "heaviest" | "best_e1rm" | "most_reps";
  value: number; // weight, estimated 1RM, or reps
  weight: number;
  reps: number;
  date: string;
}

/**
 * Walk a user's full set history chronologically and capture the moment each
 * record was set: heaviest weight lifted, best estimated 1RM, and most reps
 * (at any load) per exercise. Returns the final standing records, newest first.
 */
export function detectPersonalRecords(sets: SetRecord[]): PersonalRecord[] {
  const ordered = [...sets]
    .filter((s) => s.weight > 0 && s.reps > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  const best = new Map<
    string,
    { heaviest: PersonalRecord; e1rm: PersonalRecord; reps: PersonalRecord }
  >();

  for (const s of ordered) {
    const e1rm = estimateOneRepMax(s.weight, s.reps);
    const existing = best.get(s.exerciseId);
    const base = { exerciseId: s.exerciseId, exerciseName: s.exerciseName, weight: s.weight, reps: s.reps, date: s.date };

    if (!existing) {
      best.set(s.exerciseId, {
        heaviest: { ...base, kind: "heaviest", value: s.weight },
        e1rm: { ...base, kind: "best_e1rm", value: e1rm },
        reps: { ...base, kind: "most_reps", value: s.reps },
      });
      continue;
    }
    if (s.weight > existing.heaviest.value)
      existing.heaviest = { ...base, kind: "heaviest", value: s.weight };
    if (e1rm > existing.e1rm.value)
      existing.e1rm = { ...base, kind: "best_e1rm", value: e1rm };
    if (s.reps > existing.reps.value)
      existing.reps = { ...base, kind: "most_reps", value: s.reps };
  }

  return [...best.values()]
    .flatMap((r) => [r.e1rm, r.heaviest, r.reps])
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Records achieved on or after `since` — i.e. recent PRs to celebrate. */
export function recentRecords(sets: SetRecord[], since: Date): PersonalRecord[] {
  const cutoff = since.toISOString();
  return detectPersonalRecords(sets).filter((r) => r.date >= cutoff);
}
