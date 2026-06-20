import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, SetType, TrackingType } from "@/lib/database.types";
import type { SetRecord } from "@/lib/utils/personal-records";

export type DB = SupabaseClient<Database>;

/** Shape of a fully-hydrated workout (workout → exercises → sets). */
export interface WorkoutDetail {
  id: string;
  started_at: string;
  ended_at: string | null;
  notes: string | null;
  routine_id: string | null;
  workout_exercises: {
    id: string;
    order_index: number;
    notes: string | null;
    exercise: {
      id: string;
      name: string;
      primary_muscle: string;
      equipment: string;
      tracking_type: TrackingType;
    } | null;
    sets: {
      id: string;
      set_number: number;
      weight: number | null;
      reps: number | null;
      rpe: number | null;
      set_type: SetType;
      completed: boolean;
    }[];
  }[];
}

const WORKOUT_SELECT = `
  id, started_at, ended_at, notes, routine_id,
  workout_exercises (
    id, order_index, notes,
    exercise:exercises ( id, name, primary_muscle, equipment, tracking_type ),
    sets ( id, set_number, weight, reps, rpe, set_type, completed )
  )
`;

/** Recent or all workouts for a user, newest first, fully hydrated. */
export async function getWorkouts(
  supabase: DB,
  userId: string,
  limit?: number,
): Promise<WorkoutDetail[]> {
  let query = supabase
    .from("workouts")
    .select(WORKOUT_SELECT)
    .eq("user_id", userId)
    .order("started_at", { ascending: false });
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as unknown as WorkoutDetail[];
}

/** A single workout by id (RLS guarantees ownership). */
export async function getWorkout(
  supabase: DB,
  id: string,
): Promise<WorkoutDetail | null> {
  const { data, error } = await supabase
    .from("workouts")
    .select(WORKOUT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as WorkoutDetail) ?? null;
}

/** Sort exercises/sets into stable display order. */
export function orderWorkout(w: WorkoutDetail): WorkoutDetail {
  return {
    ...w,
    workout_exercises: [...w.workout_exercises]
      .sort((a, b) => a.order_index - b.order_index)
      .map((we) => ({
        ...we,
        sets: [...we.sets].sort((a, b) => a.set_number - b.set_number),
      })),
  };
}

/** Flatten workouts into per-set records for PR detection / progression. */
export function toSetRecords(workouts: WorkoutDetail[]): SetRecord[] {
  const records: SetRecord[] = [];
  for (const w of workouts) {
    for (const we of w.workout_exercises) {
      if (!we.exercise) continue;
      for (const s of we.sets) {
        if (s.set_type === "warmup") continue;
        if ((s.weight ?? 0) <= 0 || (s.reps ?? 0) <= 0) continue;
        records.push({
          exerciseId: we.exercise.id,
          exerciseName: we.exercise.name,
          date: w.started_at,
          weight: s.weight!,
          reps: s.reps!,
        });
      }
    }
  }
  return records;
}

/**
 * Just the workout timestamps — a tiny payload for streaks, counts, and the
 * calendar heatmap, so those don't have to hydrate every set on mobile data.
 */
export async function getWorkoutDates(supabase: DB, userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("workouts")
    .select("started_at")
    .eq("user_id", userId)
    .order("started_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((w) => w.started_at);
}

/** Profile row for the current user, creating sensible fallbacks upstream. */
export async function getProfile(supabase: DB, userId: string) {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return data;
}
