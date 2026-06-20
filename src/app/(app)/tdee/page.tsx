import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/queries";
import { PageHeader } from "@/components/ui";
import { TdeeCalculator } from "@/components/TdeeCalculator";
import { ageFromBirthdate } from "@/lib/utils/tdee";

export const metadata = { title: "TDEE calculator" };

export default async function TdeePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user!.id;

  const [profile, { data: bw }] = await Promise.all([
    getProfile(supabase, userId),
    supabase
      .from("bodyweight_logs")
      .select("weight")
      .eq("user_id", userId)
      .order("logged_at", { ascending: false })
      .limit(1),
  ]);

  return (
    <div>
      <PageHeader
        title="TDEE calculator"
        subtitle="Estimate the calories you burn in a day, and targets to cut, maintain, or gain."
      />
      <TdeeCalculator
        units={profile?.units ?? "lb"}
        initialWeight={bw?.[0]?.weight ?? profile?.goal_weight ?? null}
        initialHeightCm={profile?.height_cm ?? null}
        initialAge={ageFromBirthdate(profile?.birthdate ?? null)}
      />
    </div>
  );
}
