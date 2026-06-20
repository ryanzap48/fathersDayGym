"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface RoutineSummary {
  id: string;
  name: string;
  exercises: string[];
}

export function RoutinesList({ routines }: { routines: RoutineSummary[] }) {
  const router = useRouter();
  const supabase = createClient();

  async function remove(id: string) {
    if (!window.confirm("Delete this routine?")) return;
    await supabase.from("routines").delete().eq("id", id);
    router.refresh();
  }

  if (routines.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-faint">
        No routines yet. Finish a workout and tap “Save as routine” to reuse its structure.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-divider">
      {routines.map((r) => (
        <li key={r.id} className="py-4">
          <div className="flex items-baseline justify-between gap-4">
            <h3 className="font-semibold">{r.name}</h3>
            <div className="flex items-center gap-4 text-sm">
              <Link href={`/workout/new?routine=${r.id}`} className="text-accent hover:opacity-80">
                Start
              </Link>
              <button onClick={() => remove(r.id)} className="text-faint hover:text-bad">
                Delete
              </button>
            </div>
          </div>
          <p className="mt-1 truncate text-sm text-muted">
            {r.exercises.join(" · ") || "No exercises"}
          </p>
        </li>
      ))}
    </ul>
  );
}
