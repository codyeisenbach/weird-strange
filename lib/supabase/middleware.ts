import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase auth session (if any) on every request that passes
// through middleware, and keeps the response cookies in sync. Must run
// before any route decides whether a user is signed in, per Supabase's SSR
// guidance: https://supabase.com/docs/guides/auth/server-side/nextjs
export async function updateSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    return { response, user: null };
  }

  const supabase = createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Always use getUser() (not getSession()) here: it revalidates the JWT
  // against Supabase Auth rather than trusting an unverified cookie value.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user };
}
