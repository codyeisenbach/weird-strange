import { mapPrintifyProductToShopifyInput } from "lib/printify/map-to-shopify";
import { getPrintifyProduct } from "lib/printify";
import { PrintifyWebhookEvent } from "lib/printify/types";
import { createShopifyProduct } from "lib/shopify/admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.PRINTIFY_WEBHOOK_SECRET;
  if (secret && req.nextUrl.searchParams.get("secret") !== secret) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const event: PrintifyWebhookEvent = await req.json();

  if (event.type !== "product:created") {
    return NextResponse.json({ ignored: event.type }, { status: 200 });
  }

  const shopId = event.resource.data?.shop_id ?? process.env.PRINTIFY_SHOP_ID;

  if (!shopId) {
    return NextResponse.json(
      { error: "missing shop_id for event" },
      { status: 400 },
    );
  }

  try {
    const printifyProduct = await getPrintifyProduct(shopId, event.resource.id);
    const input = mapPrintifyProductToShopifyInput(printifyProduct);
    const shopifyProduct = await createShopifyProduct(input);

    return NextResponse.json({ shopifyProduct }, { status: 200 });
  } catch (error) {
    console.error(
      "Failed to create Shopify product from Printify webhook",
      error,
    );
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "unknown error" },
      { status: 500 },
    );
  }
}
