"use client";

import { useMemo, useState } from "react";
import type { UnitsPref } from "@/lib/database.types";
import { Stat, SectionTitle } from "@/components/ui";
import { num } from "@/lib/utils/format";
import {
  ACTIVITY,
  LB_TO_KG,
  type ActivityLevel,
  type Sex,
  mifflinStJeorBMR,
  tdee,
  calorieTargets,
  proteinRange,
} from "@/lib/utils/tdee";

export function TdeeCalculator({
  units,
  initialWeight,
  initialHeightCm,
  initialAge,
}: {
  units: UnitsPref;
  initialWeight: number | null;
  initialHeightCm: number | null;
  initialAge: number | null;
}) {
  const [sex, setSex] = useState<Sex>("male");
  const [weight, setWeight] = useState(initialWeight?.toString() ?? "");
  const [heightCm, setHeightCm] = useState(initialHeightCm?.toString() ?? "");
  const [age, setAge] = useState(initialAge?.toString() ?? "");
  const [level, setLevel] = useState<ActivityLevel>("moderate");

  const result = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(heightCm);
    const a = parseFloat(age);
    if (!w || !h || !a) return null;
    const weightKg = units === "lb" ? w * LB_TO_KG : w;
    const bmr = mifflinStJeorBMR({ sex, weightKg, heightCm: h, age: a });
    if (bmr <= 0) return null;
    const maintenance = tdee(bmr, level);
    return {
      bmr: Math.round(bmr),
      maintenance: Math.round(maintenance),
      targets: calorieTargets(maintenance),
      protein: proteinRange(weightKg),
    };
  }, [weight, heightCm, age, sex, level, units]);

  return (
    <div className="space-y-10">
      <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
        <div>
          <span className="block text-sm font-medium">Sex</span>
          <div className="mt-3 flex gap-6 text-sm">
            {(["male", "female"] as Sex[]).map((s) => (
              <label key={s} className="flex items-center gap-2 capitalize">
                <input
                  type="radio"
                  name="sex"
                  checked={sex === s}
                  onChange={() => setSex(s)}
                  className="accent-accent"
                />
                {s}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="tdee-age" className="block text-sm font-medium">
            Age
          </label>
          <input
            id="tdee-age"
            type="number"
            inputMode="numeric"
            className="field mt-1"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="years"
          />
        </div>

        <div>
          <label htmlFor="tdee-weight" className="block text-sm font-medium">
            Weight ({units})
          </label>
          <input
            id="tdee-weight"
            type="number"
            inputMode="decimal"
            className="field mt-1"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="—"
          />
        </div>

        <div>
          <label htmlFor="tdee-height" className="block text-sm font-medium">
            Height (cm)
          </label>
          <input
            id="tdee-height"
            type="number"
            inputMode="decimal"
            className="field mt-1"
            value={heightCm}
            onChange={(e) => setHeightCm(e.target.value)}
            placeholder="cm"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="tdee-activity" className="block text-sm font-medium">
            Activity level
          </label>
          <select
            id="tdee-activity"
            className="field mt-1"
            value={level}
            onChange={(e) => setLevel(e.target.value as ActivityLevel)}
          >
            {(Object.keys(ACTIVITY) as ActivityLevel[]).map((l) => (
              <option key={l} value={l}>
                {ACTIVITY[l].label} — {ACTIVITY[l].hint}
              </option>
            ))}
          </select>
        </div>
      </div>

      {result ? (
        <>
          <section className="grid grid-cols-2 gap-x-8 gap-y-6 border-t border-divider pt-8 sm:grid-cols-3">
            <Stat label="Maintenance" value={`${num(result.maintenance)}`} sub="kcal / day" accent />
            <Stat label="BMR" value={`${num(result.bmr)}`} sub="kcal at rest" />
            <Stat
              label="Protein"
              value={`${result.protein.low}–${result.protein.high}`}
              sub="g / day"
            />
          </section>

          <section>
            <SectionTitle>Daily calorie targets</SectionTitle>
            <ul className="divide-y divide-divider">
              {[
                ["Cut", result.targets.cut, "−500 kcal · ~0.5 kg/week loss"],
                ["Maintain", result.targets.maintain, "Hold steady"],
                ["Lean bulk", result.targets.leanBulk, "+300 kcal · slow gain"],
              ].map(([label, value, hint]) => (
                <li key={label as string} className="flex items-baseline justify-between gap-4 py-3">
                  <div>
                    <span className="font-medium">{label}</span>
                    <span className="ml-3 text-sm text-muted">{hint}</span>
                  </div>
                  <span className="tnum text-lg font-semibold">{num(value as number)} kcal</span>
                </li>
              ))}
            </ul>
          </section>

          <p className="text-xs text-faint">
            Estimates use the Mifflin–St Jeor equation. Real needs vary — adjust by ±100–200
            kcal based on how your body weight trend actually moves over 2–3 weeks.
          </p>
        </>
      ) : (
        <p className="border-t border-divider pt-8 text-sm text-faint">
          Enter your age, weight, and height to see your numbers.
        </p>
      )}
    </div>
  );
}
