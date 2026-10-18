import { getPreseasonHtml } from "@/lib/surveyTemplate";

// Public, no sign-in required. Players type their own name + UCI email directly
// into the form. See lib/surveyTemplate.ts for client-side validation.
export async function GET() {
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";
  const html = getPreseasonHtml("", adminEmail);

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
