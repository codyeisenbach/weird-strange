import {
  buildAuthorizationUrl,
  customerAccountConfigured,
  generateCodeVerifier,
  generateState,
  OAUTH_COOKIES,
  requestOrigin,
} from "lib/shopify/customer";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  if (!customerAccountConfigured) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  const origin = requestOrigin(request);
  const state = generateState();
  const verifier = generateCodeVerifier();

  const response = NextResponse.redirect(
    buildAuthorizationUrl({ origin, state, verifier }),
  );

  const cookieOptions = {
    httpOnly: true,
    secure: origin.startsWith("https"),
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 10,
  };
  response.cookies.set(OAUTH_COOKIES.state, state, cookieOptions);
  response.cookies.set(OAUTH_COOKIES.verifier, verifier, cookieOptions);

  return response;
}
