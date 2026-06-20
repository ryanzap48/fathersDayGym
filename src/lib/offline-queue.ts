"use client";

import { useEffect, useReducer } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * A tiny offline-tolerant write queue.
 *
 * Gym Wi-Fi is unreliable, so logging writes must never be lost. Every mutation
 * is appended to a FIFO queue (persisted to localStorage) and flushed against
 * Supabase sequentially. On network failure the queue is kept and retried when
 * the connection returns; on a server rejection the op is dropped so it can't
 * block the queue forever. Inserts use client-generated UUIDs, so the UI gets
 * an id immediately and child rows can reference parents before either is sent.
 */

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type QueueOp =
  | { opId: string; kind: "insert"; table: string; values: Record<string, unknown> }
  | {
      opId: string;
      kind: "update";
      table: string;
      column: string;
      value: string;
      values: Record<string, unknown>;
    }
  | { opId: string; kind: "delete"; table: string; column: string; value: string };

const KEY = "lift-write-queue";

let queue: QueueOp[] = [];
let online = typeof navigator !== "undefined" ? navigator.onLine : true;
let syncing = false;
let failed = 0; // ops the server rejected and we had to drop
const listeners = new Set<() => void>();

function load() {
  try {
    queue = JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    queue = [];
  }
}
function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(queue));
  } catch {
    /* storage full / unavailable — keep going in memory */
  }
}
function emit() {
  listeners.forEach((l) => l());
}

function isNetworkError(message: string) {
  return !navigator.onLine || /fetch|network|timeout|connection/i.test(message);
}

async function processQueue() {
  if (syncing || !navigator.onLine) return;
  syncing = true;
  emit();

  // Generic write surface — table names are dynamic so we bypass the strict
  // per-table typing here (payloads are validated by the DB and RLS).
  const sb = createClient() as unknown as {
    from: (t: string) => {
      insert: (v: unknown) => Promise<{ error: { message: string } | null }>;
      update: (v: unknown) => {
        eq: (c: string, val: string) => Promise<{ error: { message: string } | null }>;
      };
      delete: () => {
        eq: (c: string, val: string) => Promise<{ error: { message: string } | null }>;
      };
    };
  };

  while (queue.length) {
    const op = queue[0];
    try {
      let error: { message: string } | null = null;
      if (op.kind === "insert") {
        ({ error } = await sb.from(op.table).insert(op.values));
      } else if (op.kind === "update") {
        ({ error } = await sb.from(op.table).update(op.values).eq(op.column, op.value));
      } else {
        ({ error } = await sb.from(op.table).delete().eq(op.column, op.value));
      }

      if (error) {
        if (isNetworkError(error.message)) break; // retry later, keep op
        // Server rejected (e.g. constraint) — drop so the queue can drain,
        // but record it so the UI can warn the user something didn't save.
        failed += 1;
        if (process.env.NODE_ENV !== "production") {
          console.warn("[sync] dropping op", op, error.message);
        }
      }
      queue.shift();
      save();
      emit();
    } catch {
      break; // unexpected throw — treat as transient
    }
  }

  syncing = false;
  emit();
}

function enqueue(op: DistributiveOmit<QueueOp, "opId">) {
  queue.push({ ...op, opId: crypto.randomUUID() } as QueueOp);
  save();
  emit();
  void processQueue();
}

export function queueInsert(table: string, values: Record<string, unknown>) {
  enqueue({ kind: "insert", table, values });
}
export function queueUpdate(
  table: string,
  column: string,
  value: string,
  values: Record<string, unknown>,
) {
  enqueue({ kind: "update", table, column, value, values });
}
export function queueDelete(table: string, column: string, value: string) {
  enqueue({ kind: "delete", table, column, value });
}

/** Force a flush attempt (e.g. when finishing a workout). */
export function flushQueue() {
  return processQueue();
}

/** Acknowledge and clear the failed-write warning. */
export function clearFailed() {
  failed = 0;
  emit();
}

if (typeof window !== "undefined") {
  load();
  window.addEventListener("online", () => {
    online = true;
    emit();
    void processQueue();
  });
  window.addEventListener("offline", () => {
    online = false;
    emit();
  });
  setInterval(() => {
    if (queue.length) void processQueue();
  }, 15000);
  if (queue.length) void processQueue();
}

/** Subscribe to queue status from a component. */
export function useSyncStatus() {
  const [, force] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    const l = () => force();
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);
  return { pending: queue.length, syncing, online, failed };
}
