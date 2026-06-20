/** Minimal, text-based loading indicator — no boxed spinners, per the design. */
export default function Loading() {
  return (
    <div className="flex items-center gap-2 py-20 text-sm text-faint">
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
      Loading…
    </div>
  );
}
