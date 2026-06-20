"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  queueInsert,
  queueUpdate,
  queueDelete,
  flushQueue,
  useSyncStatus,
} from "@/lib/offline-queue";
import { useWakeLock } from "@/lib/hooks/useWakeLock";
import type { Exercise, SetType, UnitsPref } from "@/lib/database.types";
import { RestTimer } from "./RestTimer";
import { PlateCalculator } from "./PlateCalculator";
import { ExercisePicker } from "./ExercisePicker";
import { estimateOneRepMax } from "@/lib/utils/one-rep-max";
import { totalVolume } from "@/lib/utils/volume";
import { warmupSets } from "@/lib/utils/plate-calculator";
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

export interface InitialBlock {
  workoutExerciseId: string;
  exercise: Exercise;
  notes: string;
  sets: LiveSet[];
}

export interface PrBaseline {
  [exerciseId: string]: { e1rm: number; weight: number; reps: number };
}

const SET_TYPES: SetType[] = ["working", "warmup", "dropset", "failure"];
const uuid = () => crypto.randomUUID();

export function WorkoutLogger({
  workoutId,
  exercises,
  units,
  mode = "new",
  initialBlocks = [],
  prBaseline = {},
  created = true,
  userId,
  routineId = null,
}: {
  workoutId: string;
  exercises: Exercise[];
  units: UnitsPref;
  mode?: "new" | "edit";
  initialBlocks?: InitialBlock[];
  prBaseline?: PrBaseline;
  /** Whether the workout row already exists in the DB. */
  created?: boolean;
  userId?: string;
  routineId?: string | null;
}) {
  const supabase = createClient();
  const router = useRouter();
  const { pending, online, failed } = useSyncStatus();
  useWakeLock(true);

  // The draft workout row is created lazily on the first exercise so abandoning
  // the screen never leaves an empty workout behind.
  const createdRef = useRef(created);
  function ensureWorkout() {
    if (createdRef.current) return;
    queueInsert("workouts", { id: workoutId, user_id: userId, routine_id: routineId });
    createdRef.current = true;
  }

  const [blocks, setBlocks] = useState<Block[]>(
    initialBlocks.map((b) => ({ ...b, last: null })),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [finishing, startFinish] = useTransition();
  const [restSignal, setRestSignal] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  // Mutable PR baseline so each record only celebrates once.
  const prRef = useRef<PrBaseline>({ ...prBaseline });
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function showToast(msg: string) {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }

  function patchBlock(id: string, fn: (b: Block) => Block) {
    setBlocks((bs) => bs.map((b) => (b.workoutExerciseId === id ? fn(b) : b)));
  }

  async function fetchLast(exerciseId: string): Promise<LiveSet[] | null> {
    const { data } = await supabase
      .from("workout_exercises")
      .select(
        "id, sets(weight, reps, rpe, set_type, set_number, completed), workout:workouts!inner(started_at)",
      )
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

  // Backfill "last time" for pre-loaded blocks (edit / from-routine).
  useEffect(() => {
    if (initialBlocks.length === 0) return;
    let cancelled = false;
    (async () => {
      for (const b of initialBlocks) {
        const last = await fetchLast(b.exercise.id);
        if (cancelled) return;
        patchBlock(b.workoutExerciseId, (blk) => ({ ...blk, last }));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addExercise(exercise: Exercise) {
    setPickerOpen(false);
    ensureWorkout();
    const id = uuid();
    queueInsert("workout_exercises", {
      id,
      workout_id: workoutId,
      exercise_id: exercise.id,
      order_index: blocks.length,
    });
    const last = await fetchLast(exercise.id);
    setBlocks((bs) => [
      ...bs,
      { workoutExerciseId: id, exercise, notes: "", sets: [], last },
    ]);
  }

  function removeExercise(id: string) {
    const block = blocks.find((b) => b.workoutExerciseId === id);
    if (block && block.sets.length > 0 && !window.confirm(`Remove ${block.exercise.name} and its ${block.sets.length} set(s)?`)) {
      return;
    }
    setBlocks((bs) => bs.filter((b) => b.workoutExerciseId !== id));
    queueDelete("workout_exercises", "id", id);
  }

  function addSet(block: Block) {
    const prev = block.sets[block.sets.length - 1];
    const fromLast = block.last?.[block.sets.length];
    const id = uuid();
    const draft: LiveSet = {
      id,
      set_number: block.sets.length + 1,
      weight: prev?.weight ?? fromLast?.weight ?? null,
      reps: prev?.reps ?? fromLast?.reps ?? null,
      rpe: null,
      set_type: "working",
      completed: true,
    };
    patchBlock(block.workoutExerciseId, (b) => ({ ...b, sets: [...b.sets, draft] }));
    queueInsert("sets", {
      id,
      workout_exercise_id: block.workoutExerciseId,
      set_number: draft.set_number,
      weight: draft.weight,
      reps: draft.reps,
      set_type: draft.set_type,
      completed: draft.completed,
    });
    setRestSignal((n) => n + 1); // auto-start the rest timer
    checkPr(block.exercise, draft);
  }

  function addWarmups(block: Block) {
    const firstWork = block.sets.find((s) => s.set_type !== "warmup");
    let target = firstWork?.weight ?? null;
    if (!target) {
      const input = window.prompt(`Working weight to warm up to (${units})?`);
      target = input ? Number(input) : null;
    }
    if (!target || target <= 0) return;

    const warmups: LiveSet[] = warmupSets(target, units).map((w, i) => ({
      id: uuid(),
      set_number: i + 1,
      weight: w.weight,
      reps: w.reps,
      rpe: null,
      set_type: "warmup",
      completed: false,
    }));
    if (warmups.length === 0) return;

    const reordered = [...warmups, ...block.sets].map((s, i) => ({ ...s, set_number: i + 1 }));
    setBlocks((bs) =>
      bs.map((b) => (b.workoutExerciseId === block.workoutExerciseId ? { ...b, sets: reordered } : b)),
    );
    // Insert the new warm-ups; renumber any existing sets that shifted.
    warmups.forEach((w) => {
      const finalNumber = reordered.find((s) => s.id === w.id)!.set_number;
      queueInsert("sets", {
        id: w.id,
        workout_exercise_id: block.workoutExerciseId,
        set_number: finalNumber,
        weight: w.weight,
        reps: w.reps,
        set_type: "warmup",
        completed: false,
      });
    });
    block.sets.forEach((s) => {
      const finalNumber = reordered.find((r) => r.id === s.id)!.set_number;
      if (finalNumber !== s.set_number) queueUpdate("sets", "id", s.id, { set_number: finalNumber });
    });
  }

  function updateSet(blockId: string, setId: string, patch: Partial<LiveSet>) {
    patchBlock(blockId, (b) => ({
      ...b,
      sets: b.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
    }));
  }

  function persistSet(setId: string, patch: Partial<Omit<LiveSet, "id">>) {
    queueUpdate("sets", "id", setId, patch);
  }

  function removeSet(blockId: string, setId: string) {
    patchBlock(blockId, (b) => ({ ...b, sets: b.sets.filter((s) => s.id !== setId) }));
    queueDelete("sets", "id", setId);
  }

  function checkPr(exercise: Exercise, s: LiveSet) {
    if (s.set_type === "warmup" || !s.weight || !s.reps) return;
    const base = prRef.current[exercise.id] ?? { e1rm: 0, weight: 0, reps: 0 };
    const e1rm = estimateOneRepMax(s.weight, s.reps);
    let msg: string | null = null;
    if (e1rm > base.e1rm + 0.01) {
      msg = `New est. 1RM PR — ${exercise.name}: ${num(Math.round(e1rm))} ${units}`;
    } else if (s.weight > base.weight) {
      msg = `New weight PR — ${exercise.name}: ${num(s.weight)} ${units}`;
    }
    prRef.current[exercise.id] = {
      e1rm: Math.max(base.e1rm, e1rm),
      weight: Math.max(base.weight, s.weight),
      reps: Math.max(base.reps, s.reps),
    };
    if (msg) showToast(msg);
  }

  function finish() {
    startFinish(async () => {
      // Nothing was logged — no workout row was ever created.
      if (!createdRef.current) {
        router.replace("/dashboard");
        return;
      }
      if (mode === "new") queueUpdate("workouts", "id", workoutId, { ended_at: new Date().toISOString() });
      await flushQueue();
      router.replace(`/workout/${workoutId}`);
      router.refresh();
    });
  }

  function discard() {
    if (createdRef.current) queueDelete("workouts", "id", workoutId);
    router.replace("/dashboard");
    router.refresh();
  }

  function saveAsRoutine() {
    const withSets = blocks.filter((b) => b.exercise);
    if (withSets.length === 0) return;
    const name = window.prompt("Name this routine:");
    if (!name) return;
    const routineId = uuid();
    queueInsert("routines", { id: routineId, name });
    withSets.forEach((b, i) => {
      const working = b.sets.filter((s) => s.set_type !== "warmup");
      queueInsert("routine_exercises", {
        id: uuid(),
        routine_id: routineId,
        exercise_id: b.exercise.id,
        order_index: i,
        target_sets: working.length || null,
        target_reps: working[0]?.reps ?? null,
      });
    });
    showToast(`Saved “${name}” as a routine`);
  }

  const totalVol = blocks.reduce((sum, b) => sum + totalVolume(b.sets), 0);
  const totalSets = blocks.reduce(
    (n, b) => n + b.sets.filter((s) => s.set_type !== "warmup").length,
    0,
  );

  return (
    <div className="space-y-10 pb-24">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-divider pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {mode === "edit" ? "Edit workout" : "Active workout"}
          </h1>
          <p className="tnum mt-1 text-sm text-muted">
            {blocks.length} exercises · {totalSets} working sets · {num(Math.round(totalVol))} {units}
            <SyncPill pending={pending} online={online} failed={failed} />
          </p>
        </div>
        <button onClick={saveAsRoutine} className="btn btn-ghost text-sm text-muted">
          Save as routine
        </button>
      </div>

      <div className="grid gap-8 border-b border-divider pb-8 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-faint">Rest timer</p>
          <RestTimer autoStartSignal={restSignal} />
        </div>
        <PlateCalculator units={units} />
      </div>

      {blocks.map((block) => (
        <ExerciseBlock
          key={block.workoutExerciseId}
          block={block}
          units={units}
          onAddSet={() => addSet(block)}
          onAddWarmups={() => addWarmups(block)}
          onUpdateSet={(setId, patch) => updateSet(block.workoutExerciseId, setId, patch)}
          onPersistSet={persistSet}
          onRemoveSet={(setId) => removeSet(block.workoutExerciseId, setId)}
          onToggleComplete={(setId, completed) => {
            updateSet(block.workoutExerciseId, setId, { completed });
            persistSet(setId, { completed });
          }}
          onRemove={() => removeExercise(block.workoutExerciseId)}
          onNotes={(notes) => patchBlock(block.workoutExerciseId, (b) => ({ ...b, notes }))}
          onPersistNotes={(notes) =>
            queueUpdate("workout_exercises", "id", block.workoutExerciseId, { notes })
          }
          onSetBlurPr={(s) => checkPr(block.exercise, s)}
        />
      ))}

      <button onClick={() => setPickerOpen(true)} className="btn btn-accent">
        + Add exercise
      </button>

      {/* Sticky action bar (owns the bottom on the immersive logging screen) */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-divider bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {mode === "new" ? (
            <button onClick={discard} className="btn btn-ghost text-sm text-muted">
              Discard
            </button>
          ) : (
            <button
              onClick={() => router.replace(`/workout/${workoutId}`)}
              className="btn btn-ghost text-sm text-muted"
            >
              Cancel
            </button>
          )}
          <button onClick={finish} disabled={finishing} className="btn btn-primary">
            {finishing ? "Saving…" : mode === "edit" ? "Done" : "Finish workout"}
          </button>
        </div>
      </div>

      {toast && (
        <div className="safe-bottom fixed inset-x-0 bottom-16 z-40 px-4">
          <div className="mx-auto max-w-sm rounded bg-accent px-4 py-2.5 text-center text-sm font-medium text-white shadow-lg">
            🏆 {toast}
          </div>
        </div>
      )}

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

function SyncPill({
  pending,
  online,
  failed,
}: {
  pending: number;
  online: boolean;
  failed: number;
}) {
  if (failed > 0) return <span className="ml-2 text-bad">⚠ {failed} change(s) failed to save</span>;
  if (!online) return <span className="ml-2 text-bad">offline · {pending} queued</span>;
  if (pending > 0) return <span className="ml-2 text-faint">saving {pending}…</span>;
  return <span className="ml-2 text-faint">saved</span>;
}

function ExerciseBlock({
  block,
  units,
  onAddSet,
  onAddWarmups,
  onUpdateSet,
  onPersistSet,
  onRemoveSet,
  onToggleComplete,
  onRemove,
  onNotes,
  onPersistNotes,
  onSetBlurPr,
}: {
  block: Block;
  units: UnitsPref;
  onAddSet: () => void;
  onAddWarmups: () => void;
  onUpdateSet: (setId: string, patch: Partial<LiveSet>) => void;
  onPersistSet: (setId: string, patch: Partial<Omit<LiveSet, "id">>) => void;
  onRemoveSet: (setId: string) => void;
  onToggleComplete: (setId: string, completed: boolean) => void;
  onRemove: () => void;
  onNotes: (notes: string) => void;
  onPersistNotes: (notes: string) => void;
  onSetBlurPr: (s: LiveSet) => void;
}) {
  const trackingWeight = block.exercise.tracking_type === "weight_reps";
  const bestE1rm = block.sets.reduce(
    (m, s) => Math.max(m, estimateOneRepMax(s.weight ?? 0, s.reps ?? 0)),
    0,
  );
  // Working sets are numbered independently of warm-ups (which show "W").
  const labels = new Map<string, string>();
  let workingCount = 0;
  for (const s of block.sets) {
    labels.set(s.id, s.set_type === "warmup" ? "W" : String(++workingCount));
  }
  const hasWarmup = block.sets.some((s) => s.set_type === "warmup");

  return (
    <section>
      <div className="flex items-baseline justify-between gap-4 border-b border-divider pb-2">
        <h3 className="font-semibold">{block.exercise.name}</h3>
        <div className="flex items-center gap-4 text-sm text-muted">
          {bestE1rm > 0 && (
            <span className="tnum">
              e1RM {num(bestE1rm)} {units}
            </span>
          )}
          <button onClick={onRemove} className="min-h-[2.5rem] hover:text-bad">
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
        <div className="grid grid-cols-[1.75rem_1fr_1fr_2.25rem_4.25rem_2rem] items-center gap-2 pb-1 text-xs font-medium uppercase tracking-wider text-faint">
          <span>Set</span>
          <span>{trackingWeight ? `Wt (${units})` : "Value"}</span>
          <span>Reps</span>
          <span>RPE</span>
          <span>Type</span>
          <span className="text-center">✓</span>
        </div>

        {block.sets.map((s) => (
          <div
            key={s.id}
            className={`grid grid-cols-[1.75rem_1fr_1fr_2.25rem_4.25rem_2rem] items-center gap-2 py-1 ${
              s.completed ? "" : "opacity-50"
            }`}
          >
            <span
              className={`tnum text-sm ${s.set_type === "warmup" ? "text-faint" : "text-muted"}`}
            >
              {labels.get(s.id)}
            </span>
            <input
              type="number"
              inputMode="decimal"
              className="cell-input"
              value={s.weight ?? ""}
              onChange={(e) =>
                onUpdateSet(s.id, { weight: e.target.value === "" ? null : Number(e.target.value) })
              }
              onBlur={(e) => {
                const weight = e.target.value === "" ? null : Number(e.target.value);
                onPersistSet(s.id, { weight });
                onSetBlurPr({ ...s, weight });
              }}
            />
            <input
              type="number"
              inputMode="numeric"
              className="cell-input"
              value={s.reps ?? ""}
              onChange={(e) =>
                onUpdateSet(s.id, { reps: e.target.value === "" ? null : Number(e.target.value) })
              }
              onBlur={(e) => {
                const reps = e.target.value === "" ? null : Number(e.target.value);
                onPersistSet(s.id, { reps });
                onSetBlurPr({ ...s, reps });
              }}
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
              className="min-h-[2.5rem] bg-transparent text-xs text-muted focus:outline-none"
              aria-label="Set type"
            >
              {SET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {SET_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => onToggleComplete(s.id, !s.completed)}
              aria-label={s.completed ? "Mark set incomplete" : "Mark set complete"}
              aria-pressed={s.completed}
              className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full border text-sm ${
                s.completed ? "border-accent bg-accent text-white" : "border-divider text-faint"
              }`}
            >
              ✓
            </button>
          </div>
        ))}

        <div className="mt-2 flex flex-wrap items-center gap-6">
          <button onClick={onAddSet} className="min-h-[2.5rem] text-sm text-accent hover:opacity-80">
            + Add set
          </button>
          {trackingWeight && !hasWarmup && (
            <button
              onClick={onAddWarmups}
              className="min-h-[2.5rem] text-sm text-muted hover:text-foreground"
            >
              + Warm-ups
            </button>
          )}
          {block.sets.length > 0 && (
            <button
              onClick={() => onRemoveSet(block.sets[block.sets.length - 1].id)}
              className="min-h-[2.5rem] text-sm text-faint hover:text-bad"
            >
              − Remove last
            </button>
          )}
        </div>
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
