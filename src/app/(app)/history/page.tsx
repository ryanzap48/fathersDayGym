import { createClient } from "@/lib/supabase/server";
import { getWorkouts, getProfile, orderWorkout } from "@/lib/queries";
import { workoutVolume } from "@/lib/utils/analytics";
import { PageHeader, EmptyState } from "@/components/ui";
import { HistoryList, type WorkoutSummary } from "@/components/HistoryList";
import { shortDate, volume as fmtVolume } from "@/lib/utils/format";
import Link from "next/link";

export const metadata = { title: "History" };

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [workouts, profile] = await Promise.all([
    getWorkouts(supabase, userId),
    getProfile(supabase, userId),
  ]);
  const units = profile?.units ?? "lb";

  const summaries: WorkoutSummary[] = workouts.map(orderWorkout).map((w) => ({
    id: w.id,
    date: w.started_at,
    label: shortDate(w.started_at),
    exercises: w.workout_exercises.map((we) => we.exercise?.name ?? "Exercise"),
    setCount: w.workout_exercises.reduce(
      (n, we) => n + we.sets.filter((s) => s.set_type !== "warmup").length,
      0,
    ),
    volumeLabel: fmtVolume(workoutVolume(w), units),
  }));

  return (
    <div>
      <PageHeader
        title="History"
        subtitle={`${workouts.length} workouts logged`}
        action={
          <Link href="/settings" className="btn btn-ghost text-sm">
            Export
          </Link>
        }
      />
      {summaries.length === 0 ? (
        <EmptyState>Nothing here yet — your logged workouts will appear in this list.</EmptyState>
      ) : (
        <HistoryList workouts={summaries} />
      )}
    </div>
  );
}
