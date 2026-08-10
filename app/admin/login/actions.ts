"use server";

import { getSupabaseAuthServerClient } from "lib/supabase/server";
import { isAdminEmail } from "lib/admin/allowlist";

// Sends a magic link. Deliberately returns the same message whether or not
// the email is on the admin allowlist / has an account, so this endpoint
// can't be used to enumerate admin emails.
const GENERIC_RESPONSE =
  "If that email is authorized for admin access, a sign-in link is on its way.";

export async function sendMagicLink(
  _prevState: string | undefined,
  formData: FormData,
): Promise<string> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email) {
    return "Enter an email address.";
  }

  if (!isAdminEmail(email)) {
    return GENERIC_RESPONSE;
  }

  const supabase = await getSupabaseAuthServerClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl.replace(/\/$/, "")}/admin/auth/callback?next=/admin`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    console.error("Failed to send admin magic link:", error.message);
  }

  return GENERIC_RESPONSE;
}
