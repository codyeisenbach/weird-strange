import "server-only";

import { redirect } from "next/navigation";
import { getSupabaseAuthServerClient } from "lib/supabase/server";

import { isAdminEmail } from "./allowlist";

export type AdminUser = {
  id: string;
  email: string;
};

// Returns the current admin user, or null if not signed in / not
// allowlisted. Non-throwing — for conditional rendering on public pages
// (e.g. showing an "Edit" link on an /archive page only to admins), where a
// non-admin visitor is a normal case, not an error. Uses getUser() so the
// JWT is revalidated against Supabase Auth rather than trusting cookies.
export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await getSupabaseAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email || !isAdminEmail(user.email)) {
    return null;
  }

  return { id: user.id, email: user.email };
}

// Verifies the current request has a signed-in Supabase user on the admin
// allowlist, redirecting to the login page otherwise. Intended as
// defense-in-depth alongside the middleware gate — call this at the top of
// every /admin layout/page/action, never rely on middleware alone. Also the
// right check for any archive Server Action that mutates data.
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getAdminUser();

  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
}
