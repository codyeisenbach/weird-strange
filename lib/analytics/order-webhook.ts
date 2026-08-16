import { createHash, createHmac, timingSafeEqual } from "crypto";
import { gtmServerUrl, siteUrl } from "lib/site-config";
import { NextRequest, NextResponse } from "next/server";

type OrderLineItem = {
  id: string | number;
  title: string;
  price: string;
  quantity: number;
};

type OrderPayload = {
  id: string | number;
  email?: string;
  phone?: string;
  currency: string;
  total_price: string;
  line_items: OrderLineItem[];
  note_attributes?: { name: string; value: string }[];
  browser_ip?: string;
  client_details?: { user_agent?: string };
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string) {
  return phone.replace(/[^0-9]/g, "").replace(/^0+/, "");
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

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

async function sendGA4Purchase(order: OrderPayload) {
  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_MEASUREMENT_PROTOCOL_SECRET;

  if (!measurementId || !apiSecret) {
    console.error("GA4 Measurement Protocol env vars are not configured.");
    return;
  }

  const clientId = `${order.id}.${order.id}`;

  const res = await fetch(
    `${gtmServerUrl}/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        events: [
          {
            name: "purchase",
            params: {
              transaction_id: String(order.id),
              value: Number(order.total_price),
              currency: order.currency,
              items: order.line_items.map((item) => ({
                item_id: String(item.id),
                item_name: item.title,
                price: Number(item.price),
                quantity: item.quantity,
              })),
            },
          },
        ],
      }),
    },
  );

  if (!res.ok) {
    console.error("GA4 Measurement Protocol request failed", res.status);
  }
}

async function sendMetaPurchase(order: OrderPayload) {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.error("Meta Conversions API env vars are not configured.");
    return;
  }

  const userData: Record<string, string[] | string> = {};
  if (order.email) userData.em = [sha256(normalizeEmail(order.email))];
  if (order.phone) userData.ph = [sha256(normalizePhone(order.phone))];

  const fbp = order.note_attributes?.find((a) => a.name === "_fbp")?.value;
  const fbc = order.note_attributes?.find((a) => a.name === "_fbc")?.value;
  if (fbp) userData.fbp = fbp;
  if (fbc) userData.fbc = fbc;
  if (order.browser_ip) userData.client_ip_address = order.browser_ip;
  if (order.client_details?.user_agent)
    userData.client_user_agent = order.client_details.user_agent;

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [
          {
            event_name: "Purchase",
            event_id: String(order.id),
            event_time: Math.floor(Date.now() / 1000),
            event_source_url: siteUrl,
            action_source: "website",
            user_data: userData,
            custom_data: {
              currency: order.currency,
              value: Number(order.total_price),
              contents: order.line_items.map((item) => ({
                id: String(item.id),
                quantity: item.quantity,
                item_price: Number(item.price),
              })),
            },
          },
        ],
      }),
    },
  );

  if (!res.ok) {
    console.error(
      "Meta Conversions API request failed",
      res.status,
      await res.text(),
    );
  }
}

async function sendRedditPurchase(order: OrderPayload) {
  const pixelId = process.env.REDDIT_PIXEL_ID;
  const accessToken = process.env.REDDIT_CAPI_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.error("Reddit Conversions API env vars are not configured.");
    return;
  }

  // _rdt_uuid cookie value is "<timestamp>.<uuid>"; Reddit's CAPI only accepts the UUID part.
  const rdtUuid = order.note_attributes
    ?.find((a) => a.name === "_rdt_uuid")
    ?.value.split(".")[1];
  const rdtCid = order.note_attributes?.find(
    (a) => a.name === "_rdt_cid",
  )?.value;
  const isRfc4122Uuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    );

  const userData: Record<string, string> = {};
  if (order.email) userData.email = sha256(normalizeEmail(order.email));
  if (order.phone) userData.phone_number = sha256(normalizePhone(order.phone));
  if (rdtUuid && isRfc4122Uuid(rdtUuid)) userData.uuid = rdtUuid;
  if (order.browser_ip) userData.ip_address = order.browser_ip;
  if (order.client_details?.user_agent)
    userData.user_agent = order.client_details.user_agent;

  const res = await fetch(
    `https://ads-api.reddit.com/api/v2.0/conversions/events/${pixelId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        ...(process.env.VERCEL_ENV !== "production" &&
        process.env.REDDIT_CAPI_TEST_ID
          ? { test_id: process.env.REDDIT_CAPI_TEST_ID }
          : {}),
        events: [
          {
            event_at: new Date().toISOString(),
            event_type: { tracking_type: "Purchase" },
            ...(rdtCid ? { click_id: rdtCid } : {}),
            event_metadata: {
              currency: order.currency,
              value_decimal: Number(order.total_price),
              conversion_id: String(order.id),
              products: order.line_items.map((item) => ({
                id: String(item.id),
                name: item.title,
              })),
            },
            user: userData,
          },
        ],
      }),
    },
  );

  if (!res.ok) {
    console.error(
      "Reddit Conversions API request failed",
      res.status,
      await res.text(),
    );
  }
}

export async function handleOrderCreated(
  req: NextRequest,
): Promise<NextResponse> {
  const rawBody = await req.text();
  const hmacHeader = req.headers.get("x-shopify-hmac-sha256");

  if (!isValidShopifyHmac(rawBody, hmacHeader)) {
    console.error("Invalid Shopify webhook HMAC signature.");
    return NextResponse.json({ status: 401 }, { status: 401 });
  }

  const order = JSON.parse(rawBody) as OrderPayload;

  const results = await Promise.allSettled([
    sendGA4Purchase(order),
    sendMetaPurchase(order),
    sendRedditPurchase(order),
  ]);

  results.forEach((result) => {
    if (result.status === "rejected") {
      console.error("Purchase tracking send failed", result.reason);
    }
  });

  return NextResponse.json({ status: 200 });
}
