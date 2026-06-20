import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile, getWorkouts, toSetRecords } from "@/lib/queries";
import { detectPersonalRecords } from "@/lib/utils/personal-records";
import { WorkoutLogger, type InitialBlock, type PrBaseline } from "@/components/logger/WorkoutLogger";
import type { Exercise } from "@/lib/database.types";

export const metadata = { title: "New workout" };

export default async function NewWorkoutPage({
  searchParams,
}: {
  searchParams: Promise<{ routine?: string }>;
}) {
  const { routine: routineId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  // Create the draft workout up front so set logging feels instant.
  const { data: workout, error } = await supabase
    .from("workouts")
    .insert({ user_id: userId, routine_id: routineId ?? null })
    .select("id")
    .single();
  if (error || !workout) redirect("/dashboard");

  const [{ data: exercises }, profile, history] = await Promise.all([
    supabase.from("exercises").select("*").or(`user_id.eq.${userId},user_id.is.null`).order("name"),
    getProfile(supabase, userId),
    getWorkouts(supabase, userId),
  ]);
  const exerciseList = (exercises ?? []) as Exercise[];

  // PR baseline so we can celebrate new records mid-workout.
  const prBaseline: PrBaseline = {};
  for (const pr of detectPersonalRecords(toSetRecords(history))) {
    const b = (prBaseline[pr.exerciseId] ??= { e1rm: 0, weight: 0, reps: 0 });
    if (pr.kind === "best_e1rm") b.e1rm = pr.value;
    if (pr.kind === "heaviest") b.weight = pr.weight;
    if (pr.kind === "most_reps") b.reps = pr.reps;
  }

  // If starting from a routine, pre-load its exercises as empty blocks.
  let initialBlocks: InitialBlock[] = [];
  if (routineId) {
    const { data: re } = await supabase
      .from("routine_exercises")
      .select("exercise_id, order_index")
      .eq("routine_id", routineId)
      .order("order_index");
    const byId = new Map(exerciseList.map((e) => [e.id, e]));
    const rows = (re ?? []).filter((r) => byId.has(r.exercise_id));
    if (rows.length > 0) {
      const inserts = rows.map((r, i) => ({
        id: crypto.randomUUID(),
        workout_id: workout.id,
        exercise_id: r.exercise_id,
        order_index: i,
      }));
      await supabase.from("workout_exercises").insert(inserts);
      initialBlocks = inserts.map((ins) => ({
        workoutExerciseId: ins.id,
        exercise: byId.get(ins.exercise_id)!,
        notes: "",
        sets: [],
      }));
    }
  }

  return (
    <WorkoutLogger
      workoutId={workout.id}
      exercises={exerciseList}
      units={profile?.units ?? "lb"}
      mode="new"
      initialBlocks={initialBlocks}
      prBaseline={prBaseline}
    />
  );
}
