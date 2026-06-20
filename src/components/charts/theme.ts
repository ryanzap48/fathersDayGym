/** Shared chart palette — kept in sync with globals.css design tokens. */
export const CHART = {
  accent: "#e2502c",
  foreground: "#18181b",
  muted: "#71717a",
  faint: "#a1a1aa",
  divider: "#e8e8e4",
  good: "#2f7d54",
} as const;

export const axisProps = {
  stroke: CHART.faint,
  tick: { fill: CHART.muted, fontSize: 12 },
  tickLine: false,
  axisLine: { stroke: CHART.divider },
} as const;

export const tooltipStyle = {
  contentStyle: {
    border: "none",
    borderRadius: 2,
    boxShadow: "0 1px 8px rgba(0,0,0,0.08)",
    fontSize: 13,
    padding: "8px 12px",
  },
  labelStyle: { color: CHART.muted, marginBottom: 2 },
  cursor: { stroke: CHART.divider },
} as const;
