/**
 * Estimated one-rep max using the Epley formula:
 *   1RM = weight × (1 + reps/30)
 *
 * A single rep returns the weight itself. Returns 0 for non-positive input.
 */
export function estimateOneRepMax(weight: number, reps: number): number {
  if (!weight || !reps || weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
}

/**
 * Inverse Epley: the weight you'd expect to move for `reps` given a 1RM.
 * Useful for suggesting working weights from a known max.
 */
export function weightForReps(oneRepMax: number, reps: number): number {
  if (oneRepMax <= 0 || reps <= 0) return 0;
  return oneRepMax / (1 + reps / 30);
}

/** Best estimated 1RM across a collection of sets. */
export function bestEstimatedOneRepMax(
  sets: { weight: number | null; reps: number | null }[],
): number {
  return sets.reduce((best, s) => {
    const e = estimateOneRepMax(s.weight ?? 0, s.reps ?? 0);
    return e > best ? e : best;
  }, 0);
}
