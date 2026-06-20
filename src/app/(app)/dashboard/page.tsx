import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getWorkouts, getProfile, toSetRecords, orderWorkout } from "@/lib/queries";
import { thisWeekVolume } from "@/lib/utils/analytics";
import { currentStreak, workoutsThisWeek } from "@/lib/utils/consistency";
import { recentRecords } from "@/lib/utils/personal-records";
import { PageHeader, Stat, SectionTitle, EmptyState } from "@/components/ui";
import { volume as fmtVolume, weight as fmtWeight, shortDate, num } from "@/lib/utils/format";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
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
  const dates = workouts.map((w) => w.started_at);
  const streak = currentStreak(dates);
  const weekVol = thisWeekVolume(workouts);
  const weekCount = workoutsThisWeek(dates);

  const since = new Date();
  since.setDate(since.getDate() - 30);
  const prs = recentRecords(toSetRecords(workouts), since).slice(0, 5);

  const recent = workouts.slice(0, 5).map(orderWorkout);
  const firstName = (profile?.name ?? "there").split(" ")[0];

  return (
    <div className="space-y-12">
      <PageHeader
        title={`Hello, ${firstName}`}
        subtitle={
          streak > 0
            ? `${streak}-day streak — keep it going.`
            : "Log a workout to start a streak."
        }
        action={
          <Link href="/workout/new" className="btn btn-accent">
            Start workout
          </Link>
        }
      />

      <section className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-4">
        <Stat label="This week" value={fmtVolume(weekVol, units)} sub="volume" accent />
        <Stat label="Workouts" value={num(weekCount)} sub="this week" />
        <Stat label="Streak" value={`${streak}d`} sub="current" />
        <Stat label="All time" value={num(workouts.length)} sub="workouts" />
      </section>

      <section>
        <SectionTitle href="/analytics">Recent personal records</SectionTitle>
        {prs.length === 0 ? (
          <EmptyState>No PRs in the last 30 days — your next session could change that.</EmptyState>
        ) : (
          <ul className="divide-y divide-divider">
            {prs.map((pr, i) => (
              <li key={i} className="flex items-baseline justify-between gap-4 py-3">
                <div>
                  <span className="font-medium">{pr.exerciseName}</span>
                  <span className="ml-2 text-sm text-muted">
                    {pr.kind === "best_e1rm"
                      ? "Best est. 1RM"
                      : pr.kind === "heaviest"
                        ? "Heaviest"
                        : "Most reps"}
                  </span>
                </div>
                <div className="tnum text-right">
                  <span className="font-semibold text-accent">
                    {pr.kind === "most_reps"
                      ? `${pr.reps} reps`
                      : fmtWeight(Math.round(pr.value * 10) / 10, units)}
                  </span>
                  <span className="ml-3 text-sm text-muted">{shortDate(pr.date)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <SectionTitle href="/history">Recent workouts</SectionTitle>
        {recent.length === 0 ? (
          <EmptyState>No workouts yet. Your first session is one tap away.</EmptyState>
        ) : (
          <ul className="divide-y divide-divider">
            {recent.map((w) => {
              const exCount = w.workout_exercises.length;
              const setCount = w.workout_exercises.reduce((n, we) => n + we.sets.length, 0);
              return (
                <li key={w.id}>
                  <Link
                    href={`/workout/${w.id}`}
                    className="flex items-baseline justify-between gap-4 py-3 hover:text-accent"
                  >
                    <span className="font-medium">{shortDate(w.started_at)}</span>
                    <span className="tnum text-sm text-muted">
                      {exCount} exercises · {setCount} sets
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
