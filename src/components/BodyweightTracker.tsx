"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BodyweightLog, UnitsPref } from "@/lib/database.types";
import { LineChart } from "@/components/charts/LineChart";
import { Stat, SectionTitle, Progress } from "@/components/ui";
import { movingAverage } from "@/lib/utils/moving-average";
import { num, weight as fmtWeight, delta, shortDate } from "@/lib/utils/format";

export function BodyweightTracker({
  initialLogs,
  goalWeight,
  units,
}: {
  initialLogs: BodyweightLog[];
  goalWeight: number | null;
  units: UnitsPref;
}) {
  const supabase = createClient();
  const [logs, setLogs] = useState<BodyweightLog[]>(initialLogs);
  const [value, setValue] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pending, setPending] = useState(false);

  const sorted = useMemo(
    () => [...logs].sort((a, b) => a.logged_at.localeCompare(b.logged_at)),
    [logs],
  );

  const chartData = useMemo(() => {
    const points = sorted.map((l) => ({ x: l.logged_at, y: l.weight }));
    return movingAverage(points, 7).map((p) => ({
      date: shortDate(p.x),
      Weight: Math.round(p.y * 10) / 10,
      "7-day avg": Math.round(p.avg * 10) / 10,
    }));
  }, [sorted]);

  const latest = sorted.at(-1)?.weight ?? null;
  const first = sorted[0]?.weight ?? null;
  const prev = sorted.at(-2)?.weight ?? null;
  const totalChange = latest !== null && first !== null ? latest - first : 0;
  const lastChange = latest !== null && prev !== null ? latest - prev : 0;

  const goalProgress =
    goalWeight && first !== null && latest !== null && first !== goalWeight
      ? Math.min(100, Math.max(0, ((first - latest) / (first - goalWeight)) * 100))
      : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const w = parseFloat(value);
    if (!w || w <= 0) return;
    setPending(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data } = await supabase
      .from("bodyweight_logs")
      .insert({ user_id: u.user.id, weight: w, logged_at: date })
      .select("*")
      .single();
    if (data) {
      setLogs((prev) => [...prev.filter((l) => l.logged_at !== date), data as BodyweightLog]);
      setValue("");
    }
    setPending(false);
  }

  return (
    <div className="space-y-10">
      <form onSubmit={submit} className="flex flex-wrap items-end gap-4 border-b border-divider pb-6">
        <div className="flex-1">
          <label className="block text-sm font-medium">Weight ({units})</label>
          <input
            type="number"
            inputMode="decimal"
            className="field mt-1"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="—"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Date</label>
          <input type="date" className="field mt-1" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <button type="submit" disabled={pending} className="btn btn-accent">
          {pending ? "Saving…" : "Log"}
        </button>
      </form>

      <section className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
        <Stat label="Current" value={latest !== null ? fmtWeight(latest, units) : "—"} accent />
        <Stat
          label="Since last"
          value={<span className={lastChange <= 0 ? "text-good" : ""}>{delta(lastChange)}</span>}
        />
        <Stat label="Total change" value={delta(totalChange)} sub={`over ${sorted.length} entries`} />
        <Stat label="Goal" value={goalWeight ? fmtWeight(goalWeight, units) : "—"} />
      </section>

      {goalWeight && latest !== null && (
        <section>
          <div className="mb-2 flex items-baseline justify-between text-sm">
            <span className="text-muted">Progress to goal</span>
            <span className="tnum font-medium">{num(goalProgress)}%</span>
          </div>
          <Progress value={goalProgress} />
        </section>
      )}

      <section>
        <SectionTitle>Trend</SectionTitle>
        <LineChart
          data={chartData}
          xKey="date"
          unit={` ${units}`}
          series={[
            { key: "Weight", label: "Weight", color: "#a1a1aa" },
            { key: "7-day avg", label: "7-day avg", color: "#e2502c" },
          ]}
        />
      </section>
    </div>
  );
}
