"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Exercise } from "@/lib/database.types";
import { MUSCLE_LABELS } from "@/lib/utils/format";

const MUSCLES = ["chest", "back", "legs", "shoulders", "biceps", "triceps", "core"];

export function ExercisePicker({
  exercises,
  onPick,
  onClose,
}: {
  exercises: Exercise[];
  onPick: (e: Exercise) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape, lock background scroll, and restore focus on unmount.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [onClose]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return exercises
      .filter((e) => (muscle ? e.primary_muscle === muscle : true))
      .filter((e) => (needle ? e.name.toLowerCase().includes(needle) : true))
      .slice(0, 60);
  }, [exercises, q, muscle]);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-picker-title"
      className="fixed inset-0 z-50 flex flex-col bg-background"
    >
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6 sm:px-6">
        <div className="flex items-center justify-between pb-4">
          <h2 id="exercise-picker-title" className="text-lg font-semibold">
            Add exercise
          </h2>
          <button onClick={onClose} className="btn-ghost text-sm text-muted">
            Close
          </button>
        </div>

        <input
          autoFocus
          className="field"
          placeholder="Search exercises…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <div className="flex gap-3 overflow-x-auto py-3 text-sm">
          <button
            onClick={() => setMuscle(null)}
            className={muscle === null ? "text-accent" : "text-muted hover:text-foreground"}
          >
            All
          </button>
          {MUSCLES.map((m) => (
            <button
              key={m}
              onClick={() => setMuscle(m)}
              className={`whitespace-nowrap ${
                muscle === m ? "text-accent" : "text-muted hover:text-foreground"
              }`}
            >
              {MUSCLE_LABELS[m]}
            </button>
          ))}
        </div>

        <ul className="flex-1 divide-y divide-divider overflow-y-auto">
          {filtered.map((e) => (
            <li key={e.id}>
              <button
                onClick={() => onPick(e)}
                className="flex w-full items-baseline justify-between gap-4 py-3 text-left hover:text-accent"
              >
                <span className="font-medium">
                  {e.name}
                  {e.is_custom && <span className="ml-2 text-xs text-faint">custom</span>}
                </span>
                <span className="text-sm capitalize text-muted">
                  {MUSCLE_LABELS[e.primary_muscle] ?? e.primary_muscle} · {e.equipment}
                </span>
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="py-10 text-center text-sm text-faint">No matches.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
