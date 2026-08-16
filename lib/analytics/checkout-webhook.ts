import { createHmac, timingSafeEqual } from "crypto";
import { getSupabaseServerClient } from "lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

type CheckoutLineItem = {
  id: string | number;
  title: string;
  price: string;
  quantity: number;
};

type CheckoutPayload = {
  id: string | number;
  email?: string;
  currency: string;
  total_price: string;
  line_items: CheckoutLineItem[];
  abandoned_checkout_url: string;
  created_at: string;
};

function isValidShopifyHmac(rawBody: string, hmacHeader: string | null) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;

  if (!secret || !hmacHeader) return false;

  const digest = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  const digestBuffer = Buffer.from(digest);
  const headerBuffer = Buffer.from(hmacHeader);

  if (digestBuffer.length !== headerBuffer.length) return false;

  return timingSafeEqual(digestBuffer, headerBuffer);
}

export async function handleCheckoutCreated(
  req: NextRequest,
): Promise<NextResponse> {
  const rawBody = await req.text();
  const hmacHeader = req.headers.get("x-shopify-hmac-sha256");

  if (!isValidShopifyHmac(rawBody, hmacHeader)) {
    console.error("Invalid Shopify webhook HMAC signature.");
    return NextResponse.json({ status: 401 }, { status: 401 });
  }

  const checkout = JSON.parse(rawBody) as CheckoutPayload;

  if (!checkout.email) {
    return NextResponse.json({ status: 200 });
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.from("abandoned_checkouts").upsert({
    id: checkout.id,
    email: checkout.email,
    checkout_url: checkout.abandoned_checkout_url,
    total_price: checkout.total_price,
    currency: checkout.currency,
    line_items: checkout.line_items,
    created_at: checkout.created_at,
  });

  if (error) {
    console.error("Failed to upsert abandoned checkout:", error.message);
  }

  return NextResponse.json({ status: 200 });
}
