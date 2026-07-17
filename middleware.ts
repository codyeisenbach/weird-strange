import { NextRequest, NextResponse } from "next/server";

const GATED_HOSTS = ["weirdstrange.com", "www.weirdstrange.com"];

export function middleware(request: NextRequest) {
  if (process.env.COMING_SOON !== "true") {
    return NextResponse.next();
  }

  // Only gate the public domain — vercel.app URLs and localhost stay open
  // so the real site can be previewed while the curtain is up.
  const host = request.headers.get("host")?.toLowerCase() ?? "";
  if (!GATED_HOSTS.includes(host)) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname === "/coming-soon") {
    return NextResponse.next();
  }

  return NextResponse.rewrite(new URL("/coming-soon", request.url));
}

export const config = {
  // Everything except Next internals, API routes (Shopify webhooks, auth) and
  // static files with an extension.
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
