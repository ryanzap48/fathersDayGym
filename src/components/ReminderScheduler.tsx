"use client";

import { useEffect } from "react";

/**
 * Fires a local "time to train" notification at the user's chosen time while
 * the app (or installed PWA) is open. This is intentionally lightweight:
 * reliable background/scheduled push would require a server + VAPID keys, which
 * this app doesn't run. Preference lives in localStorage (see ReminderSettings).
 */
export function ReminderScheduler() {
  useEffect(() => {
    if (!("Notification" in window)) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    function read(): { enabled: boolean; time: string } | null {
      try {
        const raw = localStorage.getItem("reminder");
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    }

    function fireIfDue() {
      const pref = read();
      if (!pref?.enabled || Notification.permission !== "granted") return schedule();

      const today = new Date().toISOString().slice(0, 10);
      const lastFired = localStorage.getItem("reminder-last");
      const [h, m] = pref.time.split(":").map(Number);
      const now = new Date();
      const due = now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m);

      if (due && lastFired !== today) {
        localStorage.setItem("reminder-last", today);
        new Notification("Time to train 💪", {
          body: "Keep the streak alive — log today's workout.",
          icon: "/icon.svg",
        });
      }
      schedule();
    }

    function schedule() {
      if (timer) clearTimeout(timer);
      // Re-check every 5 minutes; cheap and resilient to clock changes.
      timer = setTimeout(fireIfDue, 5 * 60 * 1000);
    }

    fireIfDue();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  return null;
}
