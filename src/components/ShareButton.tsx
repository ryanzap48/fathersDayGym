"use client";

import { useState } from "react";

/** Shares a PR via the Web Share API, falling back to copying the link. */
export function ShareButton({
  exercise,
  label,
  value,
}: {
  exercise: string;
  label: string;
  value: string;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const origin = window.location.origin;
    const url = `${origin}/share/pr?exercise=${encodeURIComponent(exercise)}&label=${encodeURIComponent(
      label,
    )}&value=${encodeURIComponent(value)}`;
    const text = `${exercise} — ${label}: ${value}. New PR 🏋️`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "New PR", text, url });
      } catch {
        /* user cancelled */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <button
      onClick={share}
      className="text-faint hover:text-accent"
      aria-label={`Share ${exercise} PR`}
      title="Share"
    >
      {copied ? "copied" : "↗"}
    </button>
  );
}
