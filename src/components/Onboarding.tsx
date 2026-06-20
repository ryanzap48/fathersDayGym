"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Step {
  label: string;
  href: string;
  done: boolean;
}

/**
 * A gentle, dismissible first-run checklist. Shown to new athletes until they
 * dismiss it or complete the steps. State is local to the device.
 */
export function Onboarding({
  hasUnits,
  hasBodyweight,
  hasWorkout,
  name,
}: {
  hasUnits: boolean;
  hasBodyweight: boolean;
  hasWorkout: boolean;
  name: string;
}) {
  const [dismissed, setDismissed] = useState(true); // default hidden until we read storage

  useEffect(() => {
    // Hydrate dismissal state from localStorage on mount (no SSR access).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDismissed(localStorage.getItem("onboard-dismissed") === "1");
  }, []);

  const steps: Step[] = [
    { label: "Set your units & goal weight", href: "/settings", done: hasUnits },
    { label: "Log today's body weight", href: "/bodyweight", done: hasBodyweight },
    { label: "Start your first workout", href: "/workout/new", done: hasWorkout },
  ];
  const allDone = steps.every((s) => s.done);
  if (dismissed || allDone) return null;

  function dismiss() {
    localStorage.setItem("onboard-dismissed", "1");
    setDismissed(true);
  }

  return (
    <section className="border-b border-divider pb-8">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold">Welcome to Lift, {name.split(" ")[0]}</h2>
        <button onClick={dismiss} className="text-sm text-faint hover:text-foreground">
          Dismiss
        </button>
      </div>
      <p className="mt-1 text-sm text-muted">Three quick steps to get rolling.</p>
      <ol className="mt-4 space-y-2">
        {steps.map((s) => (
          <li key={s.href} className="flex items-center gap-3">
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                s.done ? "border-accent bg-accent text-white" : "border-divider text-faint"
              }`}
              aria-hidden
            >
              {s.done ? "✓" : ""}
            </span>
            {s.done ? (
              <span className="text-sm text-muted line-through">{s.label}</span>
            ) : (
              <Link href={s.href} className="text-sm font-medium text-foreground hover:text-accent">
                {s.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
