"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { BodyMeasurement, UnitsPref } from "@/lib/database.types";
import { LineChart } from "@/components/charts/LineChart";
import { Stat, SectionTitle } from "@/components/ui";
import { num, delta, shortDate } from "@/lib/utils/format";

const METRICS = ["Waist", "Chest", "Arms", "Shoulders", "Hips", "Thighs", "Calves", "Neck"];

export function MeasurementsTracker({
  initial,
  units,
}: {
  initial: BodyMeasurement[];
  units: UnitsPref;
}) {
  const supabase = createClient();
  const unitLabel = units === "kg" ? "cm" : "in";

  const [rows, setRows] = useState<BodyMeasurement[]>(initial);
  const [metric, setMetric] = useState(METRICS[0]);
  const [value, setValue] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [pending, setPending] = useState(false);
  const [chartMetric, setChartMetric] = useState(METRICS[0]);

  // Latest value + change per metric that has data.
  const latestByMetric = useMemo(() => {
    const map = new Map<string, BodyMeasurement[]>();
    for (const r of rows) {
      const arr = map.get(r.metric) ?? [];
      arr.push(r);
      map.set(r.metric, arr);
    }
    return [...map.entries()].map(([m, list]) => {
      const sorted = [...list].sort((a, b) => a.logged_at.localeCompare(b.logged_at));
      const latest = sorted.at(-1)!;
      const prev = sorted.at(-2);
      return { metric: m, latest: latest.value, change: prev ? latest.value - prev.value : 0 };
    });
  }, [rows]);

  const chartData = useMemo(
    () =>
      rows
        .filter((r) => r.metric === chartMetric)
        .sort((a, b) => a.logged_at.localeCompare(b.logged_at))
        .map((r) => ({ date: shortDate(r.logged_at), [chartMetric]: r.value })),
    [rows, chartMetric],
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = parseFloat(value);
    if (!v || v <= 0) return;
    setPending(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data } = await supabase
      .from("body_measurements")
      .insert({ user_id: u.user.id, metric, value: v, logged_at: date })
      .select("*")
      .single();
    if (data) {
      setRows((prev) => [...prev, data as BodyMeasurement]);
      setValue("");
      setChartMetric(metric);
    }
    setPending(false);
  }

  return (
    <div className="space-y-10">
      <form onSubmit={submit} className="flex flex-wrap items-end gap-4 border-b border-divider pb-6">
        <div>
          <label className="block text-sm font-medium">Measurement</label>
          <select className="field mt-1" value={metric} onChange={(e) => setMetric(e.target.value)}>
            {METRICS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium">Value ({unitLabel})</label>
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

      {latestByMetric.length === 0 ? (
        <p className="py-10 text-center text-sm text-faint">
          No measurements yet. Log a few to track how your body changes over time.
        </p>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
            {latestByMetric.map((m) => (
              <Stat
                key={m.metric}
                label={m.metric}
                value={`${num(m.latest)} ${unitLabel}`}
                sub={m.change !== 0 ? `${delta(m.change)} ${unitLabel}` : undefined}
              />
            ))}
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between border-b border-divider pb-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">Trend</h2>
              <select
                className="bg-transparent text-sm text-muted focus:outline-none"
                value={chartMetric}
                onChange={(e) => setChartMetric(e.target.value)}
                aria-label="Choose measurement to chart"
              >
                {METRICS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <LineChart
              data={chartData}
              xKey="date"
              unit={` ${unitLabel}`}
              series={[{ key: chartMetric, label: chartMetric, color: "#e2502c" }]}
            />
          </section>
        </>
      )}
    </div>
  );
}
