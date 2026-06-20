import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui";
import { RoutinesList, type RoutineSummary } from "@/components/RoutinesList";

export const metadata = { title: "Routines" };

interface RoutineRow {
  id: string;
  name: string;
  routine_exercises: { order_index: number; exercise: { name: string } | null }[];
}

export default async function RoutinesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("routines")
    .select("id, name, routine_exercises ( order_index, exercise:exercises ( name ) )")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const routines: RoutineSummary[] = ((data ?? []) as unknown as RoutineRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    exercises: [...r.routine_exercises]
      .sort((a, b) => a.order_index - b.order_index)
      .map((re) => re.exercise?.name ?? "Exercise"),
  }));

  return (
    <div>
      <PageHeader
        title="Routines"
        subtitle="Reusable templates. Start a workout pre-loaded with the right exercises."
      />
      <RoutinesList routines={routines} />
    </div>
  );
}
