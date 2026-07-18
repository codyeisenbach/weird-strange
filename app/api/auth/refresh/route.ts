import {
  refreshAccessToken,
  requestOrigin,
  SESSION_COOKIES,
} from "lib/shopify/customer";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const origin = requestOrigin(request);
  const next = request.nextUrl.searchParams.get("next") || "/account";
  const refreshToken = request.cookies.get(
    SESSION_COOKIES.refreshToken,
  )?.value;

  if (!refreshToken) {
    return NextResponse.redirect(new URL("/api/auth/login", request.url));
  }

  try {
    const tokens = await refreshAccessToken(refreshToken);

    const response = NextResponse.redirect(new URL(next, request.url));
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

    return response;
  } catch (e) {
    console.error("Customer token refresh failed", e);
    const response = NextResponse.redirect(
      new URL("/api/auth/login", request.url),
    );
    for (const name of Object.values(SESSION_COOKIES)) {
      response.cookies.delete(name);
    }
    return response;
  }
}
