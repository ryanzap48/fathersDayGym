/**
 * Total Daily Energy Expenditure (TDEE).
 *
 * BMR uses the Mifflin–St Jeor equation (the modern standard), then TDEE is
 * BMR scaled by an activity factor. All math is metric internally; callers
 * convert pounds → kilograms with LB_TO_KG.
 */

export type Sex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "very" | "extra";

export const LB_TO_KG = 0.45359237;

export const ACTIVITY: Record<
  ActivityLevel,
  { label: string; factor: number; hint: string }
> = {
  sedentary: { label: "Sedentary", factor: 1.2, hint: "Little or no exercise" },
  light: { label: "Light", factor: 1.375, hint: "Training 1–3 days/week" },
  moderate: { label: "Moderate", factor: 1.55, hint: "Training 3–5 days/week" },
  very: { label: "Very active", factor: 1.725, hint: "Training 6–7 days/week" },
  extra: { label: "Extra active", factor: 1.9, hint: "Hard daily training or physical job" },
};

/** Basal metabolic rate (kcal/day) — Mifflin–St Jeor. */
export function mifflinStJeorBMR(opts: {
  sex: Sex;
  weightKg: number;
  heightCm: number;
  age: number;
}): number {
  const { sex, weightKg, heightCm, age } = opts;
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) return 0;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

/** TDEE = BMR × activity factor (kcal/day). */
export function tdee(bmr: number, level: ActivityLevel): number {
  return bmr * ACTIVITY[level].factor;
}

/** Common calorie targets derived from a maintenance TDEE. */
export function calorieTargets(maintenance: number) {
  return {
    cut: Math.round(maintenance - 500),
    maintain: Math.round(maintenance),
    leanBulk: Math.round(maintenance + 300),
  };
}

/** Suggested daily protein band (grams) — ~1.6–2.2 g per kg of body weight. */
export function proteinRange(weightKg: number): { low: number; high: number } {
  return { low: Math.round(weightKg * 1.6), high: Math.round(weightKg * 2.2) };
}

/** Whole years between a birthdate (ISO date) and now. */
export function ageFromBirthdate(birthdate: string | null): number | null {
  if (!birthdate) return null;
  const b = new Date(birthdate);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age -= 1;
  return age > 0 ? age : null;
}
