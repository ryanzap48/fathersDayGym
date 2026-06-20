"use client";

import { useMemo, useState } from "react";
import type { UnitsPref } from "@/lib/database.types";
import { calculatePlates, groupPlates, DEFAULT_BAR_WEIGHT } from "@/lib/utils/plate-calculator";
import { num } from "@/lib/utils/format";

export function PlateCalculator({ units }: { units: UnitsPref }) {
  const [target, setTarget] = useState<string>("");
  const bar = DEFAULT_BAR_WEIGHT[units];

  const result = useMemo(() => {
    const t = parseFloat(target);
    if (!t || t <= 0) return null;
    return calculatePlates(t, units, bar);
  }, [target, units, bar]);

  return (
    <div className="space-y-3">
      <label className="block text-xs font-medium uppercase tracking-wider text-faint">
        Plate calculator · {bar} {units} bar
      </label>
      <input
        type="number"
        inputMode="decimal"
        className="field"
        placeholder={`Target weight (${units})`}
        value={target}
        onChange={(e) => setTarget(e.target.value)}
      />
      {result && (
        <div className="tnum text-sm">
          {result.perSide.length === 0 ? (
            <span className="text-muted">Just the bar.</span>
          ) : (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="text-muted">Per side:</span>
              {groupPlates(result.perSide).map(({ plate, count }) => (
                <span key={plate} className="font-medium">
                  {count}×{num(plate)}
                </span>
              ))}
            </div>
          )}
          {result.remainder > 0 && (
            <p className="mt-1 text-xs text-muted">
              Closest loadable: {num(result.achievable)} {units} ({num(result.remainder)} {units}/side
              short)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
