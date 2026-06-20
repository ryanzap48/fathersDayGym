import { createClient } from "@/lib/supabase/server";
import { getWorkouts, getProfile, toSetRecords } from "@/lib/queries";
import {
  volumeSeries,
  weeklyVolume,
  muscleBalance,
  exerciseProgression,
} from "@/lib/utils/analytics";
import { currentStreak, weeklyCounts, heatmap, workoutsThisWeek } from "@/lib/utils/consistency";
import { detectPersonalRecords } from "@/lib/utils/personal-records";
import { PageHeader, Stat, SectionTitle, EmptyState } from "@/components/ui";
import { LineChart } from "@/components/charts/LineChart";
import { BarChart } from "@/components/charts/BarChart";
import { Heatmap } from "@/components/charts/Heatmap";
import { AnalyticsStrength, type StrengthSeries } from "@/components/AnalyticsStrength";
import { num, weight as fmtWeight, shortDate, MUSCLE_LABELS } from "@/lib/utils/format";

export const metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
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

  if (workouts.length === 0) {
    return (
      <div>
        <PageHeader title="Analytics" />
        <EmptyState>Your charts will fill in once you&apos;ve logged a workout or two.</EmptyState>
      </div>
    );
  }

  const dates = workouts.map((w) => w.started_at);
  const records = toSetRecords(workouts);

  // Strength progression — exercises with at least 2 sessions of data.
  const exerciseIds = [...new Set(records.map((r) => r.exerciseId))];
  const strength: StrengthSeries[] = exerciseIds
    .map((id) => {
      const name = records.find((r) => r.exerciseId === id)!.exerciseName;
      const data = exerciseProgression(records, id).map((p) => ({
        date: shortDate(p.date),
        "Est. 1RM": p.e1rm,
        "Top set": p.topSet,
      }));
      return { id, name, data };
    })
    .filter((s) => s.data.length >= 2)
    .sort((a, b) => a.name.localeCompare(b.name));

  const volPerWorkout = volumeSeries(workouts).map((v) => ({
    date: shortDate(v.date),
    Volume: v.volume,
  }));
  const volPerWeek = weeklyVolume(workouts).map((v) => ({
    week: shortDate(v.weekStart),
    Volume: v.volume,
  }));
  const balance = muscleBalance(workouts, 7).map((m) => ({
    muscle: MUSCLE_LABELS[m.muscle] ?? m.muscle,
    Volume: m.volume,
  }));
  const counts = weeklyCounts(dates).map((c) => ({
    week: shortDate(c.weekStart),
    Workouts: c.count,
  }));

  const prs = detectPersonalRecords(records).slice(0, 12);
  const streak = currentStreak(dates);

  return (
    <div className="space-y-14">
      <PageHeader title="Analytics" subtitle="The story your training is telling." />

      <section className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
        <Stat label="Streak" value={`${streak}d`} accent />
        <Stat label="This week" value={num(workoutsThisWeek(dates))} sub="workouts" />
        <Stat label="Total" value={num(workouts.length)} sub="workouts" />
        <Stat label="PRs" value={num(prs.length)} sub="standing records" />
      </section>

      <section>
        <SectionTitle>Strength progression</SectionTitle>
        <AnalyticsStrength series={strength} units={units} />
      </section>

      <section>
        <SectionTitle>Volume per workout</SectionTitle>
        <LineChart
          data={volPerWorkout}
          xKey="date"
          unit={` ${units}`}
          series={[{ key: "Volume", label: "Volume", color: "#e2502c" }]}
        />
      </section>

      <div className="grid gap-12 sm:grid-cols-2">
        <section>
          <SectionTitle>Weekly volume</SectionTitle>
          <BarChart data={volPerWeek} xKey="week" yKey="Volume" unit={` ${units}`} highlightMax />
        </section>
        <section>
          <SectionTitle>Workouts per week</SectionTitle>
          <BarChart data={counts} xKey="week" yKey="Workouts" highlightMax />
        </section>
      </div>

      <section>
        <SectionTitle>Muscle group balance · last 7 days</SectionTitle>
        {balance.length === 0 ? (
          <EmptyState>No working sets in the last 7 days.</EmptyState>
        ) : (
          <BarChart data={balance} xKey="muscle" yKey="Volume" unit={` ${units}`} horizontal />
        )}
      </section>

      <section>
        <SectionTitle>Training calendar · last 17 weeks</SectionTitle>
        <Heatmap days={heatmap(dates)} />
      </section>

      <section>
        <SectionTitle>Personal records</SectionTitle>
        {prs.length === 0 ? (
          <EmptyState>No records yet — every first rep is a PR waiting to happen.</EmptyState>
        ) : (
          <ul className="divide-y divide-divider">
            {prs.map((pr, i) => (
              <li key={i} className="flex items-baseline justify-between gap-4 py-3">
                <div>
                  <span className="font-medium">{pr.exerciseName}</span>
                  <span className="ml-2 text-sm text-muted">
                    {pr.kind === "best_e1rm" ? "Best est. 1RM" : pr.kind === "heaviest" ? "Heaviest" : "Most reps"}
                  </span>
                </div>
                <div className="tnum text-right">
                  <span className="font-semibold text-accent">
                    {pr.kind === "most_reps" ? `${pr.reps} reps` : fmtWeight(Math.round(pr.value * 10) / 10, units)}
                  </span>
                  <span className="ml-3 text-sm text-muted">{shortDate(pr.date)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
