"use client";

import { useMemo, useState } from "react";
import type { UnitsPref } from "@/lib/database.types";
import { Stat, SectionTitle } from "@/components/ui";
import { estimateOneRepMax, weightForReps } from "@/lib/utils/one-rep-max";
import { num } from "@/lib/utils/format";

const REP_TARGETS = [1, 2, 3, 5, 8, 10, 12];

export function OneRepMaxCalculator({ units }: { units: UnitsPref }) {
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");

  const result = useMemo(() => {
    const w = parseFloat(weight);
    const r = parseFloat(reps);
    if (!w || !r || w <= 0 || r <= 0) return null;
    const e1rm = estimateOneRepMax(w, r);
    return {
      e1rm,
      table: REP_TARGETS.map((t) => ({ reps: t, weight: weightForReps(e1rm, t) })),
    };
  }, [weight, reps]);

  return (
    <div className="space-y-10">
      <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
        <div>
          <label htmlFor="orm-weight" className="block text-sm font-medium">
            Weight lifted ({units})
          </label>
          <input
            id="orm-weight"
            type="number"
            inputMode="decimal"
            className="field mt-1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="—"
          />
        </div>
        <div>
          <label htmlFor="orm-reps" className="block text-sm font-medium">
            Reps performed
          </label>
          <input
            id="orm-reps"
            type="number"
            inputMode="numeric"
            className="field mt-1"
            value={reps}
            onChange={(e) => setReps(e.target.value)}
            placeholder="—"
          />
        </div>
      </div>

      {result ? (
        <>
          <section className="border-t border-divider pt-8">
            <Stat
              label="Estimated 1RM"
              value={`${num(Math.round(result.e1rm))} ${units}`}
              sub="Epley formula"
              accent
            />
          </section>

          <section>
            <SectionTitle>What that predicts</SectionTitle>
            <ul className="divide-y divide-divider">
              {result.table.map((row) => (
                <li key={row.reps} className="tnum flex items-baseline justify-between py-2.5">
                  <span className="text-muted">{row.reps} reps</span>
                  <span className="font-medium">
                    {num(Math.round(row.weight))} {units}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <p className="text-xs text-faint">
            Estimates use Epley (1RM = weight × (1 + reps / 30)). They get less accurate above
            ~10 reps — treat them as a guide, not a guarantee.
          </p>
        </>
      ) : (
        <p className="border-t border-divider pt-8 text-sm text-faint">
          Enter a weight and the reps you hit to estimate your one-rep max.
        </p>
      )}
    </div>
  );
}
