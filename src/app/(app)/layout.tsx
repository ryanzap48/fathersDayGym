import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "@/components/Nav";
import { ReminderScheduler } from "@/components/ReminderScheduler";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  const name = profile?.name ?? user.email?.split("@")[0] ?? "Athlete";

  return (
    <div className="min-h-dvh">
      <Nav name={name} />
      <ReminderScheduler />
      <div className="pb-safe-nav mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:pb-8">{children}</div>
    </div>
  );
}
