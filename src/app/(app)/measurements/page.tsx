import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/queries";
import { PageHeader, SectionTitle } from "@/components/ui";
import { MeasurementsTracker } from "@/components/MeasurementsTracker";
import { ProgressPhotos } from "@/components/ProgressPhotos";
import type { BodyMeasurement } from "@/lib/database.types";

export const metadata = { title: "Measurements" };

export default async function MeasurementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [{ data: measurements }, profile] = await Promise.all([
    supabase
      .from("body_measurements")
      .select("*")
      .eq("user_id", userId)
      .order("logged_at", { ascending: true }),
    getProfile(supabase, userId),
  ]);

  return (
    <div className="space-y-12">
      <PageHeader
        title="Measurements"
        subtitle="Tape measurements and progress photos — the changes the scale doesn't show."
      />

      <MeasurementsTracker
        initial={(measurements ?? []) as BodyMeasurement[]}
        units={profile?.units ?? "lb"}
      />

      <section>
        <SectionTitle>Progress photos</SectionTitle>
        <ProgressPhotos userId={userId} />
      </section>
    </div>
  );
}
