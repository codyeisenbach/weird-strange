import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-only Supabase client for read access to trusted data (e.g. the
// archive tables). Uses the secret key, so this must never be imported from
// a Client Component.
let client: SupabaseClient | undefined;

export function getSupabaseServerClient(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set to use the Supabase server client.",
    );
  }

  client = createClient(url, secretKey, {
    auth: {
      persistSession: false,
    },
  });

  return client;
}

// Request-scoped Supabase client that reads/writes the auth session cookies.
// Uses the publishable key and the signed-in user's own session (subject to
// RLS), for use in Server Components, Server Actions, and Route Handlers
// that need to know who is signed in (e.g. the /admin area). Never cache or
// reuse this across requests.
export async function getSupabaseAuthServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set to use the Supabase auth server client.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component with no response to attach
          // cookies to; middleware will refresh the session on next request.
        }
      },
    },
  });
}
