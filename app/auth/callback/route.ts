import { NextResponse } from "next/server";
import { buildDefaultCompanyModules } from "@/config/navigation";
import { getBusinessTemplate } from "@/config/templates";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Single entry point for every Supabase auth email link: signup confirmation AND
 * password recovery. Both `signUp()` (in lib/backend/auth.ts) and
 * `resetPasswordForEmail()` (in app/login/page.tsx) point their redirect here with a
 * different `next` value, which is how we tell the two flows apart - Supabase's PKCE
 * flow itself only gives us a `code` to exchange, not the original intent.
 *
 * Before this route existed, both kinds of email links redirected straight back to
 * /login with an unused `code` in the URL and nothing ever called
 * exchangeCodeForSession() - so confirmation links silently did nothing, and password
 * recovery links had no page to actually set a new password on.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/login";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
  }

  if (next === "/reset-password") {
    return NextResponse.redirect(`${origin}/reset-password`);
  }

  const user = data.user;
  const companyName = String(user.user_metadata?.company_name ?? "").trim();
  const ownerName = String(user.user_metadata?.name ?? user.email ?? "Владелец").trim();

  if (companyName) {
    const template = getBusinessTemplate("beauty");
    const modules = buildDefaultCompanyModules("beauty").map((module) => ({
      code: module.code,
      status: module.status,
      visible: module.visible,
      sort_order: module.order,
      available_on_tariff: module.availableOnTariff
    }));

    await supabase.rpc("create_company_owner", {
      p_company_name: companyName,
      p_owner_name: ownerName,
      p_owner_email: user.email ?? "",
      p_business_template_id: "beauty",
      p_industry: "Салон красоты",
      p_timezone: "Europe/Moscow",
      p_terminology: template.terminology,
      p_modules: modules
    });
  }

  return NextResponse.redirect(`${origin}${next}`);
}
