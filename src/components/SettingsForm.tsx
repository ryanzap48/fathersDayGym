"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile, UnitsPref } from "@/lib/database.types";

export function SettingsForm({ profile }: { profile: Profile }) {
  const supabase = createClient();
  const router = useRouter();
  const [name, setName] = useState(profile.name ?? "");
  const [units, setUnits] = useState<UnitsPref>(profile.units);
  const [height, setHeight] = useState(profile.height_cm?.toString() ?? "");
  const [birthdate, setBirthdate] = useState(profile.birthdate ?? "");
  const [goalWeight, setGoalWeight] = useState(profile.goal_weight?.toString() ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    await supabase
      .from("profiles")
      .update({
        name: name || null,
        units,
        height_cm: height ? Number(height) : null,
        birthdate: birthdate || null,
        goal_weight: goalWeight ? Number(goalWeight) : null,
      })
      .eq("id", profile.id);
    setStatus("saved");
    router.refresh();
    setTimeout(() => setStatus("idle"), 1500);
  }

  return (
    <form onSubmit={save} className="grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium">Name</label>
        <input className="field mt-1" value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium">Units</label>
        <div className="mt-3 flex gap-6 text-sm">
          {(["lb", "kg"] as UnitsPref[]).map((u) => (
            <label key={u} className="flex items-center gap-2">
              <input
                type="radio"
                name="units"
                checked={units === u}
                onChange={() => setUnits(u)}
                className="accent-accent"
              />
              {u}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium">Goal weight ({units})</label>
        <input
          type="number"
          inputMode="decimal"
          className="field mt-1"
          value={goalWeight}
          onChange={(e) => setGoalWeight(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Height (cm)</label>
        <input
          type="number"
          inputMode="decimal"
          className="field mt-1"
          value={height}
          onChange={(e) => setHeight(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Birthdate</label>
        <input type="date" className="field mt-1" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} />
      </div>

      <div className="flex items-center gap-4 sm:col-span-2">
        <button type="submit" disabled={status === "saving"} className="btn btn-primary">
          {status === "saving" ? "Saving…" : "Save changes"}
        </button>
        {status === "saved" && <span className="text-sm text-good">Saved</span>}
      </div>
    </form>
  );
}
