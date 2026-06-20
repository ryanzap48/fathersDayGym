/** Placeholder shown while the chart library is loading (kept text-light). */
export function ChartSkeleton({ height = 240 }: { height?: number }) {
  return (
    <div
      style={{ height }}
      className="flex items-center justify-center text-sm text-faint"
      aria-hidden
    >
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
    </div>
  );
}
