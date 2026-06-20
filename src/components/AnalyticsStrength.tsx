"use client";

import { useState } from "react";
import { LineChart } from "@/components/charts/LineChart";

export interface StrengthSeries {
  id: string;
  name: string;
  data: { date: string; "Est. 1RM": number; "Top set": number }[];
}

export function AnalyticsStrength({ series, units }: { series: StrengthSeries[]; units: string }) {
  const [id, setId] = useState(series[0]?.id ?? "");
  const active = series.find((s) => s.id === id) ?? series[0];

  if (!active) {
    return <p className="py-10 text-center text-sm text-faint">Log a few sessions to chart strength.</p>;
  }

  return (
    <div>
      <select
        className="field mb-4 max-w-xs"
        value={id}
        onChange={(e) => setId(e.target.value)}
        aria-label="Choose exercise"
      >
        {series.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <LineChart
        data={active.data}
        xKey="date"
        unit={` ${units}`}
        series={[
          { key: "Est. 1RM", label: "Est. 1RM", color: "#e2502c" },
          { key: "Top set", label: "Top set", color: "#18181b", dashed: true },
        ]}
      />
    </div>
  );
}
