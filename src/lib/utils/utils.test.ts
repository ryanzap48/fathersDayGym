import { describe, it, expect } from "vitest";
import { estimateOneRepMax, weightForReps, bestEstimatedOneRepMax } from "./one-rep-max";
import { calculatePlates, groupPlates } from "./plate-calculator";
import { movingAverage } from "./moving-average";
import { totalVolume, totalReps, workingSetCount } from "./volume";
import { currentStreak, weeklyCounts } from "./consistency";
import { detectPersonalRecords } from "./personal-records";
import { mifflinStJeorBMR, tdee, calorieTargets, ageFromBirthdate, LB_TO_KG } from "./tdee";

describe("one-rep-max (Epley)", () => {
  it("returns the weight itself for a single rep", () => {
    expect(estimateOneRepMax(100, 1)).toBe(100);
  });
  it("applies the Epley formula", () => {
    expect(estimateOneRepMax(100, 5)).toBeCloseTo(116.667, 2);
    expect(estimateOneRepMax(225, 5)).toBeCloseTo(262.5, 1);
  });
  it("guards against non-positive input", () => {
    expect(estimateOneRepMax(0, 5)).toBe(0);
    expect(estimateOneRepMax(100, 0)).toBe(0);
  });
  it("weightForReps inverts the estimate", () => {
    const e1rm = estimateOneRepMax(100, 5);
    expect(weightForReps(e1rm, 5)).toBeCloseTo(100, 5);
  });
  it("bestEstimatedOneRepMax picks the top set", () => {
    expect(
      bestEstimatedOneRepMax([
        { weight: 100, reps: 5 },
        { weight: 140, reps: 1 },
        { weight: 120, reps: 3 },
      ]),
    ).toBeCloseTo(140, 5);
  });
});

describe("plate calculator", () => {
  it("loads a standard 135 lb bench", () => {
    const r = calculatePlates(135, "lb");
    expect(r.perSide).toEqual([45]);
    expect(r.achievable).toBe(135);
    expect(r.remainder).toBe(0);
  });
  it("loads 225 lb as two 45s per side", () => {
    expect(calculatePlates(225, "lb").perSide).toEqual([45, 45]);
  });
  it("returns just the bar at or below bar weight", () => {
    expect(calculatePlates(45, "lb").perSide).toEqual([]);
    expect(calculatePlates(20, "kg").perSide).toEqual([]);
  });
  it("reports a remainder when a target isn't loadable", () => {
    const r = calculatePlates(46, "lb"); // 0.5/side, smallest plate is 2.5
    expect(r.remainder).toBeGreaterThan(0);
  });
  it("groups plates by denomination", () => {
    expect(groupPlates([45, 45, 25, 10])).toEqual([
      { plate: 45, count: 2 },
      { plate: 25, count: 1 },
      { plate: 10, count: 1 },
    ]);
  });
});

describe("moving average", () => {
  it("computes a trailing average that settles in early", () => {
    const out = movingAverage(
      [
        { x: 1, y: 10 },
        { x: 2, y: 20 },
        { x: 3, y: 30 },
      ],
      2,
    );
    expect(out[0].avg).toBe(10);
    expect(out[1].avg).toBe(15);
    expect(out[2].avg).toBe(25);
  });
});

describe("volume", () => {
  const sets = [
    { weight: 100, reps: 5, set_type: "working" },
    { weight: 60, reps: 10, set_type: "warmup" },
    { weight: 100, reps: 5, set_type: "working" },
  ];
  it("excludes warm-ups by default", () => {
    expect(totalVolume(sets)).toBe(1000);
    expect(totalReps(sets)).toBe(10);
    expect(workingSetCount(sets)).toBe(2);
  });
  it("includes warm-ups when asked", () => {
    expect(totalVolume(sets, true)).toBe(1600);
  });
});

describe("consistency", () => {
  const iso = (d: Date) => d.toISOString();
  it("counts a current streak ending today", () => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    expect(currentStreak([iso(today), iso(yesterday)])).toBe(2);
  });
  it("returns 0 with no workouts", () => {
    expect(currentStreak([])).toBe(0);
  });
  it("buckets weekly counts to the requested window length", () => {
    expect(weeklyCounts([iso(new Date())], 4)).toHaveLength(4);
  });
});

describe("personal records", () => {
  it("detects heaviest, best e1RM, and most reps", () => {
    const prs = detectPersonalRecords([
      { exerciseId: "a", exerciseName: "Bench", date: "2024-01-01", weight: 100, reps: 5 },
      { exerciseId: "a", exerciseName: "Bench", date: "2024-02-01", weight: 110, reps: 3 },
      { exerciseId: "a", exerciseName: "Bench", date: "2024-03-01", weight: 90, reps: 12 },
    ]);
    const heaviest = prs.find((p) => p.kind === "heaviest");
    const mostReps = prs.find((p) => p.kind === "most_reps");
    expect(heaviest?.value).toBe(110);
    expect(mostReps?.reps).toBe(12);
  });
});

describe("tdee", () => {
  it("computes Mifflin–St Jeor BMR for men and women", () => {
    // 80kg, 180cm, 30y
    expect(mifflinStJeorBMR({ sex: "male", weightKg: 80, heightCm: 180, age: 30 })).toBeCloseTo(1780, 0);
    expect(mifflinStJeorBMR({ sex: "female", weightKg: 80, heightCm: 180, age: 30 })).toBeCloseTo(1614, 0);
  });
  it("scales BMR by activity factor", () => {
    expect(tdee(2000, "moderate")).toBeCloseTo(3100, 5);
  });
  it("derives cut/maintain/bulk targets", () => {
    expect(calorieTargets(2500)).toEqual({ cut: 2000, maintain: 2500, leanBulk: 2800 });
  });
  it("converts pounds to kilograms", () => {
    expect(200 * LB_TO_KG).toBeCloseTo(90.718, 2);
  });
  it("computes age from a birthdate and rejects empties", () => {
    expect(ageFromBirthdate("2000-01-01")).toBeGreaterThanOrEqual(25);
    expect(ageFromBirthdate(null)).toBeNull();
  });
});
