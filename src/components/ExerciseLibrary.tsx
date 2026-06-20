"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Exercise, TrackingType } from "@/lib/database.types";
import { MUSCLE_LABELS } from "@/lib/utils/format";

const MUSCLES = ["chest", "back", "legs", "shoulders", "biceps", "triceps", "forearms", "core"];
const EQUIPMENT = ["barbell", "dumbbell", "machine", "cable", "bodyweight"];

export function ExerciseLibrary({ exercises }: { exercises: Exercise[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return exercises
      .filter((e) => (muscle ? e.primary_muscle === muscle : true))
      .filter((e) => (needle ? e.name.toLowerCase().includes(needle) : true));
  }, [exercises, q, muscle]);

  const grouped = useMemo(() => {
    const map = new Map<string, Exercise[]>();
    for (const e of filtered) {
      const arr = map.get(e.primary_muscle) ?? [];
      arr.push(e);
      map.set(e.primary_muscle, arr);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-4 pb-4">
        <input
          className="field flex-1"
          placeholder="Search exercises…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button onClick={() => setCreating((c) => !c)} className="btn btn-ghost text-sm text-accent">
          {creating ? "Cancel" : "+ Custom exercise"}
        </button>
      </div>

      {creating && (
        <CustomExerciseForm
          onDone={() => {
            setCreating(false);
            router.refresh();
          }}
          create={async (payload) => {
            const { data } = await supabase.auth.getUser();
            if (!data.user) return;
            await supabase.from("exercises").insert({ ...payload, user_id: data.user.id, is_custom: true });
          }}
        />
      )}

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
            className={`whitespace-nowrap ${muscle === m ? "text-accent" : "text-muted hover:text-foreground"}`}
          >
            {MUSCLE_LABELS[m]}
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <p className="py-10 text-center text-sm text-faint">No exercises match.</p>
      ) : (
        grouped.map(([m, list]) => (
          <section key={m} className="mt-6">
            <h2 className="mb-2 border-b border-divider pb-2 text-sm font-semibold uppercase tracking-wider text-muted">
              {MUSCLE_LABELS[m] ?? m}
            </h2>
            <ul className="divide-y divide-divider">
              {list.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/exercises/${e.id}`}
                    className="flex items-baseline justify-between gap-4 py-2.5 hover:text-accent"
                  >
                    <span className="font-medium">
                      {e.name}
                      {e.is_custom && <span className="ml-2 text-xs text-faint">custom</span>}
                    </span>
                    <span className="text-sm capitalize text-muted">{e.equipment}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function CustomExerciseForm({
  create,
  onDone,
}: {
  create: (p: {
    name: string;
    primary_muscle: string;
    equipment: string;
    tracking_type: TrackingType;
  }) => Promise<void>;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [primary, setPrimary] = useState("chest");
  const [equipment, setEquipment] = useState("barbell");
  const [tracking, setTracking] = useState<TrackingType>("weight_reps");
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setPending(true);
    await create({ name: name.trim(), primary_muscle: primary, equipment, tracking_type: tracking });
    setPending(false);
    onDone();
  }

  return (
    <form onSubmit={submit} className="mb-4 grid gap-4 border-b border-divider pb-6 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium">Name</label>
        <input className="field mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Larsen Press" />
      </div>
      <div>
        <label className="block text-sm font-medium">Muscle group</label>
        <select className="field mt-1" value={primary} onChange={(e) => setPrimary(e.target.value)}>
          {MUSCLES.map((m) => (
            <option key={m} value={m}>
              {MUSCLE_LABELS[m]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">Equipment</label>
        <select className="field mt-1" value={equipment} onChange={(e) => setEquipment(e.target.value)}>
          {EQUIPMENT.map((eq) => (
            <option key={eq} value={eq} className="capitalize">
              {eq}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">Tracking</label>
        <select
          className="field mt-1"
          value={tracking}
          onChange={(e) => setTracking(e.target.value as TrackingType)}
        >
          <option value="weight_reps">Weight + reps</option>
          <option value="bodyweight_reps">Bodyweight + reps</option>
          <option value="time">Time</option>
          <option value="distance">Distance</option>
        </select>
      </div>
      <div className="flex items-end">
        <button type="submit" disabled={pending} className="btn btn-accent">
          {pending ? "Saving…" : "Add exercise"}
        </button>
      </div>
    </form>
  );
}
