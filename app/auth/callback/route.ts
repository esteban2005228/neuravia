import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";

const OTP_TYPES: EmailOtpType[] = ["signup", "email", "recovery", "invite", "magiclink", "email_change"];

function safeNext(value: string | null, fallback: string) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

/**
 * Handles email confirmation and password recovery links.
 * - `token_hash` + `type` (recommended email templates): works in any browser or device.
 * - `code` (PKCE default): only works in the browser where the user signed up.
 * When the link fails we still send the user somewhere useful: the email is usually
 * already confirmed by Supabase, so logging in with the password works.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const typeParam = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const isRecovery = typeParam === "recovery" || searchParams.get("next")?.startsWith("/cuenta/contrasena");
  const next = safeNext(searchParams.get("next"), isRecovery ? "/cuenta/contrasena" : "/inicio");

  const supabase = await createClient();

  if (tokenHash && typeParam && OTP_TYPES.includes(typeParam)) {
    const { error } = await supabase.auth.verifyOtp({ type: typeParam, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${typeParam === "recovery" ? "/cuenta/contrasena" : next}`);
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  // Supabase sends ?error_code=otp_expired when the link was already used or is too old.
  const reason = isRecovery ? "recovery" : "confirm";
  return NextResponse.redirect(`${origin}/login?error=${reason}`);
}
