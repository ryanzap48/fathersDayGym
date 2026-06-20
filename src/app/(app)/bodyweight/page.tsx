import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/queries";
import { PageHeader } from "@/components/ui";
import { BodyweightTracker } from "@/components/BodyweightTracker";
import type { BodyweightLog } from "@/lib/database.types";

export const metadata = { title: "Body weight" };

export default async function BodyweightPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: logs }, profile] = await Promise.all([
    supabase
      .from("bodyweight_logs")
      .select("*")
      .eq("user_id", user!.id)
      .order("logged_at", { ascending: true }),
    getProfile(supabase, user!.id),
  ]);

  return (
    <div>
      <PageHeader title="Body weight" subtitle="A daily check-in, smoothed to a 7-day average." />
      <BodyweightTracker
        initialLogs={(logs ?? []) as BodyweightLog[]}
        goalWeight={profile?.goal_weight ?? null}
        units={profile?.units ?? "lb"}
      />
    </div>
  );
}
