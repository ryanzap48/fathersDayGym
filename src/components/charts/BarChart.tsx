"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton } from "./ChartSkeleton";

// Recharts is heavy — load it client-side only, after the page shell renders.
export const BarChart = dynamic(() => import("./BarChartImpl").then((m) => m.BarChart), {
  ssr: false,
  loading: () => <ChartSkeleton />,
});
