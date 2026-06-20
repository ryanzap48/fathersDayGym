"use client";

import {
  ResponsiveContainer,
  LineChart as ReLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { CHART, axisProps, tooltipStyle } from "./theme";

export interface LineSeries {
  key: string;
  label: string;
  color?: string;
  dashed?: boolean;
}

/**
 * A spare line chart: thin strokes, muted axes, no gridlines or container.
 * `xKey` values should already be display-formatted (e.g. short dates).
 */
export function LineChart({
  data,
  xKey,
  series,
  height = 240,
  unit = "",
}: {
  data: Record<string, string | number>[];
  xKey: string;
  series: LineSeries[];
  height?: number;
  unit?: string;
}) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-faint">Not enough data yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ReLineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <XAxis dataKey={xKey} {...axisProps} minTickGap={24} />
        <YAxis {...axisProps} width={48} unit={unit} />
        <Tooltip {...tooltipStyle} formatter={(v) => `${v}${unit}`} />
        {series.map((s) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color ?? CHART.accent}
            strokeWidth={2}
            strokeDasharray={s.dashed ? "4 4" : undefined}
            dot={false}
            activeDot={{ r: 3, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        ))}
      </ReLineChart>
    </ResponsiveContainer>
  );
}
