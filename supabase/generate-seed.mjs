// Generates supabase/seed.sql — a library of global (user_id = null) exercises.
// Run: node supabase/generate-seed.mjs
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// [name, primary, secondary[], equipment, tracking_type]
// tracking_type defaults to 'weight_reps' unless noted.
const ex = [];
const add = (name, primary, secondary, equipment, tracking = "weight_reps") =>
  ex.push({ name, primary, secondary, equipment, tracking });

// ---- Chest -----------------------------------------------------------------
add("Barbell Bench Press", "chest", ["triceps", "shoulders"], "barbell");
add("Incline Barbell Bench Press", "chest", ["shoulders", "triceps"], "barbell");
add("Decline Barbell Bench Press", "chest", ["triceps"], "barbell");
add("Dumbbell Bench Press", "chest", ["triceps", "shoulders"], "dumbbell");
add("Incline Dumbbell Bench Press", "chest", ["shoulders", "triceps"], "dumbbell");
add("Decline Dumbbell Bench Press", "chest", ["triceps"], "dumbbell");
add("Dumbbell Fly", "chest", [], "dumbbell");
add("Incline Dumbbell Fly", "chest", [], "dumbbell");
add("Cable Fly", "chest", [], "cable");
add("Low Cable Fly", "chest", [], "cable");
add("High Cable Fly", "chest", [], "cable");
add("Machine Chest Press", "chest", ["triceps"], "machine");
add("Incline Machine Press", "chest", ["shoulders"], "machine");
add("Pec Deck", "chest", [], "machine");
add("Push-Up", "chest", ["triceps", "core"], "bodyweight", "bodyweight_reps");
add("Incline Push-Up", "chest", ["triceps"], "bodyweight", "bodyweight_reps");
add("Decline Push-Up", "chest", ["shoulders"], "bodyweight", "bodyweight_reps");
add("Chest Dip", "chest", ["triceps"], "bodyweight", "bodyweight_reps");
add("Svend Press", "chest", [], "dumbbell");

// ---- Back ------------------------------------------------------------------
add("Deadlift", "back", ["legs", "core"], "barbell");
add("Romanian Deadlift", "back", ["legs"], "barbell");
add("Sumo Deadlift", "back", ["legs"], "barbell");
add("Barbell Row", "back", ["biceps"], "barbell");
add("Pendlay Row", "back", ["biceps"], "barbell");
add("T-Bar Row", "back", ["biceps"], "barbell");
add("Dumbbell Row", "back", ["biceps"], "dumbbell");
add("Chest-Supported Dumbbell Row", "back", ["biceps"], "dumbbell");
add("Pull-Up", "back", ["biceps"], "bodyweight", "bodyweight_reps");
add("Chin-Up", "back", ["biceps"], "bodyweight", "bodyweight_reps");
add("Wide-Grip Pull-Up", "back", ["biceps"], "bodyweight", "bodyweight_reps");
add("Lat Pulldown", "back", ["biceps"], "cable");
add("Close-Grip Lat Pulldown", "back", ["biceps"], "cable");
add("Straight-Arm Pulldown", "back", [], "cable");
add("Seated Cable Row", "back", ["biceps"], "cable");
add("Wide-Grip Seated Row", "back", ["shoulders"], "cable");
add("Machine Row", "back", ["biceps"], "machine");
add("Machine Pulldown", "back", ["biceps"], "machine");
add("Rack Pull", "back", ["legs"], "barbell");
add("Good Morning", "back", ["legs"], "barbell");
add("Hyperextension", "back", ["legs"], "bodyweight", "bodyweight_reps");
add("Inverted Row", "back", ["biceps"], "bodyweight", "bodyweight_reps");

// ---- Legs ------------------------------------------------------------------
add("Back Squat", "legs", ["core"], "barbell");
add("Front Squat", "legs", ["core"], "barbell");
add("Box Squat", "legs", [], "barbell");
add("Pause Squat", "legs", [], "barbell");
add("Hack Squat", "legs", [], "machine");
add("Leg Press", "legs", [], "machine");
add("Bulgarian Split Squat", "legs", ["core"], "dumbbell");
add("Goblet Squat", "legs", ["core"], "dumbbell");
add("Walking Lunge", "legs", [], "dumbbell");
add("Reverse Lunge", "legs", [], "dumbbell");
add("Barbell Lunge", "legs", [], "barbell");
add("Step-Up", "legs", [], "dumbbell");
add("Leg Extension", "legs", [], "machine");
add("Lying Leg Curl", "legs", [], "machine");
add("Seated Leg Curl", "legs", [], "machine");
add("Standing Calf Raise", "legs", [], "machine");
add("Seated Calf Raise", "legs", [], "machine");
add("Barbell Calf Raise", "legs", [], "barbell");
add("Hip Thrust", "legs", ["core"], "barbell");
add("Glute Bridge", "legs", [], "bodyweight", "bodyweight_reps");
add("Cable Pull-Through", "legs", ["back"], "cable");
add("Sissy Squat", "legs", [], "bodyweight", "bodyweight_reps");
add("Pistol Squat", "legs", ["core"], "bodyweight", "bodyweight_reps");
add("Nordic Curl", "legs", [], "bodyweight", "bodyweight_reps");

// ---- Shoulders -------------------------------------------------------------
add("Overhead Press", "shoulders", ["triceps"], "barbell");
add("Push Press", "shoulders", ["triceps", "legs"], "barbell");
add("Seated Barbell Press", "shoulders", ["triceps"], "barbell");
add("Dumbbell Shoulder Press", "shoulders", ["triceps"], "dumbbell");
add("Arnold Press", "shoulders", ["triceps"], "dumbbell");
add("Lateral Raise", "shoulders", [], "dumbbell");
add("Cable Lateral Raise", "shoulders", [], "cable");
add("Front Raise", "shoulders", [], "dumbbell");
add("Rear Delt Fly", "shoulders", [], "dumbbell");
add("Reverse Pec Deck", "shoulders", [], "machine");
add("Face Pull", "shoulders", ["back"], "cable");
add("Upright Row", "shoulders", ["biceps"], "barbell");
add("Machine Shoulder Press", "shoulders", ["triceps"], "machine");
add("Landmine Press", "shoulders", ["triceps"], "barbell");
add("Barbell Shrug", "shoulders", ["back"], "barbell");
add("Dumbbell Shrug", "shoulders", ["back"], "dumbbell");

// ---- Arms (biceps / triceps) ----------------------------------------------
add("Barbell Curl", "biceps", [], "barbell");
add("EZ-Bar Curl", "biceps", [], "barbell");
add("Dumbbell Curl", "biceps", [], "dumbbell");
add("Hammer Curl", "biceps", ["forearms"], "dumbbell");
add("Incline Dumbbell Curl", "biceps", [], "dumbbell");
add("Concentration Curl", "biceps", [], "dumbbell");
add("Preacher Curl", "biceps", [], "barbell");
add("Cable Curl", "biceps", [], "cable");
add("Cable Hammer Curl", "biceps", ["forearms"], "cable");
add("Spider Curl", "biceps", [], "dumbbell");
add("Machine Curl", "biceps", [], "machine");
add("Close-Grip Bench Press", "triceps", ["chest"], "barbell");
add("Triceps Pushdown", "triceps", [], "cable");
add("Rope Pushdown", "triceps", [], "cable");
add("Overhead Cable Extension", "triceps", [], "cable");
add("Skullcrusher", "triceps", [], "barbell");
add("Dumbbell Overhead Extension", "triceps", [], "dumbbell");
add("Triceps Kickback", "triceps", [], "dumbbell");
add("Triceps Dip", "triceps", ["chest"], "bodyweight", "bodyweight_reps");
add("Bench Dip", "triceps", [], "bodyweight", "bodyweight_reps");
add("Diamond Push-Up", "triceps", ["chest"], "bodyweight", "bodyweight_reps");
add("Wrist Curl", "forearms", [], "dumbbell");
add("Reverse Wrist Curl", "forearms", [], "dumbbell");
add("Reverse Curl", "forearms", ["biceps"], "barbell");
add("Farmer's Carry", "forearms", ["core"], "dumbbell", "distance");

// ---- Core ------------------------------------------------------------------
add("Plank", "core", [], "bodyweight", "time");
add("Side Plank", "core", [], "bodyweight", "time");
add("Hanging Leg Raise", "core", [], "bodyweight", "bodyweight_reps");
add("Hanging Knee Raise", "core", [], "bodyweight", "bodyweight_reps");
add("Cable Crunch", "core", [], "cable");
add("Crunch", "core", [], "bodyweight", "bodyweight_reps");
add("Sit-Up", "core", [], "bodyweight", "bodyweight_reps");
add("Russian Twist", "core", [], "bodyweight", "bodyweight_reps");
add("Ab Wheel Rollout", "core", [], "bodyweight", "bodyweight_reps");
add("Mountain Climber", "core", [], "bodyweight", "bodyweight_reps");
add("Dead Bug", "core", [], "bodyweight", "bodyweight_reps");
add("Bicycle Crunch", "core", [], "bodyweight", "bodyweight_reps");
add("Decline Sit-Up", "core", [], "bodyweight", "bodyweight_reps");
add("Machine Crunch", "core", [], "machine");
add("Pallof Press", "core", [], "cable");
add("Toes-to-Bar", "core", [], "bodyweight", "bodyweight_reps");

// ---- Cardio / conditioning (distance / time) -------------------------------
add("Treadmill Run", "legs", ["core"], "machine", "distance");
add("Outdoor Run", "legs", ["core"], "bodyweight", "distance");
add("Rowing Machine", "back", ["legs"], "machine", "distance");
add("Stationary Bike", "legs", [], "machine", "distance");
add("Elliptical", "legs", [], "machine", "time");
add("Stair Climber", "legs", ["core"], "machine", "time");
add("Jump Rope", "legs", ["core"], "bodyweight", "time");

// Build SQL ------------------------------------------------------------------
const esc = (s) => s.replace(/'/g, "''");
const arr = (a) =>
  a.length ? `array[${a.map((x) => `'${esc(x)}'`).join(",")}]::text[]` : `'{}'::text[]`;

const values = ex
  .map(
    (e) =>
      `  (null, '${esc(e.name)}', '${e.primary}', ${arr(e.secondary)}, '${e.equipment}', '${e.tracking}', false)`,
  )
  .join(",\n");

const sql = `-- =============================================================================
-- Lift — exercise library seed (${ex.length} global exercises).
-- Generated by supabase/generate-seed.mjs — do not edit by hand.
-- Safe to re-run: skips names that already exist as global rows.
-- =============================================================================
insert into public.exercises
  (user_id, name, primary_muscle, secondary_muscles, equipment, tracking_type, is_custom)
values
${values}
on conflict do nothing;
`;

writeFileSync(join(__dirname, "seed.sql"), sql);
console.log(`Wrote seed.sql with ${ex.length} exercises.`);
