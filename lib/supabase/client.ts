import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client for admin auth (magic-link sign-in/out).
// Uses the publishable key, which is safe to expose to the client.
export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY must be set to use the Supabase browser client.",
    );
  }

  return createBrowserClient(url, publishableKey);
}
