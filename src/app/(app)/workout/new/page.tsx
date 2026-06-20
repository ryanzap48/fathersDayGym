import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/queries";
import { WorkoutLogger } from "@/components/logger/WorkoutLogger";
import type { Exercise } from "@/lib/database.types";

export const metadata = { title: "New workout" };

export default async function NewWorkoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  // Create the draft workout up front so set logging feels instant.
  const { data: workout, error } = await supabase
    .from("workouts")
    .insert({ user_id: userId })
    .select("id")
    .single();
  if (error || !workout) redirect("/dashboard");

  const [{ data: exercises }, profile] = await Promise.all([
    supabase
      .from("exercises")
      .select("*")
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order("name"),
    getProfile(supabase, userId),
  ]);

  return (
    <WorkoutLogger
      workoutId={workout.id}
      exercises={(exercises ?? []) as Exercise[]}
      units={profile?.units ?? "lb"}
    />
  );
}
