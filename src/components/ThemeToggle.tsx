"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

function apply(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    const saved = (localStorage.getItem("theme") as Theme | null) ?? "system";
    setTheme(saved);
  }, []);

  function choose(next: Theme) {
    setTheme(next);
    if (next === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", next);
    apply(next);
  }

  return (
    <div className="flex gap-6 text-sm">
      {(["light", "dark", "system"] as Theme[]).map((t) => (
        <label key={t} className="flex items-center gap-2 capitalize">
          <input
            type="radio"
            name="theme"
            checked={theme === t}
            onChange={() => choose(t)}
            className="accent-accent"
          />
          {t}
        </label>
      ))}
    </div>
  );
}
