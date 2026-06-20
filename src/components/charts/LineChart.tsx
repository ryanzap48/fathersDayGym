"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton } from "./ChartSkeleton";

// Recharts is heavy — load it client-side only, after the page shell renders.
export const LineChart = dynamic(() => import("./LineChartImpl").then((m) => m.LineChart), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});

export type { LineSeries } from "./LineChartImpl";
