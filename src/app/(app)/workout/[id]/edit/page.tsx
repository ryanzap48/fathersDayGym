import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkout, getProfile, orderWorkout } from "@/lib/queries";
import { WorkoutLogger, type InitialBlock } from "@/components/logger/WorkoutLogger";
import type { Exercise } from "@/lib/database.types";

export const metadata = { title: "Edit workout" };

export default async function EditWorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [raw, profile, { data: exercises }] = await Promise.all([
    getWorkout(supabase, id),
    getProfile(supabase, userId),
    supabase.from("exercises").select("*").or(`user_id.eq.${userId},user_id.is.null`).order("name"),
  ]);
  if (!raw) notFound();

  const workout = orderWorkout(raw);
  const exerciseList = (exercises ?? []) as Exercise[];
  const byId = new Map(exerciseList.map((e) => [e.id, e]));

  const initialBlocks: InitialBlock[] = workout.workout_exercises
    .filter((we) => we.exercise && byId.has(we.exercise.id))
    .map((we) => ({
      workoutExerciseId: we.id,
      exercise: byId.get(we.exercise!.id)!,
      notes: we.notes ?? "",
      sets: we.sets.map((s) => ({
        id: s.id,
        set_number: s.set_number,
        weight: s.weight,
        reps: s.reps,
        rpe: s.rpe,
        set_type: s.set_type,
        completed: s.completed,
      })),
    }));

  return (
    <WorkoutLogger
      workoutId={workout.id}
      exercises={exerciseList}
      units={profile?.units ?? "lb"}
      mode="edit"
      initialBlocks={initialBlocks}
    />
  );
}
