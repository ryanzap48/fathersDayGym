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
            <>
              {/* Visual: a half-barbell loaded from the collar outward. */}
              <div className="mb-2 flex items-center gap-[2px]" aria-hidden>
                <span className="h-1 w-5 rounded-sm bg-faint" title="bar" />
                {result.perSide.map((plate, i) => {
                  const h = 18 + Math.min(28, plate) * 1.4;
                  return (
                    <span
                      key={i}
                      className="rounded-[2px] bg-accent"
                      style={{ height: `${h}px`, width: "9px", opacity: 0.55 + Math.min(0.45, plate / 100) }}
                      title={`${num(plate)} ${units}`}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-muted">Per side:</span>
                {groupPlates(result.perSide).map(({ plate, count }) => (
                  <span key={plate} className="font-medium">
                    {count}×{num(plate)}
                  </span>
                ))}
              </div>
            </>
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
