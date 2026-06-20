import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/queries";
import { PageHeader } from "@/components/ui";
import { OneRepMaxCalculator } from "@/components/OneRepMaxCalculator";

export const metadata = { title: "1RM calculator" };

export default async function OneRepMaxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const profile = await getProfile(supabase, user!.id);

  return (
    <div>
      <PageHeader
        title="1RM calculator"
        subtitle="Estimate your one-rep max from any set, and what it predicts across rep ranges."
      />
      <OneRepMaxCalculator units={profile?.units ?? "lb"} />
    </div>
  );
}
