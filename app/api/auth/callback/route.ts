import {
  exchangeCodeForTokens,
  OAUTH_COOKIES,
  requestOrigin,
  SESSION_COOKIES,
} from "lib/shopify/customer";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const origin = requestOrigin(request);
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get(OAUTH_COOKIES.state)?.value;
  const verifier = request.cookies.get(OAUTH_COOKIES.verifier)?.value;

  if (!code || !state || !storedState || state !== storedState || !verifier) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens({ code, verifier, origin });

    const response = NextResponse.redirect(new URL("/account", origin));
    const cookieOptions = {
      httpOnly: true,
      secure: origin.startsWith("https"),
      sameSite: "lax" as const,
      path: "/",
    };

    response.cookies.set(SESSION_COOKIES.accessToken, tokens.access_token, {
      ...cookieOptions,
      maxAge: tokens.expires_in,
    });
    response.cookies.set(
      SESSION_COOKIES.expiresAt,
      String(Date.now() + tokens.expires_in * 1000),
      { ...cookieOptions, maxAge: 60 * 60 * 24 * 30 },
    );
    response.cookies.set(SESSION_COOKIES.refreshToken, tokens.refresh_token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30,
    });
    if (tokens.id_token) {
      response.cookies.set(SESSION_COOKIES.idToken, tokens.id_token, {
        ...cookieOptions,
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    response.cookies.delete(OAUTH_COOKIES.state);
    response.cookies.delete(OAUTH_COOKIES.verifier);

    return response;
  } catch (e) {
    console.error("Customer auth callback failed", e);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
