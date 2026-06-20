import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getWorkout, getProfile, orderWorkout } from "@/lib/queries";
import { workoutVolume } from "@/lib/utils/analytics";
import { bestEstimatedOneRepMax } from "@/lib/utils/one-rep-max";
import { totalVolume } from "@/lib/utils/volume";
import { PageHeader, Stat } from "@/components/ui";
import {
  num,
  volume as fmtVolume,
  shortDate,
  duration,
  SET_TYPE_LABELS,
} from "@/lib/utils/format";

export const metadata = { title: "Workout" };

export default async function WorkoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const raw = await getWorkout(supabase, id);
  if (!raw) notFound();
  const workout = orderWorkout(raw);
  const profile = await getProfile(supabase, user!.id);
  const units = profile?.units ?? "lb";

  const vol = workoutVolume(workout);
  const setCount = workout.workout_exercises.reduce(
    (n, we) => n + we.sets.filter((s) => s.set_type !== "warmup").length,
    0,
  );

  return (
    <div className="space-y-10">
      <PageHeader
        title={shortDate(workout.started_at)}
        subtitle={new Date(workout.started_at).toLocaleString(undefined, {
          weekday: "long",
          hour: "numeric",
          minute: "2-digit",
        })}
        action={
          <div className="flex items-center gap-4">
            <Link href={`/workout/${workout.id}/edit`} className="btn btn-ghost text-sm">
              Edit
            </Link>
            <Link href="/history" className="btn btn-ghost text-sm">
              ← History
            </Link>
          </div>
        }
      />

      <section className="grid grid-cols-3 gap-x-8">
        <Stat label="Volume" value={fmtVolume(vol, units)} accent />
        <Stat label="Working sets" value={num(setCount)} />
        <Stat label="Duration" value={duration(workout.started_at, workout.ended_at)} />
      </section>

      {workout.notes && <p className="text-sm text-muted">{workout.notes}</p>}

      <div className="space-y-8">
        {workout.workout_exercises.map((we) => {
          const e1rm = bestEstimatedOneRepMax(we.sets);
          return (
            <section key={we.id}>
              <div className="flex items-baseline justify-between gap-4 border-b border-divider pb-2">
                <Link
                  href={we.exercise ? `/exercises/${we.exercise.id}` : "#"}
                  className="font-semibold hover:text-accent"
                >
                  {we.exercise?.name ?? "Exercise"}
                </Link>
                <span className="tnum text-sm text-muted">
                  {num(Math.round(totalVolume(we.sets)))} {units}
                  {e1rm > 0 && <> · e1RM {num(e1rm)}</>}
                </span>
              </div>
              <ul className="mt-2 divide-y divide-divider">
                {we.sets.map((s) => (
                  <li
                    key={s.id}
                    className="tnum grid grid-cols-[2rem_1fr_1fr_3rem_auto] items-baseline gap-2 py-1.5 text-sm"
                  >
                    <span className="text-faint">
                      {s.set_type === "warmup" ? "W" : s.set_number}
                    </span>
                    <span>
                      {num(s.weight)} {units}
                    </span>
                    <span>{num(s.reps)} reps</span>
                    <span className="text-muted">{s.rpe ? `@${num(s.rpe)}` : ""}</span>
                    <span className="text-right text-xs text-faint">
                      {s.set_type !== "working" ? SET_TYPE_LABELS[s.set_type] : ""}
                    </span>
                  </li>
                ))}
              </ul>
              {we.notes && <p className="mt-2 text-sm text-muted">{we.notes}</p>}
            </section>
          );
        })}
      </div>
    </div>
  );
}
