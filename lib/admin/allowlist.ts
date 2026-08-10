// Comma-separated allowlist of admin emails, e.g. "a@x.com,b@x.com". A
// single email is also valid. This is the authorization boundary for
// /admin: authentication (Supabase Auth) only proves who someone is, this
// decides whether that person may use the admin tools.
//
// Kept dependency-free (no next/headers, no Supabase client) so it can be
// imported from both middleware (Edge runtime) and server components alike.
function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}
