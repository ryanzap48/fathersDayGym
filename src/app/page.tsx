import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Landing() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">Lift</p>
      <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
        Strength training,
        <br />
        measured.
      </h1>
      <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
        A quiet, focused log for the work that matters. Track every set, watch your
        estimated 1RM climb, and keep the streak alive — without the clutter.
      </p>

      <div className="mt-10 flex items-center gap-6">
        <Link href="/sign-up" className="btn btn-accent">
          Start training
        </Link>
        <Link href="/sign-in" className="btn btn-ghost">
          Sign in
        </Link>
      </div>

      <dl className="mt-16 grid grid-cols-2 gap-x-8 gap-y-6 border-t border-divider pt-8 sm:grid-cols-4">
        {[
          ["Log", "Sets, reps, RPE"],
          ["Track", "Body weight trend"],
          ["Analyze", "Volume & 1RM"],
          ["Improve", "Goals & PRs"],
        ].map(([t, d]) => (
          <div key={t}>
            <dt className="text-sm font-semibold">{t}</dt>
            <dd className="mt-1 text-sm text-muted">{d}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
