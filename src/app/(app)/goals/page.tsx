import { createClient } from "@/lib/supabase/server";
import { getWorkouts, getProfile, toSetRecords } from "@/lib/queries";
import { thisWeekVolume } from "@/lib/utils/analytics";
import { workoutsThisWeek } from "@/lib/utils/consistency";
import { detectPersonalRecords } from "@/lib/utils/personal-records";
import { PageHeader } from "@/components/ui";
import { GoalsManager, type GoalView } from "@/components/GoalsManager";

export const metadata = { title: "Goals" };

export default async function GoalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [{ data: goals }, workouts, profile, { data: bw }, { data: exercises }] = await Promise.all([
    supabase.from("goals").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    getWorkouts(supabase, userId),
    getProfile(supabase, userId),
    supabase.from("bodyweight_logs").select("weight, logged_at").eq("user_id", userId).order("logged_at", { ascending: false }).limit(1),
    supabase.from("exercises").select("id, name").or(`user_id.eq.${userId},user_id.is.null`).order("name"),
  ]);

  const units = profile?.units ?? "lb";
  const records = toSetRecords(workouts);
  const prs = detectPersonalRecords(records);
  const latestWeight = bw?.[0]?.weight ?? 0;
  const weekVolume = thisWeekVolume(workouts);
  const weekFreq = workoutsThisWeek(workouts.map((w) => w.started_at));
  const exMap = new Map((exercises ?? []).map((e) => [e.id, e.name]));

  const views: GoalView[] = (goals ?? []).map((g) => {
    let current = 0;
    let title = "";
    let unit: string = units;

    switch (g.type) {
      case "bodyweight":
        current = latestWeight;
        title = "Reach body weight";
        break;
      case "one_rep_max": {
        const best = prs.find((p) => p.exerciseId === g.exercise_id && p.kind === "best_e1rm");
        current = best ? Math.round(best.value) : 0;
        title = `${g.exercise_id ? exMap.get(g.exercise_id) ?? "Exercise" : "Exercise"} 1RM`;
        break;
      }
      case "frequency":
        current = weekFreq;
        title = "Train each week";
        unit = "× / wk";
        break;
      case "volume":
        current = Math.round(weekVolume);
        title = "Weekly volume";
        break;
    }

    const achieved =
      g.type === "bodyweight"
        ? // bodyweight goals can be cut or bulk — treat "reached" as within 0.5
          Math.abs(current - g.target_value) <= 0.5
        : current >= g.target_value;

    return {
      id: g.id,
      type: g.type,
      title,
      current,
      target: g.target_value,
      unit,
      targetDate: g.target_date,
      achieved,
    };
  });

  return (
    <div>
      <PageHeader title="Goals" subtitle="Targets, tracked against your real numbers." />
      <GoalsManager goals={views} exercises={exercises ?? []} units={units} />
    </div>
  );
}
