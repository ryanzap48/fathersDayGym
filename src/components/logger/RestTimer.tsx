"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { clock } from "@/lib/utils/format";

const PRESETS = [60, 90, 120, 180];

/** A short alert tone + vibration so you don't have to watch the clock. */
function alertDone() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate?.([180, 90, 180]);
  }
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
    osc.onended = () => ctx.close();
  } catch {
    /* audio not available — vibration alone is fine */
  }
}

/**
 * Rest timer driven by a target end-timestamp, so it stays accurate even if
 * the screen locks or the tab is backgrounded. Auto-starts whenever
 * `autoStartSignal` changes (e.g. when a set is logged).
 */
export function RestTimer({
  autoStartSignal,
  defaultSeconds = 90,
}: {
  autoStartSignal?: number;
  defaultSeconds?: number;
}) {
  const [target, setTarget] = useState(defaultSeconds);
  const [endAt, setEndAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(defaultSeconds);
  const [paused, setPaused] = useState<number | null>(null); // seconds left when paused
  const firedRef = useRef(false);

  const start = useCallback((seconds: number) => {
    setTarget(seconds);
    setPaused(null);
    firedRef.current = false;
    setEndAt(Date.now() + seconds * 1000);
  }, []);

  // Auto-start on signal change (skip first mount).
  const lastSignal = useRef(autoStartSignal);
  useEffect(() => {
    if (autoStartSignal === undefined) return;
    if (lastSignal.current === autoStartSignal) return;
    lastSignal.current = autoStartSignal;
    start(target);
  }, [autoStartSignal, start, target]);

  // Tick from wall-clock so backgrounding doesn't drift.
  useEffect(() => {
    if (endAt === null) return;
    const tick = () => {
      const left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0 && !firedRef.current) {
        firedRef.current = true;
        alertDone();
        setEndAt(null);
      }
    };
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endAt]);

  const running = endAt !== null;
  const done = remaining === 0 && !running && paused === null;

  function togglePause() {
    if (running) {
      setPaused(remaining);
      setEndAt(null);
    } else if (paused !== null) {
      firedRef.current = false;
      setEndAt(Date.now() + paused * 1000);
      setPaused(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span
        className={`tnum text-2xl font-semibold ${
          done ? "text-accent" : running ? "text-foreground" : "text-muted"
        }`}
      >
        {clock(running ? remaining : (paused ?? remaining))}
      </span>
      <div className="flex flex-wrap gap-3">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => start(p)}
            className={`min-h-[2.25rem] px-1 text-sm ${
              target === p && running ? "text-accent" : "text-muted hover:text-foreground"
            }`}
          >
            {p}s
          </button>
        ))}
        <button
          type="button"
          onClick={togglePause}
          disabled={!running && paused === null}
          className="min-h-[2.25rem] px-1 text-sm text-muted hover:text-foreground disabled:opacity-40"
        >
          {running ? "Pause" : "Resume"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEndAt(null);
            setPaused(null);
            setRemaining(target);
            firedRef.current = false;
          }}
          className="min-h-[2.25rem] px-1 text-sm text-muted hover:text-foreground"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
