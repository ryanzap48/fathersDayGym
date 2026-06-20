import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getWorkouts, orderWorkout } from "@/lib/queries";

/**
 * GET /export?format=csv|json — download the signed-in user's full log.
 * RLS scopes the data to the requesting user.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/sign-in", request.url));

  const format = new URL(request.url).searchParams.get("format") === "json" ? "json" : "csv";
  const workouts = (await getWorkouts(supabase, user.id)).map(orderWorkout);
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "json") {
    return new NextResponse(JSON.stringify(workouts, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="lift-export-${stamp}.json"`,
      },
    });
  }

  const rows = [
    ["workout_date", "exercise", "set_number", "set_type", "weight", "reps", "rpe"],
  ];
  for (const w of workouts) {
    for (const we of w.workout_exercises) {
      for (const s of we.sets) {
        rows.push([
          w.started_at,
          we.exercise?.name ?? "",
          String(s.set_number),
          s.set_type,
          s.weight?.toString() ?? "",
          s.reps?.toString() ?? "",
          s.rpe?.toString() ?? "",
        ]);
      }
    }
  }

  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="lift-export-${stamp}.csv"`,
    },
  });
}
