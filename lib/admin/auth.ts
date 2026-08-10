import "server-only";

import { redirect } from "next/navigation";
import { getSupabaseAuthServerClient } from "lib/supabase/server";

import { isAdminEmail } from "./allowlist";

export type AdminUser = {
  id: string;
  email: string;
};

// Verifies the current request has a signed-in Supabase user on the admin
// allowlist, redirecting to the login page otherwise. Uses getUser() so the
// JWT is revalidated against Supabase Auth rather than trusting cookies.
// Intended as defense-in-depth alongside the middleware gate — call this at
// the top of every /admin layout/page/action, never rely on middleware alone.
export async function requireAdmin(): Promise<AdminUser> {
  const supabase = await getSupabaseAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isAdminEmail(user.email)) {
    redirect("/admin/login");
  }

  return { id: user.id, email: user.email };
}
