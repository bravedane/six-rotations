import { createClient } from "@/lib/supabase/server";
import { getPreseasonHtml } from "@/lib/surveyTemplate";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.redirect("/login");
  }

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";
  const html = getPreseasonHtml(user.email, adminEmail);

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
