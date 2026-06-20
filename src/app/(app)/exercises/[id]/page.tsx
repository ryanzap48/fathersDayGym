import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/queries";
import { PageHeader, Stat, SectionTitle, EmptyState } from "@/components/ui";
import { LineChart } from "@/components/charts/LineChart";
import { exerciseProgression } from "@/lib/utils/analytics";
import { detectPersonalRecords, type SetRecord } from "@/lib/utils/personal-records";
import { bestEstimatedOneRepMax } from "@/lib/utils/one-rep-max";
import { num, weight as fmtWeight, shortDate, MUSCLE_LABELS } from "@/lib/utils/format";

export const metadata = { title: "Exercise" };

interface SessionRow {
  id: string;
  workout: { id: string; started_at: string };
  sets: { weight: number | null; reps: number | null; set_type: string; set_number: number }[];
}

export default async function ExerciseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: exercise }, profile, { data: rowsRaw }] = await Promise.all([
    supabase.from("exercises").select("*").eq("id", id).maybeSingle(),
    getProfile(supabase, user!.id),
    supabase
      .from("workout_exercises")
      .select("id, workout:workouts!inner(id, started_at), sets(weight, reps, set_type, set_number)")
      .eq("exercise_id", id),
  ]);

  if (!exercise) notFound();
  const units = profile?.units ?? "lb";
  const rows = (rowsRaw ?? []) as unknown as SessionRow[];

  const records: SetRecord[] = [];
  for (const r of rows) {
    for (const s of r.sets) {
      if (s.set_type === "warmup" || !s.weight || !s.reps) continue;
      records.push({
        exerciseId: id,
        exerciseName: exercise.name,
        date: r.workout.started_at,
        weight: s.weight,
        reps: s.reps,
      });
    }
  }

  const progression = exerciseProgression(records, id).map((p) => ({
    date: shortDate(p.date),
    "Top set": p.topSet,
    "Est. 1RM": p.e1rm,
  }));

  const prs = detectPersonalRecords(records);
  const heaviest = prs.find((p) => p.kind === "heaviest");
  const bestE1rm = prs.find((p) => p.kind === "best_e1rm");
  const mostReps = prs.find((p) => p.kind === "most_reps");

  const sessions = [...rows]
    .filter((r) => r.sets.length > 0)
    .sort((a, b) => b.workout.started_at.localeCompare(a.workout.started_at));

  return (
    <div className="space-y-10">
      <PageHeader
        title={exercise.name}
        subtitle={`${MUSCLE_LABELS[exercise.primary_muscle] ?? exercise.primary_muscle} · ${exercise.equipment}`}
        action={
          <Link href="/exercises" className="btn btn-ghost text-sm">
            ← Library
          </Link>
        }
      />

      <section className="grid grid-cols-3 gap-x-8">
        <Stat
          label="Best est. 1RM"
          value={bestE1rm ? fmtWeight(Math.round(bestE1rm.value), units) : "—"}
          sub={bestE1rm ? shortDate(bestE1rm.date) : undefined}
          accent
        />
        <Stat
          label="Heaviest"
          value={heaviest ? fmtWeight(heaviest.value, units) : "—"}
          sub={heaviest ? `${heaviest.reps} reps` : undefined}
        />
        <Stat label="Most reps" value={mostReps ? `${mostReps.reps}` : "—"} sub={mostReps ? fmtWeight(mostReps.weight, units) : undefined} />
      </section>

      <section>
        <SectionTitle>Strength progression</SectionTitle>
        <LineChart
          data={progression}
          xKey="date"
          unit={` ${units}`}
          series={[
            { key: "Est. 1RM", label: "Est. 1RM", color: "#e2502c" },
            { key: "Top set", label: "Top set", color: "#18181b", dashed: true },
          ]}
        />
      </section>

      <section>
        <SectionTitle>Every session</SectionTitle>
        {sessions.length === 0 ? (
          <EmptyState>You haven&apos;t logged this exercise yet.</EmptyState>
        ) : (
          <ul className="divide-y divide-divider">
            {sessions.map((r) => {
              const working = r.sets
                .filter((s) => s.set_type !== "warmup")
                .sort((a, b) => a.set_number - b.set_number);
              const e1rm = bestEstimatedOneRepMax(working);
              return (
                <li key={r.id}>
                  <Link
                    href={`/workout/${r.workout.id}`}
                    className="flex items-baseline justify-between gap-4 py-3 hover:text-accent"
                  >
                    <span className="font-medium">{shortDate(r.workout.started_at)}</span>
                    <span className="tnum text-sm text-muted">
                      {working.map((s) => `${num(s.weight)}×${num(s.reps)}`).join(", ")}
                      {e1rm > 0 && <span className="ml-2 text-faint">e1RM {num(e1rm)}</span>}
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
