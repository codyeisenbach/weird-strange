import { handleCheckoutCreated } from "lib/analytics/checkout-webhook";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest): Promise<NextResponse> {
  return handleCheckoutCreated(req);
}
