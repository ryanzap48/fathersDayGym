/**
 * Database types.
 *
 * Hand-maintained to match supabase/schema.sql. To regenerate from a live
 * project instead, run:
 *   npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts
 *
 * Each table carries a `Relationships: []` member because @supabase/postgrest-js
 * requires it to recognise the schema (relationships are resolved at runtime;
 * nested selects in the app are narrowed with explicit result types).
 */

export type UnitsPref = "kg" | "lb";
export type TrackingType = "weight_reps" | "bodyweight_reps" | "time" | "distance";
export type SetType = "warmup" | "working" | "dropset" | "failure";
export type GoalType = "bodyweight" | "one_rep_max" | "frequency" | "volume";

export type MuscleGroup =
  | "chest"
  | "back"
  | "legs"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "core";

export type Equipment = "barbell" | "dumbbell" | "machine" | "bodyweight" | "cable";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          units: UnitsPref;
          height_cm: number | null;
          birthdate: string | null;
          goal_weight: number | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name?: string | null;
          units?: UnitsPref;
          height_cm?: number | null;
          birthdate?: string | null;
          goal_weight?: number | null;
        };
        Update: {
          id?: string;
          name?: string | null;
          units?: UnitsPref;
          height_cm?: number | null;
          birthdate?: string | null;
          goal_weight?: number | null;
        };
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          primary_muscle: string;
          secondary_muscles: string[];
          equipment: string;
          tracking_type: TrackingType;
          is_custom: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          primary_muscle: string;
          secondary_muscles?: string[];
          equipment: string;
          tracking_type?: TrackingType;
          is_custom?: boolean;
        };
        Update: {
          name?: string;
          primary_muscle?: string;
          secondary_muscles?: string[];
          equipment?: string;
          tracking_type?: TrackingType;
          is_custom?: boolean;
        };
        Relationships: [];
      };
      routines: {
        Row: { id: string; user_id: string; name: string; notes: string | null; created_at: string };
        Insert: { id?: string; user_id: string; name: string; notes?: string | null };
        Update: { name?: string; notes?: string | null };
        Relationships: [];
      };
      routine_exercises: {
        Row: {
          id: string;
          routine_id: string;
          exercise_id: string;
          order_index: number;
          target_sets: number | null;
          target_reps: number | null;
        };
        Insert: {
          id?: string;
          routine_id: string;
          exercise_id: string;
          order_index?: number;
          target_sets?: number | null;
          target_reps?: number | null;
        };
        Update: {
          order_index?: number;
          target_sets?: number | null;
          target_reps?: number | null;
        };
        Relationships: [];
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          routine_id: string | null;
          started_at: string;
          ended_at: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          routine_id?: string | null;
          started_at?: string;
          ended_at?: string | null;
          notes?: string | null;
        };
        Update: {
          routine_id?: string | null;
          started_at?: string;
          ended_at?: string | null;
          notes?: string | null;
        };
        Relationships: [];
      };
      workout_exercises: {
        Row: {
          id: string;
          workout_id: string;
          exercise_id: string;
          order_index: number;
          notes: string | null;
        };
        Insert: {
          id?: string;
          workout_id: string;
          exercise_id: string;
          order_index?: number;
          notes?: string | null;
        };
        Update: { order_index?: number; notes?: string | null };
        Relationships: [];
      };
      sets: {
        Row: {
          id: string;
          workout_exercise_id: string;
          set_number: number;
          weight: number | null;
          reps: number | null;
          rpe: number | null;
          set_type: SetType;
          completed: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          workout_exercise_id: string;
          set_number?: number;
          weight?: number | null;
          reps?: number | null;
          rpe?: number | null;
          set_type?: SetType;
          completed?: boolean;
        };
        Update: {
          set_number?: number;
          weight?: number | null;
          reps?: number | null;
          rpe?: number | null;
          set_type?: SetType;
          completed?: boolean;
        };
        Relationships: [];
      };
      bodyweight_logs: {
        Row: { id: string; user_id: string; weight: number; logged_at: string };
        Insert: { id?: string; user_id: string; weight: number; logged_at?: string };
        Update: { weight?: number; logged_at?: string };
        Relationships: [];
      };
      body_measurements: {
        Row: { id: string; user_id: string; metric: string; value: number; logged_at: string };
        Insert: { id?: string; user_id: string; metric: string; value: number; logged_at?: string };
        Update: { metric?: string; value?: number; logged_at?: string };
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          type: GoalType;
          exercise_id: string | null;
          target_value: number;
          current_value: number;
          target_date: string | null;
          created_at: string;
          achieved_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: GoalType;
          exercise_id?: string | null;
          target_value: number;
          current_value?: number;
          target_date?: string | null;
          achieved_at?: string | null;
        };
        Update: {
          type?: GoalType;
          exercise_id?: string | null;
          target_value?: number;
          current_value?: number;
          target_date?: string | null;
          achieved_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      units_pref: UnitsPref;
      tracking_type: TrackingType;
      set_type: SetType;
      goal_type: GoalType;
    };
    CompositeTypes: Record<string, never>;
  };
}

// Convenience row aliases used across the app.
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Exercise = Database["public"]["Tables"]["exercises"]["Row"];
export type Routine = Database["public"]["Tables"]["routines"]["Row"];
export type Workout = Database["public"]["Tables"]["workouts"]["Row"];
export type WorkoutExercise = Database["public"]["Tables"]["workout_exercises"]["Row"];
export type WorkoutSet = Database["public"]["Tables"]["sets"]["Row"];
export type BodyweightLog = Database["public"]["Tables"]["bodyweight_logs"]["Row"];
export type BodyMeasurement = Database["public"]["Tables"]["body_measurements"]["Row"];
export type Goal = Database["public"]["Tables"]["goals"]["Row"];
