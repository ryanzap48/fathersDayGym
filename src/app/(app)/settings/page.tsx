import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/queries";
import { PageHeader, SectionTitle } from "@/components/ui";
import { SettingsForm } from "@/components/SettingsForm";
import type { Profile } from "@/lib/database.types";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = (await getProfile(supabase, user!.id)) as Profile;

  return (
    <div className="space-y-12">
      <PageHeader title="Settings" subtitle={user!.email ?? undefined} />

      <section>
        <SectionTitle>Profile</SectionTitle>
        {profile && <SettingsForm profile={profile} />}
      </section>

      <section>
        <SectionTitle>Export data</SectionTitle>
        <p className="mb-4 text-sm text-muted">Download your complete training log.</p>
        <div className="flex gap-6 text-sm">
          <a href="/export?format=csv" className="text-accent hover:opacity-80">
            Download CSV
          </a>
          <a href="/export?format=json" className="text-accent hover:opacity-80">
            Download JSON
          </a>
        </div>
      </section>

      <section>
        <SectionTitle>Account</SectionTitle>
        <form action="/auth/sign-out" method="post">
          <button type="submit" className="btn btn-ghost text-sm text-bad">
            Sign out
          </button>
        </form>
        <p className="mt-4 text-xs text-faint">
          Need the database schema?{" "}
          <Link href="/" className="underline underline-offset-2">
            See the README
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
