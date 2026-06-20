/**
 * Training volume helpers. Volume = sets × reps × weight, summed.
 * Warm-up sets are excluded by default since they don't reflect working load.
 */

export type SetLike = {
  weight: number | null;
  reps: number | null;
  set_type?: string | null;
};

export function setVolume(set: SetLike): number {
  return (set.weight ?? 0) * (set.reps ?? 0);
}

export function totalVolume(sets: SetLike[], includeWarmups = false): number {
  return sets.reduce((sum, s) => {
    if (!includeWarmups && s.set_type === "warmup") return sum;
    return sum + setVolume(s);
  }, 0);
}

export function totalReps(sets: SetLike[], includeWarmups = false): number {
  return sets.reduce((sum, s) => {
    if (!includeWarmups && s.set_type === "warmup") return sum;
    return sum + (s.reps ?? 0);
  }, 0);
}

export function workingSetCount(sets: SetLike[]): number {
  return sets.filter((s) => s.set_type !== "warmup").length;
}
