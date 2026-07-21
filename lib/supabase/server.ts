import { createClient, SupabaseClient } from "@supabase/supabase-js";

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
