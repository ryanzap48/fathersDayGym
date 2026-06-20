import { shortDate } from "@/lib/utils/format";

/**
 * A GitHub-style training calendar. Columns are weeks, rows are weekdays
 * (Mon top). Intensity is a single accent at varying opacity — no borders.
 */
export function Heatmap({ days }: { days: { date: string; count: number }[] }) {
  if (days.length === 0) {
    return <p className="py-10 text-center text-sm text-faint">No training days yet.</p>;
  }

  // Pad the front so the first column starts on a Monday.
  const first = new Date(days[0].date);
  const lead = (first.getDay() + 6) % 7; // Mon=0
  const padded = [
    ...Array.from({ length: lead }, () => null),
    ...days,
  ];

  const weeks: ({ date: string; count: number } | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));

  const opacityFor = (count: number) =>
    count === 0 ? 0.06 : Math.min(1, 0.3 + count * 0.35);

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {Array.from({ length: 7 }, (_, di) => {
              const cell = week[di];
              if (!cell) return <div key={di} className="h-3 w-3" />;
              return (
                <div
                  key={di}
                  title={`${shortDate(cell.date)} — ${cell.count} workout${cell.count === 1 ? "" : "s"}`}
                  className="h-3 w-3 rounded-[2px]"
                  style={{ backgroundColor: "var(--accent)", opacity: opacityFor(cell.count) }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
