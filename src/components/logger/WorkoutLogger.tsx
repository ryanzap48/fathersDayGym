"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Exercise, SetType, UnitsPref } from "@/lib/database.types";
import { RestTimer } from "./RestTimer";
import { PlateCalculator } from "./PlateCalculator";
import { ExercisePicker } from "./ExercisePicker";
import { estimateOneRepMax } from "@/lib/utils/one-rep-max";
import { totalVolume } from "@/lib/utils/volume";
import { num, SET_TYPE_LABELS } from "@/lib/utils/format";

interface LiveSet {
  id: string;
  set_number: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  set_type: SetType;
  completed: boolean;
}

interface Block {
  workoutExerciseId: string;
  exercise: Exercise;
  notes: string;
  sets: LiveSet[];
  last: LiveSet[] | null;
}

const SET_TYPES: SetType[] = ["working", "warmup", "dropset", "failure"];
const tempId = () => `tmp-${Math.random().toString(36).slice(2)}`;

export function WorkoutLogger({
  workoutId,
  exercises,
  units,
}: {
  workoutId: string;
  exercises: Exercise[];
  units: UnitsPref;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [finishing, startFinish] = useTransition();

  function patchBlock(id: string, fn: (b: Block) => Block) {
    setBlocks((bs) => bs.map((b) => (b.workoutExerciseId === id ? fn(b) : b)));
  }

  async function fetchLast(exerciseId: string): Promise<LiveSet[] | null> {
    const { data } = await supabase
      .from("workout_exercises")
      .select("id, sets(weight, reps, rpe, set_type, set_number, completed), workout:workouts!inner(started_at)")
      .eq("exercise_id", exerciseId)
      .neq("workout_id", workoutId)
      .limit(25);

    if (!data || data.length === 0) return null;
    const rows = data as unknown as {
      id: string;
      sets: LiveSet[];
      workout: { started_at: string };
    }[];
    rows.sort((a, b) => b.workout.started_at.localeCompare(a.workout.started_at));
    const last = rows.find((r) => r.sets.length > 0);
    return last ? [...last.sets].sort((a, b) => a.set_number - b.set_number) : null;
  }

  async function addExercise(exercise: Exercise) {
    setPickerOpen(false);
    const order = blocks.length;
    const { data, error } = await supabase
      .from("workout_exercises")
      .insert({ workout_id: workoutId, exercise_id: exercise.id, order_index: order })
      .select("id")
      .single();
    if (error || !data) return;

    const last = await fetchLast(exercise.id);
    setBlocks((bs) => [
      ...bs,
      { workoutExerciseId: data.id, exercise, notes: "", sets: [], last },
    ]);
  }

  async function removeExercise(id: string) {
    setBlocks((bs) => bs.filter((b) => b.workoutExerciseId !== id));
    await supabase.from("workout_exercises").delete().eq("id", id);
  }

  async function addSet(block: Block) {
    const prev = block.sets[block.sets.length - 1];
    const fromLast = block.last?.[block.sets.length];
    const draft: LiveSet = {
      id: tempId(),
      set_number: block.sets.length + 1,
      weight: prev?.weight ?? fromLast?.weight ?? null,
      reps: prev?.reps ?? fromLast?.reps ?? null,
      rpe: null,
      set_type: "working",
      completed: true,
    };
    patchBlock(block.workoutExerciseId, (b) => ({ ...b, sets: [...b.sets, draft] }));

    const { data } = await supabase
      .from("sets")
      .insert({
        workout_exercise_id: block.workoutExerciseId,
        set_number: draft.set_number,
        weight: draft.weight,
        reps: draft.reps,
        set_type: draft.set_type,
      })
      .select("id")
      .single();
    if (data) {
      patchBlock(block.workoutExerciseId, (b) => ({
        ...b,
        sets: b.sets.map((s) => (s.id === draft.id ? { ...s, id: data.id } : s)),
      }));
    }
  }

  function updateSet(blockId: string, setId: string, patch: Partial<LiveSet>) {
    patchBlock(blockId, (b) => ({
      ...b,
      sets: b.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
    }));
  }

  async function persistSet(setId: string, patch: Partial<Omit<LiveSet, "id">>) {
    if (setId.startsWith("tmp-")) return; // insert in flight; will be saved on next edit
    setSaving(true);
    await supabase.from("sets").update(patch).eq("id", setId);
    setSaving(false);
  }

  async function removeSet(blockId: string, setId: string) {
    patchBlock(blockId, (b) => ({ ...b, sets: b.sets.filter((s) => s.id !== setId) }));
    if (!setId.startsWith("tmp-")) await supabase.from("sets").delete().eq("id", setId);
  }

  function finish() {
    startFinish(async () => {
      await supabase
        .from("workouts")
        .update({ ended_at: new Date().toISOString() })
        .eq("id", workoutId);
      router.replace(`/workout/${workoutId}`);
      router.refresh();
    });
  }

  async function discard() {
    await supabase.from("workouts").delete().eq("id", workoutId);
    router.replace("/dashboard");
    router.refresh();
  }

  const totalVol = blocks.reduce((sum, b) => sum + totalVolume(b.sets), 0);
  const totalSets = blocks.reduce((n, b) => n + b.sets.filter((s) => s.set_type !== "warmup").length, 0);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-divider pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Active workout</h1>
          <p className="tnum mt-1 text-sm text-muted">
            {blocks.length} exercises · {totalSets} working sets · {num(Math.round(totalVol))} {units} volume
            {saving && <span className="ml-2 text-faint">saving…</span>}
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={discard} className="btn btn-ghost text-sm text-muted">
            Discard
          </button>
          <button onClick={finish} disabled={finishing} className="btn btn-primary">
            {finishing ? "Finishing…" : "Finish"}
          </button>
        </div>
      </div>

      <div className="grid gap-8 border-b border-divider pb-8 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-faint">Rest timer</p>
          <RestTimer />
        </div>
        <PlateCalculator units={units} />
      </div>

      {blocks.map((block) => (
        <ExerciseBlock
          key={block.workoutExerciseId}
          block={block}
          units={units}
          onAddSet={() => addSet(block)}
          onUpdateSet={(setId, patch) => updateSet(block.workoutExerciseId, setId, patch)}
          onPersistSet={persistSet}
          onRemoveSet={(setId) => removeSet(block.workoutExerciseId, setId)}
          onRemove={() => removeExercise(block.workoutExerciseId)}
          onNotes={(notes) => {
            patchBlock(block.workoutExerciseId, (b) => ({ ...b, notes }));
          }}
          onPersistNotes={(notes) =>
            supabase.from("workout_exercises").update({ notes }).eq("id", block.workoutExerciseId)
          }
        />
      ))}

      <button onClick={() => setPickerOpen(true)} className="btn btn-accent">
        + Add exercise
      </button>

      {pickerOpen && (
        <ExercisePicker
          exercises={exercises}
          onPick={addExercise}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

function ExerciseBlock({
  block,
  units,
  onAddSet,
  onUpdateSet,
  onPersistSet,
  onRemoveSet,
  onRemove,
  onNotes,
  onPersistNotes,
}: {
  block: Block;
  units: UnitsPref;
  onAddSet: () => void;
  onUpdateSet: (setId: string, patch: Partial<LiveSet>) => void;
  onPersistSet: (setId: string, patch: Partial<LiveSet>) => void;
  onRemoveSet: (setId: string) => void;
  onRemove: () => void;
  onNotes: (notes: string) => void;
  onPersistNotes: (notes: string) => void;
}) {
  const trackingWeight = block.exercise.tracking_type === "weight_reps";
  const bestE1rm = block.sets.reduce(
    (m, s) => Math.max(m, estimateOneRepMax(s.weight ?? 0, s.reps ?? 0)),
    0,
  );

  return (
    <section>
      <div className="flex items-baseline justify-between gap-4 border-b border-divider pb-2">
        <h3 className="font-semibold">{block.exercise.name}</h3>
        <div className="flex items-center gap-4 text-sm text-muted">
          {bestE1rm > 0 && <span className="tnum">e1RM {num(bestE1rm)} {units}</span>}
          <button onClick={onRemove} className="hover:text-bad">
            Remove
          </button>
        </div>
      </div>

      {block.last && (
        <p className="tnum mt-2 text-xs text-muted">
          Last time:{" "}
          {block.last
            .filter((s) => s.set_type !== "warmup")
            .map((s) => `${num(s.weight)}×${num(s.reps)}`)
            .join(", ") || "—"}
        </p>
      )}

      <div className="mt-3">
        <div className="grid grid-cols-[2rem_1fr_1fr_2.5rem_auto_1.5rem] items-center gap-2 pb-1 text-xs font-medium uppercase tracking-wider text-faint">
          <span>Set</span>
          <span>{trackingWeight ? `Weight (${units})` : "Value"}</span>
          <span>Reps</span>
          <span>RPE</span>
          <span>Type</span>
          <span />
        </div>

        {block.sets.map((s) => (
          <div
            key={s.id}
            className="grid grid-cols-[2rem_1fr_1fr_2.5rem_auto_1.5rem] items-center gap-2 py-1"
          >
            <span
              className={`tnum text-sm ${s.set_type === "warmup" ? "text-faint" : "text-muted"}`}
            >
              {s.set_type === "warmup" ? "W" : s.set_number}
            </span>
            <input
              type="number"
              inputMode="decimal"
              className="cell-input"
              value={s.weight ?? ""}
              onChange={(e) =>
                onUpdateSet(s.id, { weight: e.target.value === "" ? null : Number(e.target.value) })
              }
              onBlur={(e) =>
                onPersistSet(s.id, { weight: e.target.value === "" ? null : Number(e.target.value) })
              }
            />
            <input
              type="number"
              inputMode="numeric"
              className="cell-input"
              value={s.reps ?? ""}
              onChange={(e) =>
                onUpdateSet(s.id, { reps: e.target.value === "" ? null : Number(e.target.value) })
              }
              onBlur={(e) =>
                onPersistSet(s.id, { reps: e.target.value === "" ? null : Number(e.target.value) })
              }
            />
            <input
              type="number"
              inputMode="decimal"
              className="cell-input"
              value={s.rpe ?? ""}
              onChange={(e) =>
                onUpdateSet(s.id, { rpe: e.target.value === "" ? null : Number(e.target.value) })
              }
              onBlur={(e) =>
                onPersistSet(s.id, { rpe: e.target.value === "" ? null : Number(e.target.value) })
              }
            />
            <select
              value={s.set_type}
              onChange={(e) => {
                const set_type = e.target.value as SetType;
                onUpdateSet(s.id, { set_type });
                onPersistSet(s.id, { set_type });
              }}
              className="bg-transparent text-xs text-muted focus:outline-none"
              aria-label="Set type"
            >
              {SET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {SET_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <button
              onClick={() => onRemoveSet(s.id)}
              className="text-faint hover:text-bad"
              aria-label="Remove set"
            >
              ×
            </button>
          </div>
        ))}

        <button onClick={onAddSet} className="mt-2 text-sm text-accent hover:opacity-80">
          + Add set
        </button>
      </div>

      <input
        className="field mt-4 text-sm"
        placeholder="Notes for this exercise…"
        value={block.notes}
        onChange={(e) => onNotes(e.target.value)}
        onBlur={(e) => onPersistNotes(e.target.value)}
      />
    </section>
  );
}
