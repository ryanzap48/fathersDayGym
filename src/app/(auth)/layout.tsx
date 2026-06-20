import Link from "next/link";
import { Suspense } from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-6 py-12">
      <Link
        href="/"
        className="mb-10 text-sm font-medium uppercase tracking-[0.2em] text-accent"
      >
        Lift
      </Link>
      <Suspense>{children}</Suspense>
    </main>
  );
}
