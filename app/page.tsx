import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "").toLowerCase();

  if (!user) redirect("/login");
  if ((user.email || "").toLowerCase() === adminEmail) redirect("/admin");
  redirect("/checkin");
}
