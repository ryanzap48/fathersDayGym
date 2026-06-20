"use client";

import { useEffect, useState } from "react";

export function ReminderSettings() {
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState("18:00");
  const [supported, setSupported] = useState(true);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSupported(false);
      return;
    }
    try {
      const raw = localStorage.getItem("reminder");
      if (raw) {
        const pref = JSON.parse(raw);
        setEnabled(Boolean(pref.enabled));
        if (pref.time) setTime(pref.time);
      }
    } catch {
      /* ignore */
    }
  }, []);

  function persist(next: { enabled: boolean; time: string }) {
    localStorage.setItem("reminder", JSON.stringify(next));
  }

  async function toggle(on: boolean) {
    if (on) {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") {
        setNote("Notifications were blocked — enable them for this site in your browser settings.");
        return;
      }
      setNote(null);
    }
    setEnabled(on);
    persist({ enabled: on, time });
  }

  function changeTime(t: string) {
    setTime(t);
    persist({ enabled, time: t });
  }

  if (!supported) {
    return <p className="text-sm text-muted">Reminders aren&apos;t supported in this browser.</p>;
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => toggle(e.target.checked)}
          className="accent-accent"
        />
        Remind me to train
      </label>

      {enabled && (
        <div className="flex items-center gap-3">
          <label htmlFor="reminder-time" className="text-sm text-muted">
            At
          </label>
          <input
            id="reminder-time"
            type="time"
            value={time}
            onChange={(e) => changeTime(e.target.value)}
            className="field max-w-[8rem]"
          />
        </div>
      )}

      {note && <p className="text-sm text-bad">{note}</p>}

      <p className="text-xs text-faint">
        Reminders fire while Lift is open or installed to your home screen. Scheduled
        background notifications would need a push server, which this app doesn&apos;t run.
      </p>
    </div>
  );
}
