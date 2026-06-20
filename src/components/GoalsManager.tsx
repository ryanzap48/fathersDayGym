"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { GoalType } from "@/lib/database.types";
import { Progress } from "@/components/ui";
import { num } from "@/lib/utils/format";

export interface GoalView {
  id: string;
  type: GoalType;
  title: string;
  current: number;
  target: number;
  unit: string;
  targetDate: string | null;
  achieved: boolean;
}

const TYPE_LABEL: Record<GoalType, string> = {
  bodyweight: "Body weight",
  one_rep_max: "Estimated 1RM",
  frequency: "Workouts / week",
  volume: "Weekly volume",
};

export function GoalsManager({
  goals,
  exercises,
  units,
}: {
  goals: GoalView[];
  exercises: { id: string; name: string }[];
  units: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [adding, setAdding] = useState(false);

  // Add-form state
  const [type, setType] = useState<GoalType>("one_rep_max");
  const [exerciseId, setExerciseId] = useState(exercises[0]?.id ?? "");
  const [target, setTarget] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [pending, setPending] = useState(false);

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();
    const t = parseFloat(target);
    if (!t) return;
    setPending(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from("goals").insert({
      user_id: u.user.id,
      type,
      exercise_id: type === "one_rep_max" ? exerciseId : null,
      target_value: t,
      target_date: targetDate || null,
    });
    setPending(false);
    setAdding(false);
    setTarget("");
    router.refresh();
  }

  async function remove(id: string) {
    await supabase.from("goals").delete().eq("id", id);
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <div className="flex justify-end">
        <button onClick={() => setAdding((a) => !a)} className="btn btn-ghost text-sm text-accent">
          {adding ? "Cancel" : "+ New goal"}
        </button>
      </div>

      {adding && (
        <form onSubmit={addGoal} className="grid gap-4 border-b border-divider pb-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Type</label>
            <select className="field mt-1" value={type} onChange={(e) => setType(e.target.value as GoalType)}>
              {(Object.keys(TYPE_LABEL) as GoalType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
          {type === "one_rep_max" && (
            <div>
              <label className="block text-sm font-medium">Exercise</label>
              <select className="field mt-1" value={exerciseId} onChange={(e) => setExerciseId(e.target.value)}>
                {exercises.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium">Target value</label>
            <input
              type="number"
              inputMode="decimal"
              className="field mt-1"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder={type === "frequency" ? "e.g. 4" : `e.g. 225`}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Target date (optional)</label>
            <input type="date" className="field mt-1" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={pending} className="btn btn-accent">
              {pending ? "Saving…" : "Add goal"}
            </button>
          </div>
        </form>
      )}

      {goals.length === 0 ? (
        <p className="py-10 text-center text-sm text-faint">
          No goals yet. Set a target and watch the line close in on it.
        </p>
      ) : (
        <ul className="space-y-8">
          {goals.map((g) => {
            const pct = g.target > 0 ? Math.min(100, (g.current / g.target) * 100) : 0;
            return (
              <li key={g.id}>
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">{g.title}</h3>
                    <p className="text-xs uppercase tracking-wider text-faint">{TYPE_LABEL[g.type]}</p>
                  </div>
                  <button onClick={() => remove(g.id)} className="text-sm text-faint hover:text-bad">
                    Remove
                  </button>
                </div>
                <div className="tnum mt-2 mb-2 flex items-baseline justify-between text-sm">
                  <span className={g.achieved ? "font-medium text-good" : "font-medium"}>
                    {num(g.current)} / {num(g.target)} {g.unit}
                    {g.achieved && " · achieved"}
                  </span>
                  <span className="text-muted">
                    {num(pct)}%
                    {g.targetDate && <span className="ml-3 text-faint">by {g.targetDate}</span>}
                  </span>
                </div>
                <Progress value={pct} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
