import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Small, shared, presentational building blocks. Deliberately container-free:
 * structure comes from typography, spacing, and the occasional thin rule.
 */

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-4 pb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

/** A hero number with a small caption above it. Numbers are the heroes. */
export function Stat({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div>
      <div className="text-xs font-medium uppercase tracking-wider text-faint">{label}</div>
      <div
        className={`tnum mt-1 text-3xl font-semibold tracking-tight sm:text-4xl ${
          accent ? "text-accent" : ""
        }`}
      >
        {value}
      </div>
      {sub && <div className="tnum mt-1 text-sm text-muted">{sub}</div>}
    </div>
  );
}

export function SectionTitle({
  children,
  href,
  linkLabel = "View all",
}: {
  children: ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between border-b border-divider pb-2">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">{children}</h2>
      {href && (
        <Link href={href} className="text-sm text-muted hover:text-foreground">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="py-10 text-center text-sm text-faint">{children}</p>;
}

/** A slim, unboxed progress track. */
export function Progress({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="h-px w-full bg-divider" role="progressbar" aria-valuenow={Math.round(pct)}>
      <div className="h-px bg-accent" style={{ width: `${pct}%` }} />
    </div>
  );
}

/** Trend indicator: ▲ +5  /  ▼ −2.5  /  — */
export function Trend({ value, label }: { value: number; label?: string }) {
  if (value === 0 || Number.isNaN(value)) return <span className="text-faint">—</span>;
  const up = value > 0;
  return (
    <span className={`tnum text-sm ${up ? "text-good" : "text-bad"}`}>
      {up ? "▲" : "▼"} {label}
    </span>
  );
}
