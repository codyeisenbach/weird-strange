import { NextRequest, NextResponse } from "next/server";
import { updateSupabaseSession } from "lib/supabase/middleware";
import { isAdminEmail } from "lib/admin/allowlist";

const GATED_HOSTS = [
  "weirdstrange.com",
  "www.weirdstrange.com",
  "weird-strange.vercel.app",
];

// /admin/login and the auth callback (which establishes the session in the
// first place) are exempt from the admin auth gate below, since gating them
// would create a chicken-and-egg redirect loop.
const ADMIN_GATE_EXEMPT = ["/admin/login", "/admin/auth/callback"];

// The coming-soon gate only blocks storefront shopping surfaces (product and
// collection pages) — the homepage, /archive, /privacy-choices, etc. stay
// browsable while the store itself is gated.
const COMING_SOON_GATED_PREFIXES = ["/product", "/collections"];

// Checks whether the request carries a signed-in, allowlisted admin session,
// refreshing the Supabase session cookies along the way (per Supabase's SSR
// guidance) so the caller can return `response` on the bypass path instead of
// a plain NextResponse.next(). Only bothers verifying the session (a network
// round-trip to Supabase) if a Supabase auth cookie is actually present —
// anonymous visitors, who are the vast majority of traffic on a
// coming-soon-gated site, have none, so this keeps their request cheap.
async function checkSignedInAdmin(
  request: NextRequest,
): Promise<{ isAdmin: boolean; response: NextResponse }> {
  const hasSupabaseCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith("sb-"));

  if (!hasSupabaseCookie) {
    return { isAdmin: false, response: NextResponse.next() };
  }

  const { response, user } = await updateSupabaseSession(request);
  return { isAdmin: isAdminEmail(user?.email), response };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /admin gets its own gate: refresh the Supabase session and require a
  // signed-in, allowlisted user. This runs even during the coming-soon
  // gate, and is layered on top of the requireAdmin() check every /admin
  // layout/page also performs server-side.
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

  // While the store is coming-soon gated, the homepage sends visitors to the
  // archive instead — there's nothing to shop yet, but the archive is real,
  // browsable content. Admins get the normal homepage like everywhere else
  // in this gate, so they can still preview it.
  if (pathname === "/" && GATED_HOSTS.includes(host)) {
    const { isAdmin, response } = await checkSignedInAdmin(request);
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/archive", request.url));
    }
    return response;
  }

  const isGatedRoute = COMING_SOON_GATED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (!isGatedRoute) {
    return NextResponse.next();
  }

  if (!GATED_HOSTS.includes(host)) {
    return NextResponse.next();
  }

  if (ADMIN_GATE_EXEMPT.includes(pathname)) {
    return NextResponse.next();
  }

  // Let anyone who has signed in through /admin (i.e. an allowlisted admin)
  // browse the real storefront too, not just /admin itself — useful for
  // previewing the live site while it's gated from the public.
  const { isAdmin, response } = await checkSignedInAdmin(request);
  if (isAdmin) {
    return response;
  }

  // Straight to /archive, not "/" — the homepage would just redirect here
  // again (see above), and a two-hop redirect chain from a crawled URL wastes
  // crawl budget and can cause Google to deprioritize the URL.
  return NextResponse.redirect(new URL("/archive", request.url));
}

export const config = {
  // Everything except Next internals, API routes (Shopify webhooks, auth) and
  // static files with an extension.
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
