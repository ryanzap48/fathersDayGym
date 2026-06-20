"use client";

import { useEffect } from "react";

interface WakeLockSentinelLike {
  release: () => Promise<void>;
  released: boolean;
}

/**
 * Keeps the screen awake while `active` is true (e.g. during a workout).
 * Re-acquires the lock after the tab is hidden and shown again, since the
 * browser auto-releases it on visibility change. No-op where unsupported.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: "screen") => Promise<WakeLockSentinelLike> };
    };
    if (!nav.wakeLock) return;

    let sentinel: WakeLockSentinelLike | null = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        sentinel = await nav.wakeLock!.request("screen");
      } catch {
        /* user denied or not allowed in this context */
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible" && !cancelled) acquire();
    };

    acquire();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      sentinel?.release().catch(() => {});
    };
  }, [active]);
}
