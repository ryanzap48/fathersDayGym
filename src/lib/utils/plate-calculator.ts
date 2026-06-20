import type { UnitsPref } from "@/lib/database.types";

/** Standard plate denominations available per side, heaviest first. */
const PLATES: Record<UnitsPref, number[]> = {
  lb: [45, 35, 25, 10, 5, 2.5],
  kg: [25, 20, 15, 10, 5, 2.5, 1.25],
};

export const DEFAULT_BAR_WEIGHT: Record<UnitsPref, number> = {
  lb: 45,
  kg: 20,
};

export interface PlateResult {
  /** Plates to load on EACH side, heaviest first. */
  perSide: number[];
  /** Weight reachable with available plates (may be < target). */
  achievable: number;
  /** Leftover that couldn't be matched with available plates. */
  remainder: number;
}

/**
 * Given a target total barbell weight, return the plates to load per side.
 * Greedy from the heaviest plate down — correct for standard gym sets.
 */
export function calculatePlates(
  target: number,
  units: UnitsPref,
  barWeight: number = DEFAULT_BAR_WEIGHT[units],
): PlateResult {
  const perSide: number[] = [];
  if (target <= barWeight) {
    return { perSide, achievable: barWeight, remainder: 0 };
  }

  let perSideRemaining = (target - barWeight) / 2;
  for (const plate of PLATES[units]) {
    while (perSideRemaining >= plate - 1e-9) {
      perSide.push(plate);
      perSideRemaining -= plate;
    }
  }

  const loadedPerSide = perSide.reduce((a, b) => a + b, 0);
  return {
    perSide,
    achievable: barWeight + loadedPerSide * 2,
    remainder: Math.round(perSideRemaining * 100) / 100,
  };
}

/** Collapse the per-side list into `{ plate, count }` pairs for display. */
export function groupPlates(perSide: number[]): { plate: number; count: number }[] {
  const map = new Map<number, number>();
  for (const p of perSide) map.set(p, (map.get(p) ?? 0) + 1);
  return [...map.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([plate, count]) => ({ plate, count }));
}
