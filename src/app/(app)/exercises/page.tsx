import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { ExerciseLibrary } from "@/components/ExerciseLibrary";
import type { Exercise } from "@/lib/database.types";

export const metadata = { title: "Exercises" };

export default async function ExercisesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .or(`user_id.eq.${user!.id},user_id.is.null`)
    .order("name");

  return (
    <div>
      <PageHeader
        title="Exercises"
        subtitle="Browse the library or add your own. Tap any exercise to see your progression."
      />
      <ExerciseLibrary exercises={(exercises ?? []) as Exercise[]} />
    </div>
  );
}
