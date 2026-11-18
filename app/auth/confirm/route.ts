import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

/** Token-hash confirmation (used if the Supabase email templates point here). */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const nextParam = searchParams.get("next") ?? "/onboarding";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/onboarding";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${type === "recovery" ? "/cuenta/contrasena" : next}`);
  }
  return NextResponse.redirect(`${origin}/login?error=link`);
}
