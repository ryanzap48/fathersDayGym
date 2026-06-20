"use client";

import {
  ResponsiveContainer,
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { CHART, axisProps, tooltipStyle } from "./theme";

/** A minimal bar chart for weekly volume and muscle-group balance. */
export function BarChart({
  data,
  xKey,
  yKey,
  height = 240,
  unit = "",
  horizontal = false,
  highlightMax = false,
}: {
  data: Record<string, string | number>[];
  xKey: string;
  yKey: string;
  height?: number;
  unit?: string;
  horizontal?: boolean;
  highlightMax?: boolean;
}) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-faint">Not enough data yet.</p>;
  }

  const max = Math.max(...data.map((d) => Number(d[yKey]) || 0));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReBarChart
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ top: 8, right: 8, bottom: 0, left: horizontal ? 8 : -12 }}
      >
        {horizontal ? (
          <>
            <XAxis type="number" {...axisProps} unit={unit} />
            <YAxis type="category" dataKey={xKey} {...axisProps} width={84} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} {...axisProps} minTickGap={8} />
            <YAxis {...axisProps} width={48} unit={unit} />
          </>
        )}
        <Tooltip
          {...tooltipStyle}
          cursor={{ fill: CHART.divider, opacity: 0.4 }}
          formatter={(v) => `${v}${unit}`}
        />
        <Bar dataKey={yKey} radius={1} isAnimationActive={false}>
          {data.map((d, i) => (
            <Cell
              key={i}
              fill={highlightMax && Number(d[yKey]) === max ? CHART.accent : CHART.foreground}
            />
          ))}
        </Bar>
      </ReBarChart>
    </ResponsiveContainer>
  );
}
