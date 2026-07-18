import {
  buildLogoutUrl,
  requestOrigin,
  SESSION_COOKIES,
} from "lib/shopify/customer";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const origin = requestOrigin(request);
  const idToken = request.cookies.get(SESSION_COOKIES.idToken)?.value;

  // Log out of Shopify too when we have an id_token; otherwise just clear our
  // session and land on the homepage.
  const destination = idToken
    ? buildLogoutUrl({ idToken, origin })
    : new URL("/", origin).toString();

  const response = NextResponse.redirect(destination);
  for (const name of Object.values(SESSION_COOKIES)) {
    response.cookies.delete(name);
  }
  return response;
}
