import { type EmailOtpType } from "@supabase/supabase-js";
import { getSupabaseAuthServerClient } from "lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Exchanges either a magic-link OTP (token_hash + type) or an OAuth PKCE
// code (code) for a session, per
// https://supabase.com/docs/guides/auth/server-side/email-based-auth-with-pkce-flow-for-ssr
// https://supabase.com/docs/guides/auth/social-login/auth-google#step-3-add-login-code-to-your-client
// Only a same-origin, absolute-path redirect target is allowed. `next` is
// attacker-controlled (it's a query param on a publicly reachable URL), so
// this guards against it being used as an open redirect — e.g.
// ?next=https://evil.example immediately after a real sign-in.
function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/admin";
  }
  return next;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  const supabase = await getSupabaseAuthServerClient();

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(
    new URL("/admin/login?error=invalid-link", origin),
  );
}
