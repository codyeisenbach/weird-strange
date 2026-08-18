import { NextRequest, NextResponse } from "next/server";
import { updateSupabaseSession } from "lib/supabase/middleware";
import { isAdminEmail } from "lib/admin/allowlist";

const GATED_HOSTS = [
  "weirdstrange.com",
  "www.weirdstrange.com",
  "weird-strange.vercel.app",
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin gets its own gate: refresh the Supabase session and require a
  // signed-in, allowlisted user. This runs even during the coming-soon
  // gate, and is layered on top of the requireAdmin() check every /admin
  // layout/page also performs server-side. /admin/login and the auth
  // callback (which establishes the session in the first place) are exempt.
  const ADMIN_GATE_EXEMPT = ["/admin/login", "/admin/auth/callback"];
  if (pathname.startsWith("/admin") && !ADMIN_GATE_EXEMPT.includes(pathname)) {
    const { response, user } = await updateSupabaseSession(request);

    if (!isAdminEmail(user?.email)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    return response;
  }

  if (process.env.COMING_SOON !== "true") {
    return NextResponse.next();
  }

  const host = request.headers.get("host")?.toLowerCase() ?? "";
  if (!GATED_HOSTS.includes(host)) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname === "/coming-soon") {
    return NextResponse.next();
  }

  // Let anyone who has signed in through /admin (i.e. an allowlisted admin)
  // browse the real storefront too, not just /admin itself — useful for
  // previewing the live site while it's gated from the public. Only bother
  // verifying the session (a network round-trip to Supabase) if a Supabase
  // auth cookie is actually present — anonymous visitors, who are the vast
  // majority of traffic on a coming-soon-gated site, have none, so this
  // keeps their request cheap.
  const hasSupabaseCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-"));

  if (hasSupabaseCookie) {
    const { response, user } = await updateSupabaseSession(request);
    if (isAdminEmail(user?.email)) {
      return response;
    }
  }

  return NextResponse.rewrite(new URL("/coming-soon", request.url));
}

export const config = {
  // Everything except Next internals, API routes (Shopify webhooks, auth) and
  // static files with an extension.
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
