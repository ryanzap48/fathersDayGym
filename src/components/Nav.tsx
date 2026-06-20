"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const PRIMARY = [
  ["/dashboard", "Dashboard"],
  ["/history", "History"],
  ["/exercises", "Exercises"],
  ["/analytics", "Analytics"],
  ["/bodyweight", "Body weight"],
  ["/tdee", "TDEE"],
  ["/routines", "Routines"],
  ["/goals", "Goals"],
  ["/settings", "Settings"],
] as const;

// Items shown directly in the mobile bottom bar; the rest live under "More".
const MOBILE_TABS = [
  ["/dashboard", "Home"],
  ["/exercises", "Lifts"],
  ["/analytics", "Stats"],
] as const;

const MORE = [
  ["/history", "History"],
  ["/bodyweight", "Body weight"],
  ["/tdee", "TDEE"],
  ["/routines", "Routines"],
  ["/goals", "Goals"],
  ["/settings", "Settings"],
] as const;

export function Nav({ name }: { name: string }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  // Close the "More" sheet on navigation.
  useEffect(() => setMoreOpen(false), [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  // Active-logging screens are immersive: the logger owns the bottom bar.
  const immersive = pathname === "/workout/new" || pathname.endsWith("/edit");

  return (
    <>
      {/* Top header — full nav on desktop, brand-only on mobile */}
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
          className="mx-auto hidden max-w-5xl gap-5 px-4 pb-2 text-sm sm:flex sm:px-6"
        >
          {PRIMARY.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={`whitespace-nowrap border-b-2 pb-1.5 transition-colors ${
                isActive(href)
                  ? "border-accent text-foreground"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {label}
            </Link>
          ))}
          <span className="ml-auto whitespace-nowrap pb-1.5 text-muted">{name}</span>
        </nav>
      </header>

      {/* Mobile bottom tab bar — hidden while actively logging */}
      {!immersive && (
        <>
      {moreOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 sm:hidden"
          onClick={() => setMoreOpen(false)}
          aria-hidden
        />
      )}
      <nav
        aria-label="Mobile"
        className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-divider bg-background sm:hidden"
      >
        {moreOpen && (
          <div className="border-b border-divider px-4 py-2">
            <ul className="grid grid-cols-2 gap-x-4">
              {MORE.map(([href, label]) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={`block py-2.5 text-sm ${
                      isActive(href) ? "text-accent" : "text-foreground"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="grid grid-cols-5 items-center">
          {MOBILE_TABS.slice(0, 2).map(([href, label]) => (
            <BottomTab key={href} href={href} label={label} active={isActive(href)} />
          ))}
          <Link
            href="/workout/new"
            aria-label="Start workout"
            className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent text-2xl font-light text-white"
          >
            +
          </Link>
          <BottomTab href="/analytics" label="Stats" active={isActive("/analytics")} />
          <button
            type="button"
            onClick={() => setMoreOpen((v) => !v)}
            aria-expanded={moreOpen}
            className={`flex min-h-[3.5rem] flex-col items-center justify-center text-xs ${
              moreOpen || MORE.some(([h]) => isActive(h)) ? "text-accent" : "text-muted"
            }`}
          >
            More
          </button>
        </div>
      </nav>
        </>
      )}
    </>
  );
}

function BottomTab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-[3.5rem] flex-col items-center justify-center text-xs ${
        active ? "text-accent" : "text-muted"
      }`}
    >
      {label}
    </Link>
  );
}
