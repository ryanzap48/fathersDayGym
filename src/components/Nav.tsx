"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  ["/dashboard", "Dashboard"],
  ["/history", "History"],
  ["/exercises", "Exercises"],
  ["/analytics", "Analytics"],
  ["/bodyweight", "Body weight"],
  ["/goals", "Goals"],
  ["/settings", "Settings"],
] as const;

export function Nav({ name }: { name: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-divider bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/dashboard"
          className="text-sm font-semibold uppercase tracking-[0.2em] text-accent"
        >
          Lift
        </Link>
        <Link href="/workout/new" className="btn btn-accent text-sm">
          + Start workout
        </Link>
      </div>

      <nav
        aria-label="Primary"
        className="mx-auto flex max-w-5xl gap-5 overflow-x-auto px-4 pb-2 text-sm sm:px-6"
      >
        {LINKS.map(([href, label]) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`whitespace-nowrap border-b-2 pb-1.5 transition-colors ${
                active
                  ? "border-accent text-foreground"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          );
        })}
        <span className="ml-auto hidden whitespace-nowrap pb-1.5 text-muted sm:block">
          {name}
        </span>
      </nav>
    </header>
  );
}
