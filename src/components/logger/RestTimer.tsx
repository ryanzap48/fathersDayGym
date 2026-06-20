"use client";

import { useEffect, useRef, useState } from "react";
import { clock } from "@/lib/utils/format";

const PRESETS = [60, 90, 120, 180];

/** A lightweight count-up/down rest timer. Counts down from a chosen preset. */
export function RestTimer() {
  const [target, setTarget] = useState(90);
  const [remaining, setRemaining] = useState(90);
  const [running, setRunning] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [running]);

  function start(seconds: number) {
    setTarget(seconds);
    setRemaining(seconds);
    setRunning(true);
  }

  const done = remaining === 0;

  return (
    <div className="flex items-center gap-4">
      <span
        className={`tnum text-2xl font-semibold tabular-nums ${
          done ? "text-accent" : running ? "text-foreground" : "text-muted"
        }`}
      >
        {clock(remaining)}
      </span>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => start(p)}
            className={`text-sm ${target === p && running ? "text-accent" : "text-muted hover:text-foreground"}`}
          >
            {p}s
          </button>
        ))}
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="text-sm text-muted hover:text-foreground"
        >
          {running ? "Pause" : "Resume"}
        </button>
        <button
          type="button"
          onClick={() => {
            setRemaining(target);
            setRunning(false);
          }}
          className="text-sm text-muted hover:text-foreground"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
