import { type EmailOtpType } from "@supabase/supabase-js";
import { isAdminEmail } from "lib/admin/allowlist";
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

  let exchangeError: { message: string } | null = null;

  if (token_hash && type) {
    ({ error: exchangeError } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    }));
  } else if (code) {
    ({ error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code));
  } else {
    return NextResponse.redirect(
      new URL("/admin/login?error=invalid-link", origin),
    );
  }

  if (exchangeError) {
    return NextResponse.redirect(
      new URL("/admin/login?error=invalid-link", origin),
    );
  }

  // The magic-link path already only ever sends a link to an allowlisted
  // address (see sendMagicLink), so this check is redundant there but
  // harmless. It's the actual boundary for the Google OAuth path, which has
  // no allowlist gate before this point — Supabase will happily hand back a
  // valid session for *any* Google account that signs in, and only refuses
  // to auto-provision a *new* one because `enable_signup` is off in the
  // Supabase dashboard (Auth -> Sign In / Providers -> User Signups). That
  // dashboard toggle is a single point of failure outside this repo; this
  // check makes the allowlist the enforced boundary regardless of whatever
  // that setting is currently set to.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!isAdminEmail(user?.email)) {
    await supabase.auth.signOut();
    return NextResponse.redirect(
      new URL("/admin/login?error=not-authorized", origin),
    );
  }

  return NextResponse.redirect(new URL(next, origin));
}
