"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

export interface WorkoutSummary {
  id: string;
  date: string; // ISO
  label: string; // pre-formatted date
  exercises: string[];
  setCount: number;
  volumeLabel: string;
}

export function HistoryList({ workouts }: { workouts: WorkoutSummary[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return workouts;
    return workouts.filter(
      (w) =>
        w.label.toLowerCase().includes(needle) ||
        w.exercises.some((e) => e.toLowerCase().includes(needle)),
    );
  }, [q, workouts]);

  return (
    <div>
      <input
        className="field mb-6"
        placeholder="Search by date or exercise…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-faint">No workouts match.</p>
      ) : (
        <ul className="divide-y divide-divider">
          {filtered.map((w) => (
            <li key={w.id}>
              <Link href={`/workout/${w.id}`} className="block py-4 hover:text-accent">
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-medium">{w.label}</span>
                  <span className="tnum text-sm text-muted">
                    {w.setCount} sets · {w.volumeLabel}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-muted">
                  {w.exercises.join(" · ") || "No exercises logged"}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
