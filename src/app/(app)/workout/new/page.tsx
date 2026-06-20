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

  // For a blank session the workout row is created lazily (on the first
  // exercise) so abandoning the screen leaves nothing behind. When starting
  // from a routine we have exercises immediately, so we create it now.
  const workoutId = crypto.randomUUID();
  let created = false;

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
      await supabase.from("workouts").insert({ id: workoutId, user_id: userId, routine_id: routineId });
      created = true;
      const inserts = rows.map((r, i) => ({
        id: crypto.randomUUID(),
        workout_id: workoutId,
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
      workoutId={workoutId}
      exercises={exerciseList}
      units={profile?.units ?? "lb"}
      mode="new"
      initialBlocks={initialBlocks}
      prBaseline={prBaseline}
      created={created}
      userId={userId}
      routineId={routineId ?? null}
    />
  );
}
